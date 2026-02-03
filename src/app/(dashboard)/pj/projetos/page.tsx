
"use client";

import { useState } from "react";
import { useProjects, useCustomers } from "@/hooks/use-pj-data";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function PjProjectsPage() {
    const { projects, loading, createProject } = useProjects();
    const { customers, fetchCustomers } = useCustomers(); // Lazy fetch customers only when creating?
    const [search, setSearch] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Form
    const [formData, setFormData] = useState<any>({});
    const [saving, setSaving] = useState(false);

    // Ensure customers are loaded when sheet opens
    const handleOpen = () => {
        setFormData({ billing_model: 'SCOPE', status_stage: 'EXECUTION' });
        fetchCustomers();
        setIsSheetOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await createProject(formData);
            setIsSheetOpen(false);
        } catch (e: any) {
            toast.error(e.message || "Erro ao criar projeto");
        } finally {
            setSaving(false);
        }
    };

    const filtered = projects.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.customer?.company_name || '').toLowerCase().includes(search.toLowerCase())
    );

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
                    <p className="text-muted-foreground">Gerencie seus projetos e contratos.</p>
                </div>
                <Button onClick={handleOpen}><Plus className="mr-2 h-4 w-4" /> Novo Projeto</Button>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar projeto ou cliente..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="h-9"
                />
            </div>

            <div className="border rounded-md bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Modelo</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Carregando...</TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Nenhum projeto encontrado.</TableCell>
                            </TableRow>
                        ) : (
                            filtered.map(proj => (
                                <TableRow key={proj.id}>
                                    <TableCell className="font-medium">{proj.title}</TableCell>
                                    <TableCell>{proj.customer?.company_name || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{proj.billing_model}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {proj.billing_model === 'HOURLY' && `${formatCurrency(proj.hourly_rate)}/h`}
                                        {proj.billing_model === 'SCOPE' && formatCurrency(proj.scope_value)}
                                        {proj.billing_model === 'RETAINER' && `${formatCurrency(proj.retainer_amount)}/mês`}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="text-[10px]">{proj.status_stage}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/pj/projetos/${proj.id}`}>
                                            <Button variant="ghost" size="icon">
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-[500px] overflow-y-auto p-[40px]">
                    <SheetHeader className="px-0 pt-0">
                        <SheetTitle>Novo Projeto</SheetTitle>
                        <SheetDescription>Vincule um cliente e defina o modelo de cobrança.</SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Cliente *</Label>
                            <Select onValueChange={v => setFormData({ ...formData, client_id: v })} value={formData.client_id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um cliente..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.company_name} ({c.name})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Título do Projeto *</Label>
                            <Input value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Redesign Site" />
                        </div>

                        <div className="space-y-2">
                            <Label>Modelo de Cobrança *</Label>
                            <Select onValueChange={v => setFormData({ ...formData, billing_model: v })} value={formData.billing_model}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SCOPE">Escopo Fechado (Projeto)</SelectItem>
                                    <SelectItem value="HOURLY">Valor Hora</SelectItem>
                                    <SelectItem value="RETAINER">Retainer (Mensalidade)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.billing_model === 'SCOPE' && (
                            <div className="space-y-2 animate-in fade-in">
                                <Label>Valor do Escopo (R$)</Label>
                                <Input type="number" onChange={e => setFormData({ ...formData, scope_value: Number(e.target.value) })} />
                            </div>
                        )}
                        {formData.billing_model === 'HOURLY' && (
                            <div className="space-y-2 animate-in fade-in">
                                <Label>Valor Hora (R$)</Label>
                                <Input type="number" onChange={e => setFormData({ ...formData, hourly_rate: Number(e.target.value) })} />
                            </div>
                        )}
                        {formData.billing_model === 'RETAINER' && (
                            <div className="space-y-2 animate-in fade-in">
                                <Label>Valor Mensal (R$)</Label>
                                <Input type="number" onChange={e => setFormData({ ...formData, retainer_amount: Number(e.target.value) })} />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Início (Opcional)</Label>
                                <Input type="date" onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Prazo (Opcional)</Label>
                                <Input type="date" onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Horas Estimadas (Total)</Label>
                            <Input type="number" onChange={e => setFormData({ ...formData, estimated_hours: Number(e.target.value) })} />
                        </div>
                    </div>
                    <SheetFooter>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Criar Projeto
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
