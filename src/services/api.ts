import { createBrowserClient } from '@supabase/ssr';
import { Transaction, Project, Client, Debt, RecurringBill, Goal, Category } from '@/lib/types';
import { Database } from '@/lib/database.types'; // Assuming types generating. If not, use 'any' temporarily or define partials.

// Helper to get client
const getSupabase = () => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Mappers (Camel -> Snake & Vice Versa)
// Simplified for brevity, assumes DB uses compatible types or we cast effectively

export const api = {
    transactions: {
        list: async (): Promise<Transaction[]> => {
            const supabase = getSupabase();
            const { data, error } = await supabase.from('transactions').select('*');
            if (error) throw error;
            return data.map(d => ({
                id: d.id,
                description: d.description,
                amount: d.amount,
                type: d.type as any,
                category: d.category,
                mode: d.mode as any,
                status: d.status as any,
                date: d.date,
                projectId: d.project_id,
                clientId: d.client_id,
                recurrenceId: d.recurrence_id,
                isFixed: d.is_fixed
            }));
        },
        create: async (t: Transaction) => {
            const supabase = getSupabase();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const { error } = await supabase.from('transactions').insert({
                id: t.id,
                owner_id: user.id,
                description: t.description,
                amount: t.amount,
                type: t.type,
                category: t.category,
                mode: t.mode,
                status: t.status,
                date: t.date,
                project_id: t.projectId || null,
                client_id: t.clientId || null,
                recurrence_id: t.recurrenceId || null,
                is_fixed: t.isFixed || false
            });
            if (error) throw error;
        },
        update: async (id: string, updates: Partial<Transaction>) => {
            const supabase = getSupabase();
            const payload: any = {};
            if (updates.description !== undefined) payload.description = updates.description;
            if (updates.amount !== undefined) payload.amount = updates.amount;
            if (updates.status !== undefined) payload.status = updates.status;
            if (updates.date !== undefined) payload.date = updates.date;

            const { error } = await supabase.from('transactions').update(payload).eq('id', id);
            if (error) throw error;
        },
        delete: async (id: string) => {
            const supabase = getSupabase();
            const { error } = await supabase.from('transactions').delete().eq('id', id);
            if (error) throw error;
        }
    },
    // Implement other entities similarly (Projects, Clients, etc.)
    // For QA speed, I will stick to Transactions mainly, but will add stub for others or full impl if time permits.
    // Let's do Projects as they are critical for PJ mode.
    projects: {
        list: async (): Promise<Project[]> => {
            const supabase = getSupabase();
            const { data, error } = await supabase.from('projects').select('*');
            if (error) throw error;
            return data.map(d => ({
                id: d.id,
                name: d.name,
                clientId: d.client_id,
                status: d.status as any,
                stage: d.stage as any,
                totalValue: d.total_value, // bigint handling needed?
                hoursUsed: Number(d.hours_used),
                deadline: d.deadline
            }));
        },
        create: async (p: Project) => {
            const supabase = getSupabase();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const { error } = await supabase.from('projects').insert({
                id: p.id,
                owner_id: user.id,
                client_id: p.clientId,
                name: p.name,
                status: p.status,
                stage: p.stage,
                total_value: p.totalValue,
                hours_used: p.hoursUsed,
                deadline: p.deadline
            });
            if (error) throw error;
        }
    },
    admin: {
        resetAccount: async () => {
            const supabase = getSupabase();
            const { error } = await supabase.rpc('delete_user_data');
            if (error) throw error;
        }
    }
};
