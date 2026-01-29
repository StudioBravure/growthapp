"use client";

import { useProjectRisk, ProjectRiskStatus } from "@/hooks/use-project-risk";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, ShieldCheck, Clock } from "lucide-react";

export function ProjectStatusBadge({ projectId }: { projectId: string }) {
    const { status, isFinancialRisk, daysRemaining } = useProjectRisk(projectId);

    const config: Record<ProjectRiskStatus, { label: string, className: string, icon: any }> = {
        EM_DIA: { label: 'Em Dia', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: ShieldCheck },
        RISCO: { label: `Risco (${daysRemaining}d)`, className: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock },
        ATRASADO: { label: 'Atrasado', className: 'bg-red-500/10 text-red-500 border-red-500/20', icon: AlertTriangle }
    };

    const { label, className, icon: Icon } = config[status];

    return (
        <div className="flex flex-col gap-1 items-start">
            <Badge variant="outline" className={cn("font-semibold gap-1.5 px-2 py-0.5", className)}>
                <Icon className="h-3 w-3" />
                {label}
            </Badge>
            {isFinancialRisk && (
                <Badge variant="destructive" className="text-[10px] h-4 px-1 animate-pulse">
                    Risco Financeiro
                </Badge>
            )}
        </div>
    );
}
