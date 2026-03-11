"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { getChartColors } from "@/lib/chart-theme";
import type { InvoiceRow } from "@/app/invoices/actions";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMonthShort(monthRef: string) {
  const [y, m] = monthRef.split("-");
  const date = new Date(parseInt(y), parseInt(m) - 1);
  return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

interface InvoiceEvolutionChartProps {
  invoices: InvoiceRow[];
}

export function InvoiceEvolutionChart({ invoices }: InvoiceEvolutionChartProps) {
  const { resolvedTheme } = useTheme();
  const colors = getChartColors(resolvedTheme);

  const chartData = useMemo(() => {
    const monthMap = new Map<string, { total: number; count: number; pending: number }>();

    for (const inv of invoices) {
      const existing = monthMap.get(inv.monthRef) ?? { total: 0, count: 0, pending: 0 };
      existing.total += inv.totalAmount;
      existing.count += inv.txCount;
      existing.pending += inv.manualPendingCount;
      monthMap.set(inv.monthRef, existing);
    }

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([monthRef, data]) => ({
        month: formatMonthShort(monthRef),
        monthRef,
        total: data.total,
        count: data.count,
        pending: data.pending,
      }));
  }, [invoices]);

  if (chartData.length < 2) return null;

  return (
    <Card className="gap-4 py-5">
      <div className="px-5">
        <h3 className="text-sm font-semibold text-foreground">
          Evolução Mensal
        </h3>
        <p className="mt-0.5 text-xs text-foreground-secondary">
          Total de gastos por mês nas faturas importadas
        </p>
      </div>
      <div className="px-2">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={colors.gridStroke}
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: colors.tickFill, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: colors.tickFill, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
              }
              width={40}
            />
            <Tooltip
              cursor={{ fill: colors.cursorFill }}
              contentStyle={{
                backgroundColor: resolvedTheme === "dark" ? "#1A1D27" : "#FFFFFF",
                border: `1px solid ${colors.gridStroke}`,
                borderRadius: 8,
                fontSize: 13,
              }}
              formatter={(value: number) => [formatBRL(value), "Total"]}
              labelFormatter={(label) => label}
            />
            <Bar
              dataKey="total"
              fill={colors.accentPrimary}
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
