
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const project_id = searchParams.get('project_id');
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        let query = supabase
            .from('time_entries')
            .select('*, project:projects(title)')
            .eq('owner_email', user.email)
            .eq('ledger_type', 'PJ')
            .order('created_at', { ascending: false });

        if (project_id) query = query.eq('project_id', project_id);
        if (from) query = query.gte('date', from);
        if (to) query = query.lte('date', to);

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
