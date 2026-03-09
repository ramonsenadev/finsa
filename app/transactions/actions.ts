"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  normalizeTitle,
  extractMerchant,
} from "@/lib/categorization/normalizer";

const DEFAULT_USER_EMAIL = "ramon@finsa.local";

async function getUserId() {
  const user = await prisma.user.findFirst({
    where: { email: DEFAULT_USER_EMAIL },
  });
  if (!user) throw new Error("User not found");
  return user.id;
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
    return { success: true, count: matchingIds.length };
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
  revalidatePath("/");
}
