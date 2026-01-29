import { useMemo } from 'react';
import { useAppStore } from '@/store/use-store';
import { Client, Transaction } from '@/lib/types';
import { isBefore, startOfDay, parseISO } from 'date-fns';

export type ClientFinancialStatus = 'EM_DIA' | 'PENDENTE' | 'DEVENDO';

export function useClientStatus(clientId: string) {
    const { transactions } = useAppStore();

    const stats = useMemo(() => {
        const clientTransactions = transactions.filter(t => t.clientId === clientId && t.mode === 'PJ' && t.type === 'INCOME');

        const today = startOfDay(new Date());

        const late = clientTransactions.filter(t => t.status !== 'PAID' && isBefore(parseISO(t.date), today));
        const pending = clientTransactions.filter(t => t.status !== 'PAID' && !isBefore(parseISO(t.date), today));
        const paid = clientTransactions.filter(t => t.status === 'PAID');

        let status: ClientFinancialStatus = 'EM_DIA';
        if (late.length > 0) status = 'DEVENDO';
        else if (pending.length > 0) status = 'PENDENTE';

        const totalToReceive = pending.reduce((acc, t) => acc + t.amount, 0) + late.reduce((acc, t) => acc + t.amount, 0);
        const totalReceived = paid.reduce((acc, t) => acc + t.amount, 0);

        return {
            status,
            totalToReceive,
            totalReceived,
            lastPayment: paid.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date,
            lateCount: late.length,
            pendingCount: pending.length
        };
    }, [clientId, transactions]);

    return stats;
}
