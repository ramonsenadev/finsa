"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MonthSelector, getCurrentMonthRef } from "@/components/ui/month-selector";
import { ISSUER_LABELS, ISSUER_COLORS, type Issuer } from "@/lib/validations/card";
import {
  fetchCardDetail,
  fetchCardEvolution,
  fetchCardMonthlySummary,
  fetchCardCategories,
  fetchCardImports,
  fetchCardTransactions,
  fetchAllCategories,
} from "@/app/cards/[cardId]/actions";
import { CardEvolutionChart } from "./card-evolution-chart";
import { CardSummaryCards } from "./card-summary-cards";
import { CardCategoryBreakdown } from "./card-category-breakdown";
import { CardImportsHistory } from "./card-imports-history";
import { CardTransactionsList } from "./card-transactions-list";

interface CardDetailContentProps {
  cardId: string;
}

export function CardDetailContent({ cardId }: CardDetailContentProps) {
  const [monthRef, setMonthRef] = useState(getCurrentMonthRef());
  const [txPage, setTxPage] = useState(1);
  const [txFilters, setTxFilters] = useState<{
    categoryId?: string;
    minAmount?: number;
    maxAmount?: number;
    isRecurring?: boolean;
  }>({});

  const { data: card, isLoading: cardLoading } = useQuery({
    queryKey: ["card-detail", cardId],
    queryFn: () => fetchCardDetail(cardId),
  });

  const { data: evolution } = useQuery({
    queryKey: ["card-evolution", cardId],
    queryFn: () => fetchCardEvolution(cardId),
  });

  const { data: summary } = useQuery({
    queryKey: ["card-summary", cardId, monthRef],
    queryFn: () => fetchCardMonthlySummary(cardId, monthRef),
  });

  const { data: categories } = useQuery({
    queryKey: ["card-categories", cardId, monthRef],
    queryFn: () => fetchCardCategories(cardId, monthRef),
  });

  const { data: imports } = useQuery({
    queryKey: ["card-imports", cardId],
    queryFn: () => fetchCardImports(cardId),
  });

  const { data: txResult, refetch: refetchTx } = useQuery({
    queryKey: ["card-transactions", cardId, monthRef, txPage, txFilters],
    queryFn: () =>
      fetchCardTransactions(cardId, {
        monthRef,
        page: txPage,
        ...txFilters,
      }),
  });

  const { data: allCategories } = useQuery({
    queryKey: ["all-categories"],
    queryFn: () => fetchAllCategories(),
  });

  if (cardLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-foreground-secondary">
        Carregando...
      </div>
    );
  }

  if (!card) {
    return (
      <div className="text-sm text-foreground-secondary">
        Cartão não encontrado.
      </div>
    );
  }

  const issuer = card.issuer as Issuer;
  const issuerColor = ISSUER_COLORS[issuer] ?? ISSUER_COLORS.outro;
  const issuerLabel = ISSUER_LABELS[issuer] ?? card.issuer;

  function handleMonthChange(newMonth: string) {
    setMonthRef(newMonth);
    setTxPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/cards"
        className="inline-flex items-center gap-1.5 text-sm text-foreground-secondary hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para cartões
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${issuerColor}15` }}
        >
          <CreditCard className="h-6 w-6" style={{ color: issuerColor }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{card.name}</h1>
            <Badge
              className="text-xs font-medium text-white"
              style={{ backgroundColor: issuerColor }}
            >
              {issuerLabel}
            </Badge>
            {!card.isActive && (
              <Badge variant="outline" className="text-xs text-foreground-secondary">
                Inativo
              </Badge>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-foreground-secondary">
            {card.lastFourDigits && <span>**** {card.lastFourDigits}</span>}
            {card.holderName && (
              <>
                {card.lastFourDigits && <span>·</span>}
                <span>{card.holderName}</span>
              </>
            )}
          </div>
        </div>

        {/* Month selector */}
        <MonthSelector monthRef={monthRef} onChange={handleMonthChange} />
      </div>

      {/* Evolution chart */}
      <CardEvolutionChart data={evolution ?? []} />

      {/* Summary + Categories row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CardSummaryCards summary={summary ?? null} monthRef={monthRef} />
        <CardCategoryBreakdown data={categories ?? []} />
      </div>

      {/* Import history */}
      <CardImportsHistory imports={imports ?? []} />

      {/* Transactions */}
      <CardTransactionsList
        result={txResult ?? null}
        categories={allCategories ?? []}
        filters={txFilters}
        onFiltersChange={(f) => {
          setTxFilters(f);
          setTxPage(1);
        }}
        page={txPage}
        onPageChange={setTxPage}
        onRecategorized={() => refetchTx()}
      />
    </div>
  );
}
