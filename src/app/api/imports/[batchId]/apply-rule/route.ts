import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ batchId: string }> }) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { batchId } = await params;
        const body = await req.json();
        const { match_type, pattern, category_id, priority, ledger_type } = body;

        // 1. Create Rule
        const { error: ruleError } = await supabase.from('category_mapping_rule').insert({
            owner_id: user.id,
            owner_email: user.email!,
            ledger_type: ledger_type,
            match_type,
            pattern,
            category_id,
            priority: priority || 1
        });

        if (ruleError) return NextResponse.json({ error: ruleError.message }, { status: 500 });

        // 2. Re-apply to current batch
        // Fetch rows that match
        const { data: rows } = await supabase.from('import_row')
            .select('*')
            .eq('batch_id', batchId)
            .in('status', ['NEW', 'NEEDS_REVIEW']); // Only update non-final rows

        if (rows) {
            const updates = [];
            for (const row of rows) {
                const norm = row.description_norm?.toLowerCase() || '';
                const startRaw = row.description_raw?.toLowerCase() || '';

                let match = false;
                if (match_type === 'CONTAINS') {
                    match = norm.includes(pattern.toLowerCase()) || startRaw.includes(pattern.toLowerCase());
                } else if (match_type === 'EXACT') {
                    match = norm === pattern.toLowerCase();
                } // Regex, StartsWith skipped for brevity

                if (match) {
                    updates.push({
                        id: row.id,
                        suggested_category_id: category_id,
                        confidence: 'HIGH',
                        status: 'READY' // or keep NEW but with category?
                    });
                }
            }

            for (const u of updates) {
                await supabase.from('import_row').update(u).eq('id', u.id);
            }
        }

        return NextResponse.json({ success: true });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
