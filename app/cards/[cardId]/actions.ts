"use server";

import { prisma } from "@/lib/db";
import {
  getCardMonthlyEvolution,
  getCardMonthlySummary,
  getCardCategoryBreakdown,
  getCardImports,
  getCardTransactions,
  getCardAvailableMonths,
} from "@/lib/analytics/card-detail";

const DEFAULT_USER_EMAIL = "ramon@finsa.local";

async function getUserId() {
  const user = await prisma.user.findFirst({
    where: { email: DEFAULT_USER_EMAIL },
  });
  if (!user) throw new Error("User not found");
  return user.id;
}

export async function fetchCardDetail(cardId: string) {
  const userId = await getUserId();

  const card = await prisma.card.findFirst({
    where: { id: cardId, userId, deletedAt: null },
    select: {
      id: true,
      name: true,
      issuer: true,
      lastFourDigits: true,
      holderName: true,
      isActive: true,
    },
  });

  if (!card) return null;
  return card;
}

export async function fetchCardEvolution(cardId: string) {
  const userId = await getUserId();
  return getCardMonthlyEvolution(userId, cardId);
}

export async function fetchCardMonthlySummary(cardId: string, monthRef: string) {
  const userId = await getUserId();
  return getCardMonthlySummary(userId, cardId, monthRef);
}

export async function fetchCardCategories(cardId: string, monthRef: string) {
  const userId = await getUserId();
  return getCardCategoryBreakdown(userId, cardId, monthRef);
}

export async function fetchCardImports(cardId: string) {
  const userId = await getUserId();
  return getCardImports(userId, cardId);
}

export async function fetchCardTransactions(
  cardId: string,
  filters: {
    monthRef?: string;
    categoryId?: string;
    minAmount?: number;
    maxAmount?: number;
    isRecurring?: boolean;
    page?: number;
  }
) {
  const userId = await getUserId();
  return getCardTransactions(userId, cardId, filters);
}

export async function fetchCardAvailableMonths(cardId: string) {
  const userId = await getUserId();
  return getCardAvailableMonths(userId, cardId);
}

export async function fetchAllCategories() {
  const userId = await getUserId();
  return prisma.category.findMany({
    where: { OR: [{ userId }, { isSystem: true }] },
    select: { id: true, name: true, parentId: true, icon: true, color: true },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
  });
}
