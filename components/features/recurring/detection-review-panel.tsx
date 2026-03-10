"use client";

import { useState, useTransition } from "react";
import { Sparkles, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  acceptRecurringCandidate,
  dismissRecurringCandidate,
} from "@/app/recurring/actions";
import type { RecurrenceCandidate } from "@/lib/recurring/detection-engine";

const MONTH_SHORT: Record<string, string> = {
  "01": "Jan",
  "02": "Fev",
  "03": "Mar",
  "04": "Abr",
  "05": "Mai",
  "06": "Jun",
  "07": "Jul",
  "08": "Ago",
  "09": "Set",
  "10": "Out",
  "11": "Nov",
  "12": "Dez",
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatMonthBadge(month: string): string {
  const [year, m] = month.split("-");
  return `${MONTH_SHORT[m] ?? m}/${year.slice(2)}`;
}

interface DetectionReviewPanelProps {
  candidates: RecurrenceCandidate[];
}

export function DetectionReviewPanel({
  candidates: initialCandidates,
}: DetectionReviewPanelProps) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (candidates.length === 0) return null;

  function handleAccept(candidate: RecurrenceCandidate) {
    startTransition(async () => {
      const result = await acceptRecurringCandidate({
        title: candidate.title,
        normalizedTitle: candidate.normalizedTitle,
        averageAmount: candidate.averageAmount,
        categoryId: candidate.suggestedCategoryId,
        sourceType: candidate.sourceType,
        dayOfMonth: null,
      });
      if (result.success) {
        setCandidates((prev) =>
          prev.filter((c) => c.normalizedTitle !== candidate.normalizedTitle)
        );
      }
    });
  }

  function handleDismiss(candidate: RecurrenceCandidate) {
    startTransition(async () => {
      const result = await dismissRecurringCandidate(
        candidate.normalizedTitle
      );
      if (result.success) {
        setCandidates((prev) =>
          prev.filter((c) => c.normalizedTitle !== candidate.normalizedTitle)
        );
      }
    });
  }

  const visibleCandidates = expanded ? candidates : candidates.slice(0, 5);

  return (
    <div className="rounded-lg border border-amber-300/50 bg-amber-50 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-600" />
        <h2 className="text-base font-semibold">
          Identificamos {candidates.length} transaç
          {candidates.length === 1 ? "ão" : "ões"} que parece
          {candidates.length === 1 ? "" : "m"} ser recorrente
          {candidates.length === 1 ? "" : "s"}
        </h2>
      </div>

      <div className="space-y-2">
        {visibleCandidates.map((candidate) => (
          <div
            key={candidate.normalizedTitle}
            className="rounded-md border border-border bg-card px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{candidate.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground-secondary">
                    {formatCurrency(candidate.averageAmount)}/mês
                  </span>
                  {candidate.suggestedCategoryName && (
                    <>
                      <span className="text-foreground-secondary">·</span>
                      <span className="text-sm text-foreground-secondary">
                        {candidate.suggestedCategoryName}
                      </span>
                    </>
                  )}
                  <span className="text-foreground-secondary">·</span>
                  <span className="text-sm text-foreground-secondary">
                    {candidate.frequency} meses
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {candidate.months.map((m) => (
                    <Badge
                      key={m}
                      variant="secondary"
                      className="text-xs"
                    >
                      {formatMonthBadge(m)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                  onClick={() => handleAccept(candidate)}
                  disabled={isPending}
                >
                  <Check className="h-4 w-4" />
                  <span className="hidden sm:inline">Marcar</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 text-foreground-secondary hover:text-foreground"
                  onClick={() => handleDismiss(candidate)}
                  disabled={isPending}
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Ignorar</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {candidates.length > 5 && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full text-amber-700 hover:text-amber-800"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="mr-1.5 h-4 w-4" />
              Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown className="mr-1.5 h-4 w-4" />
              Ver mais {candidates.length - 5} sugestões
            </>
          )}
        </Button>
      )}
    </div>
  );
}
