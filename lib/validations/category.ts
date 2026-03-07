import { z } from "zod";

export const CATEGORY_COLORS = [
  "#F97316", // orange
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#EF4444", // red
  "#6366F1", // indigo
  "#EC4899", // pink
  "#F59E0B", // amber
  "#10B981", // emerald
  "#6B7280", // gray
  "#9CA3AF", // light gray
  "#14B8A6", // teal
  "#84CC16", // lime
];

export const CATEGORY_ICONS = [
  "utensils",
  "home",
  "car",
  "heart-pulse",
  "graduation-cap",
  "baby",
  "shopping-bag",
  "repeat",
  "gamepad-2",
  "wrench",
  "trending-up",
  "circle-dot",
  "coffee",
  "music",
  "plane",
  "gift",
  "briefcase",
  "book",
  "camera",
  "star",
  "zap",
  "shield",
  "smartphone",
  "tv",
  "scissors",
  "tag",
  "umbrella",
  "wallet",
  "dog",
  "flower-2",
] as const;

export const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50, "Máximo 50 caracteres"),
  icon: z.string().min(1, "Ícone é obrigatório"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
  parentId: z.string().nullable(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
