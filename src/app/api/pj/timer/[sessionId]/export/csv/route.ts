
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    const { sessionId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch session with related project/client
    const { data: session } = await supabase
        .from('time_sessions')
        .select(`
            *,
            project:projects(*),
            client:customers(*)
        `)
        .eq('id', sessionId)
        .eq('owner_email', user.email)
        .single();

    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Fetch events
    const { data: events } = await supabase
        .from('time_session_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('at', { ascending: true });

    // Generate CSV
    const rows = [];
    rows.push(['Relatório de Sessão - Studio Bravure']);
    rows.push(['Cliente', session.client?.company_name || 'N/A']);
    rows.push(['Projeto', session.project?.title || 'N/A']);
    rows.push(['Início', new Date(session.started_at).toLocaleString('pt-BR')]);
    rows.push(['Fim', session.ended_at ? new Date(session.ended_at).toLocaleString('pt-BR') : 'Em andamento']);

    const hours = (session.total_seconds / 3600).toFixed(2);
    rows.push(['Tempo Total (s)', session.total_seconds]);
    rows.push(['Tempo Total (h)', hours]);

    if (session.project?.billing_model === 'HOURLY') {
        const rate = session.project.hourly_rate || 0;
        const val = (Number(hours) * rate).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        rows.push(['Valor Hora', rate]);
        rows.push(['Valor Estimado', val]);
    }

    rows.push([]);
    rows.push(['TIMELINE']);
    rows.push(['Data/Hora', 'Evento', 'Detalhes']);

    events?.forEach((e: any) => {
        rows.push([
            new Date(e.at).toLocaleString('pt-BR'),
            e.type,
            e.delta_seconds ? `+${e.delta_seconds}s` : ''
        ]);
    });

    const csvContent = rows.map(r => r.join(',').replace(/\n/g, ' ')).join('\n'); // Simple CSV join

    return new NextResponse(csvContent, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="sessao-${sessionId}.csv"`
        }
    });

}
