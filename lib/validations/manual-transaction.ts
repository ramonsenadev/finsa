import { z } from "zod";

export const PAYMENT_METHODS = ["pix", "boleto", "debito", "dinheiro", "transferencia"] as const;

export const PAYMENT_METHOD_LABELS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  pix: "Pix",
  boleto: "Boleto",
  debito: "Débito",
  dinheiro: "Dinheiro",
  transferencia: "Transferência",
};

export const manualTransactionSchema = z.object({
  date: z.coerce.date({ message: "Data inválida" }),
  description: z.string().min(1, "Descrição é obrigatória").max(200, "Máximo 200 caracteres"),
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  paymentMethod: z.enum(PAYMENT_METHODS, { message: "Método de pagamento inválido" }),
  isRecurring: z.boolean().default(false),
  dayOfMonth: z.coerce.number().int().min(1).max(31).optional(),
});

export type ManualTransactionFormData = z.infer<typeof manualTransactionSchema>;
