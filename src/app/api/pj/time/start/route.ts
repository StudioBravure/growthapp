
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        if (!body.project_id) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

        // T-2: Check if any timer is already running for owner
        const { data: active } = await supabase.from('time_entries')
            .select('id, project_id')
            .eq('owner_email', user.email)
            .is('ended_at', null)
            .eq('source', 'TIMER') // Ensure we only check timers
            .maybeSingle(); // Use maybeSingle to avoid error if none or multiple (though UI prevents multiple)

        if (active) {
            return NextResponse.json({
                error: 'Active timer exists',
                active_timer_id: active.id,
                active_project_id: active.project_id
            }, { status: 409 });
        }

        const payload = {
            owner_id: user.id,
            owner_email: user.email,
            ledger_type: 'PJ',
            project_id: body.project_id,
            date: new Date().toISOString().split('T')[0], // Today based on server time
            started_at: new Date().toISOString(),
            source: 'TIMER',
            is_billable: true // Default (T-5)
        };

        const { data, error } = await supabase.from('time_entries').insert(payload).select().single();
        if (error) throw error;
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
