import { Debt } from "@/lib/types";

export interface SimulationResult {
    months: number;
    totalInterest: number;
    totalPaid: number;
    totalDebt: number;
    timeline: { month: number; remainingDebt: number; accumulatedInterest: number }[];
    month1Plan: { type: string; debtId: string; amount: number }[];
}

export function simulateDebts(
    debts: Debt[],
    monthlyPayment: number,
    extraOneTime: number,
    strategy: 'AVALANCHE' | 'SNOWBALL',
    payMinimums: boolean,
    pauseRenegotiated: boolean
): SimulationResult {
    // Deep copy
    let currentDebts = debts.map(d => ({ ...d }));
    let months = 0;
    let totalInterest = 0;
    let totalPaid = 0;
    const timeline = [];
    const month1Plan: any[] = [];

    // Initial Debt
    const initialDebt = currentDebts.reduce((acc, d) => acc + d.balance, 0);

    // Sorting
    if (strategy === 'AVALANCHE') currentDebts.sort((a, b) => b.interestRate - a.interestRate);
    else currentDebts.sort((a, b) => a.balance - b.balance);

    const MAX_MONTHS = 240; // 20 years limit

    while (currentDebts.some(d => d.balance > 0) && months < MAX_MONTHS) {
        months++;
        let availableCash = monthlyPayment; // inputs are in cents? UI sends cents.
        if (months === 1) availableCash += extraOneTime;

        let monthlyInterestTotal = 0;

        // 1. Minimals & Interest
        currentDebts.forEach(d => {
            if (d.balance > 0) {
                // Apply Interest
                const interest = Math.round(d.balance * (d.interestRate / 100));
                d.balance += interest;
                monthlyInterestTotal += interest;
                totalInterest += interest;

                // Determine Custom or Min Payment
                let requiredPayment = 0;
                // Ignoring customSchedule for simplification unless critical, reusing logic
                if (payMinimums) {
                    const min = d.minimumPayment || Math.round(d.balance * 0.01) || 0;
                    requiredPayment = Math.min(d.balance, min);
                }

                // Pay required
                if (requiredPayment > 0) {
                    let actualPayment = Math.min(d.balance, requiredPayment);

                    // If we can't afford minimums, we pay what we can (reality check)
                    // But usually minimums are mandatory. Let's assume we use availableCash.
                    if (availableCash < actualPayment) {
                        actualPayment = availableCash;
                    }

                    if (availableCash > 0 && actualPayment > 0) {
                        d.balance -= actualPayment;
                        availableCash -= actualPayment;
                        totalPaid += actualPayment;

                        const tx = { type: 'MINIMUM', debtId: d.id, amount: actualPayment };
                        if (months === 1) month1Plan.push(tx);
                    }
                }
            }
        });

        // 2. Surplus Distribution
        for (const debt of currentDebts) {
            if (debt.balance > 0 && availableCash > 0) {
                if (pauseRenegotiated && debt.status === 'RENEGOTIATED') continue;

                const payment = Math.min(debt.balance, availableCash);
                debt.balance -= payment;
                availableCash -= payment;
                totalPaid += payment;

                const tx = { type: 'EXTRA', debtId: debt.id, amount: payment };
                if (months === 1) month1Plan.push(tx);
            }
        }

        const remaining = currentDebts.reduce((acc, d) => acc + d.balance, 0);
        timeline.push({
            month: months,
            remainingDebt: remaining,
            accumulatedInterest: totalInterest
        });

        if (currentDebts.every(d => d.balance <= 0)) break;
    }

    return {
        months,
        totalInterest,
        totalPaid,
        totalDebt: initialDebt,
        timeline,
        month1Plan
    };
}
