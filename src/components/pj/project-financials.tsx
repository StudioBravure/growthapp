"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/store/use-store";
import { Transaction, Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { format, addMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface ProjectFinancialsProps {
    project: Project;
}

export function ProjectFinancials({ project }: ProjectFinancialsProps) {
    const { transactions, addTransaction, deleteTransaction, updateTransaction } = useAppStore();
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [installments, setInstallments] = useState(1);

    const projectTransactions = useMemo(() =>
        transactions.filter(t => t.projectId === project.id && t.type === 'INCOME')
        , [transactions, project.id]);

    const totalScheduled = projectTransactions.reduce((acc, t) => acc + t.amount, 0);
    const totalPaid = projectTransactions.filter(t => t.status === 'PAID').reduce((acc, t) => acc + t.amount, 0);
    const remaining = Math.max(0, project.totalValue - totalScheduled);

    const isDivergent = totalScheduled !== project.totalValue;

    const handleAddManual = () => {
        addTransaction({
            description: `Parcela ${projectTransactions.length + 1} - ${project.name}`,
            amount: 0,
            type: 'INCOME',
            date: new Date().toISOString(),
            status: 'PENDING',
            mode: 'PJ',
            category: 'Projetos',
            projectId: project.id,
            clientId: project.clientId
        });
    };

    const handleGenerate = () => {
        if (installments < 1) return;

        const amountPerInstallment = Math.floor(remaining / installments);
        const remainder = remaining % installments;

        const today = new Date();

        for (let i = 0; i < installments; i++) {
            const amount = i === installments - 1 ? amountPerInstallment + remainder : amountPerInstallment;
            addTransaction({
                description: `Parcela ${projectTransactions.length + 1 + i}/${installments} - ${project.name}`,
                amount: amount,
                type: 'INCOME',
                date: addMonths(today, i).toISOString(),
                status: 'PENDING',
                mode: 'PJ',
                category: 'Projetos',
                projectId: project.id,
                clientId: project.clientId
            });
        }

        setIsGeneratorOpen(false);
        toast.success(`${installments} parcelas geradas com sucesso!`);
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);

    return (
        <div className="space-y-6">
            {/* Status Card */}
            <div className={cn(
                "rounded-lg border p-4 flex flex-col sm:flex-row items-center justify-between gap-4",
                isDivergent ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20"
            )}>
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-full", isDivergent ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600")}>
                        {isDivergent ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                    </div>
                    <div>
                        <h4 className={cn("font-bold text-sm", isDivergent ? "text-amber-700" : "text-emerald-700")}>
                            {isDivergent ? "Divergência Financeira" : "Financeiro Sincronizado"}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            {isDivergent
                                ? `Total do projeto (${formatCurrency(project.totalValue)}) difere do total agendado (${formatCurrency(totalScheduled)}).`
                                : "O valor total do projeto bate com a soma das parcelas."}
                        </p>
                    </div>
                </div>

                {isDivergent && remaining > 0 && (
                    <Dialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="border-amber-500 text-amber-700 hover:bg-amber-100">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Resolver ({formatCurrency(remaining)})
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Gerar Parcelas Restantes</DialogTitle>
                                <DialogDescription>
                                    Há uma diferença de <b>{formatCurrency(remaining)}</b>. Como deseja dividir esse valor?
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                <div className="space-y-2">
                                    <Label>Número de Parcelas (Mensais)</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={12}
                                        value={installments}
                                        onChange={(e) => setInstallments(parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsGeneratorOpen(false)}>Cancelar</Button>
                                <Button onClick={handleGenerate}>Gerar Parcelas</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* List */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {projectTransactions.map((t) => (
                            <TableRow key={t.id}>
                                <TableCell>
                                    <Input
                                        value={t.description}
                                        onChange={(e) => updateTransaction(t.id, { description: e.target.value })}
                                        className="h-8 text-sm bg-transparent border-transparent hover:border-input focus:border-primary"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="date"
                                        value={t.date ? format(new Date(t.date), 'yyyy-MM-dd') : ''}
                                        onChange={(e) => updateTransaction(t.id, { date: new Date(e.target.value).toISOString() })}
                                        className="h-8 w-[130px] text-sm bg-transparent border-transparent hover:border-input focus:border-primary"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        value={t.amount / 100}
                                        onChange={(e) => updateTransaction(t.id, { amount: parseFloat(e.target.value) * 100 })}
                                        className="h-8 w-[100px] text-sm bg-transparent border-transparent hover:border-input focus:border-primary font-mono"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-6 text-[10px] px-2 rounded-full",
                                            t.status === 'PAID' ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        )}
                                        onClick={() => updateTransaction(t.id, { status: t.status === 'PAID' ? 'PENDING' : 'PAID' })}
                                    >
                                        {t.status === 'PAID' ? 'PAGO' : 'PENDENTE'}
                                    </Button>
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => deleteTransaction(t.id)}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {projectTransactions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-8">
                                    Nenhuma parcela criada ainda.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <div className="p-2 border-t bg-muted/20">
                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-primary" onClick={handleAddManual}>
                        <Plus className="mr-2 h-3 w-3" /> Adicionar Parcela Manualmente
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-between text-sm px-2">
                <span className="text-muted-foreground">Recebido: <span className="text-foreground font-medium">{formatCurrency(totalPaid)}</span></span>
                <span className="text-muted-foreground">A Receber: <span className="text-foreground font-medium">{formatCurrency(totalScheduled - totalPaid)}</span></span>
            </div>
        </div>
    );
}
