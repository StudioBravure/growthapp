"use client";

import { ProjectKanban } from "@/components/projects/project-kanban";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ProjetosPage() {
    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pipeline de Projetos</h1>
                    <p className="text-muted-foreground">Gerencie o fluxo de trabalho do estúdio.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Projeto
                </Button>
            </div>

            <div className="flex-1 min-h-0">
                <ProjectKanban />
            </div>
        </div>
    )
}
