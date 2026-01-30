"use client";

import { useAppStore } from "@/store/use-store";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { isSameMonth, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export default function BudgetsPage() {
    const { budgets, updateBudget, transactions, categories, mode } = useAppStore();

    // Filter categories relevant to mode (PF usually)
    const activeCategories = categories.filter(c => c.mode === mode && c.type === 'EXPENSE');

    const getSpent = (catName: string) => {
        return transactions
            .filter(t => t.mode === mode && t.type === 'EXPENSE' && t.category === catName && isSameMonth(parseISO(t.date), new Date()))
            .reduce((acc, t) => acc + t.amount, 0);
    };

    const handleUpdate = (category: string, valStr: string) => {
        if (!valStr) return;
        // Parse float treating comma as dot if needed, simplistic approach
        // Input type=number usually uses dot or locale. assume dot/standard
        const val = parseFloat(valStr.replace(',', '.'));
        if (isNaN(val)) return;

        if (mode === 'CONSOLIDATED') {
            toast.error("Selecione PF ou PJ para editar orçamentos.");
            return;
        }

        updateBudget(category, mode, Math.round(val * 100)); // to cents
        toast.success(`Orçamento de ${category} atualizado`);
    }

    const formatBRL = (cents: number) => {
        return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    if (mode === 'CONSOLIDATED') {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                <h2 className="text-2xl font-bold">Modo Consolidado</h2>
                <p className="text-muted-foreground">Selecione PF ou PJ para gerenciar orçamentos específicos.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Orçamentos ({mode})</h2>
                <p className="text-muted-foreground">Defina limites de gastos mensais para receber alertas automáticos.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeCategories.map(cat => {
                    const budget = budgets.find(b => b.category === cat.name && b.mode === mode);
                    const limit = budget ? budget.limit : 0;
                    const spent = getSpent(cat.name);
                    const percent = limit > 0 ? (spent / limit) * 100 : 0;

                    return (
                        <Card key={cat.id} className={cn("transition-colors", percent > 100 ? "border-red-200 bg-red-50/10" : "")}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                        {cat.name}
                                    </div>
                                    <span className={cn("text-sm font-semibold", percent > 100 ? "text-red-600" : "text-muted-foreground")}>
                                        {formatBRL(spent)}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>{percent.toFixed(0)}% utilizado</span>
                                        <span>Meta: {formatBRL(limit)}</span>
                                    </div>
                                    <Progress value={Math.min(percent, 100)} className={cn("h-2",
                                        percent > 100 ? "bg-red-200 [&>div]:bg-red-500" :
                                            percent >= 80 ? "bg-yellow-100 [&>div]:bg-yellow-500" : ""
                                    )} />
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground whitespace-nowrap w-24">Novo Limite:</span>
                                    <div className="relative w-full">
                                        <span className="absolute left-3 top-1.5 text-xs text-muted-foreground">R$</span>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0,00"
                                            defaultValue={limit > 0 ? (limit / 100).toFixed(2) : ''}
                                            onBlur={(e) => handleUpdate(cat.name, e.target.value)}
                                            className="h-8 pl-8 text-right"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
