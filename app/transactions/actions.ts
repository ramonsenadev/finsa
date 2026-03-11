"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  normalizeTitle,
  extractMerchant,
} from "@/lib/categorization/normalizer";
import {
  manualTransactionSchema,
  type ManualTransactionFormData,
} from "@/lib/validations/manual-transaction";
import {
  getTransactions,
  getTransactionsForExport,
  type TransactionFilters,
  type TransactionsResult,
  type TransactionExportRow,
} from "@/lib/analytics/transactions";

const DEFAULT_USER_EMAIL = "ramon@finsa.local";

async function getUserId() {
  const user = await prisma.user.findFirst({
    where: { email: DEFAULT_USER_EMAIL },
  });
  if (!user) throw new Error("User not found");
  return user.id;
}

// ─── Manual transaction CRUD ────────────────────────────────────────

export async function createManualTransaction(data: ManualTransactionFormData) {
  const parsed = manualTransactionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const userId = await getUserId();
  const { date, description, amount, categoryId, paymentMethod, isRecurring, dayOfMonth } = parsed.data;

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      sourceType: "manual",
      date,
      description,
      amount,
      categoryId,
      paymentMethod,
      isRecurring,
      categorizationMethod: "manual",
    },
  });

  if (isRecurring) {
    await prisma.recurringExpense.create({
      data: {
        userId,
        name: description,
        categoryId,
        expectedAmount: amount,
        dayOfMonth: dayOfMonth ?? date.getDate(),
        sourceType: paymentMethod,
        detectionMethod: "manual",
      },
    });
  }

  revalidatePaths();
  return { success: true, id: transaction.id };
}

export async function updateManualTransaction(id: string, data: ManualTransactionFormData) {
  const parsed = manualTransactionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const userId = await getUserId();
  const { date, description, amount, categoryId, paymentMethod, isRecurring, dayOfMonth } = parsed.data;

  const existing = await prisma.transaction.findFirst({
    where: { id, userId, sourceType: "manual" },
  });
  if (!existing) {
    return { error: "Transação não encontrada" };
  }

  await prisma.transaction.update({
    where: { id },
    data: {
      date,
      description,
      amount,
      categoryId,
      paymentMethod,
      isRecurring,
    },
  });

  // Update or create/delete recurring expense
  if (isRecurring) {
    const existingRecurring = await prisma.recurringExpense.findFirst({
      where: { userId, name: existing.description, detectionMethod: "manual" },
    });
    if (existingRecurring) {
      await prisma.recurringExpense.update({
        where: { id: existingRecurring.id },
        data: {
          name: description,
          categoryId,
          expectedAmount: amount,
          dayOfMonth: dayOfMonth ?? date.getDate(),
          sourceType: paymentMethod,
        },
      });
    } else {
      await prisma.recurringExpense.create({
        data: {
          userId,
          name: description,
          categoryId,
          expectedAmount: amount,
          dayOfMonth: dayOfMonth ?? date.getDate(),
          sourceType: paymentMethod,
          detectionMethod: "manual",
        },
      });
    }
  }

  revalidatePaths();
  return { success: true };
}

export async function deleteManualTransaction(id: string) {
  const userId = await getUserId();

  const existing = await prisma.transaction.findFirst({
    where: { id, userId, sourceType: "manual" },
  });
  if (!existing) {
    return { error: "Transação não encontrada" };
  }

  await prisma.transaction.delete({ where: { id } });

  // Also deactivate matching recurring expense if it exists
  if (existing.isRecurring) {
    await prisma.recurringExpense.updateMany({
      where: { userId, name: existing.description, detectionMethod: "manual" },
      data: { isActive: false },
    });
  }

  revalidatePaths();
  return { success: true };
}

export async function fetchManualTransaction(id: string) {
  const userId = await getUserId();
  const tx = await prisma.transaction.findFirst({
    where: { id, userId, sourceType: "manual" },
    select: {
      id: true,
      date: true,
      description: true,
      amount: true,
      categoryId: true,
      paymentMethod: true,
      isRecurring: true,
    },
  });
  if (!tx) return null;
  return {
    ...tx,
    amount: Number(tx.amount),
  };
}

// ─── Transaction listing ────────────────────────────────────────────

export async function fetchTransactions(
  filters: TransactionFilters
): Promise<TransactionsResult> {
  const userId = await getUserId();
  return getTransactions(userId, filters);
}

export async function fetchTransactionsForExport(
  filters: TransactionFilters
): Promise<TransactionExportRow[]> {
  const userId = await getUserId();
  return getTransactionsForExport(userId, filters);
}

export async function fetchCards() {
  const userId = await getUserId();
  const cards = await prisma.card.findMany({
    where: { userId, isActive: true, deletedAt: null },
    select: { id: true, name: true, color: true, lastFourDigits: true },
    orderBy: { name: "asc" },
  });
  return cards;
}

export async function fetchAllCategories() {
  const userId = await getUserId();
  const categories = await prisma.category.findMany({
    where: { OR: [{ userId }, { isSystem: true }] },
    select: { id: true, name: true, parentId: true, icon: true, color: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return categories;
}

/**
 * Count how many transactions share the same normalized merchant name.
 */
export async function countSameMerchantTransactions(transactionId: string) {
  const userId = await getUserId();

  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
    select: { originalTitle: true, description: true },
  });

  if (!transaction) return { count: 0, merchant: "" };

  const rawTitle = transaction.originalTitle ?? transaction.description;
  const merchant = extractMerchant(rawTitle);
  const normalized = normalizeTitle(merchant);

  if (!normalized) return { count: 0, merchant };

  // Find all transactions whose normalized originalTitle matches
  const allTransactions = await prisma.transaction.findMany({
    where: { userId },
    select: { id: true, originalTitle: true, description: true },
  });

  const matchingIds = allTransactions.filter((t) => {
    const title = t.originalTitle ?? t.description;
    return normalizeTitle(extractMerchant(title)) === normalized;
  });

  return { count: matchingIds.length, merchant };
}

/**
 * Recategorize a transaction, optionally propagating to all transactions
 * from the same merchant. Creates/updates categorization rules accordingly.
 */
export async function recategorizeTransaction(
  transactionId: string,
  categoryId: string,
  applyToAll: boolean
) {
  const userId = await getUserId();

  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
    select: { id: true, originalTitle: true, description: true },
  });

  if (!transaction) {
    return { success: false, error: "Transação não encontrada" };
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    return { success: false, error: "Categoria não encontrada" };
  }

  const rawTitle = transaction.originalTitle ?? transaction.description;
  const merchant = extractMerchant(rawTitle);
  const normalizedMerchant = normalizeTitle(merchant);

  if (applyToAll && normalizedMerchant) {
    // Find all transaction IDs with same normalized merchant
    const allTransactions = await prisma.transaction.findMany({
      where: { userId },
      select: { id: true, originalTitle: true, description: true },
    });

    const matchingIds = allTransactions
      .filter((t) => {
        const title = t.originalTitle ?? t.description;
        return normalizeTitle(extractMerchant(title)) === normalizedMerchant;
      })
      .map((t) => t.id);

    await prisma.$transaction(async (tx) => {
      // Update all matching transactions
      await tx.transaction.updateMany({
        where: { id: { in: matchingIds } },
        data: {
          categoryId,
          categorizationMethod: "manual",
        },
      });

      // Upsert exact-match rule for the normalized merchant
      await upsertRule(tx, userId, normalizedMerchant, categoryId, "manual", 1.0);
    });

    revalidatePaths();
    return { success: true, count: matchingIds.length, matchingIds };
  }

  // Apply to single transaction only (no rule change)
  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      categoryId,
      categorizationMethod: "manual",
    },
  });

  revalidatePaths();
  return { success: true, count: 1 };
}

/**
 * Upsert a categorization rule: update if same matchPattern+matchType exists,
 * otherwise create.
 */
async function upsertRule(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: string,
  matchPattern: string,
  categoryId: string,
  source: "manual" | "ai",
  confidence: number
) {
  const existingRule = await tx.categorizationRule.findFirst({
    where: { userId, matchPattern, matchType: "exact" },
  });

  if (existingRule) {
    await tx.categorizationRule.update({
      where: { id: existingRule.id },
      data: {
        categoryId,
        source,
        confidence,
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
  } else {
    await tx.categorizationRule.create({
      data: {
        userId,
        matchPattern,
        matchType: "exact",
        categoryId,
        source,
        confidence,
        usageCount: 1,
        lastUsedAt: new Date(),
      },
    });
  }
}

function revalidatePaths() {
  revalidatePath("/transactions");
  revalidatePath("/transactions/review");
  revalidatePath("/cards", "layout");
  revalidatePath("/recurring");
  revalidatePath("/");
}
