import Anthropic from "@anthropic-ai/sdk";

export interface AICategorizationItem {
  transactionIndex: number;
  categoryId: string;
  confidence: number;
}

export interface AIProvider {
  categorizeBatch(
    descriptions: string[],
    categories: { id: string; name: string; subcategories: string[] }[],
    examples: { description: string; categoryName: string }[]
  ): Promise<AICategorizationItem[]>;
}

const MAX_BATCH_SIZE = 50;
const MIN_REQUEST_INTERVAL_MS = 1000;

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private lastRequestAt = 0;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async categorizeBatch(
    descriptions: string[],
    categories: { id: string; name: string; subcategories: string[] }[],
    examples: { description: string; categoryName: string }[]
  ): Promise<AICategorizationItem[]> {
    if (descriptions.length === 0) return [];

    const batches = this.chunk(descriptions, MAX_BATCH_SIZE);
    const allResults: AICategorizationItem[] = [];
    let globalOffset = 0;

    for (const batch of batches) {
      await this.rateLimit();
      const results = await this.callAPI(batch, categories, examples, globalOffset);
      allResults.push(...results);
      globalOffset += batch.length;
    }

    return allResults;
  }

  private async callAPI(
    descriptions: string[],
    categories: { id: string; name: string; subcategories: string[] }[],
    examples: { description: string; categoryName: string }[],
    indexOffset: number
  ): Promise<AICategorizationItem[]> {
    const categoryList = categories
      .map((c) => {
        const subs = c.subcategories.length > 0 ? ` (${c.subcategories.join(", ")})` : "";
        return `- ${c.name}${subs} → id: ${c.id}`;
      })
      .join("\n");

    const transactionList = descriptions
      .map((d, i) => `${i}: "${d}"`)
      .join("\n");

    const exampleBlock =
      examples.length > 0
        ? `\nExemplos de categorizações anteriores bem-sucedidas:\n${examples.map((e) => `- "${e.description}" → ${e.categoryName}`).join("\n")}\n`
        : "";

    const prompt = `Você é um assistente de categorização financeira. Categorize as transações de cartão de crédito abaixo nas categorias disponíveis.

Categorias disponíveis:
${categoryList}
${exampleBlock}
Transações para categorizar:
${transactionList}

Responda APENAS com um JSON array, sem markdown, sem explicação. Cada elemento deve ter:
- transactionIndex: número do índice da transação
- categoryId: id da categoria escolhida
- confidence: número de 0 a 1 indicando sua confiança

Exemplo de resposta:
[{"transactionIndex": 0, "categoryId": "cat-alimentacao", "confidence": 0.95}]`;

    const response = await this.client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    return this.parseResponse(text, indexOffset);
  }

  private parseResponse(text: string, indexOffset: number): AICategorizationItem[] {
    try {
      // Extract JSON array from response (handle potential markdown wrapping)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const parsed = JSON.parse(jsonMatch[0]) as unknown[];

      return parsed
        .filter(
          (item): item is { transactionIndex: number; categoryId: string; confidence: number } =>
            typeof item === "object" &&
            item !== null &&
            "transactionIndex" in item &&
            "categoryId" in item &&
            "confidence" in item &&
            typeof (item as Record<string, unknown>).transactionIndex === "number" &&
            typeof (item as Record<string, unknown>).categoryId === "string" &&
            typeof (item as Record<string, unknown>).confidence === "number"
        )
        .map((item) => ({
          transactionIndex: item.transactionIndex + indexOffset,
          categoryId: item.categoryId,
          confidence: Math.max(0, Math.min(1, item.confidence)),
        }));
    } catch {
      console.warn("[AI Categorization] Failed to parse AI response:", text.slice(0, 200));
      return [];
    }
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestAt;
    if (elapsed < MIN_REQUEST_INTERVAL_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - elapsed));
    }
    this.lastRequestAt = Date.now();
  }

  private chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

let providerInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[AI Categorization] ANTHROPIC_API_KEY not configured — skipping AI step");
    return null;
  }

  if (!providerInstance) {
    providerInstance = new AnthropicProvider(apiKey);
  }

  return providerInstance;
}
