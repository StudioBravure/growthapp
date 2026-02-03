
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    const { sessionId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: session } = await supabase
        .from('time_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('owner_email', user.email)
        .single();

    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.status === 'FINISHED') return NextResponse.json({ error: "Session already finished" }, { status: 400 });

    const now = new Date();
    let newTotal = session.total_seconds || 0;

    // If running, define delta
    if (session.status === 'RUNNING' && session.last_resumed_at) {
        const lastResumed = new Date(session.last_resumed_at);
        const delta = Math.floor((now.getTime() - lastResumed.getTime()) / 1000);
        newTotal += delta;
    }

    // Update
    const { data: updated, error } = await supabase
        .from('time_sessions')
        .update({
            status: 'FINISHED',
            total_seconds: newTotal,
            ended_at: now.toISOString(),
            last_resumed_at: null,
            updated_at: now.toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Log Event
    await supabase.from('time_session_events').insert({
        owner_email: user.email,
        session_id: sessionId,
        type: 'FINISH',
        at: now.toISOString(),
        delta_seconds: 0 // Could imply final delta but logic handled in total_seconds
    });

    return NextResponse.json(updated);
}
