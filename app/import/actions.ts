"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { parseCsv } from "@/lib/csv/parser";
import { detectFormat } from "@/lib/csv/format-detector";
import {
  categorizeByRules,
  categorizeDryRun,
} from "@/lib/categorization/rules-engine";
import type { CsvFormatConfig, ParsedTransaction } from "@/types/csv";

const DEFAULT_USER_EMAIL = "ramon@finsa.local";

async function getUserId() {
  const user = await prisma.user.findFirst({
    where: { email: DEFAULT_USER_EMAIL },
  });
  if (!user) throw new Error("User not found");
  return user.id;
}

export async function getActiveCards() {
  const userId = await getUserId();
  return prisma.card.findMany({
    where: { userId, isActive: true },
    select: {
      id: true,
      name: true,
      issuer: true,
      lastFourDigits: true,
      csvFormatId: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function parseCsvFile(
  cardId: string,
  csvContent: string,
  fileName: string
) {
  const userId = await getUserId();

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { csvFormat: true },
  });

  if (!card) return { error: "Cartão não encontrado" };

  let format: CsvFormatConfig | null = null;
  let formatSource: "card" | "detected" | "none" = "none";
  let formatMismatch = false;

  // Try card's format first
  if (card.csvFormat) {
    const cardFormat: CsvFormatConfig = {
      delimiter: card.csvFormat.delimiter,
      dateColumn: card.csvFormat.dateColumn,
      descriptionColumn: card.csvFormat.descriptionColumn,
      amountColumn: card.csvFormat.amountColumn,
      dateFormat: card.csvFormat.dateFormat,
      amountLocale: card.csvFormat.amountLocale,
      skipRows: card.csvFormat.skipRows,
      encoding: card.csvFormat.encoding,
    };

    const result = parseCsv(csvContent, cardFormat);
    if (result.transactions.length > 0) {
      format = cardFormat;
      formatSource = "card";
    }
  }

  // If card format failed, try auto-detection
  if (!format) {
    const detected = detectFormat(csvContent);
    if (detected) {
      const result = parseCsv(csvContent, detected);
      if (result.transactions.length > 0) {
        format = detected;
        formatSource = "detected";
        formatMismatch = true;
      }
    }
  }

  // If nothing works, return raw lines for manual mapping
  if (!format) {
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    return {
      needsManualMapping: true,
      rawLines: lines.slice(0, 5),
      allHeaders: lines[0] ? lines[0].split(/[,;|\t]/) : [],
    };
  }

  const parseResult = parseCsv(csvContent, format);

  // Check duplicates
  const duplicateFlags = await checkDuplicates(
    userId,
    cardId,
    parseResult.transactions
  );

  // Dry-run categorization
  const descriptions = parseResult.transactions.map((t) => t.originalTitle);
  const categorizationPreview = await categorizeDryRun(userId, descriptions);

  // Serialize transactions for client
  const serializedTransactions = parseResult.transactions.map((t, i) => ({
    ...t,
    date: t.date.toISOString(),
    isDuplicate: duplicateFlags[i],
    categorization: categorizationPreview.results.has(t.originalTitle)
      ? {
          categoryId: categorizationPreview.results.get(t.originalTitle)!
            .categoryId,
          categoryName: categorizationPreview.results.get(t.originalTitle)!
            .categoryName,
        }
      : null,
  }));

  return {
    success: true,
    formatSource,
    formatMismatch,
    transactions: serializedTransactions,
    stats: {
      ...parseResult.stats,
      dateRange: parseResult.stats.dateRange
        ? {
            from: parseResult.stats.dateRange.from.toISOString(),
            to: parseResult.stats.dateRange.to.toISOString(),
          }
        : null,
    },
    errors: parseResult.errors,
    categorization: {
      byRules: categorizationPreview.byRules,
      byAi: categorizationPreview.byAi,
      manual: categorizationPreview.manual,
    },
    duplicateCount: duplicateFlags.filter(Boolean).length,
    fileName,
  };
}

async function checkDuplicates(
  userId: string,
  cardId: string,
  transactions: ParsedTransaction[]
): Promise<boolean[]> {
  if (transactions.length === 0) return [];

  const existing = await prisma.transaction.findMany({
    where: {
      userId,
      cardId,
      sourceType: "card",
    },
    select: {
      date: true,
      originalTitle: true,
      amount: true,
    },
  });

  const existingSet = new Set(
    existing.map(
      (t) =>
        `${t.date.toISOString().split("T")[0]}|${t.originalTitle}|${t.amount.toString()}`
    )
  );

  return transactions.map((t) => {
    const key = `${t.date.toISOString().split("T")[0]}|${t.originalTitle}|${t.amount}`;
    return existingSet.has(key);
  });
}

export async function processImport(
  cardId: string,
  csvContent: string,
  fileName: string,
  skipDuplicates: boolean
) {
  const userId = await getUserId();

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { csvFormat: true },
  });

  if (!card || !card.csvFormat) {
    return { error: "Cartão ou formato CSV não encontrado" };
  }

  const format: CsvFormatConfig = {
    delimiter: card.csvFormat.delimiter,
    dateColumn: card.csvFormat.dateColumn,
    descriptionColumn: card.csvFormat.descriptionColumn,
    amountColumn: card.csvFormat.amountColumn,
    dateFormat: card.csvFormat.dateFormat,
    amountLocale: card.csvFormat.amountLocale,
    skipRows: card.csvFormat.skipRows,
    encoding: card.csvFormat.encoding,
  };

  const parseResult = parseCsv(csvContent, format);

  if (parseResult.transactions.length === 0) {
    return { error: "Nenhuma transação encontrada no CSV" };
  }

  // Check duplicates
  const duplicateFlags = await checkDuplicates(
    userId,
    cardId,
    parseResult.transactions
  );

  // Filter out duplicates if requested
  const transactionsToImport = parseResult.transactions.filter(
    (_, i) => !skipDuplicates || !duplicateFlags[i]
  );

  if (transactionsToImport.length === 0) {
    return { error: "Todas as transações já foram importadas anteriormente" };
  }

  // Run categorization
  const descriptions = transactionsToImport.map((t) => t.originalTitle);
  const categorizationResults = await categorizeByRules(userId, descriptions);

  // Determine month reference from date range
  const dates = transactionsToImport.map((t) => t.date);
  const midDate = dates[Math.floor(dates.length / 2)];
  const monthRef = `${midDate.getFullYear()}-${String(midDate.getMonth() + 1).padStart(2, "0")}`;

  let autoCategorized = 0;
  let manualPending = 0;

  // Persist in a database transaction
  const result = await prisma.$transaction(async (tx) => {
    const importRecord = await tx.import.create({
      data: {
        userId,
        cardId,
        fileName,
        monthRef,
        txCount: transactionsToImport.length,
      },
    });

    const transactionData = transactionsToImport.map((t) => {
      const catResult = categorizationResults.get(t.originalTitle);
      if (catResult) {
        autoCategorized++;
      } else {
        manualPending++;
      }

      return {
        userId,
        sourceType: "card" as const,
        cardId,
        date: t.date,
        description: t.description,
        originalTitle: t.originalTitle,
        amount: t.amount,
        categoryId: catResult?.categoryId ?? null,
        installmentCurrent: t.installmentCurrent ?? null,
        installmentTotal: t.installmentTotal ?? null,
        isRecurring: false,
        categorizationMethod: catResult ? "rule" : null,
        importId: importRecord.id,
      };
    });

    await tx.transaction.createMany({ data: transactionData });

    // Update import counters
    await tx.import.update({
      where: { id: importRecord.id },
      data: {
        autoCategorizedCount: autoCategorized,
        aiCategorizedCount: 0,
        manualPendingCount: manualPending,
      },
    });

    // Update rule usage counts (increment by actual number of matches)
    const ruleUsageCounts = new Map<string, number>();
    for (const [, result] of categorizationResults) {
      const count = ruleUsageCounts.get(result.ruleId) ?? 0;
      ruleUsageCounts.set(result.ruleId, count + 1);
    }

    for (const [ruleId, count] of ruleUsageCounts) {
      await tx.categorizationRule.update({
        where: { id: ruleId },
        data: {
          usageCount: { increment: count },
          lastUsedAt: new Date(),
        },
      });
    }

    return importRecord;
  });

  revalidatePath("/transactions");
  revalidatePath("/import");
  revalidatePath("/");

  return {
    success: true,
    importId: result.id,
    imported: transactionsToImport.length,
    autoCategorized,
    manualPending,
    skippedDuplicates: skipDuplicates
      ? duplicateFlags.filter(Boolean).length
      : 0,
  };
}

export async function saveCustomFormat(
  cardId: string,
  formatData: {
    delimiter: string;
    dateColumn: string;
    descriptionColumn: string;
    amountColumn: string;
    dateFormat: string;
    amountLocale: string;
    encoding: string;
  }
) {
  const userId = await getUserId();

  const format = await prisma.csvFormat.create({
    data: {
      userId,
      name: `Custom - ${new Date().toISOString().split("T")[0]}`,
      delimiter: formatData.delimiter,
      dateColumn: formatData.dateColumn,
      descriptionColumn: formatData.descriptionColumn,
      amountColumn: formatData.amountColumn,
      dateFormat: formatData.dateFormat,
      amountLocale: formatData.amountLocale,
      encoding: formatData.encoding,
    },
  });

  await prisma.card.update({
    where: { id: cardId },
    data: { csvFormatId: format.id },
  });

  revalidatePath("/cards");
  return { success: true, formatId: format.id };
}
