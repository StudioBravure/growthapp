
"use client";

import { useState } from "react";
import { useCustomers } from "@/hooks/use-pj-data";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Search, Plus, Edit, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PjClientesPage() {
    const { customers, loading, createCustomer, updateCustomer } = useCustomers();
    const [search, setSearch] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingCust, setEditingCust] = useState<any>(null);

    // Form
    const [formData, setFormData] = useState<any>({});
    const [saving, setSaving] = useState(false);

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.company_name.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpen = (cust?: any) => {
        setEditingCust(cust);
        setFormData(cust || { name: '', company_name: '', whatsapp: '', cnpj: '', email: '', status: 'ACTIVE' });
        setIsSheetOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editingCust) {
                await updateCustomer(editingCust.id, formData);
            } else {
                await createCustomer(formData);
            }
            setIsSheetOpen(false);
        } catch (e: any) {
            toast.error(e.message || "Erro ao salvar cliente");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
                    <p className="text-muted-foreground">Gerencie sua carteira de clientes PJ.</p>
                </div>
                <Button onClick={() => handleOpen()}><Plus className="mr-2 h-4 w-4" /> Novo Cliente</Button>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nome ou empresa..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="h-9"
                />
            </div>

            <div className="border rounded-md bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Empresa</TableHead>
                            <TableHead>Contato</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>WhatsApp</TableHead>
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
                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Nenhum cliente encontrado.</TableCell>
                            </TableRow>
                        ) : (
                            filtered.map(cust => (
                                <TableRow key={cust.id}>
                                    <TableCell className="font-medium">
                                        {cust.company_name}
                                        <div className="text-[10px] text-muted-foreground">{cust.cnpj}</div>
                                    </TableCell>
                                    <TableCell>{cust.name}</TableCell>
                                    <TableCell>{cust.email}</TableCell>
                                    <TableCell>{cust.whatsapp}</TableCell>
                                    <TableCell>
                                        <Badge variant={cust.status === 'ACTIVE' ? 'default' : 'secondary'}>{cust.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpen(cust)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="p-[40px]">
                    <SheetHeader className="px-0 pt-0">
                        <SheetTitle>{editingCust ? 'Editar Cliente' : 'Novo Cliente'}</SheetTitle>
                        <SheetDescription>Preencha os dados obrigatórios.</SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome do Contato *</Label>
                            <Input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Empresa *</Label>
                            <Input value={formData.company_name || ''} onChange={e => setFormData({ ...formData, company_name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>CNPJ *</Label>
                            <Input
                                value={formData.cnpj || ''}
                                onChange={e => {
                                    let v = e.target.value.replace(/\D/g, '');
                                    if (v.length > 14) v = v.substring(0, 14);
                                    // Mask 00.000.000/0000-09
                                    v = v.replace(/^(\d{2})(\d)/, '$1.$2');
                                    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                                    v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
                                    v = v.replace(/(\d{4})(\d)/, '$1-$2');
                                    setFormData({ ...formData, cnpj: v });
                                }}
                                placeholder="00.000.000/0001-91"
                                maxLength={18}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>WhatsApp *</Label>
                            <Input
                                value={formData.whatsapp || ''}
                                onChange={e => {
                                    let v = e.target.value.replace(/\D/g, '');
                                    if (v.length > 11) v = v.substring(0, 11);
                                    // Mask (11) 99999-9999
                                    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
                                    v = v.replace(/(\d)(\d{4})$/, '$1-$2');
                                    setFormData({ ...formData, whatsapp: v });
                                }}
                                placeholder="(11) 99999-9999"
                                maxLength={15}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email *</Label>
                            <Input value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                    </div>
                    <SheetFooter>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
