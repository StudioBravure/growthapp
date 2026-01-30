
import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/use-store';
import { scanPF } from '@/services/pf-scanner';
import { Alert } from '@/lib/types';

export function useAlertsScanner() {
    const {
        transactions, budgets, debts, recurringBills,
        setAlerts, mode
    } = useAppStore();

    // Debounce reference to avoid rapid re-scans
    const timeoutRef = useRef<NodeJS.Timeout>(null);

    useEffect(() => {
        // Only run scan if relevant data triggers it
        // Debounce 1000ms
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            console.log("[Scanner] Running analysis...");
            const generatedAlerts = scanPF(transactions, budgets, debts, recurringBills);

            // Access latest state safely without triggering re-render loop
            const currentAlerts = useAppStore.getState().alerts;
            // Merge Logic: Preserve status of existing alerts if fingerprint matches
            // We map existing alerts by fingerprint
            const existingMap = new Map<string, Alert>();
            currentAlerts.forEach(a => existingMap.set(a.fingerprint, a));

            const finalAlerts = generatedAlerts.map(newAlert => {
                const existing = existingMap.get(newAlert.fingerprint);

                if (existing) {
                    // If existing is resolved/snoozed, keep that status unless condition changed drastically?
                    // For now, simplicity: Keep ID and Status and CreatedAt
                    return {
                        ...newAlert,
                        id: existing.id,
                        status: existing.status,
                        createdAt: existing.createdAt,
                        snoozedUntil: existing.snoozedUntil,
                        resolvedAt: existing.resolvedAt
                    };
                }
                return newAlert;
            });

            // Need to avoid infinite loop if alerts didn't effectively change
            // Simple JSON stringify compare for deep check or check length/ids
            const isDifferent = JSON.stringify(finalAlerts) !== JSON.stringify(currentAlerts);

            if (isDifferent) {
                setAlerts(finalAlerts);
                console.log("[Scanner] Alerts updated:", finalAlerts.length);
            }

        }, 1000);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }
    }, [transactions, budgets, debts, recurringBills, setAlerts]); // Intentionally exclude currentAlerts to avoid loop, let the setters handle it or use functional update if possible, but Zustand state usage in dep array needs care.
    // Actually, reading currentAlerts inside effect is stale if not in deps. 
    // But putting it in deps loops.
    // Solution: Use functional state setter or useAppStore.getState() inside effect.
}
