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
  if (previous === 0 || current === previous) return null;
  // Use Math.abs(previous) to avoid sign inversion when previous is negative
  // (e.g. Saldo Livre going from -15000 to -200 is an improvement, not -98%)
  const delta = ((current - previous) / Math.abs(previous)) * 100;
  const isPositive = delta > 0;
  const improved = invertTrend ? current < previous : current > previous;

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

interface CashFlowData {
  totalOutflow: number;
  cardBills: number;
  manualExpenses: number;
  cashBalance: number;
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
  cashFlow?: CashFlowData | null;
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
  cashFlow,
}: IndicatorCardsProps) {
  const income = hasIncome ? totalIncome : null;

  return (
    <div className="space-y-4">
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

      {cashFlow && (
        <Card className="border-accent/20 bg-accent/5">
          <div className="flex items-center gap-6 px-4 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <ArrowRight className="h-5 w-5 text-accent" />
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-x-8 gap-y-2">
              <div>
                <p className="text-xs font-medium text-foreground-secondary">
                  Fluxo de Caixa
                </p>
                <p className="text-xl font-bold text-foreground">
                  {formatBRL(cashFlow.totalOutflow)}
                </p>
              </div>
              <div className="flex items-center gap-6 text-sm text-foreground-secondary">
                <span>
                  Faturas:{" "}
                  <span className="font-medium text-foreground">
                    {formatBRL(cashFlow.cardBills)}
                  </span>
                </span>
                <span>
                  Manual:{" "}
                  <span className="font-medium text-foreground">
                    {formatBRL(cashFlow.manualExpenses)}
                  </span>
                </span>
                {hasIncome && (
                  <span>
                    Saldo caixa:{" "}
                    <span
                      className={`font-semibold ${
                        cashFlow.cashBalance >= 0 ? "text-success" : "text-error"
                      }`}
                    >
                      {formatBRL(cashFlow.cashBalance)}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
