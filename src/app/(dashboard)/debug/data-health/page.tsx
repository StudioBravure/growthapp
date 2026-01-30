"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/use-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Transaction } from "@/lib/types";

export default function DataHealthPage() {
    const store = useAppStore();
    const [dbCounts, setDbCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);

    const checkDb = async () => {
        setLoading(true);
        try {
            // Fetch all lists manually to count
            const [tx, pj, cli, debt, bills, goals, cats, rules, alerts] = await Promise.all([
                api.transactions.list(),
                api.projects.list(),
                api.clients.list(),
                api.debts.list(),
                api.recurringBills.list(),
                api.goals.list(),
                api.categories.list(),
                api.rules.list(),
                api.alerts.list()
            ]);

            setDbCounts({
                transactions: tx.length,
                projects: pj.length,
                clients: cli.length,
                debts: debt.length,
                recurringBills: bills.length,
                goals: goals.length,
                categories: cats.length,
                rules: rules.length,
                alerts: alerts.length
            });
        } catch (e) {
            console.error(e);
            toast.error("Erro ao checar DB");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkDb();
    }, []);

    const handleCreateTest = async () => {
        try {
            const t: Transaction = {
                id: crypto.randomUUID(),
                description: "TESTE DE CONSISTÊNCIA " + new Date().toISOString(),
                amount: 1000,
                type: 'EXPENSE',
                category: 'Outros',
                mode: 'PF',
                status: 'PAID',
                date: new Date().toISOString()
            };
            await api.transactions.create(t);
            store.addTransaction(t); // Optimistic update
            toast.success("Transação de teste criada!");
            checkDb();
        } catch (e) {
            toast.error("Falha ao criar teste");
        }
    };

    const handleReset = async () => {
        if (!confirm("ZERAR TUDO AGORA?")) return;
        try {
            await api.admin.resetAccount();
            store.resetStore();
            toast.success("Zerado!");
            checkDb();
        } catch (e) {
            toast.error("Erro ao zerar");
        }
    };

    const rows = [
        { label: "Transações", store: store.transactions.length, db: dbCounts.transactions },
        { label: "Projetos", store: store.projects.length, db: dbCounts.projects },
        { label: "Clientes", store: store.clients.length, db: dbCounts.clients },
        { label: "Dívidas", store: store.debts.length, db: dbCounts.debts },
        { label: "Contas Fixas", store: store.recurringBills.length, db: dbCounts.recurringBills },
        { label: "Metas", store: store.goals.length, db: dbCounts.goals },
        { label: "Categorias", store: store.categories.length, db: dbCounts.categories },
        { label: "Regras", store: store.categorizationRules.length, db: dbCounts.rules },
        { label: "Alertas", store: store.alerts.length, db: dbCounts.alerts },
    ];

    const isConsistent = rows.every(r => r.store === r.db || r.db === undefined);

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Diagnóstico de Dados (Data Health)</h1>
                    <p className="text-muted-foreground">Verifique a consistência entre Frontend (Store) e Backend (DB).</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { store.loadData(); checkDb(); }}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Recarregar Tudo
                    </Button>
                    <Button onClick={handleCreateTest}>
                        <Plus className="mr-2 h-4 w-4" /> Criar Dado Teste
                    </Button>
                    <Button variant="destructive" onClick={handleReset}>
                        <Trash2 className="mr-2 h-4 w-4" /> ZERAR TUDO
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Estado Atual</CardTitle>
                        <CardDescription>Comparativo Store vs DB</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Entidade</TableHead>
                                    <TableHead>Store (Client)</TableHead>
                                    <TableHead>DB (Server)</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((row, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{row.label}</TableCell>
                                        <TableCell>{row.store}</TableCell>
                                        <TableCell>{loading ? <Loader2 className="h-3 w-3 animate-spin" /> : (row.db ?? '-')}</TableCell>
                                        <TableCell>
                                            {row.db !== undefined && row.store !== row.db ? (
                                                <span className="text-red-500 font-bold">DIVERGENTE</span>
                                            ) : (
                                                <span className="text-green-500 font-bold">OK</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Detalhes do Usuário</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p><strong>Modo Atual:</strong> {store.mode}</p>
                        <p><strong>Settings Theme:</strong> {store.settings.preferences.theme}</p>
                        <p><strong>Status Global:</strong> {isConsistent ? "CONSISTENTE" : "INCONSISTENTE"}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
