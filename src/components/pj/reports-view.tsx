"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppStore } from "@/store/use-store";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths, isSameMonth, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, DollarSign, Users, AlertCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ReportsViewProps {
    period: 'MONTHLY' | 'ANNUAL';
    date: Date;
}

export function ReportsView({ period, date }: ReportsViewProps) {
    const { transactions, clients, projects } = useAppStore();
    const router = useRouter();

    const stats = useMemo(() => {
        const pjTransactions = transactions.filter(t => t.mode === 'PJ');

        const interval = period === 'MONTHLY'
            ? { start: startOfMonth(date), end: endOfMonth(date) }
            : { start: startOfYear(date), end: endOfYear(date) };

        // Realized: Date of payment/transaction falls in interval. Status PAID.
        const validRealized = pjTransactions.filter(t =>
            t.type === 'INCOME' &&
            t.status === 'PAID' &&
            isWithinInterval(parseISO(t.date), interval)
        );

        const revenueRealized = validRealized.reduce((acc, t) => acc + t.amount, 0);

        // Expected (Previsto): Date of due date falls in interval. Status != PAID.
        // MUST FILTER OUT SUSPENDED/CANCELED PROJECTS
        const validExpected = pjTransactions.filter(t => {
            if (t.type !== 'INCOME' || t.status === 'PAID') return false;
            if (!isWithinInterval(parseISO(t.date), interval)) return false;

            // Check project status
            if (t.projectId) {
                const project = projects.find(p => p.id === t.projectId);
                if (project && (project.status === 'PAUSED' || project.status === 'CANCELED' || project.status === 'ARCHIVED')) {
                    return false;
                }
            }
            return true;
        });

        const revenueExpected = validExpected.reduce((acc, t) => acc + t.amount, 0);

        // Expenses
        const expensesRealized = pjTransactions
            .filter(t => t.type === 'EXPENSE' && t.status === 'PAID' && isWithinInterval(parseISO(t.date), interval))
            .reduce((acc, t) => acc + t.amount, 0);

        const expensesExpected = pjTransactions
            .filter(t => t.type === 'EXPENSE' && isWithinInterval(parseISO(t.date), interval))
            .reduce((acc, t) => acc + t.amount, 0);

        const profit = revenueRealized - expensesRealized;

        // Receivables Aging (Global context, not just interval, usually)
        // Or if strictly for report period? Aging usually refers to ALL time overdue.
        // User request: "Atrasados (vencidos e não recebidos)". Usually this implies current state.
        const today = new Date();
        const allReceivables = pjTransactions.filter(t => t.type === 'INCOME' && t.status !== 'PAID');
        const late = allReceivables.filter(t => {
            const tDate = parseISO(t.date);
            if (tDate >= today) return false;

            // Filter out suspended projects for Overdue too? usually yes.
            if (t.projectId) {
                const project = projects.find(p => p.id === t.projectId);
                if (project && (project.status === 'PAUSED' || project.status === 'CANCELED' || project.status === 'ARCHIVED')) {
                    return false;
                }
            }
            return true;
        });

        const aging = {
            '0-7': late.filter(t => {
                const diff = (today.getTime() - parseISO(t.date).getTime()) / (1000 * 60 * 60 * 24);
                return diff <= 7;
            }).reduce((acc, t) => acc + t.amount, 0),
            '8-15': late.filter(t => {
                const diff = (today.getTime() - parseISO(t.date).getTime()) / (1000 * 60 * 60 * 24);
                return diff > 7 && diff <= 15;
            }).reduce((acc, t) => acc + t.amount, 0),
            '16-30': late.filter(t => {
                const diff = (today.getTime() - parseISO(t.date).getTime()) / (1000 * 60 * 60 * 24);
                return diff > 15 && diff <= 30;
            }).reduce((acc, t) => acc + t.amount, 0),
            '30+': late.filter(t => {
                const diff = (today.getTime() - parseISO(t.date).getTime()) / (1000 * 60 * 60 * 24);
                return diff > 30;
            }).reduce((acc, t) => acc + t.amount, 0),
        };

        // Inconsistencies Check
        // Projects where (Total Value) != (Sum of Transactions)
        const inconsistencies = projects.filter(p => {
            if (['DONE', 'CANCELED', 'ARCHIVED'].includes(p.status)) return false; // Ignore closed projects for now or maybe check them too?
            // User: "3 projetos com valor divergente...". Let's check ACTIVE/PAUSED/LEAD

            const pTrans = pjTransactions.filter(t => t.projectId === p.id && t.type === 'INCOME');
            const sumTrans = pTrans.reduce((acc, t) => acc + t.amount, 0);
            return sumTrans !== p.totalValue;
        });

        // Top Clients (by total revenue in the period - Realized)
        const clientRevenue = validRealized.reduce((acc, t) => {
            let clientId = t.clientId;
            // Fallback/Override: If linked to a project, ensure we attribute to the current project owner
            if (t.projectId) {
                const proj = projects.find(p => p.id === t.projectId);
                if (proj) clientId = proj.clientId;
            }

            if (clientId) {
                acc[clientId] = (acc[clientId] || 0) + t.amount;
            }
            return acc;
        }, {} as Record<string, number>);

        const topClients = Object.entries(clientRevenue)
            .map(([id, amount]) => {
                const client = clients.find(c => c.id === id);
                return {
                    id,
                    amount,
                    name: client?.companyName || client?.name || 'Cliente Desconhecido'
                };
            })
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

        return {
            revenueRealized,
            revenueExpected,
            expensesRealized,
            expensesExpected,
            profit,
            aging,
            totalLate: late.reduce((acc, t) => acc + t.amount, 0),
            topClients,
            inconsistencies
        };
    }, [transactions, clients, projects, period, date]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);

    return (
        <div className="space-y-6">
            {/* Inconsistencies Warning */}
            {stats.inconsistencies.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <div>
                            <h4 className="font-bold text-amber-800 text-sm">Atenção: Projetos com Divergência</h4>
                            <p className="text-xs text-amber-700">
                                {stats.inconsistencies.length} projetos possuem valor total diferente da soma de suas parcelas.
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-amber-500 text-amber-700 hover:bg-amber-100" onClick={() => router.push('/pj/projetos')}>
                        Verificar Projetos <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                </div>
            )}

            {/* DRE Simplificada */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Receita (Realizada)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">{formatCurrency(stats.revenueRealized)}</div>
                        <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-muted-foreground">
                                +{formatCurrency(stats.revenueExpected)} a realizar
                            </p>
                            {/* Comparison with previous period could go here */}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Despesas (Pagas)</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{formatCurrency(stats.expensesRealized)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            +{formatCurrency(stats.expensesExpected - stats.expensesRealized)} a pagar
                        </p>
                    </CardContent>
                </Card>

                <Card className={cn("border-l-4", stats.profit >= 0 ? "border-l-primary" : "border-l-red-500")}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Lucro Líquido</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", stats.profit < 0 && "text-red-500")}>
                            {formatCurrency(stats.profit)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Margem Real: {stats.revenueRealized > 0 ? ((stats.profit / stats.revenueRealized) * 100).toFixed(1) : 0}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recebíveis Aging */}
                <Card className="col-span-4">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Aging de Recebíveis</CardTitle>
                                <CardDescription>Total em atraso (todos os períodos)</CardDescription>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-red-500">{formatCurrency(stats.totalLate)}</div>
                                <div className="text-[10px] text-muted-foreground uppercase">Vencido</div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(stats.aging).map(([range, amount]) => (
                                <div key={range} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">{range} dias</span>
                                        <span className={cn("font-bold", amount > 0 ? "text-red-500" : "")}>{formatCurrency(amount)}</span>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full transition-all",
                                                range === '0-7' ? "bg-amber-400" : range === '8-15' ? "bg-amber-500" : range === '16-30' ? "bg-orange-500" : "bg-red-500"
                                            )}
                                            style={{ width: `${stats.totalLate > 0 ? (amount / stats.totalLate) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {stats.totalLate === 0 && (
                                <p className="text-center text-sm text-muted-foreground py-4 italic">Nenhum valor em atraso. Parabéns! 🎉</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Clientes */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Top Clientes</CardTitle>
                        <CardDescription>Por receita realizada no período</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-5">
                            {stats.topClients.length === 0 ? (
                                <div className="h-40 flex items-center justify-center text-muted-foreground text-sm italic">
                                    Sem receita realizada neste período.
                                </div>
                            ) : (
                                stats.topClients.map((client, i) => (
                                    <div key={client.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                                                {i + 1}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold truncate max-w-[140px]">{client.name}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-tight">
                                                    {((client.amount / stats.revenueRealized) * 100).toFixed(0)}% da receita
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-sm font-medium">{formatCurrency(client.amount)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
