
import Papa from 'papaparse';
import { Transaction, TransactionType } from '@/lib/types';


// Simple types for parsing result
export interface ParsedTransaction {
    date: string; // ISO
    description: string;
    amount: number; // in cents
    type: TransactionType;
    raw: any;
}

export async function parseCSV(file: File): Promise<ParsedTransaction[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const transactions: ParsedTransaction[] = [];

                // Simple heuristic for common bank CSVs (Nubank, Inter, generic)
                // Adjust column names based on real bank formats
                results.data.forEach((row: any) => {
                    // Nubank CSV Format often: date, category, title, amount
                    // Inter: Data, Histórico, Valor

                    let amount = 0;
                    let description = '';
                    let date = new Date();
                    let type: TransactionType = 'EXPENSE';

                    // Try to find amount column
                    const amountVal = row['amount'] || row['Amount'] || row['Valor'] || row['valor'];
                    if (amountVal) {
                        // Cleanup currency string
                        const cleanVal = String(amountVal).replace(/[R$\s]/g, '').replace(',', '.');
                        const floatVal = parseFloat(cleanVal);
                        if (!isNaN(floatVal)) {
                            amount = Math.abs(Math.round(floatVal * 100));
                            type = floatVal < 0 ? 'EXPENSE' : 'INCOME'; // Banks usually use negative for expense
                        }
                    }

                    // Try to find description
                    description = row['description'] || row['Description'] || row['title'] || row['Historico'] || row['histórico'] || 'Sem descrição';

                    // Try to find date
                    const dateVal = row['date'] || row['Date'] || row['Data'] || row['data'];
                    if (dateVal) {
                        // Support DD/MM/YYYY or YYYY-MM-DD
                        if (dateVal.includes('/')) {
                            const [day, month, year] = dateVal.split('/');
                            date = new Date(`${year}-${month}-${day}`);
                        } else {
                            date = new Date(dateVal);
                        }
                    }

                    if (amount > 0) {
                        transactions.push({
                            date: date.toISOString(),
                            description,
                            amount,
                            type,
                            raw: row
                        });
                    }
                });
                resolve(transactions);
            },
            error: (error) => {
                reject(error);
            }
        });
    });
}

// OFX Parser is complex to write from scratch without a lib, 
// for this environment we will mock OFX support or use a simple regex-based parser strictly for standard OFX 1.0.2
export async function parseOFX(fileContent: string): Promise<ParsedTransaction[]> {
    const transactions: ParsedTransaction[] = [];

    // Regex to find STMTTRN blocks
    const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
    const typeRegex = /<TRNTYPE>(.*)/;
    const dateRegex = /<DTPOSTED>(.*)/;
    const amountRegex = /<TRNAMT>(.*)/;
    const memoRegex = /<MEMO>(.*)/;

    let match;
    while ((match = transactionRegex.exec(fileContent)) !== null) {
        const block = match[1];

        const typeMatch = block.match(typeRegex);
        const dateMatch = block.match(dateRegex);
        const amountMatch = block.match(amountRegex);
        const memoMatch = block.match(memoRegex);

        if (dateMatch && amountMatch) {
            const rawDate = dateMatch[1].trim().substring(0, 8); // YYYYMMDD
            const year = rawDate.substring(0, 4);
            const month = rawDate.substring(4, 6);
            const day = rawDate.substring(6, 8);
            const date = new Date(`${year}-${month}-${day}`).toISOString();

            const rawAmount = parseFloat(amountMatch[1].trim().replace(',', '.'));
            const type: TransactionType = rawAmount < 0 ? 'EXPENSE' : 'INCOME';
            const amount = Math.abs(Math.round(rawAmount * 100));
            const description = memoMatch ? memoMatch[1].trim() : 'OFX Transaction';

            transactions.push({
                date,
                amount,
                type,
                description,
                raw: block
            });
        }
    }

    return transactions;
}
