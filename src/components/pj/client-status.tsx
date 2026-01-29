"use client";

import { useClientStatus, ClientFinancialStatus } from "@/hooks/use-client-status";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ClientStatusBadge({ clientId }: { clientId: string }) {
    const { status } = useClientStatus(clientId);

    const config: Record<ClientFinancialStatus, { label: string, className: string }> = {
        EM_DIA: { label: 'Em Dia', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
        PENDENTE: { label: 'Pendente', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
        DEVENDO: { label: 'Em Atraso', className: 'bg-red-500/10 text-red-500 border-red-500/20' }
    };

    return (
        <Badge variant="outline" className={cn("font-semibold", config[status].className)}>
            {config[status].label}
        </Badge>
    );
}

export function ClientFinancialInfo({ clientId }: { clientId: string }) {
    const { totalToReceive } = useClientStatus(clientId);
    if (totalToReceive === 0) return <span className="text-muted-foreground text-xs text-right block">—</span>;
    return (
        <span className="font-bold text-sm text-right block">
            R$ {(totalToReceive / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
    );
}
