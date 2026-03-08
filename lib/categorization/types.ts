export interface TransactionInput {
  originalTitle: string;
}

export interface RuleInput {
  id: string;
  matchPattern: string;
  matchType: "exact" | "contains" | "regex";
  categoryId: string;
  confidence: number;
}

export interface CategoryMatch {
  categoryId: string;
  confidence: number;
  method: "exact" | "contains" | "regex" | "ai";
  ruleId: string;
}

export interface CategorizationStrategy {
  categorize(title: string, rules: RuleInput[]): CategoryMatch | null;
}

export interface CategorizationResult {
  categorized: CategorizedTransaction[];
  uncategorized: string[];
  stats: {
    byExact: number;
    byContains: number;
    byRegex: number;
    byAi: number;
    uncategorized: number;
  };
  ruleUsage: Map<string, number>;
}

export interface CategorizedTransaction {
  originalTitle: string;
  match: CategoryMatch;
}
