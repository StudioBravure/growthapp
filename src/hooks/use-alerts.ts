import { useMemo } from 'react';
import { useAppStore } from '@/store/use-store';
import { Alert, AlertType, AlertSeverity } from '@/lib/types';
import { isAfter, isBefore, addDays, startOfDay, parseISO, format, differenceInDays } from 'date-fns';

export function useAlerts() {
    const { transactions, debts, goals, budgets, mode } = useAppStore();

    const alerts = useMemo(() => {
        const pfAlerts: Alert[] = [];
        const today = startOfDay(new Date());
        const next7Days = addDays(today, 7);

        // --- 1. CONTAS (Transactions) ---
        const pendingPF = transactions.filter(t => t.mode === 'PF' && t.status !== 'PAID');

        pendingPF.forEach(t => {
            const dueDate = startOfDay(parseISO(t.date));

            if (isBefore(dueDate, today)) {
                pfAlerts.push({
                    id: `bill-late-${t.id}`,
                    type: 'BILL',
                    severity: 'CRITICAL',
                    title: 'Conta Atrasada',
                    description: `${t.description} — R$ ${(t.amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    date: t.date,
                    relatedId: t.id,
                    actions: [
                        { label: 'Pagar Agora', action: 'PAY_BILL', variant: 'default' },
                        { label: 'Ver no Financeiro', action: 'VIEW_FINANCE', variant: 'outline' }
                    ]
                });
            } else if (isBefore(dueDate, next7Days)) {
                pfAlerts.push({
                    id: `bill-near-${t.id}`,
                    type: 'BILL',
                    severity: 'ATTENTION',
                    title: isBefore(dueDate, addDays(today, 1)) ? 'Vence Hoje' : 'Vence em breve',
                    description: `${t.description} — R$ ${(t.amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    date: t.date,
                    relatedId: t.id,
                    actions: [
                        { label: 'Marcar como Pago', action: 'PAY_BILL', variant: 'default' },
                        { label: 'Ver Detalhes', action: 'VIEW_FINANCE', variant: 'outline' }
                    ]
                });
            }
        });

        // --- 2. DÍVIDAS (Debts) ---
        const pfDebts = debts.filter(d => d.mode === 'PF');
        pfDebts.forEach(d => {
            if (d.status === 'LATE') {
                pfAlerts.push({
                    id: `debt-late-${d.id}`,
                    type: 'DEBT',
                    severity: 'CRITICAL',
                    title: 'Dívida Crítica',
                    description: `${d.name} está com status de atraso.`,
                    date: today.toISOString(),
                    relatedId: d.id,
                    actions: [
                        { label: 'Abrir Simulador', action: 'VIEW_DEBT_SIM', variant: 'default' },
                    ]
                });
            }

            // Check if due in next 7 days based on dueDate day
            const currentDay = today.getDate();
            const daysToDue = d.dueDate >= currentDay ? d.dueDate - currentDay : (30 - currentDay + d.dueDate);

            if (daysToDue <= 7 && d.balance > 0) {
                pfAlerts.push({
                    id: `debt-near-${d.id}`,
                    type: 'DEBT',
                    severity: 'ATTENTION',
                    title: 'Vencimento de Dívida',
                    description: `${d.name} vence em ${daysToDue} dias. Mínimo: R$ ${((d.minimumPayment || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    date: today.toISOString(),
                    relatedId: d.id,
                    actions: [
                        { label: 'Simular Pagamento', action: 'VIEW_DEBT_SIM', variant: 'outline' },
                    ]
                });
            }
        });

        // --- 3. ORÇAMENTO (Budgets) ---
        // Calculate current spending per category this month
        const currentMonthTransactions = transactions.filter(t =>
            t.mode === 'PF' &&
            t.type === 'EXPENSE' &&
            format(parseISO(t.date), 'yyyy-MM') === format(today, 'yyyy-MM')
        );

        budgets.filter(b => b.mode === 'PF').forEach(b => {
            const spent = currentMonthTransactions
                .filter(t => t.category === b.category)
                .reduce((acc, t) => acc + t.amount, 0);

            const percent = (spent / b.limit) * 100;

            if (percent >= 100) {
                pfAlerts.push({
                    id: `budget-over-${b.category}`,
                    type: 'BUDGET',
                    severity: 'CRITICAL',
                    title: 'Orçamento Estourado',
                    description: `Você gastou R$ ${(spent / 100).toLocaleString('pt-BR')} em ${b.category}, ultrapassando o limite de R$ ${(b.limit / 100).toLocaleString('pt-BR')}.`,
                    date: today.toISOString(),
                    actions: [
                        { label: 'Ajustar Limite', action: 'VIEW_CONFIG', variant: 'outline' },
                        { label: 'Ver Lançamentos', action: 'VIEW_FINANCE_CAT', variant: 'ghost' }
                    ]
                });
            } else if (percent >= 80) {
                pfAlerts.push({
                    id: `budget-near-${b.category}`,
                    type: 'BUDGET',
                    severity: 'ATTENTION',
                    title: 'Atenção ao Orçamento',
                    description: `Você atingiu ${percent.toFixed(0)}% do limite de ${b.category}.`,
                    date: today.toISOString(),
                    actions: [
                        { label: 'Ver Detalhes', action: 'VIEW_FINANCE_CAT', variant: 'outline' }
                    ]
                });
            }
        });

        // --- 4. METAS (Goals) ---
        goals.filter(g => g.mode === 'PF').forEach(g => {
            if (g.deadline) {
                const deadlineDate = parseISO(g.deadline);
                const daysLeft = differenceInDays(deadlineDate, today);
                const amountLeft = g.targetAmount - g.currentAmount;

                if (daysLeft < 0 && amountLeft > 0) {
                    pfAlerts.push({
                        id: `goal-missed-${g.id}`,
                        type: 'GOAL',
                        severity: 'ATTENTION',
                        title: 'Meta não atingida',
                        description: `A meta "${g.name}" encerrou o prazo e faltaram R$ ${(amountLeft / 100).toLocaleString('pt-BR')}.`,
                        date: g.deadline,
                        relatedId: g.id,
                        actions: [
                            { label: 'Replanejar', action: 'VIEW_GOALS', variant: 'outline' }
                        ]
                    });
                } else if (daysLeft > 0 && daysLeft <= 30 && amountLeft > (g.targetAmount * 0.5)) {
                    // Critical if 30 days left and more than half remains
                    pfAlerts.push({
                        id: `goal-at-risk-${g.id}`,
                        type: 'GOAL',
                        severity: 'ATTENTION',
                        title: 'Meta em Risco',
                        description: `Faltam ${daysLeft} dias para "${g.name}" e ainda resta R$ ${(amountLeft / 100).toLocaleString('pt-BR')}.`,
                        date: g.deadline,
                        relatedId: g.id,
                        actions: [
                            { label: 'Ver Meta', action: 'VIEW_GOALS', variant: 'outline' }
                        ]
                    });
                }
            }
        });

        return pfAlerts;
    }, [transactions, debts, goals, budgets]);

    const activeAlertsCount = alerts.length;

    return {
        alerts,
        activeAlertsCount
    };
}
