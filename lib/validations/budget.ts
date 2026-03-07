import { z } from "zod";

export const upsertBudgetSchema = z.object({
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  monthRef: z.string().regex(/^\d{4}-\d{2}$/, "Formato inválido (YYYY-MM)"),
  amount: z.coerce.number().min(0, "Valor deve ser zero ou positivo"),
});

export type UpsertBudgetData = z.infer<typeof upsertBudgetSchema>;
