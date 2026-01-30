import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, addMonths } from "date-fns";
import { Calendar, ChevronRight, DollarSign, TrendingUp, Wallet } from "lucide-react";
import { Debt } from "@/lib/types";

interface SimulationResult {
    months: number;
    totalInterest: number;
    totalPaid: number;
    totalDebt: number;
    timeline: { month: number; remainingDebt: number; accumulatedInterest: number }[];
    month1Plan: { type: string; debtId: string; amount: number }[];
}

interface ResultsPanelProps {
    result: SimulationResult;
    effectivePayment: number;
    debts: Debt[]; // Needed to map names in plan
}

export function ResultsPanel({ result, effectivePayment, debts }: ResultsPanelProps) {
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);
    const quitDate = addMonths(new Date(), result.months);

    // Prepare plan data
    const month1Map = new Map<string, { paid: number, remaining: number }>();
    debts.forEach(d => month1Map.set(d.id, { paid: 0, remaining: d.balance }));

    result.month1Plan.forEach(tx => {
        const d = month1Map.get(tx.debtId);
        if (d) {
            d.paid += tx.amount;
            d.remaining -= tx.amount;
        }
    });

    const planRows = Array.from(month1Map.entries())
        .map(([id, data]) => {
            const debt = debts.find(d => d.id === id);
            return { name: debt?.name || 'Desconhecido', ...data, id };
        })
        .filter(r => r.paid > 0) // Show only what is being paid? Or all? Prompt says "Plano de pagamento". Usually priority list.
        .sort((a, b) => b.paid - a.paid);

    // Chart Data Sampling
    const chartData = result.timeline.map((item, i) => {
        // Show every month if total months < 24
        // If > 24, show ~20 points max
        const step = Math.ceil(result.months / 24);
        if (result.months > 24 && i % step !== 0 && i !== result.months - 1) return null;
        return { month: item.month, Saldo: item.remainingDebt };
    }).filter(Boolean);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 4.1 Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-sm">
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Quitação Prevista
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold">{result.months}</span>
                            <span className="text-sm text-muted-foreground">meses</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{format(quitDate, 'MMMM yyyy')}</span>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                            <Wallet className="h-3 w-3" /> Total Dívidas
                        </span>
                        <span className="text-2xl font-bold">{formatCurrency(result.totalDebt)}</span>
                        <span className="text-xs text-muted-foreground">Saldo atual consolidado</span>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Juros Estimados
                        </span>
                        <span className="text-2xl font-bold text-red-500">{formatCurrency(result.totalInterest)}</span>
                        <span className="text-xs text-muted-foreground">Custo total da dívida</span>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-primary/20 bg-primary/5">
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 text-primary">
                            <DollarSign className="h-3 w-3" /> Aporte Efetivo
                        </span>
                        <span className="text-2xl font-bold text-primary">{formatCurrency(effectivePayment)}</span>
                        <span className="text-xs text-primary/70">Parcela mensal usada</span>
                    </CardContent>
                </Card>
            </div>

            {/* 4.2 Chart */}
            <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Evolução da Dívida</h3>
                <div className="h-[300px] w-full bg-card/50 rounded-lg p-4 border border-border/50 shadow-inner">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="month"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v) => `M${v}`}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: '8px',
                                    color: 'hsl(var(--foreground))'
                                }}
                                formatter={(val: any) => formatCurrency(Number(val) || 0)}
                                labelFormatter={(l) => `Mês ${l}`}
                            />
                            <Area
                                type="monotone"
                                dataKey="Saldo"
                                stroke="hsl(var(--primary))"
                                fill="url(#colorSaldo)"
                                strokeWidth={3}
                                animationDuration={700}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 4.3 Payment Plan */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Plano de Pagamento (Mês 1)</h3>
                    {/* <Button variant="link" size="sm" className="h-auto p-0 text-xs">Ver plano completo <ChevronRight className="h-3 w-3" /></Button> */}
                </div>

                <div className="border rounded-md overflow-hidden bg-card">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Dívida Priorizada</TableHead>
                                <TableHead className="text-right">Pagamento no Mês</TableHead>
                                <TableHead className="text-right">Saldo Restante</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {planRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                                        Nenhum pagamento previsto. Verifique se o aporte cobre os juros.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                planRows.map((row, i) => (
                                    <TableRow key={row.id}>
                                        <TableCell>
                                            <div className="font-medium">{row.name}</div>
                                            {i === 0 && <Badge variant="secondary" className="text-[10px] mt-0.5">Foco Principal</Badge>}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-foreground">
                                            {formatCurrency(row.paid)}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {formatCurrency(Math.max(0, row.remaining))}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
