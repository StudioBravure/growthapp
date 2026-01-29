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
import { Client } from "@/lib/types";
import { toast } from "sonner";

interface ClientFormProps {
    onSuccess: () => void;
    initialData?: Client;
}

export function ClientForm({ onSuccess, initialData }: ClientFormProps) {
    const { addClient, updateClient } = useAppStore();

    const form = useForm<Omit<Client, 'id'>>({
        defaultValues: initialData || {
            name: "",
            companyName: "",
            email: "",
            phone: "",
            contractType: "PROJECT",
            defaultPaymentDay: 10,
        },
    });

    function onSubmit(values: Omit<Client, 'id'>) {
        if (initialData) {
            updateClient(initialData.id, values);
            toast.success("Cliente atualizado com sucesso!");
        } else {
            addClient(values);
            toast.success("Cliente cadastrado com sucesso!");
        }
        onSuccess();
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    rules={{ required: "Nome é obrigatório" }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Contato</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: João Silva" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Razão Social / Empresa</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Alpha Corp LTDA" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>E-mail</FormLabel>
                                <FormControl>
                                    <Input placeholder="financeiro@empresa.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Telefone</FormLabel>
                                <FormControl>
                                    <Input placeholder="(11) 99999-9999" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="contractType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Contrato</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="PROJECT">Projeto</SelectItem>
                                        <SelectItem value="RETAINER">Retainer (Mensal)</SelectItem>
                                        <SelectItem value="HOURLY">Valor por Hora</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="defaultPaymentDay"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Dia de Vencimento</FormLabel>
                                <FormControl>
                                    <Input type="number" min={1} max={31} {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="submit" className="w-full">
                        {initialData ? "Salvar Alterações" : "Cadastrar Cliente"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
