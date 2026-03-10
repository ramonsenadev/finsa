"use client";

import { TrendingUp, Calculator, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/format";
import type { CardMonthlySummary } from "@/lib/analytics/card-detail";

interface CardSummaryCardsProps {
  summary: CardMonthlySummary | null;
  monthRef: string;
}

export function CardSummaryCards({ summary, monthRef }: CardSummaryCardsProps) {
  const [y, m] = monthRef.split("-");
  const date = new Date(parseInt(y), parseInt(m) - 1);
  const monthLabel = date.toLocaleDateString("pt-BR", { month: "long" });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Resumo de{" "}
          <span className="capitalize">{monthLabel}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!summary ? (
          <div className="flex h-24 items-center justify-center text-sm text-foreground-secondary">
            Carregando...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/10">
                <TrendingUp className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">Total do mês</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatBRL(summary.total)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/10">
                <Calculator className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">Média mensal</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatBRL(summary.average)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-warning/10">
                <Trophy className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">Maior gasto</p>
                {summary.maxExpense ? (
                  <>
                    <p className="text-lg font-semibold text-foreground">
                      {formatBRL(summary.maxExpense.amount)}
                    </p>
                    <p className="text-xs text-foreground-secondary truncate max-w-[200px]">
                      {summary.maxExpense.description}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-foreground-secondary">—</p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
