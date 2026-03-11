import { z } from "zod";

export const ISSUERS = ["nubank", "itau", "inter", "outro"] as const;
export type Issuer = (typeof ISSUERS)[number];

export const ISSUER_LABELS: Record<Issuer, string> = {
  nubank: "Nubank",
  itau: "Itaú",
  inter: "Inter",
  outro: "Outro",
};

export const ISSUER_COLORS: Record<Issuer, string> = {
  nubank: "#8B5CF6",
  itau: "#EA580C",
  inter: "#C2410C",
  outro: "#6B7280",
};

export const ISSUER_CSV_FORMAT_IDS: Record<string, string> = {
  nubank: "fmt-nubank",
  itau: "fmt-itau",
  inter: "fmt-inter",
};

export const cardSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  issuer: z.enum(ISSUERS, { required_error: "Instituição é obrigatória" }),
  lastFourDigits: z
    .string()
    .regex(/^\d{4}$/, "Informe exatamente 4 dígitos numéricos"),
  holderName: z.string().min(1, "Titular é obrigatório"),
  closingDay: z.number().int().min(1).max(31).nullable().optional(),
  dueDay: z.number().int().min(1).max(31).nullable().optional(),
});

export const customCsvFormatSchema = z.object({
  delimiter: z.string().min(1, "Separador é obrigatório"),
  dateColumn: z.string().min(1, "Coluna de data é obrigatória"),
  descriptionColumn: z.string().min(1, "Coluna de descrição é obrigatória"),
  amountColumn: z.string().min(1, "Coluna de valor é obrigatória"),
  dateFormat: z.string().min(1, "Formato de data é obrigatório"),
  encoding: z.string().min(1, "Encoding é obrigatório"),
});

export type CardFormData = z.infer<typeof cardSchema>;
export type CustomCsvFormatData = z.infer<typeof customCsvFormatSchema>;
