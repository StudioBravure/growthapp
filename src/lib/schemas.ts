
import { z } from "zod";

export const transactionSchema = z.object({
    description: z.string().min(2, "Descrição muito curta"),
    amount: z.coerce.number().min(0.01, "Valor deve ser positivo"),
    type: z.enum(["INCOME", "EXPENSE"]),
    category: z.string().min(1, "Selecione uma categoria"),
    mode: z.enum(["PF", "PJ"]),
    date: z.date(),
    status: z.enum(["PENDING", "PAID", "SCHEDULED"]),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
