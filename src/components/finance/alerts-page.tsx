"use client";

import { useState } from "react";
import { useAppStore } from "@/store/use-store";
import { useAlerts } from "@/hooks/use-alerts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Bell,
    AlertTriangle,
    Calendar,
    CheckCircle2,
    ChevronRight,
    CreditCard,
    Target,
    Wallet,
    Filter,
    ArrowUpRight,
    Clock,
    XCircle,
    ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertType, Alert } from "@/lib/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AlertsPage() {
    const router = useRouter();
    const { alerts } = useAlerts();
    const { updateTransaction, debts, updateDebt, mode } = useAppStore();
    const [filter, setFilter] = useState<AlertType | 'ALL'>('ALL');

    const filteredAlerts = alerts.filter(a => filter === 'ALL' || a.type === filter);

    const handleAction = (alert: Alert, action: string) => {
        switch (action) {
            case 'PAY_BILL':
                if (alert.relatedId) {
                    updateTransaction(alert.relatedId, { status: 'PAID' });
                    toast.success("Conta marcada como paga!");
                }
                break;
            case 'VIEW_FINANCE':
                if (alert.relatedId) {
                    router.push(`/financeiro?highlight=${alert.relatedId}&date=${alert.date}`);
                } else {
                    router.push('/financeiro');
                }
                break;
            case 'VIEW_DEBT_SIM':
                router.push('/metas');
                break;
            case 'VIEW_GOALS':
                router.push('/');
                break;
            default:
                console.log("Action not implemented:", action);
        }
    };

    const getTypeIcon = (type: AlertType) => {
        switch (type) {
            case 'BILL': return <Wallet className="h-4 w-4" />;
            case 'CARD': return <CreditCard className="h-4 w-4" />;
            case 'DEBT': return <AlertTriangle className="h-4 w-4" />;
            case 'GOAL': return <Target className="h-4 w-4" />;
            case 'BUDGET': return <ShoppingBag className="h-4 w-4" />;
        }
    };

    const sections = [
        { title: "Críticos", items: filteredAlerts.filter(a => a.severity === 'CRITICAL') },
        { title: "Atenção", items: filteredAlerts.filter(a => a.severity === 'ATTENTION') },
        { title: "Informativos", items: filteredAlerts.filter(a => a.severity === 'INFO') },
    ];

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Bell className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Alertas PF</h1>
                    </div>
                    <p className="text-muted-foreground">Tudo que precisa de atenção hoje e nos próximos dias.</p>
                </div>
                <div className="flex gap-2 bg-muted/50 p-1 rounded-lg border">
                    <Button
                        variant={filter === 'ALL' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('ALL')}
                        className="text-xs h-8"
                    >
                        Todos
                    </Button>
                    <Button
                        variant={filter === 'BILL' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('BILL')}
                        className="text-xs h-8"
                    >
                        Contas
                    </Button>
                    <Button
                        variant={filter === 'DEBT' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('DEBT')}
                        className="text-xs h-8"
                    >
                        Dívidas
                    </Button>
                    <Button
                        variant={filter === 'BUDGET' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('BUDGET')}
                        className="text-xs h-8"
                    >
                        Orçamento
                    </Button>
                </div>
            </div>

            {alerts.length === 0 ? (
                <Card className="border-dashed bg-transparent mt-8">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Você está em dia 🎉</h2>
                        <p className="text-muted-foreground max-w-sm mb-6">
                            Nenhum alerta pendente no momento. Suas finanças estão sob controle!
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Button variant="outline" size="sm" onClick={() => router.push('/financeiro')}>Ver Financeiro</Button>
                            <Button variant="outline" size="sm" onClick={() => router.push('/financeiro/contas-fixas')}>Adicionar Conta Fixa</Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-10">
                    {sections.map(section => section.items.length > 0 && (
                        <div key={section.title} className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <h2 className={cn(
                                    "text-sm font-bold uppercase tracking-widest",
                                    section.title === 'Críticos' ? "text-destructive" :
                                        section.title === 'Atenção' ? "text-amber-500" : "text-muted-foreground"
                                )}>
                                    {section.title}
                                </h2>
                                <Badge variant="outline" className="h-5 px-1.5 text-[10px]">{section.items.length}</Badge>
                            </div>

                            <div className="grid gap-3">
                                {section.items.map(alert => (
                                    <Card key={alert.id} className={cn(
                                        "group border-l-4 transition-all hover:translate-x-1",
                                        alert.severity === 'CRITICAL' ? "border-l-destructive" :
                                            alert.severity === 'ATTENTION' ? "border-l-amber-500" : "border-l-muted"
                                    )}>
                                        <CardContent className="p-4 flex items-start gap-4">
                                            <div className={cn(
                                                "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                                                alert.type === 'BILL' ? "bg-blue-500/10 text-blue-500" :
                                                    alert.type === 'DEBT' ? "bg-purple-500/10 text-purple-500" :
                                                        alert.type === 'BUDGET' ? "bg-orange-500/10 text-orange-500" :
                                                            "bg-primary/10 text-primary"
                                            )}>
                                                {getTypeIcon(alert.type)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <h3 className="font-semibold text-base truncate">{alert.title}</h3>
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0 uppercase font-medium">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(alert.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                                    {alert.description}
                                                </p>

                                                <div className="flex flex-wrap gap-2">
                                                    {alert.actions.map((act, i) => (
                                                        <Button
                                                            key={i}
                                                            variant={act.variant || 'default'}
                                                            size="sm"
                                                            className="h-8 text-[11px] px-3 font-semibold"
                                                            onClick={() => handleAction(alert, act.action)}
                                                        >
                                                            {act.label}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
