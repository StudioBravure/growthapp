import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Papa from 'papaparse';
import { createRequire } from 'module';
// const require = createRequire(import.meta.url);
// const pdf = require('pdf-parse');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { format, parse, isValid, addDays, subDays } from 'date-fns';

// Helper to normalize strings
function normalizeString(str: string) {
    return str?.trim().replace(/\s+/g, ' ') || '';
}

// Helper to parse date
function parseDate(raw: string): Date | null {
    if (!raw) return null;
    const clean = raw.trim().replace(/[^\d\/-]/g, '');
    if (!clean) return null;

    // Try common formats: DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY, DD/MM/YY, DD/MM
    const formats = ['dd/MM/yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy', 'dd-MM-yyyy', 'dd/MM/yy', 'dd/MM'];
    for (const fmt of formats) {
        try {
            const d = parse(clean, fmt, new Date());
            if (isValid(d)) return d;
        } catch (e) { }
    }
    return null;
}

// Helper to parse amount
function parseAmount(raw: any): number {
    if (typeof raw === 'number') return raw;
    if (!raw || raw === '') return NaN;

    // Remove currency symbols and spaces
    let s = raw.toString().replace(/[^\d.,-]/g, '').trim();
    if (!s) return NaN;

    // Detect format
    const hasComma = s.includes(',');
    const hasDot = s.includes('.');

    if (hasComma && hasDot) {
        // Assume 1.234,56 (BRL)
        s = s.replace(/\./g, '').replace(',', '.');
    } else if (hasComma) {
        // Assume 1234,56 (BRL)
        s = s.replace(',', '.');
    } else if (hasDot) {
        // Ambiguous: 1.234 or 12.34?
        // If it ends with .XX (2 digits), assume decimal
        // If it ends with .XXX (3 digits), assume thousand
        const parts = s.split('.');
        if (parts[parts.length - 1].length === 3) {
            s = s.replace(/\./g, '');
        } else if (parts[parts.length - 1].length === 2 || parts[parts.length - 1].length === 1) {
            // keep it as is (JS parseFloat handles it as decimal)
        } else {
            // something else, probably thousand
            s = s.replace(/\./g, '');
        }
    }

    const val = parseFloat(s);
    return isNaN(val) ? NaN : val;
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { file_id, source_type } = body;

        if (!file_id) return NextResponse.json({ error: 'Missing file_id' }, { status: 400 });

        // 1. Fetch File Record
        const { data: fileRecord, error: fileError } = await supabase
            .from('import_file')
            .select('*')
            .eq('id', file_id)
            .eq('owner_id', user.id)
            .single();

        if (fileError || !fileRecord) return NextResponse.json({ error: 'File not found' }, { status: 404 });

        // 2. Download Content
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('imports')
            .download(fileRecord.storage_path);

        if (downloadError || !fileData) return NextResponse.json({ error: 'Download failed' }, { status: 500 });

        const buffer = await fileData.arrayBuffer();
        const bufferNode = Buffer.from(buffer);

        // Try multiple decodings for CSV if needed (UTF-8, ISO-8859-1)
        let textContent = new TextDecoder('utf-8').decode(buffer);
        if (textContent.includes('')) {
            textContent = new TextDecoder('iso-8859-1').decode(buffer);
        }

        let rows: any[] = [];
        let parseError = null;

        console.log(`Starting parse for ${source_type}, size: ${buffer.byteLength}`);

        // 3. Parse
        if (source_type === 'CSV') {
            // Auto-detect delimiter
            const delimiters = [',', ';', '\t', '|'];
            let bestDelimiter = ',';
            let maxCols = 0;

            for (const d of delimiters) {
                const test = Papa.parse(textContent.slice(0, 1000), { delimiter: d });
                const firstRow = test.data[0] as string[];
                if (firstRow && firstRow.length > maxCols) {
                    maxCols = firstRow.length;
                    bestDelimiter = d;
                }
            }
            console.log(`Auto-detected delimiter: "${bestDelimiter}"`);

            // Find Header
            const lines = textContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            const headerIndex = lines.findIndex(l => {
                const cols = l.toLowerCase();
                return (cols.includes('data') || cols.includes('date')) &&
                    (cols.includes('valor') || cols.includes('amount') || cols.includes('historico') || cols.includes('descri'));
            });

            if (headerIndex !== -1) {
                console.log(`Found header at line ${headerIndex}`);
                const csvBody = lines.slice(headerIndex).join('\n');
                const parsed = Papa.parse(csvBody, {
                    header: true,
                    skipEmptyLines: true,
                    delimiter: bestDelimiter,
                    transformHeader: (h) => h.trim()
                });
                rows = parsed.data;
            } else {
                // FALLBACK: No header found, try to parse every line and find transactions
                console.log("No header found, using line-by-line fallback");
                rows = lines.map(line => {
                    const cols = line.split(bestDelimiter).map(c => c.trim().replace(/^"|"$/g, ''));
                    if (cols.length < 2) return null;

                    // Simple logic: if a column looks like a date and another like a number
                    const hasDate = cols.some(c => parseDate(c));
                    const hasAmount = cols.some(c => !isNaN(parseAmount(c)) && parseAmount(c) !== 0);

                    if (hasDate && hasAmount) {
                        return {
                            date: cols.find(c => parseDate(c)),
                            amount: cols.find(c => !isNaN(parseAmount(c)) && parseAmount(c) !== 0),
                            description: cols.find(c => c.length > 5 && isNaN(parseAmount(c)) && !parseDate(c)) || line
                        };
                    }
                    return null;
                }).filter(Boolean);
            }
            console.log(`CSV Parsed rows: ${rows.length}`);
        } else if (source_type === 'PDF') {
            try {
                const require = createRequire(import.meta.url);
                const pdf = require('pdf-parse');
                const pdfData = await pdf(bufferNode);

                const lines = pdfData.text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
                console.log(`PDF extracted ${lines.length} lines`);

                // Improved Regex: Supports DD/MM, DD/MM/YY, DD/MM/YYYY, YYYY-MM-DD
                const dateRegex = /(\d{2}\/\d{2}(\/\d{2,4})?)|(\d{4}-\d{2}-\d{2})/;

                rows = lines.map((line: string) => {
                    const dateMatch = line.match(dateRegex);
                    // Also check if line has something that looks like an amount
                    const amountMatch = line.match(/(-?\s?\d{1,3}(\.?\d{3})*,\d{2})|(-?\s?\d+\.\d{2})/);

                    if (dateMatch && amountMatch) {
                        return { raw: line, date: dateMatch[0] };
                    }
                    return null;
                }).filter(Boolean);
                console.log(`PDF found ${rows.length} date+amount matching lines`);
            } catch (e: any) {
                console.error("PDF Parse Error:", e);
                parseError = e.message;
            }
        }

        if (rows.length === 0) {
            console.warn("No rows found after parsing. Data sample:", textContent.slice(0, 500));
            const lineCount = textContent.split('\n').length;
            return NextResponse.json({
                error: `Nenhuma transação encontrada. O arquivo possui ${lineCount} linhas, mas nenhuma seguiu o padrão de (Data + Valor).`,
                debug: {
                    lineCount,
                    sourceType: source_type,
                    sample: textContent.slice(0, 200)
                }
            }, { status: 400 });
        }

        // 4. Normalize Rows
        const normalizedRows = rows.map((r, index) => {
            // Map CSV columns flexibly
            const dateRaw = r.date || r.Data || r.Date || r['Data Transação'] || r['DATA'];
            const startRaw = r.description || r.Descricao || r.Historico || r.Memo || r['Histórico'] || r['HISTÓRICO'] || (r.raw ? r.raw : 'Sem descrição');
            let amountRaw = r.amount || r.Valor || r.Amount || r.Value || r['VALOR'];

            // For PDF, we often have the whole line in 'raw' and need to find the amount
            if (source_type === 'PDF' && r.raw && !amountRaw) {
                // Heuristic: Amount is often at the end of the line
                // Matches patterns like: 1.234,56 or 1234.56 or 1234,56 - (sign can be prefix or suffix)
                const amountRegex = /(-?\s?\d{1,3}(\.?\d{3})*,\d{2})|(-?\s?\d+(\.\d{2})?)/;
                // Try reverse search for numerical values
                const parts = r.raw.split(/\s+/);
                for (let i = parts.length - 1; i >= 0; i--) {
                    const p = parts[i].replace(/[^\d.,-]/g, '');
                    if (p.includes(',') || (p.includes('.') && p.match(/\.\d{2}$/))) {
                        amountRaw = p;
                        break;
                    }
                }
            }

            const date = parseDate(dateRaw);
            if (!date) return null; // Skip invalid date

            let amount = parseAmount(amountRaw);
            let direction = 'OUT';
            if (amount < 0) {
                direction = 'OUT';
                amount = Math.abs(amount); // Store absolute
            } else {
                direction = 'IN';
            }

            // Override using Amount sign if present in string
            if (amountRaw && amountRaw.toString().includes('-')) {
                direction = 'OUT';
            }

            return {
                row_index: index,
                date: format(date, 'yyyy-MM-dd'),
                amount: amount * 100, // Cents (app standard) ? Wait, parseAmount returns float. *100 -> cents. 
                // Careful with precision.
                direction,
                description_raw: startRaw,
                description_norm: normalizeString(startRaw),
                merchant: null, // Extract if possible
                status: 'NEW',
                confidence: 'LOW'
            };
        }).filter(Boolean) as any[];

        // 5. Categorize & Dedupe
        // Fetch rules
        const { data: rules } = await supabase.from('category_mapping_rule')
            .select('*')
            .eq('owner_id', user.id)
            .eq('ledger_type', fileRecord.ledger_type)
            .order('priority', { ascending: false });

        // Fetch existing transactions for dedupe
        if (normalizedRows.length > 0) {
            const dates = normalizedRows.map(r => r.date).sort();
            const minDate = subDays(new Date(dates[0]), 5);
            const maxDate = addDays(new Date(dates[dates.length - 1]), 5);

            const { data: existingTxs } = await supabase.from('transactions')
                .select('*')
                .eq('owner_id', user.id)
                .gte('date', format(minDate, 'yyyy-MM-dd'))
                .lte('date', format(maxDate, 'yyyy-MM-dd'))
                .eq('mode', fileRecord.ledger_type); // Dedupe only same mode

            for (const row of normalizedRows) {
                // Categorize
                if (rules) {
                    for (const rule of rules) {
                        const match = rule.match_type === 'CONTAINS' ? row.description_norm.toLowerCase().includes(rule.pattern.toLowerCase()) :
                            rule.match_type === 'EXACT' ? row.description_norm === rule.pattern :
                                false; // TODO regex
                        if (match) {
                            row.suggested_category_id = rule.category_id;
                            row.confidence = 'HIGH';
                            break;
                        }
                    }
                }

                // Dedupe
                if (existingTxs) {
                    const dupe = existingTxs.find(t => {
                        // Match logic:
                        // Same amount (cents)
                        // Date within 2 days
                        // Description similar?
                        const tDate = new Date(t.date);
                        const rDate = new Date(row.date);
                        const diffTime = Math.abs(tDate.getTime() - rDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        // Check amount (t.amount is cents, row.amount is in cents? Yes I multiplied by 100)
                        // Wait, parseAmount logic above might need refinement. 
                        // If 100.50 -> 10050.
                        const sameAmount = Math.abs(t.amount - row.amount) < 10; // tolerance?

                        return diffDays <= 2 && sameAmount;
                    });

                    if (dupe) {
                        row.status = 'DUPLICATE_SUSPECT';
                        row.duplicate_of_transaction_id = dupe.id;
                    }
                }
            }
        }

        // 6. Create Batch
        const totalIn = normalizedRows.filter(r => r.direction === 'IN').reduce((acc, r) => acc + r.amount, 0);
        const totalOut = normalizedRows.filter(r => r.direction === 'OUT').reduce((acc, r) => acc + r.amount, 0);

        const { data: batch, error: batchError } = await supabase.from('import_batch').insert({
            owner_id: user.id,
            owner_email: user.email!,
            ledger_type: fileRecord.ledger_type,
            source_type: source_type,
            file_id: file_id,
            status: 'READY_TO_REVIEW',
            date_start: normalizedRows[0]?.date,
            date_end: normalizedRows[normalizedRows.length - 1]?.date,
            totals_json: { incoming: totalIn, outgoing: totalOut, count: normalizedRows.length }
        }).select().single();

        if (batchError) throw batchError;

        // 7. Insert Rows
        const rowsToInsert = normalizedRows.map(r => ({
            batch_id: batch.id,
            owner_id: user.id,
            owner_email: user.email!,
            ledger_type: fileRecord.ledger_type,
            row_index: r.row_index,
            date: r.date,
            amount: r.amount,
            direction: r.direction,
            description_raw: r.description_raw,
            description_norm: r.description_norm,
            merchant: r.merchant,
            suggested_category_id: r.suggested_category_id,
            confidence: r.confidence,
            status: r.status,
            duplicate_of_transaction_id: r.duplicate_of_transaction_id
        }));

        const { error: rowsError } = await supabase.from('import_row').insert(rowsToInsert);
        if (rowsError) throw rowsError;

        return NextResponse.json({ success: true, batch_id: batch.id, summary: batch.totals_json });

    } catch (e: any) {
        console.error("Parse Endpoint Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
