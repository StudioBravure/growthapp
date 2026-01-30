"use client";

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Activity, TrendingUp, AlertCircle, Calendar, ChevronRight, Bell, ShieldCheck } from "lucide-react";
import { useAppStore } from "@/store/use-store";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { parseISO, isSameMonth, differenceInDays } from "date-fns";
import { ConsolidatedOverview } from "@/components/dashboard/consolidated-overview";

export default function DashboardPage() {
    const router = useRouter();
    const { mode, transactions, generateMonthlyBills, updateTransaction, projects, alerts, goals } = useAppStore();

    // Auto-generate recurring bills for current month whenever dashboard is visited
    useEffect(() => {
        generateMonthlyBills(new Date());
    }, [generateMonthlyBills]);

    const activeAlerts = alerts.filter(a => a.status === 'OPEN' && (mode === 'CONSOLIDATED' || a.ledgerType === mode));
    const activeAlertsCount = activeAlerts.length;

    const filteredTransactions = transactions.filter(t => {
        if (mode === 'CONSOLIDATED') return true;
        return t.mode === mode;
    });

    const today = new Date();

    // Financial Stats
    const balance = filteredTransactions
        .filter(t => t.status === 'PAID')
        .reduce((acc, t) => acc + (t.type === 'INCOME' ? t.amount : -t.amount), 0);

    const pendingIncome = filteredTransactions
        .filter(t => t.type === 'INCOME' && t.status === 'PENDING')
        .reduce((acc, t) => acc + t.amount, 0);

    const lateIncome = filteredTransactions
        .filter(t => t.type === 'INCOME' && t.status !== 'PAID' && parseISO(t.date) < today)
        .reduce((acc, t) => acc + t.amount, 0);

    const monthExpenses = filteredTransactions
        .filter(t => t.type === 'EXPENSE' && isSameMonth(parseISO(t.date), today))
        .reduce((acc, t) => acc + t.amount, 0);

    // Filter alerts for the "Upcoming Alerts" list (Focus on bills/debts)
    const displayAlerts = activeAlerts.filter(a =>
        ['OVERDUE', 'DUE_TODAY', 'DUE_SOON', 'HIGH', 'CRITICAL'].includes(a.type) || a.severity === 'HIGH' || a.severity === 'CRITICAL'
    ).slice(0, 5);

    const criticalCount = activeAlerts.filter(a => a.severity === 'CRITICAL').length;

    // PJ Specific Status
    const pjProjects = projects.filter(p => p.status === 'ACTIVE');
    const projectsAtRisk = pjProjects.filter(p => {
        if (!p.deadline) return false;
        const diff = differenceInDays(parseISO(p.deadline), today);
        return diff >= 0 && diff <= 7;
    });

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);

    if (mode === 'CONSOLIDATED') {
        return <ConsolidatedOverview />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                        {mode === 'PF' ? 'Finanças Pessoais' : mode === 'PJ' ? 'Centro Operacional PJ' : 'Visão 360°'}
                    </h1>
                    <p className="text-muted-foreground">Resumo financeiro e operacional de hoje.</p>
                </div>
                <div className="flex items-center gap-2">
                    {mode !== 'PJ' && (
                        <Button variant="outline" size="sm" onClick={() => router.push('/alerts')} className="relative">
                            <Bell className="mr-2 h-4 w-4" />
                            Alertas
                            {activeAlertsCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground font-bold">
                                    {activeAlertsCount}
                                </span>
                            )}
                        </Button>
                    )}
                    {mode === 'PJ' && (
                        <Button variant="outline" size="sm" onClick={() => router.push('/pj/relatorios')} className="relative">
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Relatórios
                        </Button>
                    )}
                    <Button size="sm" onClick={() => router.push(mode === 'PJ' ? '/pj/projetos' : '/financeiro')}>
                        {mode === 'PJ' ? 'Novo Projeto' : 'Novo Lançamento'}
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* KPI 1: Caixa ou Receita */}
                <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {mode === 'PJ' ? 'Receita Total (Mês)' : 'Caixa Atual'}
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {mode === 'PJ'
                                ? formatCurrency(filteredTransactions.filter(t => t.type === 'INCOME' && isSameMonth(parseISO(t.date), today)).reduce((acc, t) => acc + t.amount, 0))
                                : formatCurrency(balance)
                            }
                        </div>
                        <p className="text-xs text-muted-foreground font-medium flex items-center mt-1">
                            <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
                            Fluxo estável
                        </p>
                    </CardContent>
                </Card>

                {/* KPI 2: A Receber */}
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">A Receber</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(pendingIncome)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {mode === 'PJ' ? 'Recebíveis futuros' : 'Previsão de Entrada'}
                        </p>
                    </CardContent>
                </Card>

                {/* KPI 3: Críticos (Atrasados ou Alertas) */}
                <Card
                    className={cn(
                        "shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4",
                        (mode === 'PJ' ? lateIncome > 0 : criticalCount > 0) ? "border-l-destructive" : "border-l-transparent"
                    )}
                    onClick={() => router.push(mode === 'PJ' ? '/pj/clientes' : '/alerts')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {mode === 'PJ' ? 'Recebíveis Atrasados' : 'Alertas Críticos'}
                        </CardTitle>
                        <AlertCircle className={cn("h-4 w-4", (mode === 'PJ' ? lateIncome > 0 : criticalCount > 0) ? "text-destructive animate-pulse" : "text-muted-foreground")} />
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", (mode === 'PJ' ? lateIncome > 0 : criticalCount > 0) ? "text-destructive" : "")}>
                            {mode === 'PJ' ? formatCurrency(lateIncome) : criticalCount}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {(mode === 'PJ' ? lateIncome > 0 : criticalCount > 0) ? 'Ação imediata necessária' : 'Tudo em dia'}
                        </p>
                    </CardContent>
                </Card>

                {/* KPI 4: Projetos ou Atividades */}
                <Card
                    className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(mode === 'PJ' ? '/pj/projetos' : '/')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {mode === 'PJ' ? 'Projetos em Risco' : 'Projetos Ativos'}
                        </CardTitle>
                        <Activity className={cn("h-4 w-4", mode === 'PJ' && projectsAtRisk.length > 0 ? "text-amber-500" : "text-violet-500")} />
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", mode === 'PJ' && projectsAtRisk.length > 0 ? "text-amber-500" : "")}>
                            {mode === 'PJ' ? projectsAtRisk.length : goals.length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {mode === 'PJ'
                                ? 'Prazos menores que 7 dias'
                                : `${goals.filter(g => g.currentAmount >= g.targetAmount).length} meta(s) atingida(s)`}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Lado Esquerdo: Fluxo ou Lista PJ */}
                <Card className="col-span-4 shadow-sm">
                    <CardHeader>
                        <CardTitle>
                            {mode === 'PJ' ? 'Próximos Recebíveis' : 'Fluxo de Caixa (Real vs Previsto)'}
                        </CardTitle>
                        <CardDescription>
                            {mode === 'PJ' ? 'Entradas agendadas para os próximos 15 dias' : 'Movimentação dos últimos 6 meses'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className={cn(mode === 'PJ' ? "p-0" : "h-[300px] flex items-center justify-center text-muted-foreground rounded-md mx-6 mb-6")}>
                        {mode === 'PJ' ? (
                            <div className="divide-y divide-border/40 border-t">
                                {filteredTransactions
                                    .filter(t => t.type === 'INCOME' && t.status !== 'PAID' && differenceInDays(parseISO(t.date), today) >= 0 && differenceInDays(parseISO(t.date), today) <= 15)
                                    .slice(0, 5)
                                    .map(t => (
                                        <div key={t.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                    <DollarSign className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">{t.description}</p>
                                                    <p className="text-xs text-muted-foreground">Vence em {differenceInDays(parseISO(t.date), today)} dias</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold">{formatCurrency(t.amount)}</p>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="h-auto p-0 text-[10px] text-primary"
                                                    onClick={() => updateTransaction(t.id, { status: 'PAID' })}
                                                >
                                                    Confirmar Recebimento
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                }
                                {filteredTransactions.filter(t => t.type === 'INCOME' && t.status !== 'PAID' && differenceInDays(parseISO(t.date), today) >= 0).length === 0 && (
                                    <p className="p-8 text-center text-muted-foreground text-sm italic">Nenhum recebível próximo.</p>
                                )}
                            </div>
                        ) : (
                            "Visualização do Gráfico em Breve"
                        )}
                    </CardContent>
                </Card>

                {/* Lado Direito: Contas ou Projetos Críticos */}
                <Card className="col-span-3 shadow-sm overflow-hidden border-none ring-1 ring-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div>
                            <CardTitle className="text-lg">
                                {mode === 'PJ' ? 'Prazos Críticos' : 'Alertas e Contas'}
                            </CardTitle>
                            <CardDescription>Atenção imediata</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => router.push(mode === 'PJ' ? '/pj/projetos' : '/alerts')}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {mode === 'PJ' ? (
                            <div className="divide-y divide-border/40">
                                {projectsAtRisk.slice(0, 4).map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-4 bg-card hover:bg-muted/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold text-[10px]">
                                                {p.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold truncate max-w-[140px]">{p.name}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                    <p className="text-[10px] font-medium text-amber-600">
                                                        Vence em {differenceInDays(parseISO(p.deadline!), today)} dias
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-[10px] rounded-full border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                                            onClick={() => router.push(`/pj/projetos`)}
                                        >
                                            Ver Projeto
                                        </Button>
                                    </div>
                                ))}
                                {projectsAtRisk.length === 0 && (
                                    <div className="p-10 text-center">
                                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-2">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <p className="text-xs text-muted-foreground italic">Sem prazos críticos no momento.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="divide-y border-t">
                                {displayAlerts.map(alert => (
                                    <div key={alert.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold",
                                                alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                                            )}>
                                                {alert.type.substring(0, 2)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium truncate max-w-[120px]">{alert.title}</p>
                                                <p className={cn(
                                                    "text-[10px] items-center flex gap-1 font-medium",
                                                    alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? "text-destructive" : "text-muted-foreground"
                                                )}>
                                                    {alert.type === 'OVERDUE' ? 'Atrasado' : 'Atenção'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {/* Show amount if available in payload */}
                                            {alert.reasonPayload?.amount && (
                                                <p className="text-sm font-bold">{formatCurrency(alert.reasonPayload.amount)}</p>
                                            )}
                                            {alert.sourceRefs?.[0]?.entity === 'transaction' && (
                                                <Button
                                                    variant="link"
                                                    className="h-auto p-0 text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => {
                                                        const refId = alert.sourceRefs?.[0]?.id;
                                                        if (refId) updateTransaction(refId, { status: 'PAID' });
                                                    }}
                                                >
                                                    Pagar agora
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {displayAlerts.length === 0 && (
                                    <div className="p-10 text-center">
                                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-2">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <p className="text-xs text-muted-foreground italic">Tudo em dia! Sem alertas ativos.</p>
                                    </div>
                                )}
                            </div>
                        )}
                        <Button
                            variant="ghost"
                            className="w-full rounded-none h-10 text-xs text-muted-foreground hover:text-primary border-t"
                            onClick={() => router.push(mode === 'PJ' ? '/pj/projetos' : '/alerts')}
                        >
                            {mode === 'PJ' ? 'Ver todos os projetos' : 'Ver todos os alertas'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

