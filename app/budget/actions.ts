"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { upsertBudgetSchema, type UpsertBudgetData } from "@/lib/validations/budget";

const DEFAULT_USER_EMAIL = "ramon@finsa.local";

async function getUserId() {
  const user = await prisma.user.findFirst({
    where: { email: DEFAULT_USER_EMAIL },
  });
  if (!user) throw new Error("User not found");
  return user.id;
}

export async function upsertBudget(data: UpsertBudgetData) {
  const parsed = upsertBudgetSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const userId = await getUserId();
  const { categoryId, monthRef, amount } = parsed.data;

  if (amount === 0) {
    await prisma.monthlyBudget.deleteMany({
      where: { userId, categoryId, monthRef },
    });
  } else {
    await prisma.monthlyBudget.upsert({
      where: {
        userId_categoryId_monthRef: { userId, categoryId, monthRef },
      },
      create: { userId, categoryId, monthRef, amount },
      update: { amount },
    });
  }

  revalidatePath("/budget");
  return { success: true };
}

export async function copyBudgetFromPreviousMonth(currentMonthRef: string) {
  const userId = await getUserId();

  const [year, month] = currentMonthRef.split("-").map(Number);
  const prevDate = new Date(year, month - 2, 1);
  const prevMonthRef = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  const previousBudgets = await prisma.monthlyBudget.findMany({
    where: { userId, monthRef: prevMonthRef },
  });

  if (previousBudgets.length === 0) {
    return { error: "Nenhum orçamento encontrado no mês anterior." };
  }

  for (const budget of previousBudgets) {
    await prisma.monthlyBudget.upsert({
      where: {
        userId_categoryId_monthRef: {
          userId,
          categoryId: budget.categoryId,
          monthRef: currentMonthRef,
        },
      },
      create: {
        userId,
        categoryId: budget.categoryId,
        monthRef: currentMonthRef,
        amount: budget.amount,
      },
      update: { amount: budget.amount },
    });
  }

  revalidatePath("/budget");
  return { success: true, count: previousBudgets.length };
}
