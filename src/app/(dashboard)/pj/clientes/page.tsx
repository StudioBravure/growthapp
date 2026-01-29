"use client";

import { useState } from "react";
import { Plus, Search, Filter, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientList } from "@/components/pj/client-list";
import { ClientForm } from "@/components/pj/client-form";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

export default function ClientesPage() {
    const [isAddOpen, setIsAddOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Clientes</h1>
                    <p className="text-muted-foreground text-sm flex items-center gap-1">
                        <Users className="h-3 w-3" /> Gerencie sua base de contatos e saúde financeira por cliente.
                    </p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <SheetTrigger asChild>
                            <Button className="flex-1 sm:flex-none shadow-lg shadow-primary/20">
                                <Plus className="mr-2 h-4 w-4" /> Novo Cliente
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-[600px] p-6 sm:p-10">
                            <SheetHeader className="mb-6">
                                <SheetTitle>Novo Cliente</SheetTitle>
                                <SheetDescription>
                                    Adicione as informações para acompanhamento de projetos e cobranças.
                                </SheetDescription>
                            </SheetHeader>
                            <ClientForm onSuccess={() => setIsAddOpen(false)} />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                        placeholder="Buscar cliente por nome ou empresa..."
                        className="pl-10 h-10 bg-card border-none ring-1 ring-border focus-visible:ring-primary shadow-sm"
                    />
                </div>
                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            <ClientList />
        </div>
    );
}
