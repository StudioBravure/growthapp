import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ batchId: string }> }) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { batchId } = await params; // Await params in Next.js 15+

        // Fetch Batch
        const { data: batch, error: batchError } = await supabase
            .from('import_batch')
            .select('*')
            .eq('id', batchId)
            .eq('owner_id', user.id)
            .single();

        if (batchError || !batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

        // Fetch Rows
        const { data: rows, error: rowsError } = await supabase
            .from('import_row')
            .select('*')
            .eq('batch_id', batchId)
            .order('row_index', { ascending: true });

        if (rowsError) return NextResponse.json({ error: 'Rows fetch error' }, { status: 500 });

        return NextResponse.json({ batch, rows });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
