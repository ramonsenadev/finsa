"use server";

import { prisma } from "@/lib/db";
import {
  getTemporalComparison,
  type TemporalComparisonData,
} from "@/lib/analytics/temporal-comparison";

const DEFAULT_USER_EMAIL = "ramon@finsa.local";

async function getUserId() {
  const user = await prisma.user.findFirst({
    where: { email: DEFAULT_USER_EMAIL },
  });
  if (!user) throw new Error("User not found");
  return user.id;
}

export async function fetchComparison(
  startMonth: string,
  endMonth: string,
): Promise<TemporalComparisonData> {
  const userId = await getUserId();
  return getTemporalComparison(userId, startMonth, endMonth);
}
