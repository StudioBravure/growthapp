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
import { Edit2, Trash2, Mail, Phone, MoreHorizontal, User } from "lucide-react";
import { useAppStore } from "@/store/use-store";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClientStatusBadge, ClientFinancialInfo } from "./client-status";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ClientForm } from "./client-form";
import { Client } from "@/lib/types";

export function ClientList() {
    const { clients, deleteClient } = useAppStore();
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[300px]">Cliente / Empresa</TableHead>
                        <TableHead>Status Financeiro</TableHead>
                        <TableHead>Contrato</TableHead>
                        <TableHead className="text-right">A Receber</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clients.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                <div className="flex flex-col items-center gap-2">
                                    <User className="h-8 w-8 opacity-20" />
                                    <p>Nenhum cliente cadastrado ainda.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        clients.map((client) => (
                            <TableRow key={client.id} className="group transition-colors">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-base">{client.companyName || client.name}</span>
                                        <div className="flex items-center gap-3 mt-1">
                                            {client.email && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Mail className="h-3 w-3" /> {client.email}
                                                </span>
                                            )}
                                            {client.phone && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Phone className="h-3 w-3" /> {client.phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <ClientStatusBadge clientId={client.id} />
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted border">
                                        {client.contractType === 'PROJECT' ? 'Projeto' :
                                            client.contractType === 'RETAINER' ? 'Retainer' : 'Hora'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <ClientFinancialInfo clientId={client.id} />
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40">
                                            <DropdownMenuItem onClick={() => setEditingClient(client)}>
                                                <Edit2 className="mr-2 h-4 w-4" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => deleteClient(client.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <Sheet open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
                <SheetContent className="sm:max-w-[700px] p-20 overflow-y-auto">
                    <SheetHeader className="mb-8 p-0">
                        <SheetTitle className="text-3xl font-bold">Editar Cliente</SheetTitle>
                    </SheetHeader>
                    {editingClient && (
                        <ClientForm
                            initialData={editingClient}
                            onSuccess={() => setEditingClient(null)}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
