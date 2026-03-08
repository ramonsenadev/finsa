"use server";

import { prisma } from "@/lib/db";
import { getMonthlyDashboard, type MonthlyDashboardData } from "@/lib/analytics/dashboard";

const DEFAULT_USER_EMAIL = "ramon@finsa.local";

async function getUserId() {
  const user = await prisma.user.findFirst({
    where: { email: DEFAULT_USER_EMAIL },
  });
  if (!user) throw new Error("User not found");
  return user.id;
}

export async function fetchDashboardData(
  monthRef: string
): Promise<MonthlyDashboardData> {
  const userId = await getUserId();
  return getMonthlyDashboard(userId, monthRef);
}
