import { prisma } from "@/lib/db";
import { categorizePipeline } from "./pipeline";
import { categorizeBatchWithAI } from "./strategies/ai-categorization";
import type { RuleInput, CategorizationResult as PipelineResult } from "./types";

export interface CategorizationResult {
  categoryId: string;
  categoryName: string;
  method: "rule" | "ai";
  ruleId?: string;
  confidence?: number;
  autoApproved?: boolean;
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

export async function categorizeWithAI(
  userId: string,
  descriptions: string[],
  ruleResults: Map<string, CategorizationResult>
): Promise<Map<string, CategorizationResult>> {
  const uncategorized = descriptions.filter((d) => !ruleResults.has(d));
  if (uncategorized.length === 0) return new Map();

  const aiResults = await categorizeBatchWithAI(userId, uncategorized);
  const results = new Map<string, CategorizationResult>();

  // Load category names for AI results
  const categoryIds = [...new Set(aiResults.map((r) => r.categoryId))];
  const categories = categoryIds.length > 0
    ? await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true },
      })
    : [];
  const categoryNameMap = new Map(categories.map((c) => [c.id, c.name]));

  for (const item of aiResults) {
    results.set(item.originalTitle, {
      categoryId: item.categoryId,
      categoryName: categoryNameMap.get(item.categoryId) ?? "",
      method: "ai",
      confidence: item.confidence,
      autoApproved: item.autoApproved,
    });
  }

  const autoApproved = aiResults.filter((r) => r.autoApproved).length;
  const manualReview = aiResults.filter((r) => !r.autoApproved).length;
  console.log(
    `[AI Categorization] ${aiResults.length} categorized by AI (${autoApproved} auto-approved, ${manualReview} for review)`
  );

  return results;
}

export async function categorizeFullPipeline(
  userId: string,
  descriptions: string[]
): Promise<{
  byRules: number;
  byAi: number;
  aiAutoApproved: number;
  manual: number;
  results: Map<string, CategorizationResult>;
}> {
  const ruleResults = await categorizeByRules(userId, descriptions);
  const aiResults = await categorizeWithAI(userId, descriptions, ruleResults);

  // Merge results (rules take priority)
  const allResults = new Map<string, CategorizationResult>(ruleResults);
  for (const [key, value] of aiResults) {
    if (!allResults.has(key)) {
      allResults.set(key, value);
    }
  }

  const aiAutoApproved = [...aiResults.values()].filter((r) => r.autoApproved).length;

  return {
    byRules: ruleResults.size,
    byAi: aiResults.size,
    aiAutoApproved,
    manual: descriptions.length - allResults.size,
    results: allResults,
  };
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
  const { byRules, byAi, manual, results } = await categorizeFullPipeline(
    userId,
    descriptions
  );

  return { byRules, byAi, manual, results };
}

export { categorizePipeline } from "./pipeline";
export type { RuleInput, PipelineResult };
