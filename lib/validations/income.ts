import { z } from "zod";

export const INCOME_TYPES = ["salary", "freelance", "business", "other"] as const;

export const INCOME_TYPE_LABELS: Record<(typeof INCOME_TYPES)[number], string> = {
  salary: "Salário",
  freelance: "Freelance",
  business: "Negócio",
  other: "Outro",
};

export const incomeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Máximo 100 caracteres"),
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  type: z.enum(INCOME_TYPES, { message: "Tipo inválido" }),
  effectiveFrom: z.coerce.date({ message: "Data inválida" }),
});

export type IncomeFormData = z.infer<typeof incomeSchema>;
