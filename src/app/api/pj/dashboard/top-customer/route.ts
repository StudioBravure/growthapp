
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const month = searchParams.get('month'); // YYYY-MM

        let start, end;
        if (month) {
            start = startOfMonth(new Date(`${month}-01`)).toISOString();
            end = endOfMonth(new Date(`${month}-01`)).toISOString();
        } else {
            start = startOfMonth(new Date()).toISOString();
            end = endOfMonth(new Date()).toISOString();
        }

        // Logic D-1 & D-2: Transactions, type=INCOME, status=RECEIVED, ledger_type=PJ
        // Assuming 'transactions' table (legacy) or new structure. 
        // Prompt says "D-1) Somar apenas recebíveis: ledger_type='PJ', status='RECEIVED'"
        // I need to check if transactions table has ledger_type. 
        // Based on types.ts, Transaction has `mode: 'PF' | 'PJ'`.
        // And status: 'PENDING' | 'PAID' | 'LATE' | 'SCHEDULED'.
        // "RECEIVED" is likely "PAID" for Income. I'll use status='PAID' AND type='INCOME'.
        // Also check if customer_id exists in transactions. `transactions` table usually links to `customer_id`?
        // In types.ts: `clientId?: string;`.
        // So I will aggregate on `clientId`.

        const { data: txs, error } = await supabase
            .from('transactions')
            .select('amount, client_id') // Join customer name if possible, or fetch separate
            .eq('owner_email', user.email)
            .eq('mode', 'PJ') // Using 'mode' as per types.ts, standardizing queries
            .eq('type', 'INCOME')
            .eq('status', 'PAID') // logic D-1
            .gte('date', start)
            .lte('date', end);

        if (error) throw error;

        // Manual aggregation
        const totals: Record<string, number> = {};
        let totalMonth = 0;

        txs?.forEach((tx: any) => {
            if (!tx.client_id) return;
            totals[tx.client_id] = (totals[tx.client_id] || 0) + tx.amount;
            totalMonth += tx.amount;
        });

        // Sort descending
        const sorted = Object.entries(totals).sort(([, a], [, b]) => b - a);
        const top = sorted[0]; // [id, amount]

        if (!top) {
            return NextResponse.json({ top_customer: null, total_month: 0 });
        }

        const [topId, topAmount] = top;

        // Fetch customer details
        const { data: cust } = await supabase
            .from('customers')
            .select('name, company_name')
            .eq('id', topId)
            .single();

        return NextResponse.json({
            top_customer: {
                id: topId,
                name: cust?.name || 'Unknown',
                company: cust?.company_name || 'Unknown',
                amount: topAmount,
                percent: totalMonth > 0 ? (topAmount / totalMonth) * 100 : 0
            },
            total_month: totalMonth
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
