"use client";

import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatBRL } from "@/lib/format";
import Link from "next/link";

interface IndicatorCardProps {
  label: string;
  value: number | null;
  percentOfIncome?: number | null;
  previousValue?: number | null;
  invertTrend?: boolean; // true = lower is better (expenses)
  hasIncome: boolean;
}

function DeltaBadge({
  current,
  previous,
  invertTrend,
}: {
  current: number;
  previous: number;
  invertTrend?: boolean;
}) {
  if (previous === 0) return null;
  const delta = ((current - previous) / previous) * 100;
  const isPositive = delta > 0;
  const improved = invertTrend ? !isPositive : isPositive;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        improved ? "text-success" : "text-error"
      }`}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isPositive ? "+" : ""}
      {delta.toFixed(1)}%
    </span>
  );
}

function IndicatorCard({
  label,
  value,
  percentOfIncome,
  previousValue,
  invertTrend,
  hasIncome,
}: IndicatorCardProps) {
  const showEmpty = !hasIncome && label === "Renda Total";

  return (
    <Card className="gap-3 py-4">
      <div className="px-4">
        <p className="text-xs font-medium text-foreground-secondary">{label}</p>
        {showEmpty ? (
          <div className="mt-1">
            <span className="text-2xl font-bold text-foreground">—</span>
            <Link
              href="/settings"
              className="mt-1 flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              Cadastrar renda <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {value != null ? formatBRL(value) : "—"}
            </p>
            <div className="mt-1 flex items-center gap-2">
              {percentOfIncome != null && (
                <span className="text-xs text-foreground-secondary">
                  {percentOfIncome.toFixed(1)}% da renda
                </span>
              )}
              {previousValue != null && value != null && (
                <DeltaBadge
                  current={value}
                  previous={previousValue}
                  invertTrend={invertTrend}
                />
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

interface IndicatorCardsProps {
  totalIncome: number;
  totalExpenses: number;
  totalInvestments: number;
  freeBalance: number;
  hasIncome: boolean;
  prevTotalIncome: number | null;
  prevTotalExpenses: number | null;
  prevTotalInvestments: number | null;
  prevFreeBalance: number | null;
}

export function IndicatorCards({
  totalIncome,
  totalExpenses,
  totalInvestments,
  freeBalance,
  hasIncome,
  prevTotalIncome,
  prevTotalExpenses,
  prevTotalInvestments,
  prevFreeBalance,
}: IndicatorCardsProps) {
  const income = hasIncome ? totalIncome : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <IndicatorCard
        label="Renda Total"
        value={income}
        previousValue={prevTotalIncome}
        hasIncome={hasIncome}
      />
      <IndicatorCard
        label="Total Gastos"
        value={totalExpenses}
        percentOfIncome={
          hasIncome && totalIncome > 0
            ? (totalExpenses / totalIncome) * 100
            : null
        }
        previousValue={prevTotalExpenses}
        invertTrend
        hasIncome={hasIncome}
      />
      <IndicatorCard
        label="Total Investido"
        value={totalInvestments}
        percentOfIncome={
          hasIncome && totalIncome > 0
            ? (totalInvestments / totalIncome) * 100
            : null
        }
        previousValue={prevTotalInvestments}
        hasIncome={hasIncome}
      />
      <IndicatorCard
        label="Saldo Livre"
        value={hasIncome ? freeBalance : null}
        percentOfIncome={
          hasIncome && totalIncome > 0
            ? (freeBalance / totalIncome) * 100
            : null
        }
        previousValue={prevFreeBalance}
        hasIncome={hasIncome}
      />
    </div>
  );
}
