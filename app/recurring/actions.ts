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
  categoryIcon: string | null;
  categoryColor: string | null;
  expectedAmount: number;
  dayOfMonth: number | null;
  sourceType: string;
  effectiveFrom: string | null; // ISO date string
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

// ─── Helper to parse monthRef ────────────────────────────────────────

function parseMonthRef(monthRef?: string) {
  if (monthRef) {
    const [y, m] = monthRef.split("-").map(Number);
    return { year: y, month: m - 1 }; // 0-based month
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

// ─── Fetch all data for the page ───────────────────────────────────

export async function fetchRecurringPageData(monthRef?: string): Promise<RecurringPageData> {
  const userId = await getUserId();
  const { year, month } = parseMonthRef(monthRef);
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
          icon: true,
          color: true,
          parent: { select: { name: true, icon: true, color: true } },
        },
      },
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  // Fetch transactions for current month that are recurring
  const [monthTransactions, skippedEntries] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: monthStart, lte: monthEnd },
        isRecurring: true,
      },
      select: {
        description: true,
        categoryId: true,
      },
    }),
    prisma.skippedRecurring.findMany({
      where: { userId, monthRef: currentMonth },
      select: { recurringId: true },
    }),
  ]);

  // Build lookup sets for matching
  const normalizedTransactions = monthTransactions.map((t) => ({
    normalizedName: t.description.toLowerCase().trim(),
    categoryId: t.categoryId,
  }));
  const skippedIds = new Set(skippedEntries.map((s) => s.recurringId));

  // Determine pending suggestions (active recurring without matching transaction or skip)
  const activeRecurring = allRecurring.filter((r) => r.isActive);

  const pending: PendingSuggestion[] = [];
  for (const rec of activeRecurring) {
    // Skip if effectiveFrom is in the future relative to the current month
    if (rec.effectiveFrom && rec.effectiveFrom > monthEnd) {
      continue;
    }

    // Skip if explicitly skipped for this month
    if (skippedIds.has(rec.id)) {
      continue;
    }

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
    categoryIcon: r.category?.parent?.icon ?? r.category?.icon ?? null,
    categoryColor: r.category?.parent?.color ?? r.category?.color ?? null,
    expectedAmount: toNumber(r.expectedAmount),
    dayOfMonth: r.dayOfMonth,
    sourceType: r.sourceType,
    effectiveFrom: r.effectiveFrom ? r.effectiveFrom.toISOString().split("T")[0] : null,
    detectionMethod: r.detectionMethod,
    isActive: r.isActive,
  }));

  // Total fixed expenses from active recurring (only those effective by current month)
  const totalFixedExpenses = activeRecurring
    .filter((r) => !r.effectiveFrom || r.effectiveFrom <= monthEnd)
    .reduce((sum, r) => sum + toNumber(r.expectedAmount), 0);

  // Get total income (effective by this month)
  const incomes = await prisma.income.findMany({
    where: { userId, effectiveFrom: { lte: monthEnd } },
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
  amount: number,
  monthRef?: string
) {
  const userId = await getUserId();

  const recurring = await prisma.recurringExpense.findFirst({
    where: { id: recurringId, userId },
  });
  if (!recurring) return { error: "Recorrente não encontrado" };

  const { year, month } = parseMonthRef(monthRef);
  const day = recurring.dayOfMonth ?? 15;
  const txDate = new Date(year, month, day, 12, 0, 0);

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
  items: { id: string; amount: number }[],
  monthRef?: string
) {
  const userId = await getUserId();
  const { year, month } = parseMonthRef(monthRef);

  const recurringExpenses = await prisma.recurringExpense.findMany({
    where: { id: { in: items.map((i) => i.id) }, userId },
  });

  const recurringMap = new Map(recurringExpenses.map((r) => [r.id, r]));

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const recurring = recurringMap.get(item.id);
      if (!recurring) continue;

      const day = recurring.dayOfMonth ?? 15;
      const txDate = new Date(year, month, day, 12, 0, 0);

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

// ─── Skip a recurring for this month ─────────────────────────────

export async function skipRecurringSuggestion(recurringId: string, monthRef?: string) {
  const userId = await getUserId();

  const recurring = await prisma.recurringExpense.findFirst({
    where: { id: recurringId, userId },
  });
  if (!recurring) return { error: "Recorrente não encontrado" };

  const { year, month } = parseMonthRef(monthRef);
  const currentMonth = `${year}-${String(month + 1).padStart(2, "0")}`;

  // Create a skip marker so the pending detection won't show it again
  await prisma.skippedRecurring.upsert({
    where: {
      userId_recurringId_monthRef: { userId, recurringId, monthRef: currentMonth },
    },
    update: {},
    create: { userId, recurringId, monthRef: currentMonth },
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
  effectiveFrom: string | null; // ISO date string or null
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
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : null,
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

// ─── Accept a detection candidate as recurring ───────────────────

export async function acceptRecurringCandidate(data: {
  title: string;
  normalizedTitle: string;
  averageAmount: number;
  categoryId: string | null;
  sourceType: string;
  dayOfMonth: number | null;
}) {
  const userId = await getUserId();

  const now = new Date();
  const effectiveFrom = new Date(now.getFullYear(), now.getMonth(), 1);

  await prisma.recurringExpense.create({
    data: {
      userId,
      name: data.title,
      expectedAmount: data.averageAmount,
      categoryId: data.categoryId,
      sourceType: data.sourceType === "card" ? "card" : data.sourceType,
      dayOfMonth: data.dayOfMonth,
      detectionMethod: "auto",
      isActive: true,
      effectiveFrom,
    },
  });

  // Remove from dismissed if it was there
  await prisma.dismissedRecurring.deleteMany({
    where: { userId, normalizedTitle: data.normalizedTitle },
  });

  revalidateRecurringPaths();
  return { success: true };
}

// ─── Dismiss a detection candidate ────────────────────────────────

export async function dismissRecurringCandidate(normalizedTitle: string) {
  const userId = await getUserId();

  await prisma.dismissedRecurring.upsert({
    where: {
      userId_normalizedTitle: { userId, normalizedTitle },
    },
    update: {},
    create: { userId, normalizedTitle },
  });

  revalidateRecurringPaths();
  return { success: true };
}

// ─── Fetch detection candidates ───────────────────────────────────

export async function fetchDetectionCandidates() {
  const { detectRecurringPatterns } = await import(
    "@/lib/recurring/detection-engine"
  );
  const userId = await getUserId();
  return detectRecurringPatterns(userId);
}

function revalidateRecurringPaths() {
  revalidatePath("/recurring");
  revalidatePath("/");
  revalidatePath("/transactions");
}
