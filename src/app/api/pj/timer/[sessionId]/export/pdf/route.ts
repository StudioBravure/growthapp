
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

    const { data: events } = await supabase
        .from('time_session_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('at', { ascending: true });

    const start = new Date(session.started_at).toLocaleString('pt-BR');
    const end = session.ended_at ? new Date(session.ended_at).toLocaleString('pt-BR') : 'Em andamento';
    const hours = (session.total_seconds / 3600).toFixed(2);
    const hourlyRate = session.project?.hourly_rate || 0;
    const value = session.project?.billing_model === 'HOURLY'
        ? (Number(hours) * hourlyRate).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : 'N/A';

    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Relatório de Sessão #${sessionId.slice(0, 8)}</title>
        <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            h1 { color: #000; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
            .meta { margin-bottom: 20px; }
            .meta div { margin-bottom: 5px; }
            .label { font-weight: bold; width: 120px; display: inline-block; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
        </style>
    </head>
    <body onload="window.print()">
        <h1>Relatório de Sessão</h1>
        
        <div class="meta">
            <div><span class="label">Cliente:</span> ${session.client?.company_name || 'N/A'}</div>
            <div><span class="label">Projeto:</span> ${session.project?.title || 'N/A'}</div>
            <div><span class="label">Início:</span> ${start}</div>
            <div><span class="label">Fim:</span> ${end}</div>
            <div><span class="label">Tempo Total:</span> ${hours} horas (${session.total_seconds}s)</div>
            ${session.project?.billing_model === 'HOURLY' ? `<div><span class="label">Valor:</span> ${value}</div>` : ''}
        </div>

        <h2>Eventos</h2>
        <table>
            <thead>
                <tr>
                    <th>Data/Hora</th>
                    <th>Evento</th>
                    <th>Duração</th>
                </tr>
            </thead>
            <tbody>
                ${events?.map((e: any) => `
                <tr>
                    <td>${new Date(e.at).toLocaleString('pt-BR')}</td>
                    <td>${e.type}</td>
                    <td>${e.delta_seconds ? `+${e.delta_seconds}s` : '-'}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </body>
    </html>
    `;

    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' }
    });
}
