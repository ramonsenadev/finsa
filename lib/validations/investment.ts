import { z } from "zod";

export const INVESTMENT_CATEGORIES = [
  "renda_fixa",
  "renda_variavel",
  "previdencia",
  "outro",
] as const;

export const INVESTMENT_CATEGORY_LABELS: Record<
  (typeof INVESTMENT_CATEGORIES)[number],
  string
> = {
  renda_fixa: "Renda Fixa",
  renda_variavel: "Renda Variável",
  previdencia: "Previdência",
  outro: "Outro",
};

export const investmentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Máximo 100 caracteres"),
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  category: z.enum(INVESTMENT_CATEGORIES, { message: "Categoria inválida" }),
  effectiveFrom: z.coerce.date({ message: "Data inválida" }),
});

export type InvestmentFormData = z.infer<typeof investmentSchema>;
