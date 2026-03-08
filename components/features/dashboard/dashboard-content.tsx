"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndicatorCards } from "./indicator-cards";
import { CategoryChart } from "./category-chart";
import { CategoryTable } from "./category-table";
import { DailyChart } from "./daily-chart";
import { SourceSplit } from "./source-split";
import { TopExpenses } from "./top-expenses";
import { fetchDashboardData, fetchDailyExpenses } from "@/app/(dashboard)/actions";

function getCurrentMonthRef() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function DashboardContent() {
  const searchParams = useSearchParams();
  const monthRef = searchParams.get("month") || getCurrentMonthRef();

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", monthRef],
    queryFn: () => fetchDashboardData(monthRef),
  });

  const { data: dailyData } = useQuery({
    queryKey: ["daily-expenses", monthRef],
    queryFn: () => fetchDailyExpenses(monthRef),
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

  return (
    <div className="space-y-6">
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
            <TopExpenses data={data.topExpenses} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
