"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, MoreHorizontal, Calendar, Briefcase } from "lucide-react";
import { useAppStore } from "@/store/use-store";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectStatusBadge } from "./project-status";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProjectForm } from "./project-form";
import { Project, PipelineStage } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const STAGE_LABELS: Record<PipelineStage, string> = {
    LEAD: 'Briefing',
    PROPOSAL: 'Proposta',
    NEGOTIATION: 'Negociação',
    CLOSED: 'Contrato',
    EXECUTION: 'Execução',
    DELIVERY: 'Entrega',
    POST_SALE: 'Pós-Venda'
};

export function ProjectList() {
    const { projects, clients, deleteProject } = useAppStore();
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[280px]">Projeto / Cliente</TableHead>
                        <TableHead>Etapa</TableHead>
                        <TableHead>Status / Risco</TableHead>
                        <TableHead>Prazo</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {projects.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                <div className="flex flex-col items-center gap-2">
                                    <Briefcase className="h-8 w-8 opacity-20" />
                                    <p>Nenhum projeto em andamento.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        projects.map((project) => {
                            const client = clients.find(c => c.id === project.clientId);
                            return (
                                <TableRow key={project.id} className="group transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-base">{project.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {client?.companyName || client?.name || 'Cliente Desconhecido'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/5 text-primary border border-primary/10">
                                            {STAGE_LABELS[project.stage]}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <ProjectStatusBadge projectId={project.id} />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {project.deadline ? format(parseISO(project.deadline), "dd/MM/yyyy", { locale: ptBR }) : 'Sem prazo'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-sm">
                                        R$ {(project.totalValue / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                <DropdownMenuItem onClick={() => setEditingProject(project)}>
                                                    <Edit2 className="mr-2 h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => deleteProject(project.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>

            <Sheet open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
                <SheetContent className="sm:max-w-[500px]">
                    <SheetHeader className="mb-6">
                        <SheetTitle>Editar Projeto</SheetTitle>
                    </SheetHeader>
                    {editingProject && (
                        <ProjectForm
                            initialData={editingProject}
                            onSuccess={() => setEditingProject(null)}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
