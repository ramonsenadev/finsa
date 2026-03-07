import { prisma } from "@/lib/db";

export interface CategorizationResult {
  categoryId: string;
  categoryName: string;
  method: "rule";
  ruleId: string;
}

export async function categorizeByRules(
  userId: string,
  descriptions: string[]
): Promise<Map<string, CategorizationResult>> {
  const rules = await prisma.categorizationRule.findMany({
    where: { userId },
    include: { category: { select: { name: true } } },
    orderBy: { usageCount: "desc" },
  });

  const results = new Map<string, CategorizationResult>();

  for (const description of descriptions) {
    const normalized = description.toLowerCase().trim();

    // 1. Exact match
    for (const rule of rules) {
      if (rule.matchType === "exact" && normalized === rule.matchPattern.toLowerCase()) {
        results.set(description, {
          categoryId: rule.categoryId,
          categoryName: rule.category.name,
          method: "rule",
          ruleId: rule.id,
        });
        break;
      }
    }
    if (results.has(description)) continue;

    // 2. Contains match
    for (const rule of rules) {
      if (
        rule.matchType === "contains" &&
        normalized.includes(rule.matchPattern.toLowerCase())
      ) {
        results.set(description, {
          categoryId: rule.categoryId,
          categoryName: rule.category.name,
          method: "rule",
          ruleId: rule.id,
        });
        break;
      }
    }
    if (results.has(description)) continue;

    // 3. Regex match
    for (const rule of rules) {
      if (rule.matchType === "regex") {
        try {
          const regex = new RegExp(rule.matchPattern, "i");
          if (regex.test(description)) {
            results.set(description, {
              categoryId: rule.categoryId,
              categoryName: rule.category.name,
              method: "rule",
              ruleId: rule.id,
            });
            break;
          }
        } catch {
          // Invalid regex, skip
        }
      }
    }
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
