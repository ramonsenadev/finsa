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
      csvFormatId,
    },
  });

  revalidatePath("/cards");
  return { success: true };
}

export async function toggleCardActive(id: string) {
  const card = await prisma.card.findUnique({ where: { id } });
  if (!card) return { error: "Cartão não encontrado" };

  await prisma.card.update({
    where: { id },
    data: { isActive: !card.isActive },
  });

  revalidatePath("/cards");
  return { success: true };
}
