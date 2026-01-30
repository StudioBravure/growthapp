import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useAppStore } from '@/store/use-store';

// Helper accessible outside helper file if needed, but here simple local usage
const getSupabase = () => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useRealtimeSync(userId: string | undefined) {
    const { loadData } = useAppStore();

    useEffect(() => {
        if (!userId) return;

        const supabase = getSupabase();

        console.log("Setting up Realtime subscription for user:", userId);

        const channel = supabase.channel('db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `owner_id=eq.${userId}` },
                () => { console.log('RT: Transactions changed'); loadData(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `owner_id=eq.${userId}` },
                () => { console.log('RT: Projects changed'); loadData(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'debts', filter: `owner_id=eq.${userId}` },
                () => { console.log('RT: Debts changed'); loadData(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clients', filter: `owner_id=eq.${userId}` },
                () => { console.log('RT: Clients changed'); loadData(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'goals', filter: `owner_id=eq.${userId}` },
                () => { console.log('RT: Goals changed'); loadData(); })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') console.log('Realtime connected!');
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, loadData]);
}
