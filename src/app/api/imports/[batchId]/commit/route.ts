import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ batchId: string }> }) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { batchId } = await params;
        const body = await req.json();
        const { selected_row_ids } = body; // Optional: Only commit specific rows? Or all valid ones.

        // Fetch Batch
        const { data: batch } = await supabase.from('import_batch').select('*').eq('id', batchId).single();
        if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

        // Fetch Rows to commit
        let query = supabase.from('import_row')
            .select('*')
            .eq('batch_id', batchId)
            // .neq('status', 'IMPORTED') // Avoid re-import
            .in('status', ['NEW', 'READY']); // Only import new/ready rows. Skip DUPLICATE_SUSPECT/SKIPPED unless user forced them to READY.

        if (selected_row_ids && Array.isArray(selected_row_ids)) {
            query = query.in('id', selected_row_ids);
        }

        const { data: rows } = await query;
        if (!rows || rows.length === 0) {
            return NextResponse.json({ message: 'No rows to import' });
        }

        // Resolve Categories
        const { data: categories } = await supabase.from('categories').select('*').eq('owner_id', user.id);
        const categoryMap = new Map(categories?.map((c: any) => [c.id, c.name]) || []);

        const transactionsToInsert: any[] = [];
        const rowUpdates: any[] = [];

        for (const row of rows) {
            const catName = row.final_category_id ? categoryMap.get(row.final_category_id) :
                row.suggested_category_id ? categoryMap.get(row.suggested_category_id) : 'Outros';

            // Generate UUID for transaction
            const txId = crypto.randomUUID();

            transactionsToInsert.push({
                id: txId,
                owner_id: user.id,
                date: row.date,
                amount: row.amount, // Record as absolute
                type: row.direction === 'IN' ? 'INCOME' : 'EXPENSE',
                category: catName || 'Outros', // Fallback
                description: row.merchant ? `${row.merchant} - ${row.description_norm}` : row.description_norm,
                mode: batch.ledger_type,
                status: 'PAID', // Extrato usually means PAID
                // Link back for traceability?
                // Supabase generic tables don't usually strict link unless foreign key.
                // We rely on import_row.created_transaction_id
            });

            rowUpdates.push({
                id: row.id,
                status: 'IMPORTED',
                created_transaction_id: txId
            });
        }

        if (transactionsToInsert.length > 0) {
            const { error: insertError } = await supabase.from('transactions').insert(transactionsToInsert);
            if (insertError) throw insertError;

            // Update Rows status
            for (const update of rowUpdates) {
                await supabase.from('import_row').update(update).eq('id', update.id);
            }

            // Update Batch Status
            await supabase.from('import_batch').update({ status: 'IMPORTED', updated_at: new Date().toISOString() }).eq('id', batchId);
        }

        return NextResponse.json({ success: true, count: transactionsToInsert.length });

    } catch (e: any) {
        console.error("Commit Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
