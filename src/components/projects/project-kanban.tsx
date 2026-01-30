"use client";

import { useAppStore } from "@/store/use-store";
import { PipelineStage, Project } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Clock, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

const COLUMNS: { id: PipelineStage; label: string; color: string }[] = [
    { id: 'LEAD', label: 'Lead', color: 'bg-foreground/5 border-border' },
    { id: 'PROPOSAL', label: 'Proposta', color: 'bg-system-blue/5 border-system-blue/20' },
    { id: 'NEGOTIATION', label: 'Negociação', color: 'bg-system-purple/5 border-system-purple/20' },
    { id: 'CLOSED', label: 'Fechado', color: 'bg-system-green/5 border-system-green/20' },
    { id: 'EXECUTION', label: 'Em Execução', color: 'bg-system-yellow/5 border-system-yellow/20' },
    { id: 'DELIVERY', label: 'Entregue', color: 'bg-system-blue/10 border-system-blue/30' },
];

export function ProjectKanban() {
    const { projects, updateProjectStage } = useAppStore();

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);

    const getProjectsByStage = (stage: PipelineStage) => projects.filter(p => p.stage === stage);

    return (
        <div className="flex h-[calc(100vh-200px)] gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((col) => {
                const stageProjects = getProjectsByStage(col.id);
                const totalValue = stageProjects.reduce((acc, p) => acc + p.totalValue, 0);

                return (
                    <div key={col.id} className={`flex flex-col min-w-[300px] rounded-lg border ${col.color} bg-opacity-50`}>
                        <div className="p-3 font-semibold flex items-center justify-between">
                            <span>{col.label} <span className="text-muted-foreground ml-1 text-xs font-normal">({stageProjects.length})</span></span>
                            <span className="text-xs text-muted-foreground">{totalValue > 0 ? formatCurrency(totalValue) : ''}</span>
                        </div>
                        <Separator className="bg-background/20" />
                        <ScrollArea className="flex-1 p-3">
                            <div className="space-y-3">
                                {stageProjects.map((project, index) => (
                                    <motion.div
                                        key={project.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Card className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50 group bg-card">
                                            <CardHeader className="p-3 pb-2">
                                                <CardTitle className="text-sm font-medium flex justify-between">
                                                    <span className="truncate">{project.name}</span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-3 pt-0 space-y-2">
                                                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                                    <div className="flex items-center justify-between">
                                                        <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Valor Total</span>
                                                        <span className="font-medium text-foreground">{formatCurrency(project.totalValue)}</span>
                                                    </div>

                                                    {/* Real-time Financial Link */}
                                                    {(() => {
                                                        const received = useAppStore.getState().transactions
                                                            .filter(t => t.projectId === project.id && t.type === 'INCOME' && t.status === 'PAID')
                                                            .reduce((acc, t) => acc + t.amount, 0);

                                                        const percent = Math.min(100, (received / project.totalValue) * 100);

                                                        return (
                                                            <div className="space-y-1 mt-1">
                                                                <div className="flex justify-between text-[10px]">
                                                                    <span>Recebido</span>
                                                                    <span className={percent >= 100 ? "text-system-green font-bold" : ""}>{formatCurrency(received)}</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-secondary overflow-hidden rounded-full">
                                                                    <div
                                                                        className={`h-full ${percent >= 100 ? 'bg-system-green shadow-[0_0_8px_rgba(52,199,89,0.3)]' : 'bg-system-blue'} transition-all duration-500`}
                                                                        style={{ width: `${percent}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}

                                                    {project.hoursUsed > 0 && (
                                                        <div className="flex items-center gap-1 mt-1 border-t border-border pt-1">
                                                            <Clock className="h-3 w-3" />
                                                            <span>{project.hoursUsed}h gastas</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Quick Actions (Mock) -> Could implement Drag & Drop later */}
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1 mt-2">
                                                    {col.id !== 'LEAD' && (
                                                        <Badge variant="secondary" className="text-[10px] cursor-pointer hover:bg-muted" onClick={() => {
                                                            // Simple prev stage logic
                                                            const idx = COLUMNS.findIndex(c => c.id === col.id);
                                                            if (idx > 0) updateProjectStage(project.id, COLUMNS[idx - 1].id);
                                                        }}>
                                                            ←
                                                        </Badge>
                                                    )}
                                                    {col.id !== 'DELIVERY' && (
                                                        <Badge variant="secondary" className="text-[10px] cursor-pointer hover:bg-muted" onClick={() => {
                                                            // Simple next stage logic
                                                            const idx = COLUMNS.findIndex(c => c.id === col.id);
                                                            if (idx < COLUMNS.length - 1) updateProjectStage(project.id, COLUMNS[idx + 1].id);
                                                        }}>
                                                            →
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                );
            })}
        </div>
    );
}
