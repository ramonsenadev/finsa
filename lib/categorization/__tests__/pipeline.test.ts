import { describe, it, expect } from "vitest";
import { categorizePipeline } from "../pipeline";
import type { RuleInput } from "../types";

const rules: RuleInput[] = [
  {
    id: "rule-exact-gbarbosa",
    matchPattern: "G Barbosa",
    matchType: "exact",
    categoryId: "cat-supermercado",
    confidence: 1.0,
  },
  {
    id: "rule-contains-ifood",
    matchPattern: "Ifd*",
    matchType: "contains",
    categoryId: "cat-delivery",
    confidence: 0.9,
  },
  {
    id: "rule-contains-netflix",
    matchPattern: "Netflix",
    matchType: "contains",
    categoryId: "cat-streaming",
    confidence: 0.95,
  },
  {
    id: "rule-contains-nutag",
    matchPattern: "NuTag",
    matchType: "contains",
    categoryId: "cat-pedagio",
    confidence: 1.0,
  },
  {
    id: "rule-contains-nuseguro",
    matchPattern: "Nu Seguro",
    matchType: "contains",
    categoryId: "cat-seguros",
    confidence: 1.0,
  },
  {
    id: "rule-contains-amazon",
    matchPattern: "Amazon",
    matchType: "contains",
    categoryId: "cat-ecommerce",
    confidence: 0.9,
  },
  {
    id: "rule-contains-shopee",
    matchPattern: "Shopee",
    matchType: "contains",
    categoryId: "cat-ecommerce",
    confidence: 0.9,
  },
  {
    id: "rule-contains-99app",
    matchPattern: "99app",
    matchType: "contains",
    categoryId: "cat-uber99",
    confidence: 0.9,
  },
];

describe("categorizePipeline", () => {
  it("categorizes a mix of transactions in correct order", () => {
    const titles = [
      "G Barbosa",
      "Ifd*Ifood Restaurante",
      "Netflix.Com",
      "NuTag Pedagio",
      "Nu Seguro Vida",
      "Amazon Marketplace - Parcela 2/2",
      "Shopee Brasil",
      "99app *99app",
      "Padaria Sao Jorge",
      "Clinica Odonto Saude",
    ];

    const result = categorizePipeline(titles, rules);

    // 8 should be categorized, 2 uncategorized
    expect(result.categorized).toHaveLength(8);
    expect(result.uncategorized).toHaveLength(2);
    expect(result.uncategorized).toContain("Padaria Sao Jorge");
    expect(result.uncategorized).toContain("Clinica Odonto Saude");

    // Verify stats
    expect(result.stats.byExact).toBe(1); // G Barbosa
    expect(result.stats.byContains).toBe(7); // rest matched by contains
    expect(result.stats.uncategorized).toBe(2);
  });

  it("exact match takes priority over contains", () => {
    const mixedRules: RuleInput[] = [
      {
        id: "rule-exact",
        matchPattern: "G Barbosa",
        matchType: "exact",
        categoryId: "cat-exact",
        confidence: 1.0,
      },
      {
        id: "rule-contains",
        matchPattern: "Barbosa",
        matchType: "contains",
        categoryId: "cat-contains",
        confidence: 0.8,
      },
    ];

    const result = categorizePipeline(["G Barbosa"], mixedRules);
    expect(result.categorized[0].match.categoryId).toBe("cat-exact");
    expect(result.categorized[0].match.method).toBe("exact");
  });

  it("tracks rule usage correctly", () => {
    const titles = [
      "Ifd*Ifood A",
      "Ifd*Ifood B",
      "Netflix.Com",
    ];

    const result = categorizePipeline(titles, rules);
    expect(result.ruleUsage.get("rule-contains-ifood")).toBe(2);
    expect(result.ruleUsage.get("rule-contains-netflix")).toBe(1);
  });

  it("returns empty results for empty input", () => {
    const result = categorizePipeline([], rules);
    expect(result.categorized).toHaveLength(0);
    expect(result.uncategorized).toHaveLength(0);
  });
});
