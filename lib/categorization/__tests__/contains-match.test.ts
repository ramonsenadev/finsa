import { describe, it, expect } from "vitest";
import { ContainsMatchStrategy } from "../strategies/contains-match";
import type { RuleInput } from "../types";

const strategy = new ContainsMatchStrategy();

const rules: RuleInput[] = [
  {
    id: "rule-1",
    matchPattern: "Ifd*Ifood Club",
    matchType: "contains",
    categoryId: "cat-apps",
    confidence: 1.0,
  },
  {
    id: "rule-2",
    matchPattern: "Ifd*",
    matchType: "contains",
    categoryId: "cat-delivery",
    confidence: 0.9,
  },
  {
    id: "rule-3",
    matchPattern: "Netflix",
    matchType: "contains",
    categoryId: "cat-streaming",
    confidence: 0.95,
  },
  {
    id: "rule-4",
    matchPattern: "^Nu Seguro\\b",
    matchType: "regex",
    categoryId: "cat-seguros",
    confidence: 0.9,
  },
  {
    id: "rule-exact",
    matchPattern: "g barbosa",
    matchType: "exact",
    categoryId: "cat-super",
    confidence: 1.0,
  },
];

describe("ContainsMatchStrategy", () => {
  it("matches contains rule with longer pattern first", () => {
    const result = strategy.categorize("Ifd*Ifood Club", rules);
    expect(result).not.toBeNull();
    expect(result!.categoryId).toBe("cat-apps");
    expect(result!.ruleId).toBe("rule-1");
  });

  it("matches shorter contains pattern when longer doesn't match", () => {
    const result = strategy.categorize("Ifd*Ifood Restaurante", rules);
    expect(result).not.toBeNull();
    expect(result!.categoryId).toBe("cat-delivery");
    expect(result!.ruleId).toBe("rule-2");
  });

  it("matches Netflix in longer title", () => {
    const result = strategy.categorize("Netflix.Com - Mensal", rules);
    expect(result).not.toBeNull();
    expect(result!.categoryId).toBe("cat-streaming");
  });

  it("matches regex rule", () => {
    const result = strategy.categorize("Nu Seguro Vida", rules);
    expect(result).not.toBeNull();
    expect(result!.categoryId).toBe("cat-seguros");
    expect(result!.method).toBe("regex");
  });

  it("ignores exact rules", () => {
    const result = strategy.categorize("g barbosa", rules);
    // Contains strategy should not match exact rules
    expect(result).toBeNull();
  });

  it("returns null for no match", () => {
    const result = strategy.categorize("Random Store XYZ", rules);
    expect(result).toBeNull();
  });
});
