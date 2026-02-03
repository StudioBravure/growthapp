
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ProjectComment } from '@/lib/types';

export function useProjectComments(projectId: string) {
    const [comments, setComments] = useState<ProjectComment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchComments = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/pj/projects/${projectId}/comments`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (projectId) fetchComments();
    }, [projectId, fetchComments]);

    const createComment = async (body: string) => {
        const res = await fetch(`/api/pj/projects/${projectId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body })
        });
        if (!res.ok) throw new Error('Erro ao criar comentário');
        await fetchComments();
        toast.success('Comentário adicionado');
    };

    const deleteComment = async (id: string) => {
        const res = await fetch(`/api/pj/comments/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Erro ao excluir');
        setComments(prev => prev.filter(c => c.id !== id));
        toast.success('Comentário excluído');
    };

    return {
        comments,
        loading,
        createComment,
        deleteComment,
        refresh: fetchComments
    };
}
