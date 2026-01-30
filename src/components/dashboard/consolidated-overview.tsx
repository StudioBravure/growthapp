"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/store/use-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, startOfMonth, endOfMonth, addDays, isBefore, isAfter, differenceInDays, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Wallet,
    Briefcase,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    ChevronRight,
    Building2,
    User,
    CheckCircle2,
    Clock,
    Filter,
    ArrowRight,
    Target,
    Zap
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from "@/lib/utils";

type TimelineFilter = 'ALL' | 'PF' | 'PJ' | 'BILLS' | 'RECEIVABLES' | 'RISKS';

export function ConsolidatedOverview() {
    const { transactions, projects, debts, mode, setMode } = useAppStore();
    const router = useRouter();

    const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('ALL');
    const [chartScope, setChartScope] = useState<'ALL' | 'PF' | 'PJ'>('ALL');

    const today = new Date();

    // --- 1. CORE CALCULATIONS ---
    const stats = useMemo(() => {
        // --- A) Date Ranges ---
        const next7Days = addDays(today, 7);
        const next30Days = addDays(today, 30);

        // --- B) Helper Filters ---
        const getBalance = (filterMode?: 'PF' | 'PJ') => {
            return transactions
                .filter(t => (!filterMode || t.mode === filterMode))
                .reduce((acc, t) => {
                    // Only count executed transactions for balance? Or include pending if prior to today?
                    // Usually Balance = What I have NOW. So only PAID income - PAID expenses (or similar logic).
                    // For simplicity in this mock: All INCOME - All EXPENSE up to now gives "Checking Balance".
                    // Ideally we check t.status === 'PAID'.
                    if (t.status !== 'PAID') return acc;
                    return t.type === 'INCOME' ? acc + t.amount : acc - t.amount;
                }, 0);
        };

        const getProjectedIn = (filterMode?: 'PF' | 'PJ', days = 30) => {
            const limitDate = addDays(today, days);
            return transactions
                .filter(t =>
                    (!filterMode || t.mode === filterMode) &&
                    t.type === 'INCOME' &&
                    t.status !== 'PAID' &&
                    isAfter(parseISO(t.date), today) &&
                    isBefore(parseISO(t.date), limitDate)
                )
                .reduce((acc, t) => acc + t.amount, 0);
        };

        const getProjectedOut = (filterMode?: 'PF' | 'PJ', days = 30) => {
            const limitDate = addDays(today, days);
            return transactions
                .filter(t =>
                    (!filterMode || t.mode === filterMode) &&
                    t.type === 'EXPENSE' &&
                    t.status !== 'PAID' &&
                    isAfter(parseISO(t.date), today) &&
                    isBefore(parseISO(t.date), limitDate)
                )
                .reduce((acc, t) => acc + t.amount, 0);
        };

        // --- C) Calculate ---
        const pfBalance = getBalance('PF');
        const pjBalance = getBalance('PJ');

        const pfIncoming30 = getProjectedIn('PF');
        const pfOutgoing30 = getProjectedOut('PF');

        const pjIncoming30 = getProjectedIn('PJ');
        const pjOutgoing30 = getProjectedOut('PJ');

        // Overdue Transactions (Risks)
        const overdueTransactions = transactions.filter(t =>
            t.status !== 'PAID' &&
            isBefore(parseISO(t.date), today)
        );

        const pfOverdueCount = overdueTransactions.filter(t => t.mode === 'PF').length;
        const pjOverdueCount = overdueTransactions.filter(t => t.mode === 'PJ').length;

        // Project Risks (Deadline passed or close)
        const riskProjectsCount = projects.filter(p =>
            p.status === 'ACTIVE' &&
            p.deadline &&
            isBefore(parseISO(p.deadline), next7Days)
        ).length;

        // Debts Total Balance
        const pfDebtTotal = debts.filter(d => d.mode === 'PF').reduce((acc, d) => acc + d.balance, 0);
        const pjDebtTotal = debts.filter(d => d.mode === 'PJ').reduce((acc, d) => acc + d.balance, 0);

        // Late Debts
        const pfLateDebts = debts.filter(d => d.mode === 'PF' && d.status === 'LATE').length;

        return {
            pf: {
                balance: pfBalance,
                expensesForecast: pfOutgoing30,
                debt: pfDebtTotal,
                upcomingFixCount: transactions.filter(t =>
                    t.mode === 'PF' && t.isFixed && t.status !== 'PAID' && isBefore(parseISO(t.date), next7Days) && isAfter(parseISO(t.date), today)
                ).length,
                overdueCount: pfOverdueCount + pfLateDebts
            },
            pj: {
                balance: pjBalance,
                revenueForecast: pjIncoming30,
                receivablesTotal: transactions.filter(t => t.mode === 'PJ' && t.type === 'INCOME' && t.status !== 'PAID').reduce((acc, t) => acc + t.amount, 0),
                riskProjectsCount,
                receivablesOverdue: transactions.filter(t => t.mode === 'PJ' && t.type === 'INCOME' && t.status !== 'PAID' && isBefore(parseISO(t.date), today)).reduce((acc, t) => acc + t.amount, 0)
            },
            consolidated: {
                balance: pfBalance + pjBalance,
                in30: pjIncoming30 + pfIncoming30,
                in7: getProjectedIn(undefined, 7),
                out30: pfOutgoing30 + pjOutgoing30,
                out7: getProjectedOut(undefined, 7),
                result30: (pjIncoming30 + pfIncoming30) - (pfOutgoing30 + pjOutgoing30),
                alertsTotal: pfOverdueCount + pjOverdueCount + pfLateDebts + riskProjectsCount
            }
        };
    }, [transactions, projects, debts, today]);

    // --- 2. TIMELINE ITEMS ---
    const timeline = useMemo(() => {
        let items: any[] = [];

        // 1. Transactions (Payables & Receivables)
        transactions.filter(t => t.status !== 'PAID').forEach(t => {
            items.push({
                id: t.id,
                type: t.type === 'INCOME' ? 'RECEIVABLE' : 'BILL',
                date: parseISO(t.date),
                amount: t.amount,
                description: t.description,
                mode: t.mode,
                meta: t.category,
                isLate: isBefore(parseISO(t.date), today)
            });
        });

        // 2. Project Deadlines
        projects.forEach(p => {
            if (p.status === 'ACTIVE' && p.deadline) {
                items.push({
                    id: p.id,
                    type: 'PROJECT',
                    date: parseISO(p.deadline),
                    amount: 0,
                    description: `Entrega: ${p.name}`,
                    mode: 'PJ',
                    meta: 'Prazo Final',
                    isLate: isBefore(parseISO(p.deadline), today)
                });
            }
        });

        // Sort items by date
        items.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Calculate diff
        const withDiff = items.map(i => ({
            ...i,
            daysDiff: differenceInDays(i.date, today)
        }));

        return {
            critical: withDiff.filter(i => i.daysDiff < 0), // Late
            urgent48h: withDiff.filter(i => i.daysDiff >= 0 && i.daysDiff <= 2),
            upcoming7d: withDiff.filter(i => i.daysDiff > 2 && i.daysDiff <= 7),
            future: withDiff.filter(i => i.daysDiff > 7)
        };
    }, [transactions, projects, today]);

    // --- 3. CHART DATA ---
    const chartData = useMemo(() => {
        const data = [];
        for (let i = -5; i <= 3; i++) {
            const d = addMonths(startOfMonth(today), i);
            const key = format(d, 'MMM');

            // This is mock data generator for chart visualization
            // In a real app we would aggregate historical transactions by month
            const base = 50000 + (i * 2000);

            data.push({
                name: key,
                realBalance: i <= 0 ? base + (Math.random() * 5000) : null,
                forecastBalance: base + (Math.random() * 5000)
            });
        }
        return data;
    }, [today]);

    const chartSummary = useMemo(() => {
        if (chartData.length === 0) return "Sem dados suficientes.";
        const lastReal = chartData.findLast(d => d.realBalance !== null);
        const lastForecast = chartData[chartData.length - 1];
        if (!lastReal || !lastForecast) return "Calculando...";

        const growth = ((lastForecast.forecastBalance - lastReal.realBalance!) / lastReal.realBalance!) * 100;
        return `Projeção de ${growth >= 0 ? 'crescimento' : 'queda'} de ${Math.abs(growth).toFixed(1)}% nos próximos 3 meses.`;
    }, [chartData]);


    const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100); // Amount is in cents

    return (
        <div className="flex flex-col space-y-6">

            {/* A) HEADER & CONTROLS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 pb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Visão Geral</h2>
                    <p className="text-muted-foreground">Bem-vindo ao painel financeiro consolidado.</p>
                </div>

                {/* Focus Toggle */}
                <div className="flex bg-muted p-1 rounded-lg mt-4 md:mt-0">
                    <Button
                        variant={mode === 'CONSOLIDATED' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setMode('CONSOLIDATED')}
                        className="text-xs"
                    >
                        Consolidado
                    </Button>
                    <div className="w-px bg-border/50 my-1 mx-1" />
                    <Button
                        variant={mode === 'PF' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setMode('PF')}
                        className={cn("text-xs", mode === 'PF' && "bg-system-blue/10 text-system-blue hover:bg-system-blue/20 transition-colors")}
                    >
                        <User className="mr-2 h-3 w-3" /> Focar Pessoal
                    </Button>
                    <div className="w-px bg-border/50 my-1 mx-1" />
                    <Button
                        variant={mode === 'PJ' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setMode('PJ')}
                        className={cn("text-xs", mode === 'PJ' && "bg-system-blue/10 text-system-blue hover:bg-system-blue/20 transition-colors")}
                    >
                        <Briefcase className="mr-2 h-3 w-3" /> Focar Estúdio
                    </Button>
                </div>
            </div>

            {/* B) KPIs Consolidated */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {/* 1. Saldo */}
                <Card className="shadow-sm border-t-4 border-t-primary cursor-pointer hover:shadow-md transition-all">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saldo Total</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{formatBRL(stats.consolidated.balance)}</div>
                        <div className="flex gap-2 mt-2 text-[10px] text-muted-foreground">
                            <span className="flex items-center text-blue-500"><User className="h-3 w-3 mr-1" />{formatBRL(stats.pf.balance)}</span>
                            <span className="flex items-center text-violet-500"><Briefcase className="h-3 w-3 mr-1" />{formatBRL(stats.pj.balance)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Entradas Previstas */}
                <Card className="shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Entradas (30d)</CardTitle>
                        <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-emerald-600">{formatBRL(stats.consolidated.in30)}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Próximos 7 dias: {formatBRL(stats.consolidated.in7)}</p>
                    </CardContent>
                </Card>

                {/* 3. Saídas Previstas */}
                <Card className="shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saídas (30d)</CardTitle>
                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-red-600">{formatBRL(stats.consolidated.out30)}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Próximos 7 dias: {formatBRL(stats.consolidated.out7)}</p>
                    </CardContent>
                </Card>

                {/* 4. Resultado Líquido */}
                <Card className={cn("shadow-sm hover:shadow-md transition-all border-l-2", stats.consolidated.result30 >= 0 ? "border-l-emerald-500" : "border-l-red-500")}>
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resultado (30d)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className={cn("text-2xl font-bold", stats.consolidated.result30 >= 0 ? "text-emerald-600" : "text-red-600")}>
                            {stats.consolidated.result30 > 0 ? '+' : ''}{formatBRL(stats.consolidated.result30)}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Projeção líquida</p>
                    </CardContent>
                </Card>

                {/* 5. Alertas */}
                <Card
                    className={cn("shadow-sm hover:shadow-md transition-all cursor-pointer group", stats.consolidated.alertsTotal > 0 ? "border-destructive/30" : "")}
                    onClick={() => router.push('/financeiro/alertas')}
                >
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Alertas</CardTitle>
                        <AlertCircle className={cn("h-4 w-4", stats.consolidated.alertsTotal > 0 ? "text-destructive" : "text-muted-foreground")} />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className={cn("text-2xl font-bold", stats.consolidated.alertsTotal > 0 && "text-destructive")}>
                            {stats.consolidated.alertsTotal}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 group-hover:underline">
                            {stats.consolidated.alertsTotal > 0 ? "Resolver agora" : "Tudo em ordem"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* C) PF vs PJ PANELS (Controlled by Focus Toggle) */}
            <div className="grid gap-6 md:grid-cols-2">

                {/* PF PANEL */}
                <div className={cn(
                    "transition-all duration-500 ease-in-out",
                    mode === 'PJ' ? "opacity-40 scale-95 pointer-events-none" : "opacity-100 scale-100"
                )}>
                    <Card className="h-full flex flex-col border-blue-100 dark:border-blue-900 bg-card">
                        <CardHeader className="pb-3 border-b border-blue-100 dark:border-blue-900/50">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded text-blue-700 dark:text-blue-300">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <span className="font-semibold text-blue-950 dark:text-blue-100">Pessoal</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                                    onClick={() => router.push('/financeiro')}
                                >
                                    Abrir Módulo <ArrowRight className="ml-1 h-3 w-3" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-6 space-y-6">
                            {/* Row 1 */}
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Previsão Gastos (30d)</p>
                                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatBRL(stats.pf.expensesForecast)}</div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground mb-1">Dívida Total</p>
                                    <div className="text-sm font-bold text-slate-600">{formatBRL(stats.pf.debt)}</div>
                                </div>
                            </div>

                            {/* Row 2 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-card rounded-lg border shadow-sm">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Fixos a Vencer (7d)</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className={cn("text-lg font-bold", stats.pf.upcomingFixCount > 0 ? "text-amber-600" : "text-foreground")}>
                                            {stats.pf.upcomingFixCount}
                                        </span>
                                        <span className="text-xs text-muted-foreground">contas</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-card rounded-lg border shadow-sm">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Saúde Financeira</p>
                                    <div className={cn("text-sm font-bold truncate", stats.pf.overdueCount > 0 ? "text-destructive" : "text-emerald-600")}>
                                        {stats.pf.overdueCount > 0 ? 'Atenção' : 'Estável'}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* PJ PANEL */}
                <div className={cn(
                    "transition-all duration-500 ease-in-out",
                    mode === 'PF' ? "opacity-40 scale-95 pointer-events-none" : "opacity-100 scale-100"
                )}>
                    <Card className="h-full flex flex-col border-violet-100 dark:border-violet-900 bg-card">
                        <CardHeader className="pb-3 border-b border-violet-100 dark:border-violet-900/50">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-violet-100 dark:bg-violet-900 rounded text-violet-700 dark:text-violet-300">
                                        <Briefcase className="h-4 w-4" />
                                    </div>
                                    <span className="font-semibold text-violet-950 dark:text-violet-100">Estúdio</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-100"
                                    onClick={() => router.push('/pj')}
                                >
                                    Abrir Módulo <ArrowRight className="ml-1 h-3 w-3" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-6 space-y-6">
                            {/* Row 1 */}
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Receita Prevista (30d)</p>
                                    <div className="text-2xl font-bold text-emerald-600">{formatBRL(stats.pj.revenueForecast)}</div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground mb-1">A Receber Total</p>
                                    <div className="text-sm font-bold text-violet-600">{formatBRL(stats.pj.receivablesTotal)}</div>
                                </div>
                            </div>

                            {/* Row 2 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-card rounded-lg border shadow-sm">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Projetos em Risco</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className={cn("text-lg font-bold", stats.pj.riskProjectsCount > 0 ? "text-red-600" : "text-foreground")}>
                                            {stats.pj.riskProjectsCount}
                                        </span>
                                        <span className="text-xs text-muted-foreground">critícos</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-card rounded-lg border shadow-sm">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Recebíveis Atrasados</p>
                                    <div className={cn("text-lg font-bold truncate", stats.pj.receivablesOverdue > 0 ? "text-destructive" : "text-muted-foreground")}>
                                        {formatBRL(stats.pj.receivablesOverdue)}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* D) TIMELINE & LIST */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        Próximos Vencimentos
                    </h3>
                    <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                        {['ALL', 'PF', 'PJ', 'BILLS', 'RECEIVABLES', 'RISKS'].map((filter) => (
                            <Badge
                                key={filter}
                                variant={timelineFilter === filter ? 'default' : 'outline'}
                                className="cursor-pointer hover:bg-primary/20"
                                onClick={() => setTimelineFilter(filter as TimelineFilter)}
                            >
                                {filter === 'ALL' ? 'Tudo' :
                                    filter === 'BILLS' ? 'Contas' :
                                        filter === 'RECEIVABLES' ? 'Recebíveis' :
                                            filter === 'RISKS' ? 'Prazos/Riscos' : filter}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {/* COL 1: CRITICAL/LATE */}
                    <Card className="md:col-span-1 border-l-4 border-l-destructive bg-card h-fit">
                        <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm font-bold text-destructive flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" /> Atrasados / Críticos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {timeline.critical.length === 0 ? (
                                <p className="text-xs text-muted-foreground p-4 italic">Nenhum item crítico.</p>
                            ) : (
                                <div className="divide-y divide-destructive/10">
                                    {timeline.critical.slice(0, 5).map(item => (
                                        <div key={item.id} className="p-3 hover:bg-destructive/10 transition-colors flex justify-between items-center group">
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <Badge variant="outline" className="text-[9px] h-4 px-1 bg-background border-destructive/20 text-destructive">{item.mode}</Badge>
                                                    <span className="text-[10px] font-bold text-destructive uppercase">{Math.abs(item.daysDiff)} dias atraso</span>
                                                </div>
                                                <p className="text-xs font-semibold">{item.description}</p>
                                                {item.amount > 0 && <p className="text-xs font-bold mt-0.5">{formatBRL(item.amount)}</p>}
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 relative" onClick={() => console.log('Action')}>
                                                <Filter className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* COL 2 & 3: UPCOMING */}
                    <Card className="md:col-span-2">
                        <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm font-medium text-foreground">Agenda Geral</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {[...timeline.urgent48h, ...timeline.upcoming7d, ...timeline.future].length === 0 ? (
                                    <p className="p-8 text-center text-sm text-muted-foreground italic">Nada agendado para o futuro próximo.</p>
                                ) : (
                                    [...timeline.urgent48h, ...timeline.upcoming7d, ...timeline.future].filter(item => {
                                        if (timelineFilter === 'ALL') return true;
                                        if (timelineFilter === 'PF') return item.mode === 'PF';
                                        if (timelineFilter === 'PJ') return item.mode === 'PJ';
                                        if (timelineFilter === 'BILLS') return item.type === 'BILL';
                                        if (timelineFilter === 'RECEIVABLES') return item.type === 'RECEIVABLE';
                                        if (timelineFilter === 'RISKS') return item.isLate;
                                        return true;
                                    }).slice(0, 10).map(item => (
                                        <div key={item.id} className="p-3 md:px-4 md:py-3 flex items-center justify-between hover:bg-muted/40 transition-colors group">
                                            <div className="flex items-start gap-3">
                                                <div className={cn(
                                                    "mt-1 h-2 w-2 rounded-full shrink-0",
                                                    item.daysDiff <= 2 ? "bg-amber-500" : "bg-emerald-500",
                                                    item.type === 'RECEIVABLE' && "bg-blue-500"
                                                )} />
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge variant="secondary" className="text-[9px] h-4 px-1">{item.mode}</Badge>
                                                        <span className="text-[10px] text-muted-foreground uppercase">{format(item.date, "dd MMM")} • {item.daysDiff === 0 ? 'Hoje' : `Em ${item.daysDiff} dias`}</span>
                                                    </div>
                                                    <p className="text-sm font-medium">{item.description}</p>
                                                    <p className="text-xs text-muted-foreground">{item.meta || 'Geral'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-4">
                                                {item.amount > 0 && <span className={cn("font-mono font-bold text-sm", item.type === 'RECEIVABLE' ? 'text-emerald-600' : 'text-red-600')}>{formatBRL(item.amount)}</span>}
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => console.log('Action')}>
                                                        Ver
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* E) CHART & INSIGHTS */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <CardTitle className="text-base">Fluxo Consolidado</CardTitle>
                                <CardDescription>Histórico e Projeção</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Tabs value={chartScope} onValueChange={(v: any) => setChartScope(v)} className="w-[180px]">
                                    <TabsList className="h-7 w-full">
                                        <TabsTrigger value="ALL" className="text-xs flex-1">Tudo</TabsTrigger>
                                        <TabsTrigger value="PF" className="text-xs flex-1">PF</TabsTrigger>
                                        <TabsTrigger value="PJ" className="text-xs flex-1">PJ</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradientReal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-system-green)" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="var(--color-system-green)" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradientForecast" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-system-blue)" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="var(--color-system-blue)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px', fontSize: '12px', boxShadow: 'var(--shadow-md)' }}
                                        formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, '']}
                                    />
                                    <Area type="monotone" dataKey="realBalance" stroke="var(--color-system-green)" strokeWidth={3} fill="url(#gradientReal)" name="Realizado" />
                                    <Area type="monotone" dataKey="forecastBalance" stroke="var(--color-system-blue)" strokeWidth={3} strokeDasharray="6 4" fill="none" name="Previsto" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground text-center">
                            {chartSummary}
                        </div>
                    </CardContent>
                </Card>

                {/* INSIGHTS */}
                <div className="space-y-4">
                    {/* 1. PF Insight */}
                    <Card className="border-l-4 border-l-amber-500 bg-card">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                <AlertCircle className="h-4 w-4" /> Anomalia PF
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-xs text-amber-900 dark:text-amber-200 mb-2">
                                Gastos com <strong>Alimentação</strong> estão <strong>30% acima</strong> da média dos últimos 3 meses.
                            </p>
                            <Button size="sm" variant="outline" className="h-7 w-full text-xs border-amber-200 text-amber-800 hover:bg-amber-100">
                                Ver Detalhes
                            </Button>
                        </CardContent>
                    </Card>

                    {/* 2. PJ Insight */}
                    <Card className="border-l-4 border-l-blue-500 bg-card">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                <TrendingUp className="h-4 w-4" /> Dica de Caixa
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-xs text-blue-900 dark:text-blue-200 mb-2">
                                Recebimento de <strong>R$ 15k</strong> do projeto Alpha está previsto para sexta-feira.
                            </p>
                            <Button size="sm" variant="outline" className="h-7 w-full text-xs border-blue-200 text-blue-800 hover:bg-blue-100">
                                Ver Recebíveis
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
