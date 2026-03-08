import { ExactMatchStrategy } from "./strategies/exact-match";
import { ContainsMatchStrategy } from "./strategies/contains-match";
import type { CategorizationResult, RuleInput } from "./types";

const strategies = [new ExactMatchStrategy(), new ContainsMatchStrategy()];

export function categorizePipeline(
  titles: string[],
  rules: RuleInput[]
): CategorizationResult {
  const result: CategorizationResult = {
    categorized: [],
    uncategorized: [],
    stats: { byExact: 0, byContains: 0, byRegex: 0, byAi: 0, uncategorized: 0 },
    ruleUsage: new Map(),
  };

  for (const title of titles) {
    let matched = false;

    for (const strategy of strategies) {
      const match = strategy.categorize(title, rules);
      if (match) {
        result.categorized.push({ originalTitle: title, match });

        if (match.method === "exact") result.stats.byExact++;
        else if (match.method === "contains") result.stats.byContains++;
        else if (match.method === "regex") result.stats.byRegex++;

        const count = result.ruleUsage.get(match.ruleId) ?? 0;
        result.ruleUsage.set(match.ruleId, count + 1);

        matched = true;
        break;
      }
    }

    if (!matched) {
      result.uncategorized.push(title);
      result.stats.uncategorized++;
    }
  }

  return result;
}
