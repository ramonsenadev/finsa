import { prisma } from "@/lib/db";
import { categorizePipeline } from "./pipeline";
import type { RuleInput, CategorizationResult as PipelineResult } from "./types";

export interface CategorizationResult {
  categoryId: string;
  categoryName: string;
  method: "rule";
  ruleId: string;
}

async function loadRules(userId: string) {
  return prisma.categorizationRule.findMany({
    where: { userId },
    include: { category: { select: { name: true } } },
    orderBy: { usageCount: "desc" },
  });
}

function toRuleInputs(
  dbRules: Awaited<ReturnType<typeof loadRules>>
): RuleInput[] {
  return dbRules.map((r) => ({
    id: r.id,
    matchPattern: r.matchPattern,
    matchType: r.matchType as RuleInput["matchType"],
    categoryId: r.categoryId,
    confidence: r.confidence ? Number(r.confidence) : 1.0,
  }));
}

export async function categorizeByRules(
  userId: string,
  descriptions: string[]
): Promise<Map<string, CategorizationResult>> {
  const dbRules = await loadRules(userId);
  const ruleInputs = toRuleInputs(dbRules);
  const categoryNameMap = new Map(
    dbRules.map((r) => [r.categoryId, r.category.name])
  );

  const pipelineResult = categorizePipeline(descriptions, ruleInputs);
  const results = new Map<string, CategorizationResult>();

  for (const item of pipelineResult.categorized) {
    results.set(item.originalTitle, {
      categoryId: item.match.categoryId,
      categoryName: categoryNameMap.get(item.match.categoryId) ?? "",
      method: "rule",
      ruleId: item.match.ruleId,
    });
  }

  return results;
}

export async function categorizeDryRun(
  userId: string,
  descriptions: string[]
): Promise<{
  byRules: number;
  byAi: number;
  manual: number;
  results: Map<string, CategorizationResult>;
}> {
  const results = await categorizeByRules(userId, descriptions);

  return {
    byRules: results.size,
    byAi: 0, // AI not implemented yet
    manual: descriptions.length - results.size,
    results,
  };
}

export { categorizePipeline } from "./pipeline";
export type { RuleInput, PipelineResult };
