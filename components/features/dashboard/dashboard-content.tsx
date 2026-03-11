"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionErrorBoundary } from "@/components/ui/section-error-boundary";
import { SkeletonIndicatorCards, SkeletonChart } from "@/components/ui/skeleton-card";
import { MonthSelector, getCurrentMonthRef } from "@/components/ui/month-selector";
import { IndicatorCards } from "./indicator-cards";
import { CategoryChart } from "./category-chart";
import { CategoryTable } from "./category-table";
import { DailyChart } from "./daily-chart";
import { SourceSplit } from "./source-split";
import { TopExpenses } from "./top-expenses";
import { RecurrenceToggle } from "./recurrence-toggle";
import { InvestmentPanel } from "./investment-panel";
import { fetchDashboardData, fetchDailyExpenses, fetchInvestmentEvolution } from "@/app/(dashboard)/actions";
import { formatBRL } from "@/lib/format";
import type { RecurrenceFilter } from "@/lib/analytics/dashboard";

export function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const monthRef = searchParams.get("month") || getCurrentMonthRef();

  function handleMonthChange(newMonth: string) {
    if (newMonth === getCurrentMonthRef()) {
      router.push("/");
    } else {
      router.push(`/?month=${newMonth}`);
    }
  }
  const [recurrenceFilter, setRecurrenceFilter] = useState<RecurrenceFilter>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", monthRef, recurrenceFilter],
    queryFn: () => fetchDashboardData(monthRef, recurrenceFilter),
  });

  const { data: dailyData } = useQuery({
    queryKey: ["daily-expenses", monthRef, recurrenceFilter],
    queryFn: () => fetchDailyExpenses(monthRef, recurrenceFilter),
  });

  const { data: investmentData } = useQuery({
    queryKey: ["investment-evolution", monthRef],
    queryFn: () => fetchInvestmentEvolution(monthRef),
  });

  const isFiltered = recurrenceFilter !== "all";
  const filterLabel = recurrenceFilter === "recurring" ? "Fixo" : "Variável";
  const percentOfIncome =
    data?.hasIncome && data.totalIncome > 0
      ? (data.totalExpenses / data.totalIncome) * 100
      : null;

  const isEmpty = data && data.totalExpenses === 0 && data.categoryBreakdown.length === 0 && !data.hasIncome && data.totalInvestments === 0;

  return (
    <div className="space-y-6">
      {/* Month selector + Recurrence Toggle — always visible */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <MonthSelector monthRef={monthRef} onChange={handleMonthChange} />
        <RecurrenceToggle value={recurrenceFilter} onChange={setRecurrenceFilter} />
      </div>

      {isLoading ? (
        <>
          <SkeletonIndicatorCards />
          <SkeletonChart />
          <SkeletonChart />
        </>
      ) : error || !data ? (
        <p className="text-sm text-error">
          Erro ao carregar dados do dashboard.
        </p>
      ) : isEmpty ? (
        <EmptyState
          icon={FileText}
          title="Importe sua primeira fatura para começar"
          description="Importe a fatura do seu cartão de crédito ou adicione lançamentos manuais para visualizar seus gastos."
          action={{ label: "Importar Fatura", href: "/invoices/import" }}
        />
      ) : (
        <>

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
        cashFlow={data.cashFlow}
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
      <SectionErrorBoundary fallbackTitle="Erro ao carregar gráfico de categorias">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryChart
              data={data.categoryBreakdown}
            />
          </CardContent>
        </Card>
      </SectionErrorBoundary>

      {/* Daily Expense Fluctuation */}
      <SectionErrorBoundary fallbackTitle="Erro ao carregar gráfico diário">
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
      </SectionErrorBoundary>

      {/* Investment Panel */}
      <SectionErrorBoundary fallbackTitle="Erro ao carregar investimentos">
        {investmentData && (
          <Card>
            <CardHeader>
              <CardTitle>Investimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <InvestmentPanel data={investmentData} />
            </CardContent>
          </Card>
        )}
      </SectionErrorBoundary>

      {/* Category Summary Table */}
      <SectionErrorBoundary fallbackTitle="Erro ao carregar tabela de categorias">
        <Card>
          <CardHeader>
            <CardTitle>Resumo por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryTable data={data.categoryBreakdown} />
          </CardContent>
        </Card>
      </SectionErrorBoundary>

      {/* Bottom row: Split + Top Expenses */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        {/* Source Split */}
        <SectionErrorBoundary fallbackTitle="Erro ao carregar divisão">
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
        </SectionErrorBoundary>

        {/* Top 10 Expenses */}
        <SectionErrorBoundary fallbackTitle="Erro ao carregar top gastos">
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
        </SectionErrorBoundary>
      </div>
      </>
      )}
    </div>
  );
}
