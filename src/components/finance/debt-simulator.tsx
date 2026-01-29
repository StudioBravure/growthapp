"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/store/use-store";
import { useDebounce } from "@/hooks/use-debounce";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, FileText, Save, RotateCcw, ChevronDown, ChevronUp, Plus, Trash2, Edit2, AlertTriangle, X, TrendingUp, TrendingDown, Target, Download, FileDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Debt } from "@/lib/types";
import { addMonths, format } from "date-fns";

export function DebtSimulator() {
    const { debts, addDebt, updateDebt, deleteDebt, mode } = useAppStore();

    // --- Simulator State (UI) ---
    const [monthlyPayment, setMonthlyPayment] = useState(2500);
    const [extraOneTime, setExtraOneTime] = useState(0);
    const [strategy, setStrategy] = useState<'AVALANCHE' | 'SNOWBALL'>('AVALANCHE');
    const [payMinimums, setPayMinimums] = useState(true);
    const [pauseRenegotiated, setPauseRenegotiated] = useState(false);
    const [targetType, setTargetType] = useState<'BUDGET' | 'DEADLINE'>('BUDGET');
    const [targetDateISO, setTargetDateISO] = useState<string>(''); // For 'DEADLINE' mode target
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // --- Debounced State for Simulation (Performance) ---
    const debouncedMonthlyPayment = useDebounce(monthlyPayment, 300);
    const debouncedExtraOneTime = useDebounce(extraOneTime, 300);

    // --- Managing Debts State (Sheet & CRUD) ---
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
    const [formData, setFormData] = useState<Partial<Debt>>({});
    const [useCustomSchedule, setUseCustomSchedule] = useState(false);
    // Helper to store raw string input for currency fields to allow "R$ 0,00" typing
    const [rawBalance, setRawBalance] = useState("");
    const [rawMinimum, setRawMinimum] = useState("");

    // Filter debts by mode (PF/PJ)
    const filteredDebts = debts.filter(d => mode === 'CONSOLIDATED' ? true : d.mode === mode);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);
    const parseCurrency = (val: string) => {
        const digits = val.replace(/\D/g, "");
        return Number(digits) / 100;
    };
    const formatCurrencyInput = (val: string) => {
        const digits = val.replace(/\D/g, "");
        const number = Number(digits) / 100;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number);
    };

    // --- Engine (Recalculates on every render if filteredDebts changes) ---
    const simulate = (strat: 'AVALANCHE' | 'SNOWBALL', forcedPayment?: number) => {
        // Deep copy to not mutate store
        let currentDebts = filteredDebts.map(d => ({ ...d }));
        let months = 0;
        let totalInterest = 0;
        let totalPaid = 0;
        const timeline = [];
        const month1Plan: any[] = [];
        const planByMonth: any[] = []; // Store full plan for PDF

        // Sorting
        if (strat === 'AVALANCHE') currentDebts.sort((a, b) => b.interestRate - a.interestRate);
        else currentDebts.sort((a, b) => a.balance - b.balance);

        const MAX_MONTHS = 180; // Safety limit
        const simMonthlyPayment = forcedPayment !== undefined ? forcedPayment : debouncedMonthlyPayment;

        while (currentDebts.some(d => d.balance > 0) && months < MAX_MONTHS) {
            months++;
            let availableCash = (simMonthlyPayment * 100);
            if (months === 1) availableCash += (debouncedExtraOneTime * 100);

            let monthlyInterestTotal = 0;
            const currentMonthTransactions: any[] = [];

            // 1. Minimals & Interest & Custom Schedules
            currentDebts.forEach(d => {
                if (d.balance > 0) {
                    // Apply Interest
                    const interest = Math.round(d.balance * (d.interestRate / 100));
                    d.balance += interest;
                    monthlyInterestTotal += interest;
                    totalInterest += interest;

                    // Determine required payment
                    let requiredPayment = 0;
                    if (d.customSchedule && d.customSchedule[months]) {
                        requiredPayment = d.customSchedule[months];
                    } else if (payMinimums) {
                        const min = d.minimumPayment || Math.round(d.balance * 0.01) || 0;
                        requiredPayment = Math.min(d.balance, min);
                    }

                    // Pay required
                    if (requiredPayment > 0) {
                        let actualPayment = Math.min(d.balance, requiredPayment);
                        if (availableCash < actualPayment) {
                            actualPayment = availableCash;
                        }

                        if (availableCash > 0 && actualPayment > 0) {
                            d.balance -= actualPayment;
                            availableCash -= actualPayment;
                            totalPaid += actualPayment;

                            const tx = { type: 'MINIMUM', debtId: d.id, amount: actualPayment };
                            if (months === 1) month1Plan.push(tx);
                            currentMonthTransactions.push(tx);
                        }
                    }
                }
            });

            // 2. Surplus Distribution (Snowball/Avalanche)
            for (const debt of currentDebts) {
                if (debt.balance > 0 && availableCash > 0) {
                    if (pauseRenegotiated && debt.status === 'RENEGOTIATED') continue;

                    const payment = Math.min(debt.balance, availableCash);
                    debt.balance -= payment;
                    availableCash -= payment;
                    totalPaid += payment;

                    const tx = { type: 'EXTRA', debtId: debt.id, amount: payment };
                    if (months === 1) month1Plan.push(tx);
                    currentMonthTransactions.push(tx);
                }
            }

            const remaining = currentDebts.reduce((acc, d) => acc + d.balance, 0);
            timeline.push({
                month: months,
                remainingDebt: remaining,
                accumulatedInterest: totalInterest
            });
            planByMonth.push({ month: months, transactions: currentMonthTransactions, remainingDebt: remaining });

            if (currentDebts.every(d => d.balance <= 0)) break;
        }

        return { months, totalInterest, totalPaid, timeline, month1Plan, planByMonth };
    };

    const currentResult = useMemo(() => simulate(strategy), [filteredDebts, debouncedMonthlyPayment, debouncedExtraOneTime, strategy, payMinimums, pauseRenegotiated]);

    // --- Scenarios Calculation ---
    const scenarioData = useMemo(() => {
        const conservativePayment = Math.round(debouncedMonthlyPayment * 0.8);
        const aggressivePayment = Math.round(debouncedMonthlyPayment * 1.2);

        const conservative = simulate(strategy, conservativePayment);
        const aggressive = simulate(strategy, aggressivePayment);

        return {
            conservative: { payment: conservativePayment, result: conservative },
            current: { payment: debouncedMonthlyPayment, result: currentResult },
            aggressive: { payment: aggressivePayment, result: aggressive }
        };
    }, [debouncedMonthlyPayment, strategy, currentResult]);

    const chartData = currentResult.timeline.map((item, i) => {
        if (currentResult.months > 50 && i % Math.ceil(currentResult.months / 50) !== 0 && i !== currentResult.months - 1) return null;
        return { month: item.month, Saldo: item.remainingDebt };
    }).filter(Boolean);

    const finalMonth1Plan = filteredDebts.map(d => {
        const payments = currentResult.month1Plan.filter(p => p.debtId === d.id);
        const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
        return { ...d, paid: totalPaid, remaining: Math.max(0, d.balance - totalPaid) };
    }).sort((a, b) => b.paid - a.paid);

    const quitDate = addMonths(new Date(), currentResult.months);


    // --- PDF Generation Handler (Native Browser Print) ---
    const handleExportPDF = () => {
        setIsGeneratingPdf(true); // Just for UI feedback

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Por favor, permita pop-ups para gerar o relatório.");
            setIsGeneratingPdf(false);
            return;
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Simulação de Dívidas - Studio Bravure</title>
                <style>
                    body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; padding: 40px; max-width: 800px; margin: 0 auto; }
                    h1 { color: #111827; font-size: 24px; margin-bottom: 5px; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; }
                    .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 30px; }
                    .section { margin-bottom: 40px; }
                    .section-title { font-size: 16px; font-weight: 700; color: #374151; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.05em; }
                    
                    /* KPI Grid */
                    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
                    .kpi-card { background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; }
                    .kpi-label { font-size: 11px; color: #6b7280; text-transform: uppercase; display: block; margin-bottom: 5px; }
                    .kpi-value { font-size: 18px; font-weight: 700; color: #111827; }
                    
                    /* Tables */
                    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 10px; }
                    th { background-color: #f3f4f6; text-align: left; font-weight: 600; color: #4b5563; padding: 10px; border-bottom: 2px solid #e5e7eb; }
                    td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; color: #374151; }
                    tr:nth-child(even) { background-color: #f9fafb; }
                    .text-right { text-align: right; }
                    
                    .footer { margin-top: 50px; font-size: 10px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; }
                </style>
            </head>
            <body>
                <h1>Relatório de Simulação Financeira</h1>
                <div class="subtitle">
                    Gerado em: ${new Date().toLocaleString('pt-BR')} • Cenário: ${strategy === 'AVALANCHE' ? 'Avalanche' : 'Bola de Neve'} • Aporte: ${formatCurrency(debouncedMonthlyPayment * 100)}
                </div>

                <div class="kpi-grid">
                    <div class="kpi-card"><span class="kpi-label">Quitação Estimada</span><span class="kpi-value">${currentResult.months} meses</span></div>
                    <div class="kpi-card"><span class="kpi-label">Total de Juros</span><span class="kpi-value" style="color: #ef4444">${formatCurrency(currentResult.totalInterest)}</span></div>
                    <div class="kpi-card"><span class="kpi-label">Total Pago</span><span class="kpi-value">${formatCurrency(currentResult.totalPaid)}</span></div>
                    <div class="kpi-card"><span class="kpi-label">Dívida Inicial</span><span class="kpi-value">${formatCurrency(filteredDebts.reduce((acc, d) => acc + d.balance, 0))}</span></div>
                </div>

                <div class="section">
                    <div class="section-title">Minhas Dívidas</div>
                    <table>
                        <thead>
                            <tr><th>Nome</th><th class="text-right">Saldo</th><th class="text-right">Juros</th><th class="text-right">Mínimo</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            ${filteredDebts.map(d => `
                                <tr>
                                    <td>${d.name}</td>
                                    <td class="text-right">${formatCurrency(d.balance)}</td>
                                    <td class="text-right">${d.interestRate}%</td>
                                    <td class="text-right">${formatCurrency(d.minimumPayment || 0)}</td>
                                    <td>${d.status === 'LATE' ? 'Atrasada' : 'Em dia'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <div class="section-title">Plano Sugerido (Mês 1)</div>
                    <table>
                        <thead>
                            <tr><th>Dívida</th><th class="text-right">Pagar Agora</th><th class="text-right">Saldo Restante</th></tr>
                        </thead>
                        <tbody>
                            ${finalMonth1Plan.map(p => `
                                <tr>
                                    <td>${p.name}</td>
                                    <td class="text-right" style="font-weight: bold;">${formatCurrency(p.paid)}</td>
                                    <td class="text-right">${formatCurrency(p.remaining)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <div class="section-title">Evolução Estimada (Próximos 24 meses)</div>
                    <table>
                        <thead>
                            <tr><th>Mês</th><th class="text-right">Saldo Devedor Restante</th><th class="text-right">Juros Acumulados</th></tr>
                        </thead>
                        <tbody>
                            ${currentResult.timeline.slice(0, 24).map(t => `
                                <tr>
                                    <td>Mês ${t.month}</td>
                                    <td class="text-right">${formatCurrency(t.remainingDebt)}</td>
                                    <td class="text-right">${formatCurrency(t.accumulatedInterest)}</td>
                                </tr>
                            `).join('')}
                            ${currentResult.months > 24 ? `<tr><td colspan="3" style="text-align: center; color: #6b7280;">...e mais ${currentResult.months - 24} meses até a quitação.</td></tr>` : ''}
                        </tbody>
                    </table>
                </div>

                <div class="footer">
                    Studio Bravure Financial • Relatório gerado automaticamente. Valores são estimativas.
                </div>

                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setIsGeneratingPdf(false);
    };



    // --- Handlers ---
    const handleOpenSheet = (debt?: Debt) => {
        if (debt) {
            setEditingDebt(debt);
            setFormData({ ...debt });
            setRawBalance(formatCurrency(debt.balance));
            setRawMinimum(formatCurrency(debt.minimumPayment || 0));
        } else {
            setEditingDebt(null);
            setFormData({
                name: '',
                type: 'CREDIT_CARD',
                balance: 0,
                interestRate: 0,
                minimumPayment: 0,
                dueDate: 10,
                status: 'NORMAL',
                mode: mode === 'CONSOLIDATED' ? 'PF' : mode as 'PF' | 'PJ',
                totalMonths: undefined
            });
            setRawBalance("R$ 0,00");
            setRawMinimum("R$ 0,00");
        }
        setIsSheetOpen(true);
    };

    const handleSaveDebt = () => {
        if (!formData.name) return;

        // Parse from raw strings if modified, else use formData numbers logic
        // But we update formData on change of raw strings
        const finalBalance = Math.round(parseCurrency(rawBalance) * 100);
        const finalMin = Math.round(parseCurrency(rawMinimum) * 100);

        const payload: any = {
            ...formData,
            balance: finalBalance,
            interestRate: Number(formData.interestRate),
            minimumPayment: finalMin,
            dueDate: Number(formData.dueDate)
        };

        if (editingDebt && editingDebt.id) {
            updateDebt(editingDebt.id, payload);
        } else {
            addDebt(payload);
        }
        setIsSheetOpen(false);
    };

    const handleDeleteDebt = () => {
        if (editingDebt?.id) {
            deleteDebt(editingDebt.id);
            setIsSheetOpen(false);
        }
    };

    const handleCurrencyChange = (val: string, setter: (s: string) => void) => {
        setter(formatCurrencyInput(val));
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] -m-4 md:-m-8">

            {/* TOPO: Cenário & Sugestões */}
            <div className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-10 px-6 py-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className="text-sm font-medium px-3 py-1 flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            Quitação prevista: <span className="font-bold">{currentResult.months} meses</span>
                            <span className="text-muted-foreground ml-1">({format(quitDate, 'MMM yyyy')})</span>
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportPDF}
                            disabled={isGeneratingPdf}
                            className="gap-2"
                        >
                            {isGeneratingPdf ? <RotateCcw className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3" />}
                            {isGeneratingPdf ? 'Gerando...' : 'Exportar PDF'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setMonthlyPayment(2500); setExtraOneTime(0); }}><RotateCcw className="mr-2 h-3 w-3" /> Resetar</Button>
                        <Button variant="secondary" size="sm" onClick={() => { }} className="bg-primary/10 text-primary hover:bg-primary/20"><Save className="mr-2 h-3 w-3" /> Salvar Cenário</Button>
                    </div>
                </div>

                {/* Cenários de Aporte */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {[
                        { label: 'Conservador', data: scenarioData.conservative, icon: ChevronDown, color: 'text-muted-foreground' },
                        { label: 'Atual', data: scenarioData.current, icon: Target, color: 'text-primary font-bold border-primary' },
                        { label: 'Agressivo', data: scenarioData.aggressive, icon: TrendingUp, color: 'text-emerald-500' }
                    ].map((s, i) => (
                        <div key={i}
                            onClick={() => setMonthlyPayment(s.data.payment)}
                            className={`flex items-center justify-between p-2 rounded-md border text-xs cursor-pointer hover:bg-muted/50 transition-colors ${i === 1 ? 'bg-primary/5 border-primary/30' : 'bg-background'}`}
                        >
                            <div className="flex flex-col">
                                <span className="font-semibold text-muted-foreground">{s.label}</span>
                                <span className="text-base font-bold">{formatCurrency(s.data.payment * 100)}</span>
                            </div>
                            <div className="text-right">
                                <div className="font-bold">{s.data.result.months} meses</div>
                                <div className="text-muted-foreground flex items-center gap-1 justify-end">{formatCurrency(s.data.result.totalInterest)} <span className="text-[9px]">juros</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-[380px_1fr] divide-y md:divide-y-0 md:divide-x divide-border">

                {/* CONFIGURAR (Left) */}
                <div className="overflow-y-auto p-6 space-y-8 bg-card/30">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">Aporte Mensal</Label>
                            <span className="text-primary font-mono font-bold text-lg">{formatCurrency(monthlyPayment * 100)}</span>
                        </div>
                        <Slider value={[monthlyPayment]} max={Math.max(20000, monthlyPayment * 1.5)} step={100} onValueChange={(v) => setMonthlyPayment(v[0])} className="py-2" />

                        <div className="pt-2">
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Extra no Mês 1</Label>
                            <Input type="number" className="bg-background/50" value={extraOneTime} onChange={(e) => setExtraOneTime(Number(e.target.value))} />
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <Label className="text-base font-semibold">Estratégia</Label>
                        <RadioGroup value={strategy} onValueChange={(v: any) => setStrategy(v)} className="grid gap-3">
                            <div onClick={() => setStrategy('AVALANCHE')} className={`flex items-start space-x-3 p-3 rounded-md border cursor-pointer ${strategy === 'AVALANCHE' ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50'}`}>
                                <RadioGroupItem value="AVALANCHE" id="avalanche" className="mt-1" />
                                <div><Label className="cursor-pointer">Avalanche</Label><p className="text-xs text-muted-foreground">Prioriza juros altos.</p></div>
                            </div>
                            <div onClick={() => setStrategy('SNOWBALL')} className={`flex items-start space-x-3 p-3 rounded-md border cursor-pointer ${strategy === 'SNOWBALL' ? 'border-cyan-500 bg-cyan-500/5' : 'border-transparent bg-muted/50'}`}>
                                <RadioGroupItem value="SNOWBALL" id="snowball" className="mt-1 border-cyan-500 text-cyan-500" />
                                <div><Label className="cursor-pointer">Bola de Neve</Label><p className="text-xs text-muted-foreground">Prioriza menores saldos.</p></div>
                            </div>
                        </RadioGroup>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <Label className="text-base font-semibold">Restrições</Label>
                        <div className="flex justify-between items-center"><Label className="text-sm">Pagar Mínimos</Label><Switch checked={payMinimums} onCheckedChange={setPayMinimums} /></div>
                        <div className="flex justify-between items-center"><Label className="text-sm">Pausar Renegociadas</Label><Switch checked={pauseRenegotiated} onCheckedChange={setPauseRenegotiated} /></div>
                    </div>
                </div>

                {/* RESULTADOS (Right) */}
                <div className="overflow-y-auto p-6 md:p-8 bg-background space-y-8">

                    {/* Chart */}
                    <div className="h-[300px] w-full bg-card/50 rounded-lg p-4 border border-border/50">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Evolução do Saldo</h3>
                            <Badge variant="secondary" className="text-xs">{currentResult.months} meses p/ liberdade</Badge>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="month"
                                    stroke="var(--muted-foreground)"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="var(--muted-foreground)"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--card)',
                                        borderColor: 'var(--border)',
                                        borderRadius: '8px',
                                        color: 'var(--foreground)'
                                    }}
                                    formatter={(val: any) => formatCurrency(Number(val) || 0)}
                                    labelFormatter={(l) => `Mês ${l}`}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="Saldo"
                                    stroke="var(--primary)"
                                    fill="url(#colorSaldo)"
                                    strokeWidth={3}
                                    animationDuration={500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <Separator />

                    {/* MINHAS DÍVIDAS (CRUD) */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Minhas Dívidas</h3>
                            <Button size="sm" onClick={() => handleOpenSheet()}><Plus className="h-4 w-4 mr-2" /> Adicionar Dívida</Button>
                        </div>

                        {filteredDebts.length === 0 ? (
                            <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
                                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Nenhuma dívida cadastrada para este modo.</p>
                                <Button variant="link" onClick={() => handleOpenSheet()}>Cadastrar primeira dívida</Button>
                            </div>
                        ) : (
                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead>Nome</TableHead>
                                            <TableHead>Saldo</TableHead>
                                            <TableHead>Juros</TableHead>
                                            <TableHead className="hidden md:table-cell">Mínimo</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredDebts.map(debt => (
                                            <TableRow key={debt.id} className="group">
                                                <TableCell className="font-medium">{debt.name}</TableCell>
                                                <TableCell className="font-mono">{formatCurrency(debt.balance)}</TableCell>
                                                <TableCell>{debt.interestRate}%</TableCell>
                                                <TableCell className="hidden md:table-cell">{formatCurrency(debt.minimumPayment || 0)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={debt.status === 'LATE' ? 'destructive' : 'secondary'} className="text-[10px] h-5 px-1.5">
                                                        {debt.status === 'LATE' ? 'Atrasada' : debt.status === 'RENEGOTIATED' ? 'Reneg.' : 'Ativa'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => handleOpenSheet(debt)}><Edit2 className="h-3.5 w-3.5" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* PLANO DO MÊS */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Plano Sugerido (Mês 1)</h3>
                        <div className="border rounded-md overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>Dívida</TableHead>
                                        <TableHead className="text-right">A Pagar</TableHead>
                                        <TableHead className="text-right">Saldo Final</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {finalMonth1Plan.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Sem plano disponível.</TableCell></TableRow>}
                                    {finalMonth1Plan.map((item, idx) => (
                                        <TableRow key={item.id} className={item.paid > 0 ? (idx === 0 ? "bg-primary/10" : "") : "opacity-60"}>
                                            <TableCell>
                                                <div className="font-medium">{item.name}</div>
                                                {idx === 0 && item.paid > 0 && <Badge variant="outline" className="text-xs border-primary text-primary mt-1">Prioridade</Badge>}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-foreground">{formatCurrency(item.paid)}</TableCell>
                                            <TableCell className="text-right text-muted-foreground">{formatCurrency(item.remaining)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                </div>
            </div>

            {/* SHEET FORM */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="sm:max-w-[400px] overflow-y-auto">
                    <SheetHeader className="mb-4">
                        <SheetTitle>{editingDebt ? 'Editar Dívida' : 'Nova Dívida'}</SheetTitle>
                        <SheetDescription>Valores em reais (R$)</SheetDescription>
                    </SheetHeader>

                    <div className="grid gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome da Dívida</Label>
                            <Input id="name" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Cartão Nubank" className="h-10 text-base" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Saldo (R$)</Label>
                                <Input type="text" value={rawBalance} onChange={e => handleCurrencyChange(e.target.value, setRawBalance)} className="h-10 text-base font-semibold" placeholder="R$ 0,00" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Juros (% a.m.)</Label>
                                <Input type="number" step="0.1" value={formData.interestRate || 0} onChange={e => setFormData({ ...formData, interestRate: Number(e.target.value) })} className="h-10" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Pgto. Mínimo (R$)</Label>
                                <Input type="text" value={rawMinimum} onChange={e => handleCurrencyChange(e.target.value, setRawMinimum)} placeholder="R$ 0,00" className="h-10" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Vencimento (Dia)</Label>
                                <Input type="number" min="1" max="31" value={formData.dueDate || 10} onChange={e => setFormData({ ...formData, dueDate: Number(e.target.value) })} className="h-10" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.status || 'NORMAL'}
                                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                >
                                    <option value="NORMAL">Normal (Ativa)</option>
                                    <option value="LATE">Atrasada</option>
                                    <option value="RENEGOTIATED">Renegociada</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Tipo</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.type || 'CREDIT_CARD'}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                >
                                    <option value="CREDIT_CARD">Cartão</option>
                                    <option value="LOAN">Empréstimo</option>
                                    <option value="FINANCING">Financiam.</option>
                                    <option value="TAX">Imposto</option>
                                </select>
                            </div>
                        </div>

                        {/* TEMPO TOTAL / PRAZO */}
                        <div className="grid gap-2 p-3 bg-muted/40 rounded-lg border border-border/50">
                            <Label>Prazo Restante (Meses) <span className="text-xs text-muted-foreground font-normal">(Opcional)</span></Label>
                            <Input
                                type="number"
                                placeholder="Auto"
                                value={formData.totalMonths || ''}
                                onChange={e => setFormData({ ...formData, totalMonths: e.target.value ? Number(e.target.value) : undefined })}
                            />
                            <p className="text-[10px] text-muted-foreground">Se em branco, o simulador calcula baseado no aporte.</p>
                        </div>
                    </div>

                    <SheetFooter className="flex-col sm:flex-col gap-3 mt-6 sticky bottom-0 bg-background pt-2 pb-4 border-t border-border">
                        <Button onClick={handleSaveDebt} className="w-full text-base h-11 shadow-md">Salvar Dívida</Button>
                        {editingDebt && (
                            <Button variant="destructive" onClick={handleDeleteDebt} className="w-full h-10 gap-2"><Trash2 className="h-4 w-4" /> Excluir Dívida</Button>
                        )}
                        <Button variant="ghost" onClick={() => setIsSheetOpen(false)} className="w-full h-10">Cancelar</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

        </div>
    );
}
