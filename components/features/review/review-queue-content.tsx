"use client";

import { useState, useCallback, useEffect } from "react";
import { ReviewQueueTable } from "./review-queue-table";
import { ReviewQueueFilters } from "./review-queue-filters";
import {
  getReviewQueueTransactions,
  getCategories,
  getImportsForFilter,
} from "@/app/transactions/review/actions";
import { Loader2 } from "lucide-react";

type ReviewTransaction = {
  id: string;
  date: string;
  description: string;
  originalTitle: string;
  amount: number;
  categoryId: string | null;
  categoryName: string | null;
  categorizationMethod: string | null;
  cardName: string | null;
  importId: string | null;
  importFileName: string | null;
};

type Category = {
  id: string;
  name: string;
  parentId: string | null;
  icon: string | null;
  color: string | null;
};

type ImportOption = {
  id: string;
  fileName: string;
  importedAt: Date;
};

export function ReviewQueueContent() {
  const [transactions, setTransactions] = useState<ReviewTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imports, setImports] = useState<ImportOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [importId, setImportId] = useState("all");
  const [hasSuggestion, setHasSuggestion] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "description">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [txs, cats, imps] = await Promise.all([
        getReviewQueueTransactions({
          importId: importId !== "all" ? importId : undefined,
          sortBy,
          sortDir,
        }),
        getCategories(),
        getImportsForFilter(),
      ]);

      let filtered = txs;
      if (hasSuggestion === "with") {
        filtered = txs.filter((t) => t.categorizationMethod === "ai");
      } else if (hasSuggestion === "without") {
        filtered = txs.filter((t) => !t.categorizationMethod);
      }

      setTransactions(filtered);
      setCategories(cats);
      setImports(imps);
    } finally {
      setIsLoading(false);
    }
  }, [importId, hasSuggestion, sortBy, sortDir]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleSortChange(field: "date" | "amount" | "description") {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir(field === "description" ? "asc" : "desc");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ReviewQueueFilters
        imports={imports}
        importId={importId}
        hasSuggestion={hasSuggestion}
        onImportChange={setImportId}
        onSuggestionChange={setHasSuggestion}
      />

      <ReviewQueueTable
        transactions={transactions}
        categories={categories}
        onSortChange={handleSortChange}
      />
    </div>
  );
}
