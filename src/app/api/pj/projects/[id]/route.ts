
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createClient();
        const { id } = await params;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data, error } = await supabase
            .from('projects')
            .select('*, customer:customers(*)')
            .eq('id', id)
            .eq('owner_email', user.email)
            .single();

        if (error) throw error;
        return NextResponse.json({ ...data, title: data.title || data.name });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createClient();
        const { id } = await params;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();

        // Map 'title' to 'name' and vice versa for sync
        if (body.title) {
            body.name = body.title;
        } else if (body.name) {
            body.title = body.name;
        }

        const { client_snapshot_company, client_snapshot_cnpj, ...updates } = body;

        const { data, error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', id)
            .eq('owner_email', user.email)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ ...data, title: data.name });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createClient();
        const { id } = await params;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id)
            .eq('owner_email', user.email);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
