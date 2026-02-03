
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
    if (session.status !== 'PAUSED') return NextResponse.json({ error: "Session is not paused" }, { status: 400 });

    // Check if there is another running session (global rule)
    const { data: activeOther } = await supabase
        .from('time_sessions')
        .select('id')
        .eq('owner_email', user.email)
        .eq('status', 'RUNNING')
        .single();

    if (activeOther) {
        return NextResponse.json({ error: "Você já tem outra sessão rodando. Pause-a antes." }, { status: 409 });
    }

    const now = new Date();

    // Update
    const { data: updated, error } = await supabase
        .from('time_sessions')
        .update({
            status: 'RUNNING',
            last_resumed_at: now.toISOString(),
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
        type: 'RESUME',
        at: now.toISOString()
    });

    return NextResponse.json(updated);
}
