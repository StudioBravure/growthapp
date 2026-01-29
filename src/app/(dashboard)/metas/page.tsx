"use client";

import { useAppStore } from "@/store/use-store";
import { DebtSimulator } from "@/components/finance/debt-simulator";

export default function MetasPage() {
    const { mode } = useAppStore();

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Metas e Dívidas</h1>
                    <p className="text-muted-foreground">{mode === 'PF' ? 'Planejamento para liberdade financeira.' : 'Metas de faturamento e quitação.'}</p>
                </div>
            </div>

            <DebtSimulator />

            {/* Future placeholder for other goals */}
        </div>
    )
}
