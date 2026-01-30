
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { differenceInMinutes } from 'date-fns';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { time_entry_id } = body;

        if (!time_entry_id) return NextResponse.json({ error: 'Time Entry ID required' }, { status: 400 });

        // Fetch existing
        const { data: entry, error: fetchError } = await supabase
            .from('time_entries')
            .select('*')
            .eq('id', time_entry_id)
            .single();

        if (fetchError || !entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
        if (entry.ended_at) return NextResponse.json({ error: 'Timer already stopped' }, { status: 400 });

        const endedAt = new Date().toISOString();
        const duration = differenceInMinutes(new Date(endedAt), new Date(entry.started_at));

        // T-4: Safety limits
        // If duration > 16h (960 min), maybe flag or just allow for now as per prompt "block without confirmation"
        // Since this is API, we return error if super long? Strictness level T-4 says "block entries > 16h".
        if (duration > 960) {
            return NextResponse.json({ error: 'Duração excede 16 horas. Verifique manualmente.' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('time_entries')
            .update({
                ended_at: endedAt,
                duration_minutes: duration > 0 ? duration : 1, // Minimum 1 minute (T-4)
            })
            .eq('id', time_entry_id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
