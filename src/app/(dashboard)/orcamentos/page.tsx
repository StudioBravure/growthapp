"use client";

import { useState, useEffect, useMemo } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isSameMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAppStore } from "@/store/use-store";
import { BudgetMonthly, BudgetSettings, Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
    ChevronLeft,
    ChevronRight,
    Settings,
    Plus,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    MoreHorizontal,
    Copy,
    Wand2,
    Search,
    AlertCircle
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// --- Components ---

function BudgetHeader({
    month,
    onPrev,
    onNext,
    onToday,
    onOpenSettings,
    onCopyPrevious,
    onSuggest
}: {
    month: Date,
    onPrev: () => void,
    onNext: () => void,
    onToday: () => void,
    onOpenSettings: () => void,
    onCopyPrevious: () => void,
    onSuggest: () => void
}) {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Orçamentos (PF)</h1>
                <p className="text-muted-foreground">Defina limites de gastos mensais para receber alertas automáticos.</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-1 bg-card border rounded-md p-1 shadow-sm">
                    <Button variant="ghost" size="icon-xs" onClick={onPrev}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="w-32 text-center font-medium text-sm capitalize">
                        {format(month, 'MMMM yyyy', { locale: ptBR })}
                    </span>
                    <Button variant="ghost" size="icon-xs" onClick={onNext}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <Button variant="ghost" size="sm" onClick={onToday}>Hoje</Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <MoreHorizontal className="h-4 w-4" />
                            Ações
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ferramentas</DropdownMenuLabel>
                        <DropdownMenuItem onClick={onCopyPrevious}>
                            <Copy className="mr-2 h-4 w-4" /> Copiar do mês anterior
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onSuggest}>
                            <Wand2 className="mr-2 h-4 w-4" /> Gerar sugestão (Média 3m)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onOpenSettings}>
                            <Settings className="mr-2 h-4 w-4" /> Configurar Alertas
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

function SummaryCards({
    totalLimit,
    totalSpent,
    remaining,
    percent
}: {
    totalLimit: number,
    totalSpent: number,
    remaining: number,
    percent: number
}) {
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);

    return (
        <div className="grid gap-4 md:grid-cols-4">
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
                    <span className="text-muted-foreground">🎯</span>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalLimit)}</div>
                </CardContent>
            </Card>
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gasto Realizado</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
                </CardContent>
            </Card>
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Restante</CardTitle>
                    {remaining < 0 ? <AlertCircle className="h-4 w-4 text-destructive" /> : <span className="text-muted-foreground">💰</span>}
                </CardHeader>
                <CardContent>
                    <div className={cn("text-2xl font-bold", remaining < 0 ? "text-destructive" : "text-emerald-600")}>
                        {formatCurrency(remaining)}
                    </div>
                </CardContent>
            </Card>
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">% Comprometido</CardTitle>
                    <span className="text-muted-foreground">📊</span>
                </CardHeader>
                <CardContent>
                    <div className={cn("text-2xl font-bold", percent > 100 ? "text-destructive" : percent > 80 ? "text-amber-500" : "")}>
                        {percent.toFixed(1)}%
                    </div>
                    <Progress value={Math.min(percent, 100)} className={cn("h-1 mt-2", percent > 100 ? "bg-destructive/20" : "")} indicatorClassName={percent > 100 ? "bg-destructive" : percent > 80 ? "bg-amber-500" : "bg-primary"} />
                </CardContent>
            </Card>
        </div>
    );
}

// --- Main Page Component ---

export default function OrcamentosPage() {
    const {
        monthlyBudgets,
        categories,
        transactions,
        pfBudgetSettings,
        loadMonthlyBudgets,
        saveMonthlyBudget,
        copyPreviousMonthBudgets,
        loadBudgetSettings,
        saveBudgetSettings
    } = useAppStore();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedCategoryForDrawer, setSelectedCategoryForDrawer] = useState<string | null>(null);

    // Initial Load
    useEffect(() => {
        const monthKey = format(currentDate, 'yyyy-MM');
        loadMonthlyBudgets(monthKey);
        loadBudgetSettings(); // Ensuring settings are loaded
    }, [currentDate]); // eslint-disable-line react-hooks/exhaustive-deps

    // Derived Data
    const monthKey = format(currentDate, 'yyyy-MM');
    const filteredCategories = categories.filter(c => c.mode === 'PF' && c.type === 'EXPENSE');

    // Transactions for current month & PF
    const monthTransactions = useMemo(() => {
        return transactions.filter(t =>
            t.mode === 'PF' &&
            t.type === 'EXPENSE' &&
            isSameMonth(new Date(t.date), currentDate)
        );
    }, [transactions, currentDate]);

    // Calculate Budgets & Spent by Category
    const budgetData = useMemo(() => {
        return filteredCategories.map(cat => {
            const budget = monthlyBudgets.find(b => b.category_id === cat.id && b.month_key === monthKey);
            const limit = budget?.budget_amount || 0;
            const spent = monthTransactions
                .filter(t => t.category === cat.name) // Assuming transaction category maps to category name. Ideally ID.
                // Fallback: match by name if ID not available in transaction or simple string match
                .reduce((acc, t) => acc + t.amount, 0);

            return {
                categoryId: cat.id,
                name: cat.name,
                limit,
                spent,
                remaining: limit - spent,
                percent: limit > 0 ? (spent / limit) * 100 : spent > 0 ? 100 : 0,
                isPaused: budget?.is_alerts_paused || false,
                budgetObj: budget // raw object
            };
        }).sort((a, b) => b.limit - a.limit); // Sort by highest budget
    }, [filteredCategories, monthlyBudgets, monthTransactions, monthKey]);

    const totalLimit = budgetData.reduce((acc, b) => acc + b.limit, 0);
    const totalSpent = budgetData.reduce((acc, b) => acc + b.spent, 0);
    const remaining = totalLimit - totalSpent;
    const globalPercent = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

    // Actions
    const handleUpdateLimit = async (categoryId: string, newLimit: number) => {
        await saveMonthlyBudget({
            month_key: monthKey,
            category_id: categoryId,
            budget_amount: newLimit,
            is_alerts_paused: false // default
        });
        toast.success("Limite atualizado");
    };

    const handleCopyPrevious = async () => {
        toast.promise(copyPreviousMonthBudgets(monthKey), {
            loading: 'Copiando do mês anterior...',
            success: 'Orçamentos copiados!',
            error: 'Erro ao copiar orçamentos.'
        });
    };

    const handleSuggest = () => {
        // Logic: Calculate 3-month average for each category and set as budget
        // This runs client side for simplicity
        const threeMonthsAgo = subMonths(currentDate, 3);
        const relevantTransactions = transactions.filter(t =>
            t.mode === 'PF' &&
            t.type === 'EXPENSE' &&
            new Date(t.date) >= startOfMonth(threeMonthsAgo) &&
            new Date(t.date) < startOfMonth(currentDate)
        );

        let updatesCount = 0;

        filteredCategories.forEach(cat => {
            const catTransactions = relevantTransactions.filter(t => t.category === cat.name);
            const total = catTransactions.reduce((acc, t) => acc + t.amount, 0);
            const average = total / 3;

            if (average > 0) {
                saveMonthlyBudget({
                    month_key: monthKey,
                    category_id: cat.id,
                    budget_amount: Math.ceil(average),
                    is_alerts_paused: false
                });
                updatesCount++;
            }
        });
        toast.success(`${updatesCount} sugestões aplicadas baseadas na média de 3 meses.`);
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <BudgetHeader
                month={currentDate}
                onPrev={() => setCurrentDate(subMonths(currentDate, 1))}
                onNext={() => setCurrentDate(addMonths(currentDate, 1))}
                onToday={() => setCurrentDate(new Date())}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onCopyPrevious={handleCopyPrevious}
                onSuggest={handleSuggest}
            />

            <SummaryCards
                totalLimit={totalLimit}
                totalSpent={totalSpent}
                remaining={remaining}
                percent={globalPercent}
            />

            <Card className="shadow-sm border-border">
                <CardHeader>
                    <CardTitle>Detalhamento por Categoria</CardTitle>
                    <CardDescription>Gerencie seus limites de gastos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {budgetData.map(item => (
                            <div key={item.categoryId} className="group">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 cursor-pointer hover:underline" onClick={() => setSelectedCategoryForDrawer(item.categoryId)}>
                                        <span className="font-semibold text-sm">{item.name}</span>
                                        {item.isPaused && <span className="text-[10px] bg-muted px-1 rounded text-muted-foreground">Alertas Pausados</span>}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <span className="text-xs text-muted-foreground mr-2">Gasto: {formatCurrency(item.spent)}</span>
                                            <span className="text-xs text-muted-foreground mr-2">Restante: <span className={item.remaining < 0 ? "text-destructive font-medium" : "text-emerald-600"}>{formatCurrency(item.remaining)}</span></span>
                                        </div>
                                        <div className="relative w-24">
                                            <Input
                                                type="text" // using text to handle currency mask easier if needed, but here simple number
                                                className="h-7 text-right text-xs pr-2"
                                                value={(item.limit / 100).toFixed(2)} // display as float
                                                onChange={(e) => {
                                                    // Allow editing, but usually debounced. For now, simple onBlur save
                                                }}
                                                onBlur={(e) => {
                                                    const val = parseFloat(e.target.value.replace(',', '.')) * 100; // to cents
                                                    if (!isNaN(val) && val !== item.limit) {
                                                        handleUpdateLimit(item.categoryId, val);
                                                    }
                                                }}
                                            />
                                            <span className="absolute left-2 top-1.5 text-[10px] text-muted-foreground">R$</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full transition-all duration-500",
                                            item.percent > 100 ? "bg-destructive" :
                                                item.percent > (pfBudgetSettings?.alert_threshold_percent || 80) ? "bg-amber-500" : "bg-primary"
                                        )}
                                        style={{ width: `${Math.min(item.percent, 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}

                        {budgetData.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>Nenhuma categoria de despesa PF encontrada.</p>
                                <Button variant="link" className="mt-2">Adicionar Categoria</Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Settings Sheet */}
            <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Configuração de Alertas PF</SheetTitle>
                        <SheetDescription>Personalize como o Scanner monitora seus orçamentos.</SheetDescription>
                    </SheetHeader>
                    <div className="py-6 space-y-6">
                        <div className="space-y-3">
                            <Label>Limite de Alerta (%)</Label>
                            <div className="flex items-center gap-4">
                                <Slider
                                    value={[pfBudgetSettings?.alert_threshold_percent || 80]}
                                    min={50} max={100} step={5}
                                    onValueChange={(v) => saveBudgetSettings({ alert_threshold_percent: v[0] })}
                                />
                                <span className="text-sm font-bold w-12 text-center">{pfBudgetSettings?.alert_threshold_percent || 80}%</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Você será notificado quando atingir essa porcentagem do orçamento.</p>
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="alert-over">Notificar estouro (100%)</Label>
                            <Switch
                                id="alert-over"
                                checked={pfBudgetSettings?.alert_on_over ?? true}
                                onCheckedChange={(c) => saveBudgetSettings({ alert_on_over: c })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="detect-anomaly">Detectar gastos anormais</Label>
                            <Switch
                                id="detect-anomaly"
                                checked={pfBudgetSettings?.detect_anomaly ?? true}
                                onCheckedChange={(c) => saveBudgetSettings({ detect_anomaly: c })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Base de Cálculo</Label>
                            <Select
                                value={pfBudgetSettings?.calc_basis || 'TRANSACTION_DATE'}
                                onValueChange={(v: any) => saveBudgetSettings({ calc_basis: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TRANSACTION_DATE">Data da Transação</SelectItem>
                                    <SelectItem value="DUE_DATE">Data de Vencimento</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Category Details Drawer */}
            <Sheet open={!!selectedCategoryForDrawer} onOpenChange={(o) => !o && setSelectedCategoryForDrawer(null)}>
                <SheetContent className="sm:max-w-md">
                    {(() => {
                        if (!selectedCategoryForDrawer) return null;
                        const data = budgetData.find(d => d.categoryId === selectedCategoryForDrawer);
                        if (!data) return null;

                        const catTransactions = monthTransactions.filter(t => t.category === data.name).sort((a, b) => b.amount - a.amount);

                        return (
                            <>
                                <SheetHeader>
                                    <SheetTitle className="flex items-center gap-2">
                                        {data.name}
                                        {data.percent > 100 && <BadgeDestructive />}
                                    </SheetTitle>
                                    <SheetDescription>Visão detalhada do mês.</SheetDescription>
                                </SheetHeader>

                                <div className="py-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-muted/50 p-3 rounded-lg">
                                            <div className="text-xs text-muted-foreground">Limite</div>
                                            <div className="text-lg font-bold">{formatCurrency(data.limit)}</div>
                                        </div>
                                        <div className="bg-muted/50 p-3 rounded-lg">
                                            <div className="text-xs text-muted-foreground">Gasto</div>
                                            <div className="text-lg font-bold">{formatCurrency(data.spent)}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium mb-3">Top Gastos</h4>
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                            {catTransactions.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">Nenhuma transação.</p>
                                            ) : (
                                                catTransactions.map(t => (
                                                    <div key={t.id} className="flex justify-between items-center text-sm border-b border-border/50 pb-2 last:border-0">
                                                        <div className="truncate pr-4">
                                                            <div className="font-medium">{t.description}</div>
                                                            <div className="text-[10px] text-muted-foreground">{format(new Date(t.date), 'dd/MM')}</div>
                                                        </div>
                                                        <div className="font-mdeium whitespace-nowrap">{formatCurrency(t.amount)}</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-border flex flex-col gap-2">
                                        <Button variant="outline" onClick={() => {
                                            if (data.budgetObj) {
                                                saveMonthlyBudget({ ...data.budgetObj, is_alerts_paused: !data.isPaused });
                                                toast.success(data.isPaused ? "Alertas retomados" : "Alertas pausados");
                                            }
                                        }}>
                                            {data.isPaused ? "Retomar Alertas" : "Pausar Alertas desta Categoria"}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </SheetContent>
            </Sheet>
        </div>
    );
}

function BadgeDestructive() {
    return <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold uppercase">Estourado</span>;
}
