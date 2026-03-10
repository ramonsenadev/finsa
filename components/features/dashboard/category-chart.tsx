"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { useTheme } from "next-themes";
import { formatBRL } from "@/lib/format";
import { getChartColors } from "@/lib/chart-theme";
import type { CategoryBreakdown } from "@/lib/analytics/dashboard";

interface CategoryChartProps {
  data: CategoryBreakdown[];
  totalIncome: number;
  hasIncome: boolean;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: CategoryBreakdown }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 shadow-md">
      <p className="text-sm font-semibold text-foreground">{d.name}</p>
      <p className="text-sm text-foreground-secondary">{formatBRL(d.total)}</p>
      {d.percentOfIncome != null && (
        <p className="text-xs text-foreground-secondary">
          {d.percentOfIncome.toFixed(1)}% da renda
        </p>
      )}
      {d.budgetAmount != null && (
        <p className="text-xs text-warning">
          Orçamento: {formatBRL(d.budgetAmount)}
        </p>
      )}
    </div>
  );
}

export function CategoryChart({ data, totalIncome, hasIncome }: CategoryChartProps) {
  const { resolvedTheme } = useTheme();
  const colors = getChartColors(resolvedTheme);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-foreground-secondary">
        Nenhuma transação neste período.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    displayName: d.name.length > 18 ? d.name.slice(0, 16) + "…" : d.name,
  }));

  const maxValue = Math.max(...data.map((d) => d.total), ...data.map((d) => d.budgetAmount ?? 0));

  return (
    <ResponsiveContainer width="100%" height={data.length * 44 + 20}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
      >
        <XAxis
          type="number"
          tickFormatter={(v: number) => formatBRL(v)}
          tick={{ fontSize: 11, fill: colors.tickFill }}
          axisLine={false}
          tickLine={false}
          domain={[0, maxValue * 1.1]}
        />
        <YAxis
          type="category"
          dataKey="displayName"
          width={130}
          tick={{ fontSize: 12, fill: colors.tickFillStrong }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: colors.cursorFill }} />
        <Bar dataKey="total" radius={6} barSize={24}>
          {chartData.map((entry) => (
            <Cell key={entry.categoryId} fill={entry.color || colors.accentPrimary} />
          ))}
        </Bar>
        {/* Budget reference lines */}
        {chartData.map(
          (entry) =>
            entry.budgetAmount != null && (
              <ReferenceLine
                key={`budget-${entry.categoryId}`}
                x={entry.budgetAmount}
                stroke={colors.warningStroke}
                strokeDasharray="4 4"
                strokeWidth={2}
              />
            )
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
