"use client";

import { useAppStore } from "@/store/use-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function RecurringBillList() {
    const { recurringBills, deleteRecurringBill, mode } = useAppStore();

    const filtered = recurringBills.filter(b => mode === 'CONSOLIDATED' ? true : b.mode === mode);
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(bill => (
                <Card key={bill.id}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-semibold">{bill.description}</CardTitle>
                            <CardDescription>Dia {bill.dayOfMonth} • {bill.category}</CardDescription>
                        </div>
                        <Badge variant={bill.active ? "default" : "secondary"}>
                            {bill.active ? "Ativa" : "Pausada"}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-2xl font-bold">{formatCurrency(bill.amount)}</span>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => deleteRecurringBill(bill.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
            {filtered.length === 0 && (
                <div className="col-span-full text-center py-10 text-muted-foreground">
                    Nenhuma conta fixa cadastrada.
                </div>
            )}
        </div>
    );
}
