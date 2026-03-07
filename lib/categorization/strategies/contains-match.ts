import { normalizeTitle } from "../normalizer";
import type { CategorizationStrategy, CategoryMatch, RuleInput } from "../types";

export class ContainsMatchStrategy implements CategorizationStrategy {
  categorize(title: string, rules: RuleInput[]): CategoryMatch | null {
    const normalized = normalizeTitle(title);

    // Collect contains rules sorted by pattern length desc (most specific first)
    const containsRules = rules
      .filter((r) => r.matchType === "contains")
      .sort((a, b) => b.matchPattern.length - a.matchPattern.length);

    for (const rule of containsRules) {
      if (normalized.includes(normalizeTitle(rule.matchPattern))) {
        return {
          categoryId: rule.categoryId,
          confidence: rule.confidence,
          method: "contains",
          ruleId: rule.id,
        };
      }
    }

    // Regex rules
    const regexRules = rules.filter((r) => r.matchType === "regex");

    for (const rule of regexRules) {
      try {
        const regex = new RegExp(rule.matchPattern, "i");
        if (regex.test(title)) {
          return {
            categoryId: rule.categoryId,
            confidence: rule.confidence,
            method: "regex",
            ruleId: rule.id,
          };
        }
      } catch {
        // Invalid regex pattern, skip
      }
    }

    return null;
  }
}
