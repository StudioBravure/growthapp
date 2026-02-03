
"use client";

import { useProjectTimer } from "@/hooks/use-project-timer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Square, Download, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function TimeTracker({ projectId }: { projectId: string }) {
    const { session, loading, currentSeconds, start, pause, resume, finish } = useProjectTimer(projectId);

    if (loading) return <div className="p-4 border rounded animate-pulse bg-muted/20 h-24"></div>;

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'RUNNING': return 'bg-green-500/10 text-green-600 border-green-200';
            case 'PAUSED': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <Card className="border-l-4 border-l-primary shadow-sm">
            <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">Cronômetro do Projeto</h3>
                            {session && (
                                <Badge variant="outline" className={cn("text-[10px] h-5", getStatusColor(session.status))}>
                                    {session.status === 'RUNNING' ? 'EM ANDAMENTO' : 'PAUSADO'}
                                </Badge>
                            )}
                        </div>
                        <div className="text-3xl font-mono font-bold tracking-tight">
                            {formatTime(currentSeconds)}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!session ? (
                        <Button onClick={start} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                            <Play className="h-4 w-4" /> Iniciar Sessão
                        </Button>
                    ) : (
                        <>
                            {session.status === 'RUNNING' ? (
                                <Button onClick={pause} variant="outline" className="border-yellow-200 hover:bg-yellow-50 text-yellow-700 gap-2">
                                    <Pause className="h-4 w-4" /> Pausar
                                </Button>
                            ) : (
                                <Button onClick={resume} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                                    <Play className="h-4 w-4" /> Retomar
                                </Button>
                            )}

                            <Button onClick={finish} variant="destructive" className="gap-2">
                                <Square className="h-4 w-4 fill-current" /> Finalizar
                            </Button>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
