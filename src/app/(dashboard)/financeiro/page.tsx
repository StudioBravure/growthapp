"use client";

import { useState, Suspense } from "react";
import { Plus, Import, CalendarClock, Calendar as CalendarIcon, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TransactionForm } from "@/components/finance/transaction-form";
import { TransactionList } from "@/components/finance/transaction-list";
import { FileImporter } from "@/components/finance/file-importer";
import { RecurringBillForm } from "@/components/finance/recurring-form";
import { RecurringBillList } from "@/components/finance/recurring-list";
import { useAppStore } from "@/store/use-store";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { parseISO } from "date-fns";

function FinanceiroContent() {
    const { generateMonthlyBills, transactions, mode } = useAppStore();
    const searchParams = useSearchParams();
    const highlightId = searchParams.get('highlight');
    const dateParam = searchParams.get('date');

    const [openSheet, setOpenSheet] = useState(false);
    const [openRecurringSheet, setOpenRecurringSheet] = useState(false);
    const [openImportDialog, setOpenImportDialog] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    useEffect(() => {
        if (dateParam) {
            setSelectedDate(parseISO(dateParam));
        }
    }, [dateParam]);

    const handleGenerateBills = () => {
        generateMonthlyBills(selectedDate);
        toast.success(`Contas de ${format(selectedDate, 'MMMM', { locale: ptBR })} geradas com sucesso!`);
    };

    // Derived State for Filtering
    const monthlyTransactions = transactions.filter(t => {
        const isSameMonth = format(new Date(t.date), 'yyyy-MM') === format(selectedDate, 'yyyy-MM');
        const isModeMatch = mode === 'CONSOLIDATED' ? true : t.mode === mode;
        return isSameMonth && isModeMatch;
    });

    const income = monthlyTransactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    const expense = monthlyTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
    const balance = income - expense;

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
                    <p className="text-muted-foreground">{mode === 'PF' ? 'Finanças Pessoais' : mode === 'PJ' ? 'Gestão Empresarial' : 'Visão Consolidada'}</p>
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
                    {/* Month Selector */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "MMMM yyyy", { locale: ptBR }) : <span>Selecione o Mês</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(d) => d && setSelectedDate(d)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    <Button variant="ghost" onClick={handleGenerateBills} title={`Gerar contas fixas para ${format(selectedDate, 'MMM')}`}>
                        <CalendarClock className="h-4 w-4 text-primary" />
                    </Button>

                    <Dialog open={openImportDialog} onOpenChange={setOpenImportDialog}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1 sm:flex-none">
                                <Import className="mr-2 h-4 w-4" />
                                Importar
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px]">
                            <DialogHeader>
                                <DialogTitle>Importar Transações</DialogTitle>
                                <DialogDescription>Suporta arquivos OFX (Bancos) e CSV.</DialogDescription>
                            </DialogHeader>
                            <FileImporter />
                        </DialogContent>
                    </Dialog>

                </div>
            </div>

            <Tabs defaultValue="transactions" className="space-y-6">
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Balanço ({format(selectedDate, 'MMM')})</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={cn("text-2xl font-bold", balance >= 0 ? "text-emerald-500" : "text-red-500")}>
                                {formatCurrency(balance)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-500">
                                {formatCurrency(income)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">
                                {formatCurrency(expense)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-between items-center">
                    <TabsList>
                        <TabsTrigger value="transactions">Lançamentos</TabsTrigger>
                        <TabsTrigger value="recurring">Contas Fixas</TabsTrigger>
                    </TabsList>

                    {/* Dynamic Action Button based on Tab */}
                    <div className="flex gap-2">
                        <Sheet open={openRecurringSheet} onOpenChange={setOpenRecurringSheet}>
                            <SheetTrigger asChild>
                                <Button variant="secondary" id="btn-add-recurring">
                                    <Plus className="mr-2 h-4 w-4" /> Nova Conta Fixa
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="sm:max-w-[600px] p-20 overflow-y-auto">
                                <SheetHeader className="mb-8 p-0">
                                    <SheetTitle className="text-2xl font-bold">Nova Conta Fixa</SheetTitle>
                                    <SheetDescription className="text-base">Configure uma despesa recorrente.</SheetDescription>
                                </SheetHeader>
                                <div className="mt-8">
                                    <RecurringBillForm onSuccess={() => setOpenRecurringSheet(false)} />
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Sheet open={openSheet} onOpenChange={setOpenSheet}>
                            <SheetTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" /> Novo Lançamento
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="sm:max-w-[600px] p-20 overflow-y-auto">
                                <SheetHeader className="mb-8 p-0">
                                    <SheetTitle className="text-2xl font-bold">Novo Lançamento</SheetTitle>
                                    <SheetDescription className="text-base">Adicione uma receita ou despesa.</SheetDescription>
                                </SheetHeader>
                                <div className="mt-8">
                                    <TransactionForm onSuccess={() => setOpenSheet(false)} />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>

                <TabsContent value="transactions" className="space-y-4">
                    <TransactionList data={monthlyTransactions} highlightId={highlightId} />
                </TabsContent>

                <TabsContent value="recurring" className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <CalendarClock className="h-5 w-5 text-primary" />
                        <span>Aqui você define modelos de contas (Aluguel, Assinaturas...). O sistema usa esses modelos para gerar lançamentos mensais.</span>
                    </div>
                    <RecurringBillList />
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default function FinanceiroPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando Finanças...</div>}>
            <FinanceiroContent />
        </Suspense>
    );
}
