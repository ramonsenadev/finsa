"use server";

import { prisma } from "@/lib/db";

const DEFAULT_USER_EMAIL = "ramon@finsa.local";

async function getUserId() {
  const user = await prisma.user.findFirst({
    where: { email: DEFAULT_USER_EMAIL },
  });
  if (!user) throw new Error("User not found");
  return user.id;
}

export type InvoiceRow = {
  id: string;
  fileName: string;
  monthRef: string;
  importedAt: Date;
  txCount: number;
  autoCategorizedCount: number;
  aiCategorizedCount: number;
  manualPendingCount: number;
  totalAmount: number;
  cardId: string;
  cardName: string;
  cardColor: string | null;
  cardIssuer: string;
};

export async function getInvoices(cardId?: string): Promise<InvoiceRow[]> {
  const userId = await getUserId();

  const imports = await prisma.import.findMany({
    where: { userId, ...(cardId ? { cardId } : {}) },
    include: {
      card: { select: { id: true, name: true, color: true, issuer: true } },
    },
    orderBy: [{ monthRef: "desc" }, { importedAt: "desc" }],
  });

  if (imports.length === 0) return [];

  // Calculate totals per import
  const totals = await prisma.transaction.groupBy({
    by: ["importId"],
    where: {
      userId,
      importId: { in: imports.map((i) => i.id) },
    },
    _sum: { amount: true },
  });

  const totalMap = new Map(
    totals.map((t) => [t.importId, Number(t._sum.amount ?? 0)])
  );

  return imports.map((imp) => ({
    id: imp.id,
    fileName: imp.fileName,
    monthRef: imp.monthRef,
    importedAt: imp.importedAt,
    txCount: imp.txCount,
    autoCategorizedCount: imp.autoCategorizedCount,
    aiCategorizedCount: imp.aiCategorizedCount,
    manualPendingCount: imp.manualPendingCount,
    totalAmount: totalMap.get(imp.id) ?? 0,
    cardId: imp.card.id,
    cardName: imp.card.name,
    cardColor: imp.card.color,
    cardIssuer: imp.card.issuer,
  }));
}

export type InvoiceInsight = {
  type: "pending_review" | "month_variation" | "missing_import";
  cardId?: string;
  cardName?: string;
  cardColor?: string | null;
  monthRef?: string;
  message: string;
  detail: string;
  actionLabel: string;
  actionHref: string;
};

export async function getInvoiceInsights(
  invoices: InvoiceRow[]
): Promise<InvoiceInsight[]> {
  const insights: InvoiceInsight[] = [];

  // 1. Pending review: faturas com transações sem categoria
  const pendingInvoices = invoices.filter((i) => i.manualPendingCount > 0);
  if (pendingInvoices.length > 0) {
    const totalPendingTx = pendingInvoices.reduce(
      (sum, i) => sum + i.manualPendingCount,
      0
    );
    insights.push({
      type: "pending_review",
      message: `${totalPendingTx} transações aguardando categorização`,
      detail: `Em ${pendingInvoices.length} fatura${pendingInvoices.length > 1 ? "s" : ""}: ${pendingInvoices.map((i) => i.cardName).filter((v, i, a) => a.indexOf(v) === i).join(", ")}`,
      actionLabel: "Revisar Pendentes",
      actionHref: "/transactions/review",
    });
  }

  // 2. Month-over-month variation: detect cards with >15% increase
  const cardMonths = new Map<string, Map<string, number>>();
  for (const inv of invoices) {
    if (!cardMonths.has(inv.cardId)) {
      cardMonths.set(inv.cardId, new Map());
    }
    const existing = cardMonths.get(inv.cardId)!.get(inv.monthRef) ?? 0;
    cardMonths.get(inv.cardId)!.set(inv.monthRef, existing + inv.totalAmount);
  }

  for (const [cardId, months] of cardMonths) {
    const sorted = Array.from(months.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    if (sorted.length < 2) continue;

    // Only compare truly consecutive months (e.g. 2026-01 vs 2026-02)
    const [currMonth, currAmount] = sorted[sorted.length - 1];
    const expectedPrev = getPreviousMonthRef(currMonth);
    const prevEntry = sorted.find(([ref]) => ref === expectedPrev);
    if (!prevEntry) continue;

    const [prevMonth, prevAmount] = prevEntry;

    if (prevAmount > 0 && currAmount > prevAmount) {
      const pctChange = ((currAmount - prevAmount) / prevAmount) * 100;
      if (pctChange >= 15) {
        const card = invoices.find((i) => i.cardId === cardId);
        const monthLabel = formatMonthLabel(currMonth);
        const prevLabel = formatMonthLabel(prevMonth);
        insights.push({
          type: "month_variation",
          cardId,
          cardName: card?.cardName,
          cardColor: card?.cardColor,
          monthRef: currMonth,
          message: `${card?.cardName}: fatura de ${monthLabel} subiu ${pctChange.toFixed(0)}%`,
          detail: `De ${formatBRLShort(prevAmount)} (${prevLabel}) para ${formatBRLShort(currAmount)} (${monthLabel})`,
          actionLabel: "Ver Transações",
          actionHref: `/transactions?card=${cardId}`,
        });
      }
    }
  }

  // 3. Missing import: detect cards that have a regular import pattern but are missing the current month
  const now = new Date();
  const currentMonthRef = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
  const prevMonthRef = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;

  // Group months per card
  for (const [cardId, months] of cardMonths) {
    const sortedMonths = Array.from(months.keys()).sort();
    if (sortedMonths.length < 3) continue; // Need 3+ months of history

    // Check if card has imports for the last 3 consecutive months before current
    const hasRecentPattern = sortedMonths.includes(prevMonthRef);
    const hasCurrent = sortedMonths.includes(currentMonthRef);

    if (hasRecentPattern && !hasCurrent) {
      const card = invoices.find((i) => i.cardId === cardId);
      insights.push({
        type: "missing_import",
        cardId,
        cardName: card?.cardName,
        cardColor: card?.cardColor,
        monthRef: currentMonthRef,
        message: `Fatura de ${formatMonthLabel(currentMonthRef)} do ${card?.cardName} ainda não importada`,
        detail: `Você importou os meses anteriores regularmente. A fatura deste mês já está disponível?`,
        actionLabel: "Importar Agora",
        actionHref: "/invoices/import",
      });
    }
  }

  return insights;
}

function formatMonthLabel(monthRef: string) {
  const [y, m] = monthRef.split("-");
  const date = new Date(parseInt(y), parseInt(m) - 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function getPreviousMonthRef(monthRef: string): string {
  const [y, m] = monthRef.split("-").map(Number);
  const prev = new Date(y, m - 2); // month is 0-indexed, so m-1 is current, m-2 is previous
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
}

function formatBRLShort(value: number) {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1).replace(".", ",")}k`;
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export async function getInvoiceCards() {
  const userId = await getUserId();
  const cards = await prisma.card.findMany({
    where: { userId, deletedAt: null },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });
  return cards;
}
