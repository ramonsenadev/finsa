"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

const DEFAULT_USER_EMAIL = "ramon@finsa.local";

async function getUserId() {
  const user = await prisma.user.findFirst({
    where: { email: DEFAULT_USER_EMAIL },
  });
  if (!user) throw new Error("User not found");
  return user.id;
}

function toNumber(val: unknown): number {
  if (typeof val === "number") return val;
  if (val && typeof val === "object" && "toNumber" in val) {
    return (val as { toNumber: () => number }).toNumber();
  }
  return Number(val);
}

// ─── Types ─────────────────────────────────────────────────────────

export interface RecurringExpenseRow {
  id: string;
  name: string;
  categoryId: string | null;
  categoryName: string | null;
  parentCategoryName: string | null;
  expectedAmount: number;
  dayOfMonth: number | null;
  sourceType: string;
  detectionMethod: string;
  isActive: boolean;
}

export interface PendingSuggestion {
  id: string;
  name: string;
  categoryId: string | null;
  categoryName: string | null;
  expectedAmount: number;
  dayOfMonth: number | null;
  sourceType: string;
}

export interface RecurringPageData {
  recurring: RecurringExpenseRow[];
  pending: PendingSuggestion[];
  totalFixedExpenses: number;
  totalIncome: number;
  currentMonth: string; // "YYYY-MM"
}

// ─── Fetch all data for the page ───────────────────────────────────

export async function fetchRecurringPageData(): Promise<RecurringPageData> {
  const userId = await getUserId();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based
  const currentMonth = `${year}-${String(month + 1).padStart(2, "0")}`;

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

  // Fetch all recurring expenses with category info
  const allRecurring = await prisma.recurringExpense.findMany({
    where: { userId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          parentId: true,
          parent: { select: { name: true } },
        },
      },
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  // Fetch transactions for current month that are recurring
  const monthTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: monthStart, lte: monthEnd },
      isRecurring: true,
    },
    select: {
      description: true,
      categoryId: true,
    },
  });

  // Build normalized lookup for matching
  const normalizedTransactions = monthTransactions.map((t) => ({
    normalizedName: t.description.toLowerCase().trim(),
    categoryId: t.categoryId,
  }));

  // Determine pending suggestions (active recurring without matching transaction)
  const activeRecurring = allRecurring.filter((r) => r.isActive);

  const pending: PendingSuggestion[] = [];
  for (const rec of activeRecurring) {
    const normalizedRecName = rec.name.toLowerCase().trim();
    const hasMatch = normalizedTransactions.some(
      (t) =>
        t.normalizedName === normalizedRecName ||
        (t.categoryId === rec.categoryId && t.categoryId !== null)
    );

    if (!hasMatch) {
      pending.push({
        id: rec.id,
        name: rec.name,
        categoryId: rec.categoryId,
        categoryName: rec.category
          ? rec.category.parent
            ? `${rec.category.parent.name} › ${rec.category.name}`
            : rec.category.name
          : null,
        expectedAmount: toNumber(rec.expectedAmount),
        dayOfMonth: rec.dayOfMonth,
        sourceType: rec.sourceType,
      });
    }
  }

  // Map all recurring to rows
  const recurring: RecurringExpenseRow[] = allRecurring.map((r) => ({
    id: r.id,
    name: r.name,
    categoryId: r.categoryId,
    categoryName: r.category?.name ?? null,
    parentCategoryName: r.category?.parent?.name ?? null,
    expectedAmount: toNumber(r.expectedAmount),
    dayOfMonth: r.dayOfMonth,
    sourceType: r.sourceType,
    detectionMethod: r.detectionMethod,
    isActive: r.isActive,
  }));

  // Total fixed expenses from active recurring
  const totalFixedExpenses = activeRecurring.reduce(
    (sum, r) => sum + toNumber(r.expectedAmount),
    0
  );

  // Get total income
  const incomes = await prisma.income.findMany({
    where: { userId, effectiveFrom: { lte: now } },
  });
  const totalIncome = incomes.reduce((sum, i) => sum + toNumber(i.amount), 0);

  return {
    recurring,
    pending,
    totalFixedExpenses,
    totalIncome,
    currentMonth,
  };
}

// ─── Confirm a single recurring suggestion ─────────────────────────

export async function confirmRecurringSuggestion(
  recurringId: string,
  amount: number
) {
  const userId = await getUserId();

  const recurring = await prisma.recurringExpense.findFirst({
    where: { id: recurringId, userId },
  });
  if (!recurring) return { error: "Recorrente não encontrado" };

  const now = new Date();
  const day = recurring.dayOfMonth ?? now.getDate();
  const txDate = new Date(now.getFullYear(), now.getMonth(), day, 12, 0, 0);

  await prisma.transaction.create({
    data: {
      userId,
      sourceType: "manual",
      date: txDate,
      description: recurring.name,
      amount,
      categoryId: recurring.categoryId,
      paymentMethod: recurring.sourceType,
      isRecurring: true,
      categorizationMethod: "manual",
    },
  });

  // Update expected amount if different
  if (amount !== toNumber(recurring.expectedAmount)) {
    await prisma.recurringExpense.update({
      where: { id: recurringId },
      data: { expectedAmount: amount },
    });
  }

  revalidateRecurringPaths();
  return { success: true };
}

// ─── Confirm all pending suggestions ───────────────────────────────

export async function confirmAllRecurringSuggestions(
  items: { id: string; amount: number }[]
) {
  const userId = await getUserId();
  const now = new Date();

  const recurringExpenses = await prisma.recurringExpense.findMany({
    where: { id: { in: items.map((i) => i.id) }, userId },
  });

  const recurringMap = new Map(recurringExpenses.map((r) => [r.id, r]));

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const recurring = recurringMap.get(item.id);
      if (!recurring) continue;

      const day = recurring.dayOfMonth ?? now.getDate();
      const txDate = new Date(now.getFullYear(), now.getMonth(), day, 12, 0, 0);

      await tx.transaction.create({
        data: {
          userId,
          sourceType: "manual",
          date: txDate,
          description: recurring.name,
          amount: item.amount,
          categoryId: recurring.categoryId,
          paymentMethod: recurring.sourceType,
          isRecurring: true,
          categorizationMethod: "manual",
        },
      });

      // Update expected amount if different
      if (item.amount !== toNumber(recurring.expectedAmount)) {
        await tx.recurringExpense.update({
          where: { id: item.id },
          data: { expectedAmount: item.amount },
        });
      }
    }
  });

  revalidateRecurringPaths();
  return { success: true, count: items.length };
}

// ─── Skip a recurring for this month (no-op, just removes from UI) ─

export async function skipRecurringSuggestion(recurringId: string) {
  // We create a $0 "skipped" marker transaction so the pending detection
  // won't show it again this month
  const userId = await getUserId();

  const recurring = await prisma.recurringExpense.findFirst({
    where: { id: recurringId, userId },
  });
  if (!recurring) return { error: "Recorrente não encontrado" };

  const now = new Date();
  const day = recurring.dayOfMonth ?? now.getDate();
  const txDate = new Date(now.getFullYear(), now.getMonth(), day, 12, 0, 0);

  // Create a zero-amount transaction as marker
  await prisma.transaction.create({
    data: {
      userId,
      sourceType: "manual",
      date: txDate,
      description: recurring.name,
      amount: 0,
      categoryId: recurring.categoryId,
      paymentMethod: recurring.sourceType,
      isRecurring: true,
      categorizationMethod: "manual",
    },
  });

  revalidateRecurringPaths();
  return { success: true };
}

// ─── Toggle active/inactive ────────────────────────────────────────

export async function toggleRecurringActive(id: string) {
  const userId = await getUserId();

  const recurring = await prisma.recurringExpense.findFirst({
    where: { id, userId },
  });
  if (!recurring) return { error: "Recorrente não encontrado" };

  await prisma.recurringExpense.update({
    where: { id },
    data: { isActive: !recurring.isActive },
  });

  revalidateRecurringPaths();
  return { success: true, isActive: !recurring.isActive };
}

// ─── Update recurring expense ──────────────────────────────────────

export interface UpdateRecurringData {
  name: string;
  categoryId: string | null;
  expectedAmount: number;
  dayOfMonth: number | null;
  sourceType: string;
}

export async function updateRecurringExpense(
  id: string,
  data: UpdateRecurringData
) {
  const userId = await getUserId();

  const existing = await prisma.recurringExpense.findFirst({
    where: { id, userId },
  });
  if (!existing) return { error: "Recorrente não encontrado" };

  await prisma.recurringExpense.update({
    where: { id },
    data: {
      name: data.name,
      categoryId: data.categoryId,
      expectedAmount: data.expectedAmount,
      dayOfMonth: data.dayOfMonth,
      sourceType: data.sourceType,
    },
  });

  revalidateRecurringPaths();
  return { success: true };
}

// ─── Delete recurring expense ──────────────────────────────────────

export async function deleteRecurringExpense(id: string) {
  const userId = await getUserId();

  const existing = await prisma.recurringExpense.findFirst({
    where: { id, userId },
  });
  if (!existing) return { error: "Recorrente não encontrado" };

  await prisma.recurringExpense.delete({ where: { id } });

  revalidateRecurringPaths();
  return { success: true };
}

function revalidateRecurringPaths() {
  revalidatePath("/recurring");
  revalidatePath("/");
  revalidatePath("/transactions");
}
