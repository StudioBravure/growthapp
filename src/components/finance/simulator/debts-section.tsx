import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Edit2, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Debt } from "@/lib/types";
import { formatCurrencyInput, parseCurrency } from "@/lib/utils"; // Assuming these exist or I'll implement local helper

interface DebtsSectionProps {
    debts: Debt[];
    mode: 'PF' | 'PJ' | 'CONSOLIDATED';
    onAddDebt: (debt: Omit<Debt, 'id'>) => void;
    onUpdateDebt: (id: string, debt: Partial<Debt>) => void;
    onDeleteDebt: (id: string) => void;
}

export function DebtsSection({ debts, mode, onAddDebt, onUpdateDebt, onDeleteDebt }: DebtsSectionProps) {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Debt>>({});
    const [rawBalance, setRawBalance] = useState("");
    const [rawMinimum, setRawMinimum] = useState("");

    const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);

    const handleOpen = (debt?: Debt) => {
        if (debt) {
            setEditingDebt(debt);
            setFormData({ ...debt });
            setRawBalance(formatBRL(debt.balance));
            setRawMinimum(formatBRL(debt.minimumPayment || 0));
        } else {
            setEditingDebt(null);
            setFormData({
                name: '',
                type: 'CREDIT_CARD',
                interestRate: 0,
                minimumPayment: 0,
                dueDate: 10,
                status: 'NORMAL',
                totalMonths: undefined,
                mode: mode === 'CONSOLIDATED' ? 'PF' : mode
            });
            setRawBalance("R$ 0,00");
            setRawMinimum("R$ 0,00");
        }
        setIsSheetOpen(true);
    };

    const handleSave = () => {
        if (!formData.name) return;

        // Helper for currency parsing
        // If imports are missing, I'll inline standard parse
        const parse = (str: string) => Number(str.replace(/\D/g, "")) / 100;

        const finalBalance = Math.round(parse(rawBalance) * 100);
        const finalMin = Math.round(parse(rawMinimum) * 100);

        const payload: any = {
            ...formData,
            balance: finalBalance,
            interestRate: Number(formData.interestRate),
            minimumPayment: finalMin,
            dueDate: Number(formData.dueDate)
        };

        if (editingDebt) {
            onUpdateDebt(editingDebt.id, payload);
        } else {
            onAddDebt(payload);
        }
        setIsSheetOpen(false);
    };

    // Currency Input Handler
    const handleCurrencyChange = (val: string, setter: (s: string) => void) => {
        const digits = val.replace(/\D/g, "");
        const number = Number(digits) / 100;
        const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number);
        setter(formatted);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" /> Minhas Dívidas
                    </h3>
                    <span className="text-xs text-muted-foreground">{debts.length} dívidas cadastradas • Total: {formatBRL(debts.reduce((acc, d) => acc + d.balance, 0))}</span>
                </div>
                <Button size="sm" onClick={() => handleOpen()}><Plus className="h-4 w-4 mr-2" /> Adicionar Dívida</Button>
            </div>

            {debts.length === 0 ? (
                <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground bg-muted/20">
                    <p className="text-sm">Sua lista está fazia.</p>
                    <Button variant="link" onClick={() => handleOpen()}>Cadastrar primeira dívida</Button>
                </div>
            ) : (
                <div className="border rounded-md overflow-hidden bg-card">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead className="text-right">Saldo</TableHead>
                                <TableHead className="text-center">Juros</TableHead>
                                <TableHead className="text-right hidden sm:table-cell">Mínimo</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {debts.map(debt => (
                                <TableRow key={debt.id} className="group hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium">{debt.name}</TableCell>
                                    <TableCell className="text-right font-mono">{formatBRL(debt.balance)}</TableCell>
                                    <TableCell className="text-center">{debt.interestRate}%</TableCell>
                                    <TableCell className="text-right hidden sm:table-cell">{formatBRL(debt.minimumPayment || 0)}</TableCell>
                                    <TableCell>
                                        <Badge variant={debt.status === 'LATE' ? 'destructive' : 'secondary'} className="text-[10px] h-5 px-1.5">
                                            {debt.status === 'LATE' ? 'Atrasada' : debt.status === 'RENEGOTIATED' ? 'Reneg.' : 'Ativa'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => handleOpen(debt)}>
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* DRAWER FORM */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="sm:max-w-[500px] w-full p-6 overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <SheetTitle>{editingDebt ? 'Editar Dívida' : 'Nova Dívida'}</SheetTitle>
                        <SheetDescription>Preencha os dados da dívida para simulação.</SheetDescription>
                    </SheetHeader>

                    <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome / Credor</Label>
                            <Input id="name" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Cartão Visa" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Saldo Devedor</Label>
                                <Input value={rawBalance} onChange={e => handleCurrencyChange(e.target.value, setRawBalance)} placeholder="R$ 0,00" className="font-semibold" />
                            </div>
                            <div className="space-y-2">
                                <Label>Juros (% a.m.)</Label>
                                <Input type="number" step="0.1" value={formData.interestRate || ''} onChange={e => setFormData({ ...formData, interestRate: Number(e.target.value) })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Pgto. Mínimo</Label>
                                <Input value={rawMinimum} onChange={e => handleCurrencyChange(e.target.value, setRawMinimum)} placeholder="R$ 0,00" />
                            </div>
                            <div className="space-y-2">
                                <Label>Dia Vencimento</Label>
                                <Input type="number" min="1" max="31" value={formData.dueDate || ''} onChange={e => setFormData({ ...formData, dueDate: Number(e.target.value) })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={formData.status || 'NORMAL'}
                                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                >
                                    <option value="NORMAL">Em dia</option>
                                    <option value="LATE">Atrasada</option>
                                    <option value="RENEGOTIATED">Renegociada</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={formData.type || 'CREDIT_CARD'}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                >
                                    <option value="CREDIT_CARD">Cartão</option>
                                    <option value="LOAN">Empréstimo</option>
                                    <option value="FINANCING">Financiamento</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <SheetFooter className="flex-col gap-3 mt-6">
                        <Button onClick={handleSave} className="w-full">Salvar Dívida</Button>
                        {editingDebt && (
                            <Button variant="destructive" onClick={() => { onDeleteDebt(editingDebt.id); setIsSheetOpen(false); }} className="w-full">
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </Button>
                        )}
                        <Button variant="ghost" onClick={() => setIsSheetOpen(false)} className="w-full">Cancelar</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
