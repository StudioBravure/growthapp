"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/use-store";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
    Upload, FileText, CheckCircle, AlertTriangle, ArrowRight,
    Trash2, Save, Filter, RefreshCw, ChevronDown, Check, X,
    AlertCircle, Search
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// Types matching API
import { ImportBatch, ImportRow, ImportFile, Category } from "@/lib/types";

export default function ScannerExtratosPage() {
    const { mode, categories, loadData } = useAppStore();
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Review, 3: Done

    // Upload State
    const [file, setFile] = useState<File | null>(null);
    const [ledgerType, setLedgerType] = useState<'PF' | 'PJ'>('PF');
    const [isUploading, setIsUploading] = useState(false);

    // Process State
    const [importFile, setImportFile] = useState<ImportFile | null>(null);
    const [batch, setBatch] = useState<ImportBatch | null>(null);
    const [rows, setRows] = useState<ImportRow[]>([]);
    const [isLoadingRows, setIsLoadingRows] = useState(false);

    // Rule Dialog State
    const [ruleRow, setRuleRow] = useState<ImportRow | null>(null);
    const [ruleTerm, setRuleTerm] = useState('');
    const [ruleCategory, setRuleCategory] = useState('');

    // Filter Review
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEW' | 'DUPLICATE'>('ALL');

    useEffect(() => {
        if (mode === 'PF') setLedgerType('PF');
        if (mode === 'PJ') setLedgerType('PJ');
    }, [mode]);

    // Handlers
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const openRuleDialog = (row: ImportRow) => {
        setRuleRow(row);
        setRuleTerm(row.description_raw || '');
        setRuleCategory(row.final_category_id || row.suggested_category_id || '');
    };

    const handleSaveRule = async () => {
        if (!ruleRow || !batch || !ruleCategory || !ruleTerm) return;
        try {
            const res = await fetch(`/api/imports/${batch.id}/apply-rule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ledger_type: batch.ledger_type,
                    match_type: 'CONTAINS',
                    pattern: ruleTerm,
                    category_id: ruleCategory,
                    priority: 5
                })
            });
            if (!res.ok) throw new Error("Erro ao salvar regra");

            toast.success("Regra salva e aplicada!");
            setRuleRow(null);
            // Reload rows to see updates
            loadBatch(batch.id);

        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleUploadAndParse = async () => {
        if (!file) return;
        setIsUploading(true);
        try {
            // 1. Upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('ledger_type', ledgerType);

            const uploadRes = await fetch('/api/imports/upload', {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.error);

            setImportFile(uploadData.file);

            // 2. Parse
            const sourceType = file.type === 'application/pdf' ? 'PDF' : 'CSV';
            const parseRes = await fetch('/api/imports/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file_id: uploadData.file.id,
                    source_type: sourceType
                })
            });
            const parseData = await parseRes.json();
            if (!parseRes.ok) {
                if (parseData.debug) {
                    console.error("Parse Debug Info:", parseData.debug);
                    throw new Error(`${parseData.error} (Tipo: ${parseData.debug.sourceType}, Sample: ${parseData.debug.sample}...)`);
                }
                throw new Error(parseData.error);
            }

            // Load Batch
            await loadBatch(parseData.batch_id);
            setStep(2);
            toast.success("Arquivo processado com sucesso!");

        } catch (e: any) {
            toast.error(e.message, { duration: 6000 });
        } finally {
            setIsUploading(false);
        }
    };

    const loadBatch = async (batchId: string) => {
        setIsLoadingRows(true);
        try {
            const res = await fetch(`/api/imports/${batchId}`);
            const data = await res.json();
            if (res.ok) {
                setBatch(data.batch);
                setRows(data.rows);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingRows(false);
        }
    };

    const handleCategoryChange = async (rowId: string, catId: string) => {
        // Optimization: Optimistic UI update
        const oldRows = [...rows];
        setRows(prev => prev.map(r => r.id === rowId ? { ...r, final_category_id: catId, status: 'READY' } : r));

        try {
            await fetch(`/api/imports/${batch?.id}/rows`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rowId, updates: { final_category_id: catId, status: 'READY' } })
            });
        } catch (e) {
            setRows(oldRows); // Revert
            toast.error("Erro ao salvar categoria");
        }
    };

    const handleCommit = async () => {
        if (!batch) return;
        try {
            const res = await fetch(`/api/imports/${batch.id}/commit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}) // Commit all READY/NEW
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success(`${data.count} transações importadas!`);
            setStep(3);

            // Refresh Global Store
            loadData();

        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleRollback = async () => {
        if (!batch) return;
        if (!confirm("Tem certeza que deseja desfazer esta importação? Isso apagará as transações criadas.")) return;
        try {
            const res = await fetch(`/api/imports/${batch.id}/rollback`, { method: 'POST' });
            if (!res.ok) throw new Error("Erro no rollback");
            toast.success("Importação desfeita.");
            setStep(1);
            setFile(null);
            setBatch(null);
            setRows([]);
        } catch (e) {
            toast.error("Erro ao desfazer.");
        }
    };

    // Filter Logic
    const filteredRows = rows.filter(r => {
        if (statusFilter === 'NEW') return r.status === 'NEW' || r.status === 'READY';
        if (statusFilter === 'DUPLICATE') return r.status.includes('DUPLICATE');
        return true;
    });

    const relevantCategories = categories.filter(c => c.mode === ledgerType);

    if (step === 3) {
        return (
            <div className="flex flex-col items-center justify-center h-[600px] text-center space-y-6 animate-in fade-in">
                <div className="h-20 w-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold">Importação Concluída!</h2>
                <p className="text-muted-foreground max-w-md">
                    Suas transações foram adicionadas ao Financeiro {ledgerType}.
                    O sistema já verificou orçamentos e atualizou seus relatórios.
                </p>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => { setStep(1); setFile(null); setBatch(null); }}>Importar Outro</Button>
                    <Button onClick={() => window.location.href = '/financeiro'}>Ir para Financeiro</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Scanner de Extratos</h1>
                    <p className="text-muted-foreground">Importe CSV ou PDF, revise e integre ao seu fluxo.</p>
                </div>
                {batch && step === 2 && (
                    <Button variant="ghost" onClick={handleRollback} className="text-destructive hover:text-destructive">
                        Cancelar Importação
                    </Button>
                )}
            </div>

            {/* Stepper */}
            {/* <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                <span className={cn(step >= 1 && "text-primary")}>1. Upload</span>
                <ArrowRight className="h-4 w-4" />
                <span className={cn(step >= 2 && "text-primary")}>2. Revisão</span>
                <ArrowRight className="h-4 w-4" />
                <span className={cn(step >= 3 && "text-primary")}>3. Conclusão</span>
            </div> */}

            {step === 1 && (
                <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-20 space-y-6">
                        <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center">
                            <Upload className="h-10 w-10 text-primary" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-semibold">Arraste seu extrato ou clique para selecionar</h3>
                            <p className="text-sm text-muted-foreground">Suporta arquivos .CSV e .PDF (Nubank, Inter, Itaú, etc)</p>
                        </div>

                        <div className="w-full max-w-xs space-y-4">
                            {mode === 'CONSOLIDATED' && (
                                <Tabs value={ledgerType} onValueChange={(v) => setLedgerType(v as any)} className="w-full">
                                    <TabsList className="w-full grid grid-cols-2">
                                        <TabsTrigger value="PF">Pessoa Física</TabsTrigger>
                                        <TabsTrigger value="PJ">Pessoa Jurídica</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            )}

                            <div className="flex gap-2">
                                <Input
                                    type="file"
                                    accept=".csv,.pdf"
                                    onChange={handleFileChange}
                                    className="cursor-pointer"
                                />
                            </div>

                            <Button
                                className="w-full"
                                onClick={handleUploadAndParse}
                                disabled={!file || isUploading}
                            >
                                {isUploading ? (
                                    <>Processing <RefreshCw className="ml-2 h-4 w-4 animate-spin" /></>
                                ) : (
                                    "Enviar e Analisar"
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 2 && batch && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Entradas</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-emerald-600">R$ {(batch.totals_json?.incoming || 0) / 100}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Saídas</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-red-600">R$ {(batch.totals_json?.outgoing || 0) / 100}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Transações</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">{batch.totals_json?.count}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Novas vs Duplicadas</CardTitle></CardHeader>
                            <CardContent>
                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between"><span>Novas:</span> <span className="font-bold">{rows.filter(r => r.status === 'NEW' || r.status === 'READY').length}</span></div>
                                    <div className="flex justify-between text-amber-600"><span>Suspeitas:</span> <span className="font-bold">{rows.filter(r => r.status.includes('DUPLICATE')).length}</span></div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Toolbar */}
                    <div className="flex items-center justify-between gap-4 bg-card p-4 rounded-lg border shadow-sm">
                        <div className="flex items-center gap-2">
                            <Button variant={statusFilter === 'ALL' ? 'secondary' : 'ghost'} size="sm" onClick={() => setStatusFilter('ALL')}>Todos</Button>
                            <Button variant={statusFilter === 'NEW' ? 'secondary' : 'ghost'} size="sm" onClick={() => setStatusFilter('NEW')}>Novos ({rows.filter(r => r.status === 'NEW').length})</Button>
                            <Button variant={statusFilter === 'DUPLICATE' ? 'secondary' : 'ghost'} size="sm" onClick={() => setStatusFilter('DUPLICATE')} className="text-amber-600">
                                Duplicados ({rows.filter(r => r.status.includes('DUPLICATE')).length})
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={handleCommit}>
                                Confirmar Importação
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Descrição (Normalizada)</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead>Status</TableHead>
                                    {/* <TableHead>Ações</TableHead> */}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRows.map((row) => (
                                    <TableRow key={row.id} className={cn(row.status.includes('DUPLICATE') && "bg-amber-50/50 dark:bg-amber-950/20")}>
                                        <TableCell className="font-mono text-xs">
                                            {row.date ? format(new Date(row.date), 'dd/MM/yyyy') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{row.description_norm}</span>
                                                <span className="text-[10px] text-muted-foreground">{row.description_raw}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className={cn("font-medium", row.direction === 'IN' ? "text-emerald-600" : "text-red-600")}>
                                            {row.direction === 'IN' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.amount / 100)}
                                        </TableCell>
                                        <TableCell className="w-[240px]">
                                            <div className="flex items-center gap-1">
                                                <Select
                                                    value={row.final_category_id || row.suggested_category_id || "uncategorized"}
                                                    onValueChange={(val) => handleCategoryChange(row.id, val)}
                                                >
                                                    <SelectTrigger className="h-8 text-xs w-full">
                                                        <SelectValue placeholder="Selecione..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="uncategorized">Sem Categoria</SelectItem>
                                                        {relevantCategories.map(c => (
                                                            <SelectItem key={c.id} value={c.id}>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color || '#ccc' }} />
                                                                    {c.name}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openRuleDialog(row)}>
                                                    <Save className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(
                                                "text-[10px]",
                                                row.status === 'NEW' && "bg-blue-50 text-blue-700 border-blue-200",
                                                row.status === 'READY' && "bg-green-50 text-green-700 border-green-200",
                                                row.status.includes('DUPLICATE') && "bg-amber-50 text-amber-700 border-amber-200",
                                                row.status === 'IMPORTED' && "bg-gray-100 text-gray-700"
                                            )}>
                                                {row.status === 'DUPLICATE_SUSPECT' ? 'Duplicado?' : row.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>

                    {/* Rule Dialog */}
                    <Dialog open={!!ruleRow} onOpenChange={(open) => !open && setRuleRow(null)}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Criar Regra de Categorização</DialogTitle>
                                <DialogDescription>
                                    Transações futuras contendo este termo serão categorizadas automaticamente.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Termo (Contém)</Label>
                                    <Input value={ruleTerm} onChange={e => setRuleTerm(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Categoria</Label>
                                    <Select value={ruleCategory} onValueChange={setRuleCategory}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {relevantCategories.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setRuleRow(null)}>Cancelar</Button>
                                <Button onClick={handleSaveRule}>Salvar Regra</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </div>
    );
}
