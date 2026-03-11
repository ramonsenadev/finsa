"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  cardSchema,
  customCsvFormatSchema,
  ISSUER_CSV_FORMAT_IDS,
  type CardFormData,
  type CustomCsvFormatData,
} from "@/lib/validations/card";

const DEFAULT_USER_ID = "ramon@finsa.local";

async function getUserId() {
  const user = await prisma.user.findFirst({
    where: { email: DEFAULT_USER_ID },
  });
  if (!user) throw new Error("User not found");
  return user.id;
}

export async function createCard(
  data: CardFormData,
  customCsvFormat?: CustomCsvFormatData
) {
  const parsed = cardSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const userId = await getUserId();
  let csvFormatId: string | null = null;

  if (parsed.data.issuer !== "outro") {
    csvFormatId = ISSUER_CSV_FORMAT_IDS[parsed.data.issuer] ?? null;
  } else if (customCsvFormat) {
    const csvParsed = customCsvFormatSchema.safeParse(customCsvFormat);
    if (!csvParsed.success) {
      return { error: csvParsed.error.flatten().fieldErrors };
    }
    const format = await prisma.csvFormat.create({
      data: {
        userId,
        name: `${parsed.data.name} - Custom`,
        delimiter: csvParsed.data.delimiter,
        dateColumn: csvParsed.data.dateColumn,
        descriptionColumn: csvParsed.data.descriptionColumn,
        amountColumn: csvParsed.data.amountColumn,
        dateFormat: csvParsed.data.dateFormat,
        encoding: csvParsed.data.encoding,
      },
    });
    csvFormatId = format.id;
  }

  await prisma.card.create({
    data: {
      userId,
      name: parsed.data.name,
      issuer: parsed.data.issuer,
      lastFourDigits: parsed.data.lastFourDigits,
      holderName: parsed.data.holderName,
      closingDay: parsed.data.closingDay ?? null,
      dueDay: parsed.data.dueDay ?? null,
      color: null,
      csvFormatId,
    },
  });

  revalidatePath("/cards");
  return { success: true };
}

export async function updateCard(
  id: string,
  data: CardFormData,
  customCsvFormat?: CustomCsvFormatData
) {
  const parsed = cardSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const userId = await getUserId();
  let csvFormatId: string | null = null;

  if (parsed.data.issuer !== "outro") {
    csvFormatId = ISSUER_CSV_FORMAT_IDS[parsed.data.issuer] ?? null;
  } else if (customCsvFormat) {
    const csvParsed = customCsvFormatSchema.safeParse(customCsvFormat);
    if (!csvParsed.success) {
      return { error: csvParsed.error.flatten().fieldErrors };
    }

    const existing = await prisma.card.findUnique({
      where: { id },
      include: { csvFormat: true },
    });

    if (existing?.csvFormat && !existing.csvFormat.isSystem) {
      await prisma.csvFormat.update({
        where: { id: existing.csvFormat.id },
        data: {
          delimiter: csvParsed.data.delimiter,
          dateColumn: csvParsed.data.dateColumn,
          descriptionColumn: csvParsed.data.descriptionColumn,
          amountColumn: csvParsed.data.amountColumn,
          dateFormat: csvParsed.data.dateFormat,
          encoding: csvParsed.data.encoding,
        },
      });
      csvFormatId = existing.csvFormat.id;
    } else {
      const format = await prisma.csvFormat.create({
        data: {
          userId,
          name: `${parsed.data.name} - Custom`,
          delimiter: csvParsed.data.delimiter,
          dateColumn: csvParsed.data.dateColumn,
          descriptionColumn: csvParsed.data.descriptionColumn,
          amountColumn: csvParsed.data.amountColumn,
          dateFormat: csvParsed.data.dateFormat,
          encoding: csvParsed.data.encoding,
        },
      });
      csvFormatId = format.id;
    }
  }

  await prisma.card.update({
    where: { id },
    data: {
      name: parsed.data.name,
      issuer: parsed.data.issuer,
      lastFourDigits: parsed.data.lastFourDigits,
      holderName: parsed.data.holderName,
      closingDay: parsed.data.closingDay ?? null,
      dueDay: parsed.data.dueDay ?? null,
      csvFormatId,
    },
  });

  revalidatePath("/cards");
  return { success: true };
}

export async function getCardDeleteInfo(id: string) {
  const userId = await getUserId();
  const card = await prisma.card.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!card) return null;

  const transactionCount = await prisma.transaction.count({
    where: { cardId: id },
  });
  const importCount = await prisma.import.count({
    where: { cardId: id },
  });

  return { ...card, transactionCount, importCount };
}

export async function deleteCard(
  id: string,
  deleteTransactions: boolean
) {
  const userId = await getUserId();
  const card = await prisma.card.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!card) return { error: "Cartão não encontrado" };

  if (deleteTransactions) {
    // Find affected months to invalidate snapshots
    const affectedMonths = await prisma.transaction.findMany({
      where: { cardId: id },
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

    // Hard delete: remove transactions first, then card (imports cascade)
    await prisma.transaction.deleteMany({ where: { cardId: id } });
    await prisma.card.delete({ where: { id } });

    // Invalidate snapshots for affected months
    if (monthRefs.length > 0) {
      await prisma.monthSnapshot.deleteMany({
        where: { userId, monthRef: { in: monthRefs } },
      });
    }
  } else {
    // Soft delete: card disappears from UI, transactions keep cardId
    await prisma.card.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  revalidatePath("/cards");
  revalidatePath("/transactions");
  revalidatePath("/");
  return { success: true };
}

export async function toggleCardActive(id: string) {
  const card = await prisma.card.findFirst({ where: { id, deletedAt: null } });
  if (!card) return { error: "Cartão não encontrado" };

  await prisma.card.update({
    where: { id },
    data: { isActive: !card.isActive },
  });

  revalidatePath("/cards");
  return { success: true };
}
