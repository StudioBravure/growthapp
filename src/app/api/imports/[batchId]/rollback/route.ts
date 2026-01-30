import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ batchId: string }> }) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { batchId } = await params;

        // Fetch Imported Rows
        const { data: rows } = await supabase.from('import_row')
            .select('created_transaction_id')
            .eq('batch_id', batchId)
            .eq('status', 'IMPORTED')
            .not('created_transaction_id', 'is', null);

        if (rows && rows.length > 0) {
            const txIds = rows.map(r => r.created_transaction_id);
            // Delete Transactions
            const { error: delError } = await supabase.from('transactions').delete().in('id', txIds);
            if (delError) throw delError;
        }

        // Update Batch & Rows
        await supabase.from('import_batch').update({ status: 'ROLLED_BACK' }).eq('id', batchId);
        await supabase.from('import_row').update({ status: 'ROLLED_BACK' }).eq('batch_id', batchId);

        return NextResponse.json({ success: true });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
