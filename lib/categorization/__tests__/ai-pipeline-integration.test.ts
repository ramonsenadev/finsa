import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the AI adapter module
vi.mock("../ai-adapter", () => ({
  getAIProvider: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    category: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    categorizationRule: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

import { getAIProvider } from "../ai-adapter";
import { categorizeBatchWithAI } from "../strategies/ai-categorization";
import { prisma } from "@/lib/db";

const mockedGetAIProvider = vi.mocked(getAIProvider);
const mockedCategoryFindMany = vi.mocked(prisma.category.findMany);
const mockedRuleFindMany = vi.mocked(prisma.categorizationRule.findMany);

describe("categorizeBatchWithAI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty when no API key (provider is null)", async () => {
    mockedGetAIProvider.mockReturnValue(null);

    const results = await categorizeBatchWithAI("user-1", [
      "Padaria São Jorge",
      "Clinica Odonto",
    ]);

    expect(results).toHaveLength(0);
  });

  it("returns empty for empty descriptions", async () => {
    mockedGetAIProvider.mockReturnValue({
      categorizeBatch: vi.fn(),
    });

    const results = await categorizeBatchWithAI("user-1", []);
    expect(results).toHaveLength(0);
  });

  it("categorizes with AI and separates by confidence threshold", async () => {
    const mockProvider = {
      categorizeBatch: vi.fn().mockResolvedValue([
        { transactionIndex: 0, categoryId: "cat-alimentacao", confidence: 0.95 },
        { transactionIndex: 1, categoryId: "cat-saude", confidence: 0.75 },
        { transactionIndex: 2, categoryId: "cat-transporte", confidence: 0.92 },
      ]),
    };

    mockedGetAIProvider.mockReturnValue(mockProvider);

    mockedCategoryFindMany.mockResolvedValue([
      {
        id: "cat-alimentacao",
        name: "Alimentação",
        children: [{ id: "cat-restaurantes", name: "Restaurantes" }],
      },
      {
        id: "cat-saude",
        name: "Saúde",
        children: [],
      },
      {
        id: "cat-transporte",
        name: "Transporte",
        children: [],
      },
    ] as never);

    mockedRuleFindMany.mockResolvedValue([] as never);

    const results = await categorizeBatchWithAI("user-1", [
      "Padaria São Jorge",
      "Clinica Odonto",
      "99app *99app",
    ]);

    expect(results).toHaveLength(3);

    // High confidence → auto-approved
    expect(results[0].autoApproved).toBe(true);
    expect(results[0].confidence).toBe(0.95);

    // Low confidence → manual review
    expect(results[1].autoApproved).toBe(false);
    expect(results[1].confidence).toBe(0.75);

    // >= 0.9 → auto-approved
    expect(results[2].autoApproved).toBe(true);
    expect(results[2].confidence).toBe(0.92);
  });

  it("filters out results with invalid categoryIds", async () => {
    const mockProvider = {
      categorizeBatch: vi.fn().mockResolvedValue([
        { transactionIndex: 0, categoryId: "cat-alimentacao", confidence: 0.95 },
        { transactionIndex: 1, categoryId: "cat-nonexistent", confidence: 0.9 },
      ]),
    };

    mockedGetAIProvider.mockReturnValue(mockProvider);

    mockedCategoryFindMany.mockResolvedValue([
      {
        id: "cat-alimentacao",
        name: "Alimentação",
        children: [],
      },
    ] as never);

    mockedRuleFindMany.mockResolvedValue([] as never);

    const results = await categorizeBatchWithAI("user-1", [
      "Padaria São Jorge",
      "Unknown Store",
    ]);

    expect(results).toHaveLength(1);
    expect(results[0].categoryId).toBe("cat-alimentacao");
  });
});

describe("pipeline without API key", () => {
  it("pipeline continues without error when AI provider is null", async () => {
    mockedGetAIProvider.mockReturnValue(null);

    const results = await categorizeBatchWithAI("user-1", [
      "Padaria São Jorge",
      "Unknown Store",
    ]);

    // Should return empty, not throw
    expect(results).toEqual([]);
  });
});
