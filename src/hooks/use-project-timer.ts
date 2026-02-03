
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { TimeSession } from '@/lib/types';

export function useProjectTimer(projectId: string) {
    const [session, setSession] = useState<TimeSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentSeconds, setCurrentSeconds] = useState(0);

    const fetchSession = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/pj/projects/${projectId}/timer/current`);
            if (res.ok) {
                const data = await res.json();
                setSession(data);
                if (data) {
                    setCurrentSeconds(data.total_seconds);
                } else {
                    setCurrentSeconds(0);
                }
            }
        } catch (error) {
            console.error('Error fetching timer:', error);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (projectId) fetchSession();
    }, [projectId, fetchSession]);

    // Tick logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (session && session.status === 'RUNNING') {
            interval = setInterval(() => {
                const now = new Date();
                const lastResumed = new Date(session.last_resumed_at!);
                const delta = Math.floor((now.getTime() - lastResumed.getTime()) / 1000);
                setCurrentSeconds(session.total_seconds + delta);
            }, 1000);
        } else if (session) {
            setCurrentSeconds(session.total_seconds);
        } else {
            setCurrentSeconds(0);
        }
        return () => clearInterval(interval);
    }, [session]);

    const start = async () => {
        try {
            const res = await fetch(`/api/pj/projects/${projectId}/timer/start`, { method: 'POST' });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Erro ao iniciar');
            }
            const data = await res.json();
            setSession(data);
            toast.success('Cronômetro iniciado');
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const pause = async () => {
        if (!session) return;
        try {
            const res = await fetch(`/api/pj/timer/${session.id}/pause`, { method: 'POST' });
            if (!res.ok) throw new Error('Erro ao pausar');
            const data = await res.json();
            setSession(data);
            toast.success('Pausado');
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const resume = async () => {
        if (!session) return;
        try {
            const res = await fetch(`/api/pj/timer/${session.id}/resume`, { method: 'POST' });
            if (!res.ok) throw new Error((await res.json()).error || 'Erro ao retomar');
            const data = await res.json();
            setSession(data);
            toast.success('Retomado');
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const finish = async () => {
        if (!session) return;
        try {
            const res = await fetch(`/api/pj/timer/${session.id}/finish`, { method: 'POST' });
            if (!res.ok) throw new Error('Erro ao finalizar');
            const data = await res.json(); // returns finished session
            setSession(null); // Clear active session
            toast.success('Sessão finalizada');

            // Trigger report download automatically
            window.open(`/api/pj/timer/${data.id}/export/pdf`, '_blank');
            window.open(`/api/pj/timer/${data.id}/export/csv`, '_blank');
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return {
        session,
        loading,
        currentSeconds,
        start,
        pause,
        resume,
        finish,
        refresh: fetchSession
    };
}
