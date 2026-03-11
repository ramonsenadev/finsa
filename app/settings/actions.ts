"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { incomeSchema, type IncomeFormData } from "@/lib/validations/income";
import {
  investmentSchema,
  type InvestmentFormData,
} from "@/lib/validations/investment";

const DEFAULT_USER_EMAIL = "ramon@finsa.local";

async function getUserId() {
  const user = await prisma.user.findFirst({
    where: { email: DEFAULT_USER_EMAIL },
  });
  if (!user) throw new Error("User not found");
  return user.id;
}

async function invalidateAllSnapshots(userId: string) {
  await prisma.monthSnapshot.deleteMany({ where: { userId } });
  revalidatePath("/");
}

// ── Income ──

export async function createIncome(data: IncomeFormData) {
  const parsed = incomeSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const userId = await getUserId();

  await prisma.income.create({
    data: {
      userId,
      name: parsed.data.name,
      amount: parsed.data.amount,
      type: parsed.data.type,
      effectiveFrom: parsed.data.effectiveFrom,
    },
  });

  await invalidateAllSnapshots(userId);
  revalidatePath("/settings");
  return { success: true };
}

export async function updateIncome(id: string, data: IncomeFormData) {
  const parsed = incomeSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const income = await prisma.income.findUnique({ where: { id } });
  if (!income) return { error: { name: ["Renda não encontrada"] } };

  await prisma.income.update({
    where: { id },
    data: {
      name: parsed.data.name,
      amount: parsed.data.amount,
      type: parsed.data.type,
      effectiveFrom: parsed.data.effectiveFrom,
    },
  });

  await invalidateAllSnapshots(income.userId);
  revalidatePath("/settings");
  return { success: true };
}

export async function toggleIncomeActive(id: string) {
  const income = await prisma.income.findUnique({ where: { id } });
  if (!income) return { error: "Renda não encontrada" };

  await prisma.income.update({
    where: { id },
    data: { isActive: !income.isActive },
  });

  await invalidateAllSnapshots(income.userId);
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteIncome(id: string) {
  const income = await prisma.income.findUnique({ where: { id } });
  if (!income) return { error: "Renda não encontrada" };

  await prisma.income.delete({ where: { id } });

  await invalidateAllSnapshots(income.userId);
  revalidatePath("/settings");
  return { success: true };
}

// ── Investment ──

export async function createInvestment(data: InvestmentFormData) {
  const parsed = investmentSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const userId = await getUserId();

  await prisma.investment.create({
    data: {
      userId,
      name: parsed.data.name,
      amount: parsed.data.amount,
      category: parsed.data.category,
      effectiveFrom: parsed.data.effectiveFrom,
    },
  });

  await invalidateAllSnapshots(userId);
  revalidatePath("/settings");
  return { success: true };
}

export async function updateInvestment(id: string, data: InvestmentFormData) {
  const parsed = investmentSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const investment = await prisma.investment.findUnique({ where: { id } });
  if (!investment) return { error: { name: ["Investimento não encontrado"] } };

  await prisma.investment.update({
    where: { id },
    data: {
      name: parsed.data.name,
      amount: parsed.data.amount,
      category: parsed.data.category,
      effectiveFrom: parsed.data.effectiveFrom,
    },
  });

  await invalidateAllSnapshots(investment.userId);
  revalidatePath("/settings");
  return { success: true };
}

export async function toggleInvestmentActive(id: string) {
  const investment = await prisma.investment.findUnique({ where: { id } });
  if (!investment) return { error: "Investimento não encontrado" };

  await prisma.investment.update({
    where: { id },
    data: { isActive: !investment.isActive },
  });

  await invalidateAllSnapshots(investment.userId);
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteInvestment(id: string) {
  const investment = await prisma.investment.findUnique({ where: { id } });
  if (!investment) return { error: "Investimento não encontrado" };

  await prisma.investment.delete({ where: { id } });

  await invalidateAllSnapshots(investment.userId);
  revalidatePath("/settings");
  return { success: true };
}

// ── CSV Formats ──

export async function getCsvFormats() {
  const userId = await getUserId();
  const formats = await prisma.csvFormat.findMany({
    where: {
      OR: [{ isSystem: true }, { userId }],
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });
  return formats.map((f) => ({
    id: f.id,
    name: f.name,
    delimiter: f.delimiter,
    dateColumn: f.dateColumn,
    descriptionColumn: f.descriptionColumn,
    amountColumn: f.amountColumn,
    dateFormat: f.dateFormat,
    amountLocale: f.amountLocale,
    skipRows: f.skipRows,
    encoding: f.encoding,
    isSystem: f.isSystem,
  }));
}

export type CsvFormatRow = Awaited<ReturnType<typeof getCsvFormats>>[number];

export async function createCsvFormat(data: {
  name: string;
  delimiter: string;
  dateColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  dateFormat: string;
  amountLocale: string;
  skipRows: number;
  encoding: string;
}) {
  if (!data.name || !data.dateColumn || !data.descriptionColumn || !data.amountColumn) {
    return { error: "Preencha todos os campos obrigatórios" };
  }
  const userId = await getUserId();
  await prisma.csvFormat.create({
    data: { ...data, userId, isSystem: false },
  });
  revalidatePath("/settings");
  return { success: true };
}

export async function updateCsvFormat(
  id: string,
  data: {
    name: string;
    delimiter: string;
    dateColumn: string;
    descriptionColumn: string;
    amountColumn: string;
    dateFormat: string;
    amountLocale: string;
    skipRows: number;
    encoding: string;
  }
) {
  const format = await prisma.csvFormat.findUnique({ where: { id } });
  if (!format) return { error: "Formato não encontrado" };
  if (format.isSystem) return { error: "Formatos de sistema não podem ser editados" };
  await prisma.csvFormat.update({ where: { id }, data });
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteCsvFormat(id: string) {
  const format = await prisma.csvFormat.findUnique({ where: { id } });
  if (!format) return { error: "Formato não encontrado" };
  if (format.isSystem) return { error: "Formatos de sistema não podem ser excluídos" };
  await prisma.csvFormat.delete({ where: { id } });
  revalidatePath("/settings");
  return { success: true };
}

// ── Categorization Rules ──

export async function getCategorizationRules() {
  const userId = await getUserId();
  const rules = await prisma.categorizationRule.findMany({
    where: { userId },
    include: { category: { select: { name: true, parent: { select: { name: true } } } } },
    orderBy: { usageCount: "desc" },
  });
  return rules.map((r) => ({
    id: r.id,
    matchPattern: r.matchPattern,
    matchType: r.matchType,
    categoryId: r.categoryId,
    categoryName: r.category.parent
      ? `${r.category.parent.name} > ${r.category.name}`
      : r.category.name,
    source: r.source,
    usageCount: r.usageCount,
    lastUsedAt: r.lastUsedAt?.toISOString() ?? null,
  }));
}

export type CategorizationRuleRow = Awaited<ReturnType<typeof getCategorizationRules>>[number];

export async function updateCategorizationRule(
  id: string,
  data: { matchPattern: string; matchType: string; categoryId: string }
) {
  const rule = await prisma.categorizationRule.findUnique({ where: { id } });
  if (!rule) return { error: "Regra não encontrada" };
  if (!data.matchPattern) return { error: "Padrão é obrigatório" };
  if (!["exact", "contains", "regex"].includes(data.matchType)) {
    return { error: "Tipo inválido" };
  }
  await prisma.categorizationRule.update({
    where: { id },
    data: {
      matchPattern: data.matchPattern,
      matchType: data.matchType,
      categoryId: data.categoryId,
    },
  });
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteCategorizationRule(id: string) {
  const rule = await prisma.categorizationRule.findUnique({ where: { id } });
  if (!rule) return { error: "Regra não encontrada" };
  await prisma.categorizationRule.delete({ where: { id } });
  revalidatePath("/settings");
  return { success: true };
}

// ── Categories (for select dropdown) ──

export async function getCategoriesFlat() {
  const userId = await getUserId();
  const categories = await prisma.category.findMany({
    where: { OR: [{ isSystem: true }, { userId }] },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
    select: { id: true, name: true, parentId: true, parent: { select: { name: true } } },
  });
  return categories.map((c) => ({
    id: c.id,
    name: c.parent ? `${c.parent.name} > ${c.name}` : c.name,
    isParent: !c.parentId,
  }));
}

// ── Data Export & Wipe ──

export async function exportAllData() {
  const userId = await getUserId();

  const [
    transactions,
    cards,
    categories,
    incomes,
    investments,
    rules,
    recurringExpenses,
    imports,
    budgets,
    preferences,
  ] = await Promise.all([
    prisma.transaction.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.card.findMany({ where: { userId, deletedAt: null } }),
    prisma.category.findMany({ where: { OR: [{ userId }, { isSystem: true }] } }),
    prisma.income.findMany({ where: { userId } }),
    prisma.investment.findMany({ where: { userId } }),
    prisma.categorizationRule.findMany({ where: { userId } }),
    prisma.recurringExpense.findMany({ where: { userId } }),
    prisma.import.findMany({ where: { userId } }),
    prisma.monthlyBudget.findMany({ where: { userId } }),
    prisma.userPreference.findMany({ where: { userId } }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    transactions: transactions.map((t) => ({ ...t, amount: Number(t.amount) })),
    cards,
    categories,
    incomes: incomes.map((i) => ({ ...i, amount: Number(i.amount) })),
    investments: investments.map((i) => ({ ...i, amount: Number(i.amount) })),
    categorizationRules: rules,
    recurringExpenses: recurringExpenses.map((r) => ({
      ...r,
      expectedAmount: Number(r.expectedAmount),
    })),
    imports,
    budgets: budgets.map((b) => ({ ...b, amount: Number(b.amount) })),
    preferences,
  };
}

export async function wipeAllData() {
  const userId = await getUserId();

  await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { userId } }),
    prisma.import.deleteMany({ where: { userId } }),
    prisma.categorizationRule.deleteMany({ where: { userId } }),
    prisma.recurringExpense.deleteMany({ where: { userId } }),
    prisma.dismissedRecurring.deleteMany({ where: { userId } }),
    prisma.monthlyBudget.deleteMany({ where: { userId } }),
    prisma.monthSnapshot.deleteMany({ where: { userId } }),
    prisma.card.deleteMany({ where: { userId } }),
    prisma.income.deleteMany({ where: { userId } }),
    prisma.investment.deleteMany({ where: { userId } }),
    prisma.userPreference.deleteMany({ where: { userId } }),
    prisma.csvFormat.deleteMany({ where: { userId, isSystem: false } }),
    prisma.category.deleteMany({ where: { userId, isSystem: false } }),
  ]);

  revalidatePath("/");
  revalidatePath("/settings");
  return { success: true };
}

// ── Import Management ──

export async function getImportsList(cardId?: string) {
  const userId = await getUserId();

  const imports = await prisma.import.findMany({
    where: { userId, ...(cardId ? { cardId } : {}) },
    include: {
      card: { select: { name: true, color: true } },
    },
    orderBy: { importedAt: "desc" },
  });

  return imports.map((imp) => ({
    id: imp.id,
    fileName: imp.fileName,
    monthRef: imp.monthRef,
    importedAt: imp.importedAt,
    txCount: imp.txCount,
    autoCategorizedCount: imp.autoCategorizedCount,
    cardName: imp.card.name,
    cardColor: imp.card.color,
  }));
}

export async function deleteImport(importId: string) {
  const userId = await getUserId();

  const imp = await prisma.import.findFirst({
    where: { id: importId, userId },
    select: { id: true, monthRef: true },
  });

  if (!imp) return { error: "Importação não encontrada" };

  // Find all affected months from the transactions
  const affectedMonths = await prisma.transaction.findMany({
    where: { importId },
    select: { date: true },
    distinct: ["date"],
  });
  const monthRefs = [
    ...new Set(
      affectedMonths.map((tx) => {
        const d = tx.date;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      })
    ),
  ];

  await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { importId } }),
    prisma.import.delete({ where: { id: importId } }),
    // Invalidate snapshots for affected months
    ...(monthRefs.length > 0
      ? [prisma.monthSnapshot.deleteMany({ where: { userId, monthRef: { in: monthRefs } } })]
      : []),
  ]);

  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/transactions");
  revalidatePath("/cards");
  revalidatePath("/invoices");
  return { success: true };
}

// ── Preferences ──

export async function getRecurringToleranceSetting() {
  const userId = await getUserId();
  const { getRecurringTolerance } = await import(
    "@/lib/recurring/detection-engine"
  );
  return getRecurringTolerance(userId);
}

export async function updateRecurringTolerance(tolerance: number) {
  if (tolerance < 0 || tolerance > 100) {
    return { error: "Tolerância deve estar entre 0 e 100" };
  }
  const userId = await getUserId();
  const { setRecurringTolerance } = await import(
    "@/lib/recurring/detection-engine"
  );
  await setRecurringTolerance(userId, tolerance);
  revalidatePath("/settings");
  revalidatePath("/recurring");
  return { success: true };
}

// ── Re-categorize uncategorized transactions ──

export async function recategorizeUncategorized() {
  const userId = await getUserId();
  const { categorizeByRules } = await import("@/lib/categorization/rules-engine");

  // Find all uncategorized transactions
  const uncategorized = await prisma.transaction.findMany({
    where: { userId, categoryId: null },
    select: { id: true, description: true },
  });

  if (uncategorized.length === 0) {
    return { success: true, categorized: 0, total: 0 };
  }

  const descriptions = uncategorized.map((t) => t.description);
  const results = await categorizeByRules(userId, descriptions);

  // Build updates
  const updates: { id: string; categoryId: string; ruleId?: string }[] = [];
  for (const tx of uncategorized) {
    const match = results.get(tx.description);
    if (match) {
      updates.push({ id: tx.id, categoryId: match.categoryId, ruleId: match.ruleId });
    }
  }

  if (updates.length > 0) {
    // Update transactions in batches
    await prisma.$transaction(
      updates.map((u) =>
        prisma.transaction.update({
          where: { id: u.id },
          data: {
            categoryId: u.categoryId,
            categorizationMethod: "rule",
          },
        })
      )
    );

    // Update rule usage counts
    const ruleUsage = new Map<string, number>();
    for (const u of updates) {
      if (u.ruleId) {
        ruleUsage.set(u.ruleId, (ruleUsage.get(u.ruleId) ?? 0) + 1);
      }
    }
    for (const [ruleId, count] of ruleUsage) {
      await prisma.categorizationRule.update({
        where: { id: ruleId },
        data: {
          usageCount: { increment: count },
          lastUsedAt: new Date(),
        },
      });
    }

    await invalidateAllSnapshots(userId);
    revalidatePath("/transactions");
    revalidatePath("/transactions/review");
  }

  return { success: true, categorized: updates.length, total: uncategorized.length };
}
