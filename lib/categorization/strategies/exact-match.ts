import { normalizeTitle } from "../normalizer";
import type { CategorizationStrategy, CategoryMatch, RuleInput } from "../types";

export class ExactMatchStrategy implements CategorizationStrategy {
  categorize(title: string, rules: RuleInput[]): CategoryMatch | null {
    const normalized = normalizeTitle(title);

    for (const rule of rules) {
      if (rule.matchType !== "exact") continue;

      if (normalizeTitle(rule.matchPattern) === normalized) {
        return {
          categoryId: rule.categoryId,
          confidence: 1.0,
          method: "exact",
          ruleId: rule.id,
        };
      }
    }

    return null;
  }
}
