
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export function useCustomers() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCustomers = useCallback(async () => {
        try {
            const res = await fetch('/api/pj/customers');
            if (!res.ok) throw new Error('Failed to fetch customers');
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error(e);
            toast.error("Erro ao carregar clientes");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

    const createCustomer = async (cust: any) => {
        const res = await fetch('/api/pj/customers', {
            method: 'POST',
            body: JSON.stringify(cust),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to create');
        }
        await fetchCustomers();
        toast.success("Cliente criado");
    };

    const updateCustomer = async (id: string, updates: any) => {
        const res = await fetch(`/api/pj/customers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error('Failed to update');
        await fetchCustomers();
        toast.success("Cliente atualizado");
    };

    return { customers: data, loading, fetchCustomers, createCustomer, updateCustomer };
}

export function useProjects(initialParams?: any) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProjects = useCallback(async () => {
        try {
            const res = await fetch('/api/pj/projects');
            if (!res.ok) throw new Error('Failed to fetch projects');
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    const createProject = async (proj: any) => {
        const res = await fetch('/api/pj/projects', {
            method: 'POST',
            body: JSON.stringify(proj),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to create');
        }
        await fetchProjects();
        toast.success("Projeto criado");
    };

    return { projects: data, loading, fetchProjects, createProject };
}

export function useTimeEntries(projectId?: string) {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEntries = useCallback(async () => {
        if (!projectId) return;
        try {
            const res = await fetch(`/api/pj/time?project_id=${projectId}`);
            if (res.ok) setEntries(await res.json());
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => { fetchEntries(); }, [fetchEntries]);

    const startTimer = async () => {
        if (!projectId) return;
        const res = await fetch('/api/pj/time/start', { method: 'POST', body: JSON.stringify({ project_id: projectId }) });
        if (res.ok) {
            await fetchEntries();
            toast.success("Timer iniciado");
        }
    };

    const stopTimer = async (entryId: string) => {
        const res = await fetch('/api/pj/time/stop', { method: 'POST', body: JSON.stringify({ time_entry_id: entryId }) });
        if (res.ok) {
            await fetchEntries();
            toast.success("Timer parado");
        }
    };

    const manualEntry = async (data: any) => {
        const res = await fetch('/api/pj/time/manual', { method: 'POST', body: JSON.stringify(data) });
        if (res.ok) await fetchEntries();
    };

    return { entries, loading, fetchEntries, startTimer, stopTimer, manualEntry };
}
