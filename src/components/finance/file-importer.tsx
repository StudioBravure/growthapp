"use client";

import { useState } from "react";
import { UploadCloud, FileText, Check, AlertCircle } from "lucide-react";
import { parseCSV, parseOFX, ParsedTransaction } from "@/lib/importer";
import { useAppStore } from "@/store/use-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function FileImporter() {
    const { addTransaction, mode } = useAppStore();
    const [dragActive, setDragActive] = useState(false);
    const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const processFile = async (file: File) => {
        setIsProcessing(true);
        try {
            let results: ParsedTransaction[] = [];
            if (file.name.toLowerCase().endsWith('.csv')) {
                results = await parseCSV(file);
            } else if (file.name.toLowerCase().endsWith('.ofx')) {
                const text = await file.text();
                results = await parseOFX(text);
            } else {
                alert("Formato não suportado. Use .csv ou .ofx");
                return;
            }
            setParsedData(results);
            // Select all by default
            setSelectedIndices(results.map((_, i) => i));
        } catch (err) {
            console.error(err);
            alert("Erro ao ler arquivo.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const handleImportConfirm = () => {
        const toImport = parsedData.filter((_, i) => selectedIndices.includes(i));
        const currentTransactions = useAppStore.getState().transactions;
        let importedCount = 0;
        let conciliatedCount = 0;

        toImport.forEach(t => {
            // Reconcilliation Heuristic:
            // Find a pending transaction with same amount (or very close), same type, roughly same date (+- 5 days)
            const tDate = new Date(t.date);
            const match = currentTransactions.find(existing => {
                if (existing.status !== 'PENDING') return false;
                if (existing.type !== t.type) return false;

                const existingDate = new Date(existing.date);
                const diffTime = Math.abs(tDate.getTime() - existingDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > 5) return false; // > 5 days difference

                // Exact amount or very close (bank vs system rounding)
                if (Math.abs(existing.amount - t.amount) > 5) return false; // > 5 cents diff

                return true;
            });

            if (match) {
                // UPDATE existing
                useAppStore.getState().updateTransaction(match.id, {
                    status: 'PAID',
                    date: t.date, // Update to actual bank date
                    description: `${match.description} (Conciliado)`, // Optional: append info
                });
                conciliatedCount++;
            } else {
                // CREATE new
                addTransaction({
                    description: t.description,
                    amount: t.amount,
                    type: t.type,
                    date: t.date,
                    mode: mode === 'CONSOLIDATED' ? 'PF' : mode,
                    status: 'PAID',
                    category: 'Outros'
                });
                importedCount++;
            }
        });

        setParsedData([]);
        setSelectedIndices([]);
        toast.success(`Importação Concluída: ${importedCount} novos, ${conciliatedCount} conciliados.`);
    };

    const toggleSelection = (index: number) => {
        if (selectedIndices.includes(index)) {
            setSelectedIndices(selectedIndices.filter(i => i !== index));
        } else {
            setSelectedIndices([...selectedIndices, index]);
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);

    if (parsedData.length > 0) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Revisar Importação</h3>
                        <p className="text-sm text-muted-foreground">{selectedIndices.length} selecionados de {parsedData.length} encontrados</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setParsedData([])}>Cancelar</Button>
                        <Button onClick={handleImportConfirm}>Confirmar Importação</Button>
                    </div>
                </div>

                <div className="rounded-md border max-h-[400px] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={selectedIndices.length === parsedData.length}
                                        onCheckedChange={(checked) => {
                                            if (checked) setSelectedIndices(parsedData.map((_, i) => i));
                                            else setSelectedIndices([]);
                                        }}
                                    />
                                </TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Tipo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {parsedData.map((t, i) => (
                                <TableRow key={i} className={selectedIndices.includes(i) ? "bg-muted/50" : ""}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIndices.includes(i)}
                                            onCheckedChange={() => toggleSelection(i)}
                                        />
                                    </TableCell>
                                    <TableCell>{format(new Date(t.date), "dd/MM/yyyy")}</TableCell>
                                    <TableCell>{t.description}</TableCell>
                                    <TableCell className="font-mono">{formatCurrency(t.amount)}</TableCell>
                                    <TableCell>
                                        <Badge variant={t.type === 'INCOME' ? 'default' : 'secondary'}>
                                            {t.type === 'INCOME' ? 'Entrada' : 'Saída'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        )
    }

    return (
        <Card className={dragActive ? "border-primary border-dashed bg-primary/5" : "border-dashed"}>
            <CardContent
                className="flex flex-col items-center justify-center p-10 space-y-4"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <UploadCloud className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium">Arraste seu arquivo OFX ou CSV aqui</p>
                    <p className="text-xs text-muted-foreground mt-1">ou clique para selecionar</p>
                </div>
                <Input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    accept=".csv,.ofx"
                    onChange={handleChange}
                />
                <Button variant="outline" asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">Selecionar Arquivo</label>
                </Button>
            </CardContent>
        </Card>
    );
}
