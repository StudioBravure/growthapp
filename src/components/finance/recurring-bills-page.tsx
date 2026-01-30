"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/store/use-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RecurringBill } from "@/lib/types";
import { Plus, Play, Pause, Trash2, Edit2, CalendarClock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export function RecurringBillsPage() {
    const { recurringBills, addRecurringBill, updateRecurringBill, toggleRecurringBillStatus, deleteRecurringBill, mode } = useAppStore();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
    const [formData, setFormData] = useState<Partial<RecurringBill>>({});

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);

    const filteredBills = recurringBills
        .filter(b => mode === 'CONSOLIDATED' ? true : b.mode === mode)
        .sort((a, b) => a.dayOfMonth - b.dayOfMonth);

    const totalIncome = filteredBills.filter(b => b.type === 'INCOME' && b.active).reduce((acc, b) => acc + b.amount, 0);
    const totalExpense = filteredBills.filter(b => b.type === 'EXPENSE' && b.active).reduce((acc, b) => acc + b.amount, 0);

    // --- Handlers ---
    const handleOpenSheet = (bill?: RecurringBill) => {
        if (bill) {
            setEditingBill(bill);
            setFormData({ ...bill });
        } else {
            setEditingBill(null);
            setFormData({
                description: '',
                type: 'EXPENSE',
                amount: 0,
                category: '',
                dayOfMonth: 1,
                active: true,
                mode: mode === 'CONSOLIDATED' ? 'PF' : mode as 'PF' | 'PJ'
            });
        }
        setIsSheetOpen(true);
    };

    const handleSave = () => {
        if (!formData.description || !formData.amount || !formData.category) return;

        const payload: any = {
            ...formData,
            amount: Number(formData.amount),
            dayOfMonth: Number(formData.dayOfMonth)
        };

        if (editingBill) {
            updateRecurringBill(editingBill.id, payload);
        } else {
            addRecurringBill(payload);
        }
        setIsSheetOpen(false);
    };

    const handleDelete = () => {
        if (editingBill) {
            deleteRecurringBill(editingBill.id);
            setIsSheetOpen(false);
        }
    };

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Contas Fixas</h1>
                    <p className="text-muted-foreground text-sm">Gerencie suas receitas e despesas recorrentes.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => handleOpenSheet()} className="gap-2"><Plus className="h-4 w-4" /> Nova Conta Fixa</Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                    <div className="text-xs text-muted-foreground uppercase font-bold text-emerald-600 mb-1">Receitas Fixas (Mês)</div>
                    <div className="text-xl font-bold text-emerald-500">{formatCurrency(totalIncome)}</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="text-xs text-muted-foreground uppercase font-bold text-red-600 mb-1">Despesas Fixas (Mês)</div>
                    <div className="text-xl font-bold text-red-500">{formatCurrency(totalExpense)}</div>
                </div>
                <div className="bg-muted/30 border border-border rounded-lg p-4">
                    <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Saldo Fixo Previsto</div>
                    <div className={`text-xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-foreground' : 'text-red-500'}`}>{formatCurrency(totalIncome - totalExpense)}</div>
                </div>
            </div>

            {/* Main Table */}
            <div className="border rounded-md overflow-hidden bg-background">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Dia</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredBills.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Nenhuma conta fixa encontrada. Cadastre a primeira!
                                </TableCell>
                            </TableRow>
                        )}
                        {filteredBills.map((bill) => (
                            <TableRow key={bill.id} className="group hover:bg-muted/5">
                                <TableCell className="font-medium font-mono text-muted-foreground">
                                    Dia {bill.dayOfMonth}
                                </TableCell>
                                <TableCell>
                                    <div className="font-semibold flex items-center gap-2">
                                        {bill.description}
                                        {mode === 'CONSOLIDATED' && (
                                            <Badge variant="outline" className="text-[9px] h-4 px-1">{bill.mode}</Badge>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{bill.type === 'INCOME' ? 'Receita Recorrente' : 'Despesa Recorrente'}</div>
                                </TableCell>
                                <TableCell><Badge variant="secondary" className="font-normal">{bill.category}</Badge></TableCell>
                                <TableCell className={`font-bold ${bill.type === 'INCOME' ? 'text-emerald-500' : 'text-foreground'}`}>{formatCurrency(bill.amount)}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleRecurringBillStatus(bill.id)}>
                                        <div className={`h-2 w-2 rounded-full ${bill.active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-muted-foreground/30'}`} />
                                        <span className="text-xs text-muted-foreground">{bill.active ? 'Ativa' : 'Pausada'}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleOpenSheet(bill)}>
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => toggleRecurringBillStatus(bill.id)}>
                                            {bill.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Sheet Form */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="sm:max-w-[600px] p-20 overflow-y-auto">
                    <SheetHeader className="mb-8 p-0">
                        <SheetTitle className="text-2xl font-bold">{editingBill ? 'Editar Conta Fixa' : 'Nova Conta Fixa'}</SheetTitle>
                        <SheetDescription className="text-base text-muted-foreground">Será gerada automaticamente todo mês.</SheetDescription>
                    </SheetHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Descrição</Label>
                            <Input value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Ex: Aluguel" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Tipo</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.type || 'EXPENSE'}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                >
                                    <option value="INCOME">Receita Fixa</option>
                                    <option value="EXPENSE">Despesa Fixa</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Valor (Centavos)</Label>
                                <Input type="number" value={formData.amount || 0} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Categoria</Label>
                                <Input value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="Ex: Moradia" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Dia Vencimento</Label>
                                <Input type="number" min="1" max="31" value={formData.dayOfMonth || 1} onChange={e => setFormData({ ...formData, dayOfMonth: Number(e.target.value) })} />
                            </div>
                        </div>

                        {mode === 'CONSOLIDATED' && (
                            <div className="grid gap-2">
                                <Label>Origem (PF/PJ)</Label>
                                <div className="flex gap-4">
                                    <Badge
                                        variant={formData.mode === 'PF' ? 'default' : 'outline'}
                                        className="cursor-pointer"
                                        onClick={() => setFormData({ ...formData, mode: 'PF' })}
                                    >
                                        Pessoa Física
                                    </Badge>
                                    <Badge
                                        variant={formData.mode === 'PJ' ? 'default' : 'outline'}
                                        className="cursor-pointer"
                                        onClick={() => setFormData({ ...formData, mode: 'PJ' })}
                                    >
                                        Pessoa Jurídica
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </div>

                    <SheetFooter className="flex-col sm:flex-col gap-3 p-0 mt-8">
                        <Button onClick={handleSave} className="w-full h-12 text-base">Salvar Recorrência</Button>
                        {editingBill && (
                            <Button variant="destructive" onClick={handleDelete} className="w-full h-12 gap-2 text-base"><Trash2 className="h-4 w-4" /> Excluir Recorrência</Button>
                        )}
                        <Button variant="ghost" onClick={() => setIsSheetOpen(false)} className="w-full h-12 text-base">Cancelar</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
