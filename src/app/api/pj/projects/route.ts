
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data, error } = await supabase
            .from('projects')
            .select('*, customer:customers(*)')
            .eq('owner_email', user.email)
            .eq('ledger_type', 'PJ')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Map 'name' to 'title' for frontend compatibility if necessary
        const mappedData = data.map(p => ({
            ...p,
            title: p.title || p.name // ensure title exists
        }));

        return NextResponse.json(mappedData);
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

        // P-0: Title Required
        if (!body.title && !body.name) return NextResponse.json({ error: 'Título do projeto é obrigatório' }, { status: 400 });

        // P-1: Client Required
        if (!body.client_id) return NextResponse.json({ error: 'Cliente obrigatório' }, { status: 400 });

        // Fetch client for snapshot (P-2)
        const { data: client } = await supabase
            .from('customers')
            .select('*')
            .eq('id', body.client_id)
            .single();

        if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 400 });

        // P-3: Billing Model Validation
        const model = body.billing_model || 'SCOPE';
        if (!['SCOPE', 'HOURLY', 'RETAINER'].includes(model)) return NextResponse.json({ error: 'Modelo de cobrança inválido' }, { status: 400 });

        if (model === 'SCOPE' && (!body.scope_value || body.scope_value <= 0)) return NextResponse.json({ error: 'Valor do escopo obrigatório' }, { status: 400 });
        if (model === 'HOURLY' && (!body.hourly_rate || body.hourly_rate <= 0)) return NextResponse.json({ error: 'Valor hora obrigatório' }, { status: 400 });
        if (model === 'RETAINER' && (!body.retainer_amount || body.retainer_amount <= 0)) return NextResponse.json({ error: 'Valor mensal obrigatório' }, { status: 400 });

        const payload = {
            owner_id: user.id,
            owner_email: user.email,
            ledger_type: 'PJ',
            client_id: body.client_id,
            name: body.title || body.name,
            title: body.title || body.name,
            billing_model: model,
            status: 'ACTIVE',
            stage: body.status_stage || body.stage || 'EXECUTION',
            status_stage: body.status_stage || body.stage || 'EXECUTION',

            // Financials
            scope_value: Number(body.scope_value || 0),
            hourly_rate: Number(body.hourly_rate || 0),
            retainer_amount: Number(body.retainer_amount || 0),
            cost_hour_internal: Number(body.cost_hour_internal || 100),
            estimated_hours: Number(body.estimated_hours || 0),

            // Snapshots
            client_snapshot_company: client.company_name,
            client_snapshot_cnpj: client.cnpj,
            client_snapshot_whatsapp: client.whatsapp,
            client_snapshot_email: client.email,

            start_date: body.start_date || null,
            due_date: body.due_date || null
        };

        const { data, error } = await supabase.from('projects').insert(payload).select().single();
        if (error) throw error;

        return NextResponse.json({ ...data, title: data.name });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
