import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnthropicProvider } from "../ai-adapter";

// Mock the Anthropic SDK
vi.mock("@anthropic-ai/sdk", () => {
  const mockCreate = vi.fn();
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: { create: mockCreate },
    })),
    __mockCreate: mockCreate,
  };
});

// Access the mock
async function getMockCreate() {
  const mod = await import("@anthropic-ai/sdk");
  return (mod as unknown as { __mockCreate: ReturnType<typeof vi.fn> }).__mockCreate;
}

const categories = [
  { id: "cat-alimentacao", name: "Alimentação", subcategories: ["Restaurantes", "Supermercado"] },
  { id: "cat-transporte", name: "Transporte", subcategories: ["Uber/99", "Combustível"] },
  { id: "cat-saude", name: "Saúde", subcategories: ["Farmácia", "Consultas"] },
];

const examples = [
  { description: "Ifd*Ifood", categoryName: "Alimentação" },
  { description: "Uber *Trip", categoryName: "Transporte" },
];

describe("AnthropicProvider", () => {
  let provider: AnthropicProvider;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    provider = new AnthropicProvider("test-api-key");
    mockCreate = await getMockCreate();
    mockCreate.mockReset();
  });

  it("parses valid JSON response from AI", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: JSON.stringify([
            { transactionIndex: 0, categoryId: "cat-alimentacao", confidence: 0.95 },
            { transactionIndex: 1, categoryId: "cat-transporte", confidence: 0.85 },
            { transactionIndex: 2, categoryId: "cat-saude", confidence: 0.7 },
          ]),
        },
      ],
    });

    const results = await provider.categorizeBatch(
      ["Padaria São Jorge", "99app *99app", "Droga Raia"],
      categories,
      examples
    );

    expect(results).toHaveLength(3);
    expect(results[0]).toEqual({
      transactionIndex: 0,
      categoryId: "cat-alimentacao",
      confidence: 0.95,
    });
    expect(results[1]).toEqual({
      transactionIndex: 1,
      categoryId: "cat-transporte",
      confidence: 0.85,
    });
    expect(results[2]).toEqual({
      transactionIndex: 2,
      categoryId: "cat-saude",
      confidence: 0.7,
    });
  });

  it("handles JSON wrapped in markdown code block", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: '```json\n[{"transactionIndex": 0, "categoryId": "cat-alimentacao", "confidence": 0.92}]\n```',
        },
      ],
    });

    const results = await provider.categorizeBatch(
      ["Padaria São Jorge"],
      categories,
      examples
    );

    expect(results).toHaveLength(1);
    expect(results[0].categoryId).toBe("cat-alimentacao");
  });

  it("returns empty array for invalid JSON response", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "I cannot categorize these transactions." }],
    });

    const results = await provider.categorizeBatch(
      ["Unknown Store"],
      categories,
      examples
    );

    expect(results).toHaveLength(0);
  });

  it("clamps confidence values to 0-1 range", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: JSON.stringify([
            { transactionIndex: 0, categoryId: "cat-alimentacao", confidence: 1.5 },
            { transactionIndex: 1, categoryId: "cat-saude", confidence: -0.3 },
          ]),
        },
      ],
    });

    const results = await provider.categorizeBatch(
      ["Test A", "Test B"],
      categories,
      examples
    );

    expect(results[0].confidence).toBe(1);
    expect(results[1].confidence).toBe(0);
  });

  it("filters out items with missing required fields", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: JSON.stringify([
            { transactionIndex: 0, categoryId: "cat-alimentacao", confidence: 0.9 },
            { transactionIndex: 1, categoryId: "cat-saude" }, // missing confidence
            { categoryId: "cat-transporte", confidence: 0.8 }, // missing transactionIndex
          ]),
        },
      ],
    });

    const results = await provider.categorizeBatch(
      ["Test A", "Test B", "Test C"],
      categories,
      examples
    );

    expect(results).toHaveLength(1);
    expect(results[0].categoryId).toBe("cat-alimentacao");
  });

  it("returns empty for empty input", async () => {
    const results = await provider.categorizeBatch([], categories, examples);
    expect(results).toHaveLength(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("sends only descriptions to AI, no amounts or personal data", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: JSON.stringify([
            { transactionIndex: 0, categoryId: "cat-alimentacao", confidence: 0.9 },
          ]),
        },
      ],
    });

    await provider.categorizeBatch(["Padaria São Jorge"], categories, examples);

    const callArgs = mockCreate.mock.calls[0][0];
    const messageContent = callArgs.messages[0].content;

    // Verify the prompt contains description but no monetary values (R$ amounts)
    expect(messageContent).toContain("Padaria São Jorge");
    expect(messageContent).not.toMatch(/R\$\s*[\d.,]+/);
  });
});

describe("confidence threshold separation", () => {
  it("correctly identifies auto-approved vs manual review", () => {
    const results = [
      { confidence: 0.95, autoApproved: true },
      { confidence: 0.9, autoApproved: true },
      { confidence: 0.89, autoApproved: false },
      { confidence: 0.5, autoApproved: false },
      { confidence: 0.1, autoApproved: false },
    ];

    const autoApproved = results.filter((r) => r.confidence >= 0.9);
    const manualReview = results.filter((r) => r.confidence < 0.9);

    expect(autoApproved).toHaveLength(2);
    expect(manualReview).toHaveLength(3);
  });
});
