import { AlertsList } from "@/components/finance/alerts-list";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Central de Alertas | Financeiro 360',
    description: 'Gerencie alertas, riscos e oportunidades financeiras.',
};

export default function AlertsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Central de Alertas</h2>
                <p className="text-muted-foreground">Monitoramento de riscos e oportunidades.</p>
            </div>
            <AlertsList />
        </div>
    )
}
