
"use client";

import { use, useEffect, useState } from "react";
import { useProjects } from "@/hooks/use-pj-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TimeTracker } from "@/components/pj/time-tracker";
import { ArrowLeft, Calendar, DollarSign, Clock } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

// Next.js 15+ Params are async, but in client component with 'use params' hook or unwrapped.
// 'params' prop in Page is Promise (Next 15).
// But 'useParams()' hook is available.

export default function PjProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // If Next 15, we unwrap params with `use` or wait for it.
    // The prompt implies Next.js/React stack.
    const { id } = use(params);
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Fetch single project? useProjects hook fetches all, maybe inefficient but reuses existing.
    // I'll fetch single directly or filter.
    // Let's simple fetch list for consistency or add fetchSingle in hook. I'll fetch direct here to be safe.

    useEffect(() => {
        if (id) {
            fetch(`/api/pj/projects`).then(res => res.json()).then(data => {
                const found = data.find((p: any) => p.id === id);
                setProject(found);
                setLoading(false);
            });
        }
    }, [id]);

    if (loading) return <div className="p-8">Carregando...</div>;
    if (!project) return <div className="p-8">Projeto não encontrado.</div>;

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="space-y-8 p-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/pj/projetos">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                        {project.title}
                        <Badge variant="outline">{project.status_stage}</Badge>
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                        {project.customer?.company_name} • {project.billing_model}
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> Valor Contratado
                        </span>
                        <span className="text-2xl font-bold">
                            {project.billing_model === 'HOURLY' && `${formatCurrency(project.hourly_rate)}/h`}
                            {project.billing_model === 'SCOPE' && formatCurrency(project.scope_value)}
                            {project.billing_model === 'RETAINER' && `${formatCurrency(project.retainer_amount)}/mês`}
                        </span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Estimativa
                        </span>
                        <span className="text-2xl font-bold">{project.estimated_hours || 0}h</span>
                        <span className="text-xs text-muted-foreground">Horas previstas</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Prazo
                        </span>
                        <span className="text-lg font-bold">
                            {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'Sem prazo'}
                        </span>
                    </CardContent>
                </Card>
            </div>

            {/* HOURLY Logic */}
            {project.billing_model === 'HOURLY' && (
                <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <TimeTracker projectId={project.id} />
                </div>
            )}
        </div>
    );
}
