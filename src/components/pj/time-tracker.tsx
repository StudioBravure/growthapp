
"use client";

import { useState } from "react";
import { useTimeEntries } from "@/hooks/use-pj-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Play, Square, Plus, Trash2, Download } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function TimeTracker({ projectId }: { projectId: string }) {
    const { entries, loading, startTimer, stopTimer, manualEntry } = useTimeEntries(projectId);
    const [isManualOpen, setIsManualOpen] = useState(false);

    // Manual Form
    const [manualData, setManualData] = useState<any>({ date: format(new Date(), 'yyyy-MM-dd'), minutes: 60, description: '' });

    // Active entry?
    const activeEntry = entries.find(e => !e.ended_at);

    // Group entries by date? Or just list
    // List for simplicity as requested "table of entries"

    const handleManualSubmit = async () => {
        await manualEntry({ ...manualData, project_id: projectId });
        setIsManualOpen(false);
    };

    const formatDuration = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Registro de Horas</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <a href={`/api/pj/time/export/csv?project_id=${projectId}&from=2024-01-01&to=2030-12-31`} target="_blank">
                            <Download className="mr-2 h-4 w-4" /> Exportar CSV
                        </a>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsManualOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Lançar Horas
                    </Button>
                </div>
            </div>

            {/* Timer Card */}
            <Card className="bg-muted/30">
                <CardContent className="flex items-center justify-between p-6">
                    <div>
                        <h3 className="font-semibold text-lg">Cronômetro do Dia</h3>
                        <p className="text-sm text-muted-foreground">Registre o tempo trabalhado em tempo real.</p>
                    </div>

                    {activeEntry ? (
                        <div className="flex items-center gap-4 animate-in fade-in">
                            <div className="text-red-500 font-mono font-bold animate-pulse">
                                Gravando... {format(new Date(activeEntry.started_at), 'HH:mm')}
                            </div>
                            <Button variant="destructive" onClick={() => stopTimer(activeEntry.id)}>
                                <Square className="mr-2 h-4 w-4" /> Parar
                            </Button>
                        </div>
                    ) : (
                        <Button variant="default" onClick={() => startTimer()}>
                            <Play className="mr-2 h-4 w-4" /> Iniciar
                        </Button>
                    )}
                </CardContent>
            </Card>

            <div className="border rounded-md bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Início / Fim</TableHead>
                            <TableHead>Duração</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Faturável</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-4">Carregando...</TableCell></TableRow>
                        ) : entries.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">Nenhum registro encontrado.</TableCell></TableRow>
                        ) : (
                            entries.map(e => (
                                <TableRow key={e.id}>
                                    <TableCell>{format(new Date(e.date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                        {e.started_at ? format(new Date(e.started_at), 'HH:mm') : '-'}
                                        {' - '}
                                        {e.ended_at ? format(new Date(e.ended_at), 'HH:mm') : (e.source === 'MANUAL' ? '-' : 'Em andamento')}
                                    </TableCell>
                                    <TableCell className="font-mono font-medium">{formatDuration(e.duration_minutes)}</TableCell>
                                    <TableCell>{e.description || '-'}</TableCell>
                                    <TableCell>{e.is_billable ? 'Sim' : 'Não'}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Lançamento Manual</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Data</Label>
                            <Input type="date" value={manualData.date} onChange={e => setManualData({ ...manualData, date: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Minutos Trabalhados</Label>
                            <Input type="number" value={manualData.minutes} onChange={e => setManualData({ ...manualData, minutes: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Input value={manualData.description} onChange={e => setManualData({ ...manualData, description: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleManualSubmit}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
