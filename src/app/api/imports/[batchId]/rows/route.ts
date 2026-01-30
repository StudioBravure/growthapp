import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ batchId: string }> }) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { rowId, updates } = body;

        // updates can contain: final_category_id, status, description_norm, etc.

        const { error } = await supabase.from('import_row')
            .update(updates)
            .eq('id', rowId)
            .eq('owner_id', user.id); // Security check

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
