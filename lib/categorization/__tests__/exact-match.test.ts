import { describe, it, expect } from "vitest";
import { ExactMatchStrategy } from "../strategies/exact-match";
import type { RuleInput } from "../types";

const strategy = new ExactMatchStrategy();

const rules: RuleInput[] = [
  {
    id: "rule-1",
    matchPattern: "g barbosa",
    matchType: "exact",
    categoryId: "cat-supermercado",
    confidence: 1.0,
  },
  {
    id: "rule-2",
    matchPattern: "Netflix.Com",
    matchType: "exact",
    categoryId: "cat-streaming",
    confidence: 1.0,
  },
  {
    id: "rule-3",
    matchPattern: "ifood",
    matchType: "contains",
    categoryId: "cat-delivery",
    confidence: 0.9,
  },
];

describe("ExactMatchStrategy", () => {
  it("matches case-insensitively with trim", () => {
    const result = strategy.categorize("G Barbosa", rules);
    expect(result).not.toBeNull();
    expect(result!.categoryId).toBe("cat-supermercado");
    expect(result!.confidence).toBe(1.0);
    expect(result!.method).toBe("exact");
    expect(result!.ruleId).toBe("rule-1");
  });

  it("matches with different casing", () => {
    const result = strategy.categorize("  NETFLIX.COM  ", rules);
    expect(result).not.toBeNull();
    expect(result!.categoryId).toBe("cat-streaming");
  });

  it("returns null for no match", () => {
    const result = strategy.categorize("Random Store", rules);
    expect(result).toBeNull();
  });

  it("ignores non-exact rules", () => {
    const result = strategy.categorize("ifood", rules);
    expect(result).toBeNull();
  });
});
