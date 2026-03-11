"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { normalizeTitle } from "@/lib/categorization/normalizer";

const DEFAULT_USER_EMAIL = "ramon@finsa.local";

async function getUserId() {
  const user = await prisma.user.findFirst({
    where: { email: DEFAULT_USER_EMAIL },
  });
  if (!user) throw new Error("User not found");
  return user.id;
}

export async function getReviewQueueTransactions(filters?: {
  importId?: string;
  hasSuggestion?: boolean;
  sortBy?: "date" | "amount" | "description";
  sortDir?: "asc" | "desc";
}) {
  const userId = await getUserId();

  const orderBy: Record<string, "asc" | "desc"> = {};
  const sortBy = filters?.sortBy ?? "date";
  const sortDir = filters?.sortDir ?? "desc";
  orderBy[sortBy] = sortDir;

  const where: Record<string, unknown> = {
    userId,
    OR: [
      { categoryId: null },
      {
        categorizationMethod: "ai",
        // AI with low confidence — we don't store confidence on Transaction,
        // so we include all AI-categorized for review
      },
    ],
  };

  if (filters?.importId) {
    where.importId = filters.importId;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      category: { select: { id: true, name: true, parentId: true } },
      card: { select: { name: true, color: true } },
      import_: { select: { id: true, fileName: true } },
    },
    orderBy,
  });

  return transactions.map((t) => ({
    id: t.id,
    date: t.date.toISOString(),
    description: t.description,
    originalTitle: t.originalTitle ?? t.description,
    amount: Number(t.amount),
    categoryId: t.categoryId,
    categoryName: t.category?.name ?? null,
    categorizationMethod: t.categorizationMethod,
    cardName: t.card?.name ?? null,
    cardColor: t.card?.color ?? null,
    isRecurring: t.isRecurring,
    sourceType: t.sourceType,
    installmentCurrent: t.installmentCurrent,
    installmentTotal: t.installmentTotal,
    importId: t.importId,
    importFileName: t.import_?.fileName ?? null,
  }));
}

export async function getCategories() {
  const userId = await getUserId();

  const categories = await prisma.category.findMany({
    where: {
      OR: [{ isSystem: true }, { userId }],
    },
    select: {
      id: true,
      name: true,
      parentId: true,
      icon: true,
      color: true,
      sortOrder: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return categories;
}

export async function getImportsForFilter() {
  const userId = await getUserId();

  return prisma.import.findMany({
    where: { userId },
    select: { id: true, fileName: true, importedAt: true },
    orderBy: { importedAt: "desc" },
  });
}

export async function categorizeTransactions(
  transactionIds: string[],
  categoryId: string,
  options?: {
    source?: "manual" | "ai";
    confidence?: number;
  }
) {
  if (transactionIds.length === 0) return { success: false, error: "Nenhuma transação selecionada" };

  const userId = await getUserId();

  // Verify transactions belong to user
  const transactions = await prisma.transaction.findMany({
    where: { id: { in: transactionIds }, userId },
    select: { id: true, originalTitle: true, description: true },
  });

  if (transactions.length !== transactionIds.length) {
    return { success: false, error: "Transações não encontradas" };
  }

  // Verify category exists
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    return { success: false, error: "Categoria não encontrada" };
  }

  await prisma.$transaction(async (tx) => {
    // Update all transactions
    await tx.transaction.updateMany({
      where: { id: { in: transactionIds } },
      data: {
        categoryId,
        categorizationMethod: "manual",
      },
    });

    // Create or update categorization rules for each unique pattern
    const patterns = new Set<string>();
    for (const t of transactions) {
      const pattern = normalizeTitle(t.originalTitle ?? t.description);
      if (pattern && !patterns.has(pattern)) {
        patterns.add(pattern);

        const existingRule = await tx.categorizationRule.findFirst({
          where: {
            userId,
            matchPattern: pattern,
            matchType: "exact",
          },
        });

        const ruleSource = options?.source ?? "manual";
        const ruleConfidence = options?.confidence ?? 1.0;

        if (existingRule) {
          await tx.categorizationRule.update({
            where: { id: existingRule.id },
            data: {
              categoryId,
              source: ruleSource,
              confidence: ruleConfidence,
              usageCount: { increment: 1 },
              lastUsedAt: new Date(),
            },
          });
        } else {
          await tx.categorizationRule.create({
            data: {
              userId,
              matchPattern: pattern,
              matchType: "exact",
              categoryId,
              source: ruleSource,
              confidence: ruleConfidence,
              usageCount: 1,
              lastUsedAt: new Date(),
            },
          });
        }
      }
    }
  });

  revalidatePath("/transactions");
  revalidatePath("/transactions/review");
  revalidatePath("/");

  return { success: true, count: transactions.length };
}
