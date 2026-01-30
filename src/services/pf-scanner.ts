import { Transaction, Budget, Debt, RecurringBill, Alert, AlertType, AlertSeverity } from '@/lib/types';
import { differenceInDays, isSameMonth, parseISO, startOfDay, addDays, isAfter, isBefore, isSameDay, getMonth, getYear } from 'date-fns';

export function scanPF(
    transactions: Transaction[],
    budgets: Budget[],
    debts: Debt[],
    recurringBills: RecurringBill[],
    ownerId?: string
): Alert[] {
    const alerts: Alert[] = [];
    const now = new Date();
    const today = startOfDay(now);
    const currentMonthStr = `${getYear(now)}-${String(getMonth(now) + 1).padStart(2, '0')}`;

    // Helper to add alert with dedupe fingerprint logic later
    const add = (
        type: AlertType,
        severity: AlertSeverity,
        title: string,
        message: string,
        fingerprintKey: string,
        payload?: any,
        refs?: { entity: string; id: string }[]
    ) => {
        // Generate deterministic fingerprint
        const fingerprint = `${type}:${fingerprintKey}`;

        alerts.push({
            id: crypto.randomUUID(),
            owner_id: ownerId,
            ledgerType: 'PF',
            type,
            severity,
            status: 'OPEN',
            title,
            message,
            reasonPayload: payload,
            sourceRefs: refs,
            fingerprint,
            createdAt: now.toISOString()
        });
    };

    // ===========================================================================
    // A) BUDGET SCANNER
    // ===========================================================================
    const pfTransactions = transactions.filter(t => t.mode === 'PF' && t.type === 'EXPENSE' && t.status !== 'SCHEDULED');

    // Group spending by category for current month
    const spendingByCategory: Record<string, number> = {};
    pfTransactions.forEach(t => {
        const tDate = parseISO(t.date);
        if (isSameMonth(tDate, now)) {
            spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount;
        }
    });

    const pfBudgets = budgets.filter(b => b.mode === 'PF');

    pfBudgets.forEach(budget => {
        const spent = spendingByCategory[budget.category] || 0;
        const limit = budget.limit;
        const pct = spent / limit;

        if (spent > limit) {
            const excess = spent - limit;
            add(
                'BUDGET_OVER',
                'HIGH',
                `Orçamento de ${budget.category} estourado`,
                `Você gastou ${(spent / 100).toFixed(2)} de ${(limit / 100).toFixed(2)}. Excesso de R$ ${(excess / 100).toFixed(2)}.`,
                `budget_over:${currentMonthStr}:${budget.category}`,
                { spent, limit, excess }
            );
        } else if (pct >= 0.8) {
            add(
                'BUDGET_NEAR',
                'MEDIUM',
                `Atenção: ${budget.category} perto do limite`,
                `Você já consumiu ${(pct * 100).toFixed(0)}% do orçamento de ${budget.category}.`,
                `budget_near:${currentMonthStr}:${budget.category}`,
                { spent, limit, pct }
            );
        }
    });

    // ===========================================================================
    // B) DUE DATE SCANNER (Bills & Debts)
    // ===========================================================================

    // 1. Pending Transactions (Contas a Pagar)
    const pendingBills = transactions.filter(t =>
        t.mode === 'PF' &&
        t.status === 'PENDING' &&
        t.dueDate
    );

    pendingBills.forEach(bill => {
        if (!bill.dueDate) return;
        const due = parseISO(bill.dueDate);
        const diff = differenceInDays(due, today);

        if (diff < 0) {
            // Overdue
            add(
                'OVERDUE',
                'HIGH',
                `Conta Atrasada: ${bill.description}`,
                `Venceu há ${Math.abs(diff)} dias. Valor: R$ ${(bill.amount / 100).toFixed(2)}`,
                `bill_overdue:${bill.id}`,
                { dueDate: bill.dueDate, amount: bill.amount, daysLate: Math.abs(diff) },
                [{ entity: 'transaction', id: bill.id }]
            );
        } else if (diff === 0) {
            // Due Today
            add(
                'DUE_TODAY',
                'HIGH',
                `Vence Hoje: ${bill.description}`,
                `Valor: R$ ${(bill.amount / 100).toFixed(2)}. Pague para evitar juros.`,
                `bill_today:${bill.id}`,
                { dueDate: bill.dueDate, amount: bill.amount },
                [{ entity: 'transaction', id: bill.id }]
            );
        } else if (diff === 1) {
            // Due Tomorrow
            add(
                'DUE_SOON',
                'MEDIUM',
                `Vence Amanhã: ${bill.description}`,
                `Prepare-se para pagar R$ ${(bill.amount / 100).toFixed(2)}.`,
                `bill_tomorrow:${bill.id}`,
                { dueDate: bill.dueDate, amount: bill.amount },
                [{ entity: 'transaction', id: bill.id }]
            );
        }
    });

    // 2. Debts (Checks day of month)
    debts.filter(d => d.mode === 'PF' && d.status !== 'RENEGOTIATED').forEach(debt => {
        // Logic for debt due date relative to current month
        // Assuming debt.dueDate is day of month (1-31)
        const thisMonthDue = new Date(now.getFullYear(), now.getMonth(), debt.dueDate);

        // If today is past due date, check if paid? 
        // Debts usually don't have "paid" flag in this simple model unless balance decreases.
        // We will warn 2 days before.

        const diff = differenceInDays(thisMonthDue, today);

        if (diff >= 0 && diff <= 3) {
            add(
                'DUE_SOON',
                'MEDIUM',
                `Vencimento Dívida: ${debt.name}`,
                `Vence dia ${debt.dueDate}. Pagamento mínimo: R$ ${(debt.minimumPayment ? debt.minimumPayment / 100 : 0).toFixed(2)}`,
                `debt_due:${debt.id}:${currentMonthStr}`,
                { dueDate: thisMonthDue.toISOString(), balance: debt.balance },
                [{ entity: 'debt', id: debt.id }]
            );
        }
    });

    // ===========================================================================
    // D) DATA HYGIENE
    // ===========================================================================
    const uncategorized = pfTransactions.filter(t => !t.category || t.category === 'Outros' || t.category === 'Uncategorized');
    if (uncategorized.length >= 5) {
        add(
            'UNCATEGORIZED',
            'MEDIUM',
            'Muitas transações sem categoria',
            `Você tem ${uncategorized.length} transações recentes não categorizadas. Organize para ter insights melhores.`,
            `uncategorized_count:${currentMonthStr}`,
            { count: uncategorized.length }
        );
    }

    return alerts;
}
