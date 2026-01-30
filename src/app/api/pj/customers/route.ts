
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('owner_email', user.email)
            .eq('ledger_type', 'PJ')
            .order('name', { ascending: true });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();

        // Validation (C-1)
        if (!body.name || body.name.length < 2) return NextResponse.json({ error: 'Nome inválido (min 2 chars)' }, { status: 400 });
        if (!body.company_name || body.company_name.length < 2) return NextResponse.json({ error: 'Empresa inválida (min 2 chars)' }, { status: 400 });

        const cleanWhatsapp = (body.whatsapp || '').replace(/\D/g, '');
        if (cleanWhatsapp.length < 10) return NextResponse.json({ error: 'WhatsApp inválido (min 10 digitos)' }, { status: 400 });

        const cleanCnpj = (body.cnpj || '').replace(/\D/g, '');
        if (cleanCnpj.length !== 14) return NextResponse.json({ error: 'CNPJ inválido (deve ter 14 digitos)' }, { status: 400 });

        if (!body.email || !body.email.includes('@')) return NextResponse.json({ error: 'Email inválido' }, { status: 400 });

        // Uniqueness Check (C-2)
        const { data: existing } = await supabase
            .from('customers')
            .select('id')
            .eq('owner_email', user.email)
            .eq('ledger_type', 'PJ')
            .eq('cnpj', cleanCnpj)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Cliente já cadastrado com este CNPJ' }, { status: 409 });
        }

        const payload = {
            owner_id: user.id,
            owner_email: user.email,
            ledger_type: 'PJ',
            name: body.name,
            company_name: body.company_name,
            whatsapp: cleanWhatsapp,
            cnpj: cleanCnpj,
            email: body.email,
            status: body.status || 'ACTIVE'
        };

        const { data, error } = await supabase.from('customers').insert(payload).select().single();
        if (error) throw error;

        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
