
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();

        // VALIDATION
        if (!body.project_id) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
        if (!body.minutes || body.minutes < 1) return NextResponse.json({ error: 'Minutes required (min 1)' }, { status: 400 });
        if (!body.date) return NextResponse.json({ error: 'Date required' }, { status: 400 });

        const payload = {
            owner_id: user.id,
            owner_email: user.email,
            ledger_type: 'PJ',
            project_id: body.project_id,
            date: body.date,
            duration_minutes: Number(body.minutes),
            is_billable: body.billable ?? true,
            description: body.description,
            source: 'MANUAL',
            // Estimating start/end for consistency, though duration is key
            started_at: new Date(body.date).toISOString(),
            ended_at: new Date(body.date).toISOString()
        };

        const { data, error } = await supabase.from('time_entries').insert(payload).select().single();
        if (error) throw error;

        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
