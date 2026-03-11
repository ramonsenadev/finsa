import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

function toNumber(d: Decimal | number | null | undefined): number {
  if (d == null) return 0;
  return typeof d === "number" ? d : Number(d);
}

// ─── Types ───────────────────────────────────────────────────────────

export interface TransactionFilters {
  dateStart?: string; // YYYY-MM-DD
  dateEnd?: string;   // YYYY-MM-DD
  cardIds?: string[]; // card IDs or "manual" for sourceType=manual
  categoryIds?: string[]; // parent category IDs (includes children)
  minAmount?: number;
  maxAmount?: number;
  categorizationMethod?: "rule" | "ai" | "manual";
  isRecurring?: boolean;
  search?: string;
  sortBy?: "date" | "amount" | "description";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface TransactionRow {
  id: string;
  date: Date;
  description: string;
  amount: number;
  sourceType: string;
  cardId: string | null;
  cardName: string | null;
  cardColor: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  parentCategoryName: string | null;
  categorizationMethod: string | null;
  paymentMethod: string | null;
  isRecurring: boolean;
  installmentCurrent: number | null;
  installmentTotal: number | null;
}

export interface TransactionsResult {
  transactions: TransactionRow[];
  total: number;
  totalAmount: number;
  uncategorizedCount: number;
  page: number;
  pageSize: number;
}

// ─── Query ───────────────────────────────────────────────────────────

export async function getTransactions(
  userId: string,
  filters: TransactionFilters = {}
): Promise<TransactionsResult> {
  const {
    dateStart,
    dateEnd,
    cardIds,
    categoryIds,
    minAmount,
    maxAmount,
    categorizationMethod,
    isRecurring,
    search,
    sortBy = "date",
    sortDir = "desc",
    page = 1,
    pageSize = 20,
  } = filters;

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { userId };

  // Date range
  if (dateStart || dateEnd) {
    where.date = {};
    if (dateStart) where.date.gte = new Date(dateStart);
    if (dateEnd) {
      // End date is inclusive — set to end of day
      const end = new Date(dateEnd);
      end.setDate(end.getDate() + 1);
      where.date.lt = end;
    }
  }

  // Card filter (supports multi-select + "manual")
  if (cardIds && cardIds.length > 0) {
    const hasManual = cardIds.includes("manual");
    const realCardIds = cardIds.filter((id) => id !== "manual");

    if (hasManual && realCardIds.length > 0) {
      where.AND = [
        ...(where.AND ?? []),
        { OR: [{ cardId: { in: realCardIds } }, { sourceType: "manual" }] },
      ];
    } else if (hasManual) {
      where.sourceType = "manual";
    } else {
      where.cardId = { in: realCardIds };
    }
  }

  // Category filter (parent selects all children, "uncategorized" = null)
  if (categoryIds && categoryIds.length > 0) {
    const hasUncategorized = categoryIds.includes("uncategorized");
    const realCategoryIds = categoryIds.filter((id) => id !== "uncategorized");

    if (hasUncategorized && realCategoryIds.length > 0) {
      const childCategories = await prisma.category.findMany({
        where: {
          OR: [
            { id: { in: realCategoryIds } },
            { parentId: { in: realCategoryIds } },
          ],
        },
        select: { id: true },
      });
      const allCatIds = childCategories.map((c) => c.id);
      where.AND = [
        ...(where.AND ?? []),
        { OR: [{ categoryId: { in: allCatIds } }, { categoryId: null }] },
      ];
    } else if (hasUncategorized) {
      where.categoryId = null;
    } else {
      const childCategories = await prisma.category.findMany({
        where: {
          OR: [
            { id: { in: realCategoryIds } },
            { parentId: { in: realCategoryIds } },
          ],
        },
        select: { id: true },
      });
      const allCatIds = childCategories.map((c) => c.id);
      where.categoryId = { in: allCatIds };
    }
  }

  // Amount range
  if (minAmount !== undefined || maxAmount !== undefined) {
    where.amount = {};
    if (minAmount !== undefined) where.amount.gte = minAmount;
    if (maxAmount !== undefined) where.amount.lte = maxAmount;
  }

  // Categorization method
  if (categorizationMethod) {
    where.categorizationMethod = categorizationMethod;
  }

  // Recurring
  if (isRecurring !== undefined) {
    where.isRecurring = isRecurring;
  }

  // Text search (description)
  if (search && search.trim()) {
    where.description = { contains: search.trim(), mode: "insensitive" };
  }

  // Sort
  const orderBy: Record<string, string> = {};
  orderBy[sortBy] = sortDir;

  // Execute query + count + sum + uncategorized in parallel
  const [transactions, total, sumResult, uncategorizedCount] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { include: { parent: true } },
        card: { select: { name: true, color: true } },
      },
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.aggregate({
      where,
      _sum: { amount: true },
    }),
    prisma.transaction.count({ where: { ...where, categoryId: null } }),
  ]);

  return {
    transactions: transactions.map((t) => {
      const cat = t.category;
      const parentCat = cat?.parent;
      return {
        id: t.id,
        date: t.date,
        description: t.description,
        amount: toNumber(t.amount),
        sourceType: t.sourceType,
        cardId: t.cardId,
        cardName: t.card?.name ?? null,
        cardColor: t.card?.color ?? null,
        categoryId: t.categoryId,
        categoryName: cat?.name ?? null,
        categoryIcon: (parentCat ?? cat)?.icon ?? null,
        categoryColor: (parentCat ?? cat)?.color ?? null,
        parentCategoryName: parentCat?.name ?? null,
        categorizationMethod: t.categorizationMethod,
        paymentMethod: t.paymentMethod,
        isRecurring: t.isRecurring,
        installmentCurrent: t.installmentCurrent,
        installmentTotal: t.installmentTotal,
      };
    }),
    total,
    totalAmount: toNumber(sumResult._sum.amount),
    uncategorizedCount,
    page,
    pageSize,
  };
}

// ─── Export data (all matching, no pagination) ───────────────────────

export interface TransactionExportRow {
  date: string;
  description: string;
  amount: number;
  category: string;
  subcategory: string;
  card: string;
  categorizationMethod: string;
  recurring: string;
}

export async function getTransactionsForExport(
  userId: string,
  filters: TransactionFilters
): Promise<TransactionExportRow[]> {
  // Remove pagination for export
  const exportFilters = { ...filters, page: 1, pageSize: 100000 };
  const result = await getTransactions(userId, exportFilters);

  return result.transactions.map((t) => ({
    date: new Intl.DateTimeFormat("pt-BR").format(new Date(t.date)),
    description: t.description,
    amount: t.amount,
    category: t.parentCategoryName ?? t.categoryName ?? "Sem categoria",
    subcategory: t.parentCategoryName ? (t.categoryName ?? "") : "",
    card: t.sourceType === "manual" ? "Manual" : (t.cardName ?? ""),
    categorizationMethod:
      t.categorizationMethod === "rule"
        ? "Regra"
        : t.categorizationMethod === "ai"
          ? "IA"
          : t.categorizationMethod === "manual"
            ? "Manual"
            : "",
    recurring: t.isRecurring ? "Sim" : "Não",
  }));
}
