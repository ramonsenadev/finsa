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

  revalidatePath("/settings");
  return { success: true };
}

export async function deleteIncome(id: string) {
  const income = await prisma.income.findUnique({ where: { id } });
  if (!income) return { error: "Renda não encontrada" };

  await prisma.income.delete({ where: { id } });

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

  revalidatePath("/settings");
  return { success: true };
}

export async function deleteInvestment(id: string) {
  const investment = await prisma.investment.findUnique({ where: { id } });
  if (!investment) return { error: "Investimento não encontrado" };

  await prisma.investment.delete({ where: { id } });

  revalidatePath("/settings");
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
