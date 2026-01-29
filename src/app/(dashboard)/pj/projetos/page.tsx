"use client";

import { useState } from "react";
import { Plus, Search, Filter, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectList } from "@/components/pj/project-list";
import { ProjectForm } from "@/components/pj/project-form";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

export default function ProjetosPage() {
    const [isAddOpen, setIsAddOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Projetos</h1>
                    <p className="text-muted-foreground text-sm flex items-center gap-1">
                        <Briefcase className="h-3 w-3" /> Acompanhamento operacional e financeiro do estúdio.
                    </p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <SheetTrigger asChild>
                            <Button className="flex-1 sm:flex-none shadow-lg shadow-primary/20">
                                <Plus className="mr-2 h-4 w-4" /> Novo Projeto
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-[500px]">
                            <SheetHeader className="mb-6">
                                <SheetTitle>Novo Projeto</SheetTitle>
                                <SheetDescription>
                                    Defina o cliente, prazo e valor para iniciar o acompanhamento.
                                </SheetDescription>
                            </SheetHeader>
                            <ProjectForm onSuccess={() => setIsAddOpen(false)} />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                        placeholder="Buscar projeto por nome ou cliente..."
                        className="pl-10 h-10 bg-card border-none ring-1 ring-border focus-visible:ring-primary shadow-sm"
                    />
                </div>
                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            <ProjectList />
        </div>
    );
}
