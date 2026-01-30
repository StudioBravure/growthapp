
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const project_id = searchParams.get('project_id');
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        let query = supabase
            .from('time_entries')
            .select(`
                *,
                project:projects(title, hourly_rate, client:customers(company_name))
            `) // Join project and customer via project
            .eq('owner_email', user.email)
            .eq('ledger_type', 'PJ')
            .order('date', { ascending: true });

        if (project_id) query = query.eq('project_id', project_id);
        if (from) query = query.gte('date', from);
        if (to) query = query.lte('date', to);

        const { data: rows, error } = await query;
        if (error) throw error;

        // Generate CSV
        // Header
        const header = ['Date', 'Start', 'End', 'Duration (mins)', 'Hours', 'Billable', 'Description', 'Project', 'Customer', 'Value Est.'];
        const csvRows = [header.join(',')];

        let totalMins = 0;
        let totalBillableMins = 0;
        let totalValue = 0;

        rows?.forEach((row: any) => {
            const hours = (row.duration_minutes / 60).toFixed(2);
            const rate = row.project?.hourly_rate || 0;
            const val = row.is_billable ? (row.duration_minutes / 60) * rate : 0;

            totalMins += row.duration_minutes;
            if (row.is_billable) {
                totalBillableMins += row.duration_minutes;
                totalValue += val;
            }

            // CSV Safe string
            const safe = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;

            csvRows.push([
                row.date,
                row.started_at ? new Date(row.started_at).toLocaleTimeString() : '',
                row.ended_at ? new Date(row.ended_at).toLocaleTimeString() : '',
                row.duration_minutes,
                hours,
                row.is_billable ? 'Yes' : 'No',
                safe(row.description),
                safe(row.project?.title),
                safe(row.project?.client?.company_name),
                val.toFixed(2)
            ].join(','));
        });

        // Totals line
        csvRows.push('');
        csvRows.push(['TOTALS', '', '', totalMins, (totalMins / 60).toFixed(2), '', '', '', '', totalValue.toFixed(2)].join(','));

        const csvContent = csvRows.join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="timesheet_${from || 'start'}_${to || 'end'}.csv"`
            }
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
