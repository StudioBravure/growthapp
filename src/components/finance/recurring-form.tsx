"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/store/use-store";

const recurringSchema = z.object({
    description: z.string().min(2, "Descrição obrigatória"),
    amount: z.coerce.number().min(0.01, "Valor inválido"),
    category: z.string().min(1, "Categoria obrigatória"),
    dayOfMonth: z.coerce.number().min(1).max(31),
    mode: z.enum(["PF", "PJ"]),
    type: z.enum(["INCOME", "EXPENSE"]),
    active: z.boolean().default(true),
});

type RecurringFormValues = z.infer<typeof recurringSchema>;

interface RecurringBillFormProps {
    onSuccess?: () => void;
}

export function RecurringBillForm({ onSuccess }: RecurringBillFormProps) {
    const { addRecurringBill, mode } = useAppStore();

    const form = useForm({
        resolver: zodResolver(recurringSchema),
        defaultValues: {
            description: "",
            amount: 0,
            category: "Moradia",
            dayOfMonth: 5,
            mode: mode === 'CONSOLIDATED' ? 'PF' : mode,
            type: "EXPENSE" as const,
            active: true,
        },
    });

    function onSubmit(data: RecurringFormValues) {
        addRecurringBill({
            description: data.description,
            amount: Math.round(data.amount * 100), // to cents
            category: data.category,
            dayOfMonth: data.dayOfMonth,
            mode: data.mode,
            type: data.type,
            active: data.active
        });
        form.reset();
        onSuccess?.();
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Aluguel, Internet" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valor (R$)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} value={field.value as number} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="dayOfMonth"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Dia de Vencimento</FormLabel>
                                <FormControl>
                                    <Input type="number" min="1" max="31" {...field} value={field.value as number} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="EXPENSE">Despesa</SelectItem>
                                        <SelectItem value="INCOME">Receita</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoria</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Moradia">Moradia</SelectItem>
                                        <SelectItem value="Assinaturas">Assinaturas</SelectItem>
                                        <SelectItem value="Transporte">Transporte</SelectItem>
                                        <SelectItem value="Educação">Educação</SelectItem>
                                        <SelectItem value="Saúde">Saúde</SelectItem>
                                        <SelectItem value="Outros">Outros</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="mode"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Modo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={mode !== 'CONSOLIDATED'}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="PF">Pessoa Física</SelectItem>
                                    <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Ativo</FormLabel>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full">Criar Conta Fixa</Button>
            </form>
        </Form>
    );
}
