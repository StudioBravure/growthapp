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
    // Try common formats: DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY
    const formats = ['dd/MM/yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy', 'dd-MM-yyyy'];
    for (const fmt of formats) {
        const d = parse(raw, fmt, new Date());
        if (isValid(d)) return d;
    }
    return null;
}

// Helper to parse amount
function parseAmount(raw: any): number {
    if (typeof raw === 'number') return raw;
    if (!raw) return 0;
    // Remove currency symbols, keep numbers, comma/dot
    // Standardize: BRL often uses comma as decimal
    let s = raw.toString().replace(/[^\d.,-]/g, '');
    if (s.includes(',') && s.split(',').length === 2 && !s.includes('.')) {
        s = s.replace(',', '.'); // 100,50 -> 100.50
    } else if (s.includes(',') && s.includes('.')) {
        // 1.000,50 -> remove . replace ,
        s = s.replace(/\./g, '').replace(',', '.');
    }
    return parseFloat(s);
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
        const textContent = new TextDecoder('utf-8').decode(buffer); // For CSV
        const bufferNode = Buffer.from(buffer); // For PDF

        let rows: any[] = [];
        let parseError = null;

        // 3. Parse
        if (source_type === 'CSV') {
            const parsed = Papa.parse(textContent, { header: true, skipEmptyLines: true });
            if (parsed.errors.length > 0) {
                console.warn("CSV Parse errors:", parsed.errors);
            }
            rows = parsed.data;
        } else if (source_type === 'PDF') {
            try {
                const require = createRequire(import.meta.url);
                const pdf = require('pdf-parse');
                const pdfData = await pdf(bufferNode);
                // Very basic PDF text extraction heuristics
                // This usually requires a specialized parser per bank layout
                // For now, we assume simple line-by-line regex or just dump text
                const lines = pdfData.text.split('\n');
                // Heuristic: look for date/amount lines
                // MOCK/SIMPLE IMPLEMENTATION:
                // Real world would be complex. We'll try to visually analyze lines.
                // Regex for date DD/MM/YYYY
                const dateRegex1 = /\d{2}\/\d{2}\/\d{4}/;

                rows = lines.map((line: string) => {
                    const dateMatch = line.match(dateRegex1);
                    if (dateMatch) {
                        // assume rest is desc + amount
                        // VERY NAIVE
                        return { raw: line, date: dateMatch[0] };
                    }
                    return null;
                }).filter(Boolean);
            } catch (e: any) {
                parseError = e.message;
            }
        }

        if (rows.length === 0) {
            return NextResponse.json({ error: 'No transactions found or parse failed' }, { status: 400 });
        }

        // 4. Normalize Rows
        const normalizedRows = rows.map((r, index) => {
            // Map CSV columns flexibly
            const dateRaw = r.date || r.Data || r.Date || r['Data Transação'];
            const startRaw = r.description || r.Descricao || r.Historico || r.Memo || r['Histórico'] || (r.raw ? r.raw : 'Sem descrição');
            const amountRaw = r.amount || r.Valor || r.Amount || r.Value;
            // Direction?

            const date = parseDate(dateRaw);
            if (!date) return null; // Skip invalid date

            let amount = parseAmount(amountRaw);
            let direction = 'OUT';
            if (amount < 0) {
                direction = 'OUT';
                amount = Math.abs(amount); // Store absolute
            } else {
                // Heuristic: check if column specifically says "Débito" or "Crédito"
                // or if 'type' column exists
                direction = 'IN'; // Default positive as IN? Or Credit Card positive is OUT?
                // Context matters. For Bank extract: - is OUT.
                // For Credit Card: + is usually OUT (bill). 
                // Let's assume Bank Logic: + IN, - OUT.
                if (fileRecord.ledger_type === 'PF') {
                    // Usually we assume negative is expense
                }
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
