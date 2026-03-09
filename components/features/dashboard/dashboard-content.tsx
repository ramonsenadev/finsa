"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndicatorCards } from "./indicator-cards";
import { CategoryChart } from "./category-chart";
import { CategoryTable } from "./category-table";
import { DailyChart } from "./daily-chart";
import { SourceSplit } from "./source-split";
import { TopExpenses } from "./top-expenses";
import { RecurrenceToggle } from "./recurrence-toggle";
import { fetchDashboardData, fetchDailyExpenses } from "@/app/(dashboard)/actions";
import { formatBRL } from "@/lib/format";
import type { RecurrenceFilter } from "@/lib/analytics/dashboard";

function getCurrentMonthRef() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function DashboardContent() {
  const searchParams = useSearchParams();
  const monthRef = searchParams.get("month") || getCurrentMonthRef();
  const [recurrenceFilter, setRecurrenceFilter] = useState<RecurrenceFilter>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", monthRef, recurrenceFilter],
    queryFn: () => fetchDashboardData(monthRef, recurrenceFilter),
  });

  const { data: dailyData } = useQuery({
    queryKey: ["daily-expenses", monthRef, recurrenceFilter],
    queryFn: () => fetchDailyExpenses(monthRef, recurrenceFilter),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="gap-3 py-4">
              <div className="px-4">
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-7 w-28 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-3 w-16 animate-pulse rounded bg-muted" />
              </div>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent>
            <div className="h-64 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-sm text-error">
        Erro ao carregar dados do dashboard.
      </p>
    );
  }

  const isFiltered = recurrenceFilter !== "all";
  const filterLabel = recurrenceFilter === "recurring" ? "Fixo" : "Variável";
  const percentOfIncome =
    data.hasIncome && data.totalIncome > 0
      ? (data.totalExpenses / data.totalIncome) * 100
      : null;

  return (
    <div className="space-y-6">
      {/* Recurrence Toggle */}
      <RecurrenceToggle value={recurrenceFilter} onChange={setRecurrenceFilter} />

      {/* Indicator Cards */}
      <IndicatorCards
        totalIncome={data.totalIncome}
        totalExpenses={data.totalExpenses}
        totalInvestments={data.totalInvestments}
        freeBalance={data.freeBalance}
        hasIncome={data.hasIncome}
        prevTotalIncome={data.prevTotalIncome}
        prevTotalExpenses={data.prevTotalExpenses}
        prevTotalInvestments={data.prevTotalInvestments}
        prevFreeBalance={data.prevFreeBalance}
      />

      {/* Extra card for filtered modes */}
      {isFiltered && (
        <Card className="border-recurring/30 bg-recurring/5">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-recurring/10">
              <RefreshCw className="h-5 w-5 text-recurring" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground-secondary">
                Total {filterLabel} Mensal
              </p>
              <p className="text-xl font-bold text-foreground">
                {formatBRL(data.totalExpenses)}
                {percentOfIncome != null && (
                  <span className="ml-2 text-sm font-normal text-foreground-secondary">
                    ({percentOfIncome.toFixed(1)}% da renda)
                  </span>
                )}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryChart
            data={data.categoryBreakdown}
            totalIncome={data.totalIncome}
            hasIncome={data.hasIncome}
          />
        </CardContent>
      </Card>

      {/* Daily Expense Fluctuation */}
      {dailyData && (
        <Card>
          <CardHeader>
            <CardTitle>Flutuação Diária de Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyChart data={dailyData} />
          </CardContent>
        </Card>
      )}

      {/* Category Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryTable data={data.categoryBreakdown} />
        </CardContent>
      </Card>

      {/* Bottom row: Split + Top Expenses */}
      <div className="grid grid-cols-[280px_1fr] gap-4">
        {/* Source Split */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cartão vs. Manual</CardTitle>
          </CardHeader>
          <CardContent>
            <SourceSplit
              totalCard={data.totalCard}
              totalManual={data.totalManual}
            />
          </CardContent>
        </Card>

        {/* Top 10 Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Maiores Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <TopExpenses
              data={data.topExpenses}
              showRecurringBadge={recurrenceFilter === "all"}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
