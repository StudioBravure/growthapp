"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAppStore } from "@/store/use-store";

export function DangerousZoneSettings() {
    const [isOpen, setIsOpen] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { loadData } = useAppStore();

    const handleReset = async () => {
        if (confirmText !== "ZERAR TUDO") return;

        setIsLoading(true);
        try {
            await api.admin.resetAccount();
            useAppStore.getState().resetStore();
            toast.success("Todos os dados foram apagados com sucesso.");
            setIsOpen(false);

            // Reload app state to ensure clean slate
            window.location.href = "/";
        } catch (error) {
            console.error(error);
            toast.error("Falha ao apagar dados. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="border-destructive/50">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" /> Zona de Perigo
                </CardTitle>
                <CardDescription>
                    Ações irreversíveis que afetam toda a sua conta.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
                    <div>
                        <p className="font-medium text-destructive">Zerar todos os dados</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Apaga transações, projetos, metas e dívidas. Mantém seu login.
                        </p>
                    </div>
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="destructive">Zerar Dados</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="text-destructive flex items-center gap-2">
                                    <Trash2 className="h-5 w-5" /> Tem certeza absoluta?
                                </DialogTitle>
                                <DialogDescription className="space-y-3 pt-2">
                                    <p>
                                        Esta ação é <strong>irreversível</strong>. Isso apagará permanentemente:
                                    </p>
                                    <ul className="list-disc pl-5 text-sm space-y-1">
                                        <li>Todo o histórico financeiro (PF e PJ)</li>
                                        <li>Projetos, clientes e tarefas</li>
                                        <li>Metas e dívidas cadastradas</li>
                                        <li>Arquivos e configurações customizadas</li>
                                    </ul>
                                    <p className="text-foreground font-medium mt-4">
                                        Para confirmar, digite <span className="text-destructive select-all">ZERAR TUDO</span> abaixo:
                                    </p>
                                </DialogDescription>
                            </DialogHeader>

                            <div className="py-4">
                                <Label htmlFor="confirm-reset" className="sr-only">Confirmação</Label>
                                <Input
                                    id="confirm-reset"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="ZERAR TUDO"
                                    className="border-destructive/50 focus-visible:ring-destructive"
                                />
                            </div>

                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isLoading}>
                                    Cancelar
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleReset}
                                    disabled={confirmText !== "ZERAR TUDO" || isLoading}
                                >
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Apagar Tudo
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    );
}
