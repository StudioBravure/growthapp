
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createClient();
        const { id } = await params;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();

        // Validation (simplified for rewrite)
        if (body.cnpj) {
            const cleanCnpj = body.cnpj.replace(/\D/g, '');
            if (cleanCnpj.length !== 14) return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 });
            body.cnpj = cleanCnpj;
        }
        if (body.whatsapp) body.whatsapp = body.whatsapp.replace(/\D/g, '');

        const { data, error } = await supabase
            .from('customers')
            .update(body)
            .eq('id', id)
            .eq('owner_email', user.email) // Security check
            .eq('ledger_type', 'PJ')
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
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
            .from('customers')
            .delete()
            .eq('id', id)
            .eq('owner_email', user.email)
            .eq('ledger_type', 'PJ');

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
