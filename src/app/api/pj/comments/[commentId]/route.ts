
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ commentId: string }> }
) {
    const { commentId } = await params;
    const body = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
        .from('project_comments')
        .update({
            body: body.body,
            updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('owner_email', user.email)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ commentId: string }> }
) {
    const { commentId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
        .from('project_comments')
        .delete()
        .eq('id', commentId)
        .eq('owner_email', user.email);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
