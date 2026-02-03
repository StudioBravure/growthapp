
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: projectId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Check if there is already a RUNNING session for this user
    const { data: activeSession } = await supabase
        .from('time_sessions')
        .select('*')
        .eq('owner_email', user.email)
        .eq('status', 'RUNNING')
        .single();

    if (activeSession) {
        return NextResponse.json({
            error: "Já existe uma sessão ativa.",
            activeSessionId: activeSession.id,
            activeProjectId: activeSession.project_id
        }, { status: 409 });
    }

    // 2. Start new session
    const { data: project } = await supabase.from('projects').select('clientId').eq('id', projectId).single();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const { data: newSession, error } = await supabase
        .from('time_sessions')
        .insert({
            owner_email: user.email,
            ledger_type: 'PJ',
            project_id: projectId,
            client_id: project.clientId, // customer_id in projects table? Need to verify column name. 
            // In types it is clientId. In DB it is probably client_id or customer_id.
            // Previous code uses `client_id` in API. Let's check `projects` API.
            status: 'RUNNING',
            started_at: new Date().toISOString(),
            last_resumed_at: new Date().toISOString(),
            total_seconds: 0
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Log Event
    await supabase.from('time_session_events').insert({
        owner_email: user.email,
        session_id: newSession.id,
        type: 'START',
        at: new Date().toISOString()
    });

    return NextResponse.json(newSession);
}
