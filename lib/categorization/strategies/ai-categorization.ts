import { prisma } from "@/lib/db";
import { getAIProvider } from "../ai-adapter";
import type { AICategorizationItem } from "../ai-adapter";

export interface AICategorizationResult {
  originalTitle: string;
  categoryId: string;
  confidence: number;
  autoApproved: boolean; // confidence >= 0.9
}

const AUTO_APPROVE_THRESHOLD = 0.9;

export async function categorizeBatchWithAI(
  userId: string,
  descriptions: string[]
): Promise<AICategorizationResult[]> {
  const provider = getAIProvider();
  if (!provider) return [];

  if (descriptions.length === 0) return [];

  const [categories, topRules] = await Promise.all([
    loadCategories(userId),
    loadFewShotExamples(userId),
  ]);

  const categoryInput = categories.map((c) => ({
    id: c.id,
    name: c.name,
    subcategories: c.children.map((ch) => ch.name),
  }));

  const examples = topRules.map((r) => ({
    description: r.matchPattern,
    categoryName: r.category.name,
  }));

  const aiResults = await provider.categorizeBatch(descriptions, categoryInput, examples);

  // Validate categoryIds against actual categories
  const validCategoryIds = new Set(
    categories.flatMap((c) => [c.id, ...c.children.map((ch) => ch.id)])
  );

  return aiResults
    .filter((item) => validCategoryIds.has(item.categoryId))
    .map((item: AICategorizationItem) => ({
      originalTitle: descriptions[item.transactionIndex] ?? "",
      categoryId: item.categoryId,
      confidence: item.confidence,
      autoApproved: item.confidence >= AUTO_APPROVE_THRESHOLD,
    }))
    .filter((r) => r.originalTitle !== "");
}

async function loadCategories(userId: string) {
  return prisma.category.findMany({
    where: {
      OR: [{ isSystem: true }, { userId }],
      parentId: null,
    },
    select: {
      id: true,
      name: true,
      children: { select: { id: true, name: true } },
    },
  });
}

async function loadFewShotExamples(userId: string) {
  return prisma.categorizationRule.findMany({
    where: { userId },
    orderBy: { usageCount: "desc" },
    take: 20,
    include: { category: { select: { name: true } } },
  });
}
