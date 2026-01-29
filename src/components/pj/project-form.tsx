"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store/use-store";
import { Project, PipelineStage } from "@/lib/types";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectFinancials } from "./project-financials";

interface ProjectFormProps {
    onSuccess: () => void;
    initialData?: Project;
}

const STAGES: { value: PipelineStage; label: string }[] = [
    { value: 'LEAD', label: 'Briefing / Lead' },
    { value: 'PROPOSAL', label: 'Proposta' },
    { value: 'NEGOTIATION', label: 'Negociação' },
    { value: 'CLOSED', label: 'Contrato Fechado' },
    { value: 'EXECUTION', label: 'Em Execução (Design/Dev)' },
    { value: 'DELIVERY', label: 'Revisão / Entrega' },
    { value: 'POST_SALE', label: 'Pós-Venda / Manutenção' },
];

export function ProjectForm({ onSuccess, initialData }: ProjectFormProps) {
    const { clients, addProject, updateProject } = useAppStore();

    const form = useForm<Omit<Project, 'id'>>({
        defaultValues: initialData || {
            name: "",
            clientId: "",
            stage: "LEAD",
            status: "ACTIVE",
            totalValue: 0,
            deadline: "",
            hoursUsed: 0,
        },
    });

    function onSubmit(values: Omit<Project, 'id'>) {
        if (initialData) {
            updateProject(initialData.id, values);
            toast.success("Projeto atualizado com sucesso!");
            onSuccess();
        } else {
            addProject(values);
            toast.success("Projeto criado com sucesso!");
            onSuccess();
        }
    }

    const content = (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    rules={{ required: "Nome do projeto é obrigatório" }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Projeto</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Rebranding Alpha" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="clientId"
                    rules={{ required: "Selecione um cliente" }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cliente</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o cliente" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {clients.map(client => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.companyName || client.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="stage"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Etapa Atual</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a etapa" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {STAGES.map(s => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="deadline"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Prazo de Entrega</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="totalValue"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valor Total (R$)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        onChange={e => field.onChange(parseFloat(e.target.value) * 100)}
                                        value={field.value / 100}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status Operacional</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Ativo</SelectItem>
                                        <SelectItem value="DONE">Concluído</SelectItem>
                                        <SelectItem value="PAUSED">Pausado</SelectItem>
                                        <SelectItem value="CANCELED">Cancelado</SelectItem>
                                        <SelectItem value="ARCHIVED">Arquivado</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="submit" className="w-full">
                        {initialData ? "Salvar Alterações" : "Criar Projeto"}
                    </Button>
                </div>
            </form>
        </Form>
    );

    if (!initialData) return content;

    return (
        <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="financial">Financeiro</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-4">
                {content}
            </TabsContent>
            <TabsContent value="financial" className="mt-4">
                <ProjectFinancials project={initialData} />
            </TabsContent>
        </Tabs>
    );
}
