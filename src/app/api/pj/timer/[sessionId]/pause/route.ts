
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

    // Fetch session
    const { data: session } = await supabase
        .from('time_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('owner_email', user.email)
        .single();

    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.status !== 'RUNNING') return NextResponse.json({ error: "Session is not running" }, { status: 400 });

    const now = new Date();
    const lastResumed = new Date(session.last_resumed_at);
    // Calculate delta in seconds
    const delta = Math.floor((now.getTime() - lastResumed.getTime()) / 1000);
    const newTotal = (session.total_seconds || 0) + delta;

    // Update
    const { data: updated, error } = await supabase
        .from('time_sessions')
        .update({
            status: 'PAUSED',
            total_seconds: newTotal,
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
        type: 'PAUSE',
        at: now.toISOString(),
        delta_seconds: delta
    });

    return NextResponse.json(updated);
}
