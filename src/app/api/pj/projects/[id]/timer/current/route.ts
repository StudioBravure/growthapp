
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: projectId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
        .from('time_sessions')
        .select('*')
        .eq('owner_email', user.email)
        .eq('project_id', projectId)
        .in('status', ['RUNNING', 'PAUSED'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return null if no active session, or the session object
    return NextResponse.json(data || null);
}
