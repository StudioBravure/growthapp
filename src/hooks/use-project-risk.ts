import { useMemo } from 'react';
import { useAppStore } from '@/store/use-store';
import { Project, Transaction } from '@/lib/types';
import { isBefore, startOfDay, parseISO, differenceInDays } from 'date-fns';
import { useClientStatus } from './use-client-status';

export type ProjectRiskStatus = 'EM_DIA' | 'RISCO' | 'ATRASADO';

export function useProjectRisk(projectId: string) {
    const { projects } = useAppStore();

    const project = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);

    const clientStats = useClientStatus(project?.clientId || '');

    const risk = useMemo(() => {
        if (!project) return { status: 'EM_DIA' as ProjectRiskStatus, daysRemaining: 0, isFinancialRisk: false };

        const today = startOfDay(new Date());
        let status: ProjectRiskStatus = 'EM_DIA';
        let daysRemaining = 0;

        if (project.status === 'DONE') return { status: 'EM_DIA' as ProjectRiskStatus, daysRemaining: 0, isFinancialRisk: false };

        if (project.deadline) {
            const deadlineDate = startOfDay(parseISO(project.deadline));
            daysRemaining = differenceInDays(deadlineDate, today);

            if (isBefore(deadlineDate, today)) {
                status = 'ATRASADO';
            } else if (daysRemaining <= 7) {
                status = 'RISCO';
            }
        }

        return {
            status,
            daysRemaining,
            isFinancialRisk: clientStats.status === 'DEVENDO'
        };
    }, [project, clientStats.status]);

    return risk;
}
