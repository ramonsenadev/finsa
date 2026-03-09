"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchComparison } from "@/app/(dashboard)/comparison/actions";
import { PeriodSelector } from "./period-selector";
import { EvolutionChart } from "./evolution-chart";
import { VariationTable } from "./variation-table";

function getCurrentMonthRef() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonthBack(monthRef: string, count: number): string {
  const [year, month] = monthRef.split("-").map(Number);
  const d = new Date(year, month - 1 - count, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function ComparisonContent() {
  const currentMonth = getCurrentMonthRef();
  const [startMonth, setStartMonth] = useState(
    shiftMonthBack(currentMonth, 2),
  );
  const [endMonth, setEndMonth] = useState(currentMonth);

  const { data, isLoading, error } = useQuery({
    queryKey: ["comparison", startMonth, endMonth],
    queryFn: () => fetchComparison(startMonth, endMonth),
  });

  function handlePreset(months: number) {
    setEndMonth(currentMonth);
    setStartMonth(shiftMonthBack(currentMonth, months - 1));
  }

  function handleYearPreset() {
    const year = new Date().getFullYear();
    setStartMonth(`${year}-01`);
    setEndMonth(currentMonth);
  }

  function handleCustomRange(start: string, end: string) {
    setStartMonth(start);
    setEndMonth(end);
  }

  const [exporting, setExporting] = useState(false);

  async function handleExportPDF() {
    setExporting(true);
    try {
      const params = new URLSearchParams({ startMonth, endMonth });
      const res = await fetch(`/api/export/comparison-pdf?${params}`);
      if (!res.ok) throw new Error("Falha ao gerar PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finsa-comparativo-${startMonth}-a-${endMonth}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  if (error) {
    return (
      <p className="text-sm text-error">
        Erro ao carregar dados de comparação.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PeriodSelector
          startMonth={startMonth}
          endMonth={endMonth}
          onPreset={handlePreset}
          onYearPreset={handleYearPreset}
          onCustomRange={handleCustomRange}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPDF}
          disabled={exporting || isLoading || !data}
        >
          <Download className="mr-2 h-4 w-4" />
          {exporting ? "Gerando..." : "Exportar PDF"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolução por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-80 animate-pulse rounded bg-muted" />
          ) : data && data.series.length > 0 ? (
            <EvolutionChart data={data} />
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-foreground-secondary">
              Nenhuma transação no período selecionado.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variação por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 animate-pulse rounded bg-muted" />
          ) : data && data.categories.length > 0 ? (
            <VariationTable data={data} />
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-foreground-secondary">
              Nenhum dado para exibir.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
