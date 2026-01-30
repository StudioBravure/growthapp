"use client";

import { useState } from 'react';
import { useAppStore } from '@/store/use-store';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check, Clock, CheckCircle2, Trash2, AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from "@/lib/utils";
import { AlertStatus, AlertSeverity, Alert } from '@/lib/types';
import { toast } from 'sonner';
import { scanPF } from '@/services/pf-scanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AlertsList() {
    const { alerts, updateAlert, setAlerts, transactions, budgets, recurringBills, debts, mode } = useAppStore();
    const [activeTab, setActiveTab] = useState<string>('OPEN');

    const handleScan = () => {
        toast.promise(
            async () => {
                // Simulate async scan feel
                await new Promise(r => setTimeout(r, 500));
                const newAlerts = scanPF(transactions, budgets, debts, recurringBills);
                // In a real app, we would merge better. Here we replace for manual scan relying on deterministic nature.
                // But let's respect resolved state if we can?
                // For manual scan, user usually wants FRESH state.
                setAlerts(newAlerts);
                return newAlerts.length;
            },
            {
                loading: 'Rodando scanner financeiro...',
                success: (count) => `Varredura completa. ${count} alertas encontrados.`,
                error: 'Erro ao escanear.'
            }
        );
    };

    const handleResolve = (id: string) => {
        updateAlert(id, { status: 'RESOLVED', resolvedAt: new Date().toISOString() });
        toast.success("Alerta marcado como resolvido");
    };

    const handleSnooze = (id: string, days: number) => {
        const until = addDays(new Date(), days).toISOString();
        updateAlert(id, { status: 'SNOOZED', snoozedUntil: until });
        toast.success(`Alerta silenciado por ${days} dias`);
    };

    const filtered = alerts.filter(a => {
        if (mode !== 'CONSOLIDATED' && a.ledgerType !== mode) return false;

        if (activeTab === 'OPEN') return a.status === 'OPEN';
        if (activeTab === 'SNOOZED') return a.status === 'SNOOZED';
        if (activeTab === 'RESOLVED') return a.status === 'RESOLVED';
        return true;
    }).sort((a, b) => {
        // Sort by severity then date
        const score = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        const diff = score[b.severity] - score[a.severity];
        if (diff !== 0) return diff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const severityColor = (sev: AlertSeverity) => {
        switch (sev) {
            case 'CRITICAL': return 'bg-red-500 text-white hover:bg-red-600';
            case 'HIGH': return 'bg-orange-500 text-white hover:bg-orange-600';
            case 'MEDIUM': return 'bg-yellow-500 text-white hover:bg-yellow-600';
            case 'LOW': return 'bg-blue-500 text-white hover:bg-blue-600';
            default: return 'bg-gray-500';
        }
    };

    const severityLabel = (sev: AlertSeverity) => {
        switch (sev) {
            case 'CRITICAL': return 'Crítico';
            case 'HIGH': return 'Alto';
            case 'MEDIUM': return 'Médio';
            case 'LOW': return 'Baixo';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">Última varredura: {format(new Date(), 'HH:mm')}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" /> Sistema operando normalmente
                    </span>
                </div>
                <Button onClick={handleScan} variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Reescanear Agora
                </Button>
            </div>

            <Tabs defaultValue="OPEN" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3 mb-4">
                    <TabsTrigger value="OPEN">Abertos ({alerts.filter(a => a.status === 'OPEN').length})</TabsTrigger>
                    <TabsTrigger value="SNOOZED">Soneca ({alerts.filter(a => a.status === 'SNOOZED').length})</TabsTrigger>
                    <TabsTrigger value="RESOLVED">Resolvidos</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4 min-h-[300px]">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border-2 border-dashed rounded-lg">
                            <CheckCircle2 className="h-12 w-12 mb-4 text-green-500/50" />
                            <p className="text-lg font-medium">Nenhum alerta {activeTab === 'OPEN' ? 'ativo' : 'encontrado'}</p>
                            <p className="text-sm">Você está com tudo em dia!</p>
                        </div>
                    ) : (
                        filtered.map(alert => (
                            <Card key={alert.id} className={cn("transition-all hover:shadow-md border-l-4",
                                alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? "border-l-red-500" :
                                    alert.severity === 'MEDIUM' ? "border-l-yellow-500" : "border-l-blue-500"
                            )}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge className={cn("border-none", severityColor(alert.severity))}>
                                                    {severityLabel(alert.severity)}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs uppercase font-mono tracking-wider">
                                                    {alert.type.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-base font-semibold pt-1">
                                                {alert.title}
                                            </CardTitle>
                                        </div>
                                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                                            {format(new Date(alert.createdAt), 'dd/MM HH:mm')}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-2">
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {alert.message}
                                    </p>
                                    {/* Actionable Payload Details could go here (e.g. progress bar for budget) */}
                                </CardContent>
                                <CardFooter className="pt-2 flex gap-2 justify-end border-t bg-muted/10 h-14">
                                    {alert.status === 'OPEN' && (
                                        <>
                                            <Button variant="ghost" size="sm" onClick={() => handleSnooze(alert.id, 1)} title="Silenciar por 1 dia">
                                                <Clock className="h-4 w-4 mr-2" />
                                                1d
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleResolve(alert.id)} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                                                <Check className="h-4 w-4 mr-2" />
                                                Resolver
                                            </Button>
                                        </>
                                    )}
                                    {alert.status === 'SNOOZED' && (
                                        <Button variant="outline" size="sm" onClick={() => updateAlert(alert.id, { status: 'OPEN' })}>
                                            Reativar Agora
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
