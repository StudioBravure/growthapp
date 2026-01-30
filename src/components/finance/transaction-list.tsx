"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useAppStore } from "@/store/use-store";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TransactionListProps {
    data?: Transaction[];
    highlightId?: string | null;
}

export function TransactionList({ data, highlightId }: TransactionListProps) {
    const { transactions, mode, deleteTransaction, updateTransaction } = useAppStore();

    const sourceData = data || transactions;

    const filteredTransactions = sourceData.filter((t) => {
        if (mode === 'CONSOLIDATED') return true;
        return t.mode === mode;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value / 100);
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Modo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredTransactions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                Nenhum lançamento encontrado.
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredTransactions.map((transaction) => {
                            const isPending = transaction.status !== 'PAID';
                            const isFixed = transaction.isFixed;
                            const isHighlighted = highlightId === transaction.id;

                            return (
                                <TableRow
                                    key={transaction.id}
                                    className={cn(
                                        isPending && "opacity-70 bg-muted/20",
                                        isHighlighted && "ring-2 ring-primary ring-inset z-10 bg-primary/5 opacity-100 ring-offset-0"
                                    )}
                                    id={`t-${transaction.id}`}
                                >
                                    <TableCell>
                                        {format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR })}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {transaction.description}
                                            {isFixed && (
                                                <Badge variant="outline" className="text-[10px] h-5 px-1 bg-blue-500/10 text-blue-500 border-blue-500/20">
                                                    Fixa
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{transaction.category}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={transaction.mode === 'PJ' ? 'border-primary text-primary' : ''}>
                                            {transaction.mode}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={transaction.status === 'PAID' ? 'default' : 'secondary'}
                                            className="cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => {
                                                // Quick toggle status
                                                const newStatus = transaction.status === 'PAID' ? 'PENDING' : 'PAID';
                                                useAppStore.getState().updateTransaction(transaction.id, { status: newStatus });
                                            }}
                                        >
                                            {transaction.status === 'PAID' ? 'Pago' : transaction.status === 'PENDING' ? 'Pendente' : 'Agendado'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className={`text-right font-bold ${transaction.type === 'INCOME' ? 'text-system-green' : 'text-system-red'}`}>
                                        {transaction.type === 'INCOME' ? '+' : '-'} {formatCurrency(transaction.amount)}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => deleteTransaction(transaction.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

// Auto-scroll logic could be added here or in a wrapper component
