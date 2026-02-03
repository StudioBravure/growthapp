
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
        .from('project_comments')
        .select('*')
        .eq('owner_email', user.email)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: projectId } = await params;
    const body = await req.json();

    if (!body.body) return NextResponse.json({ error: "Body required" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch project to get client_id
    const { data: project } = await supabase.from('projects').select('clientId').eq('id', projectId).single();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const { data, error } = await supabase
        .from('project_comments')
        .insert({
            owner_email: user.email,
            ledger_type: 'PJ',
            project_id: projectId,
            client_id: project.clientId,
            body: body.body,
            visibility: 'INTERNAL'
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}
