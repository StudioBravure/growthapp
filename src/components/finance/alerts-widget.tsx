"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, CheckCircle, ArrowRight, Bell } from "lucide-react";
import { useAppStore } from "@/store/use-store";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function AlertsWidget() {
    const { alerts, mode } = useAppStore();

    const activeAlerts = alerts.filter(a =>
        a.status === 'OPEN' &&
        (mode === 'CONSOLIDATED' || a.ledgerType === mode)
    );

    const criticalCount = activeAlerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;

    // Sort: Critical/High first, then date
    const sorted = [...activeAlerts].sort((a, b) => {
        const severityScore = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        const scoreA = severityScore[a.severity] || 0;
        const scoreB = severityScore[b.severity] || 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return 0;
    }).slice(0, 3); // Take top 3

    if (activeAlerts.length === 0) {
        return (
            <Card className="border-dashed shadow-sm bg-muted/20">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <CheckCircle className="h-4 w-4" />
                        Tudo Certo
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Nenhum alerta financeiro detectado no momento.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("shadow-sm", criticalCount > 0 ? "border-l-4 border-l-destructive" : "border-l-4 border-l-warning")}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        {criticalCount > 0 ? <AlertCircle className="h-4 w-4 text-destructive" /> : <Bell className="h-4 w-4 text-warning" />}
                        Alertas Financeiros
                        <Badge variant="secondary" className="ml-2 bg-muted text-xs">{activeAlerts.length}</Badge>
                    </CardTitle>
                    <Link href="/alerts" className="text-xs text-primary hover:underline flex items-center">
                        Ver todos <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
                {sorted.map(alert => (
                    <div key={alert.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-[var(--state-hover-overlay)] transition-colors border border-transparent hover:border-border">
                        <div className={cn("mt-0.5 min-w-1.5 min-h-1.5 rounded-full",
                            (alert.severity === 'HIGH' || alert.severity === 'CRITICAL') ? "bg-destructive" : "bg-warning"
                        )} />
                        <div>
                            <p className="text-xs font-medium leading-none">{alert.title}</p>
                            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{alert.message}</p>
                        </div>
                    </div>
                ))}
                {activeAlerts.length > 3 && (
                    <p className="text-[10px] text-center text-muted-foreground pt-1">
                        + {activeAlerts.length - 3} outros alertas
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
