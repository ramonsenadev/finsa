"use server";

import { prisma } from "@/lib/db";
import { getMonthlyDashboard, type MonthlyDashboardData, type RecurrenceFilter } from "@/lib/analytics/dashboard";
import { getDailyExpenses, type DailyExpenseSummary } from "@/lib/analytics/daily-expenses";

const DEFAULT_USER_EMAIL = "ramon@finsa.local";

async function getUserId() {
  const user = await prisma.user.findFirst({
    where: { email: DEFAULT_USER_EMAIL },
  });
  if (!user) throw new Error("User not found");
  return user.id;
}

export async function fetchDashboardData(
  monthRef: string,
  recurrenceFilter: RecurrenceFilter = "all"
): Promise<MonthlyDashboardData> {
  const userId = await getUserId();
  return getMonthlyDashboard(userId, monthRef, recurrenceFilter);
}

export async function fetchDailyExpenses(
  monthRef: string,
  recurrenceFilter: RecurrenceFilter = "all"
): Promise<DailyExpenseSummary> {
  const userId = await getUserId();
  return getDailyExpenses(userId, monthRef, recurrenceFilter);
}
