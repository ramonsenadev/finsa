"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useTheme } from "next-themes";
import { formatBRL } from "@/lib/format";
import { getChartColors } from "@/lib/chart-theme";
import type { TemporalComparisonData } from "@/lib/analytics/temporal-comparison";

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const FALLBACK_COLORS = [
  "#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#3B82F6", "#84CC16",
  "#06B6D4", "#E11D48",
];

function formatMonth(monthRef: string) {
  const [year, month] = monthRef.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${String(year).slice(2)}`;
}

interface EvolutionChartProps {
  data: TemporalComparisonData;
}

interface ChartDataPoint {
  monthRef: string;
  label: string;
  [categoryId: string]: string | number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const sorted = [...payload].sort((a, b) => b.value - a.value);

  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 shadow-md min-w-[200px]">
      <p className="text-sm font-semibold text-foreground mb-1.5">{label}</p>
      <div className="space-y-0.5">
        {sorted.map((entry) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-4 text-xs"
          >
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-foreground-secondary truncate max-w-[140px]">
                {entry.name}
              </span>
            </span>
            <span className="font-medium tabular-nums text-foreground">
              {formatBRL(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EvolutionChart({ data }: EvolutionChartProps) {
  const { resolvedTheme } = useTheme();
  const colors = getChartColors(resolvedTheme);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(
    new Set(),
  );

  // Build chart data: one object per month with each category as a key
  const chartData: ChartDataPoint[] = data.months.map((m) => {
    const point: ChartDataPoint = { monthRef: m, label: formatMonth(m) };
    for (const s of data.series) {
      const monthData = s.data.find((d) => d.monthRef === m);
      point[s.categoryId] = monthData?.total ?? 0;
    }
    return point;
  });

  // Average line data
  const avgByMonth = data.months.map((m) => {
    let total = 0;
    let count = 0;
    for (const s of data.series) {
      if (hiddenCategories.has(s.categoryId)) continue;
      const monthData = s.data.find((d) => d.monthRef === m);
      total += monthData?.total ?? 0;
      count++;
    }
    return total;
  });
  const overallAvg =
    avgByMonth.length > 0
      ? avgByMonth.reduce((s, v) => s + v, 0) / avgByMonth.length
      : 0;

  function toggleCategory(categoryId: string) {
    setHiddenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={360}>
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
        >
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: colors.tickFill }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(Math.round(v))
            }
            tick={{ fontSize: 11, fill: colors.tickFill }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            content={
              <CustomLegend
                series={data.series}
                hiddenCategories={hiddenCategories}
                onToggle={toggleCategory}
                hiddenColor={colors.hiddenColor}
              />
            }
          />
          {/* Average reference line */}
          {overallAvg > 0 && (
            <ReferenceLine
              y={overallAvg}
              stroke={colors.referenceStroke}
              strokeDasharray="6 4"
              strokeWidth={1}
            />
          )}
          {data.series.map((s, i) =>
            hiddenCategories.has(s.categoryId) ? null : (
              <Line
                key={s.categoryId}
                type="monotone"
                dataKey={s.categoryId}
                name={s.name}
                stroke={s.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5, strokeWidth: 2 }}
              />
            ),
          )}
        </LineChart>
      </ResponsiveContainer>

      {overallAvg > 0 && (
        <p className="text-xs text-foreground-secondary">
          Linha pontilhada: média total do período ({formatBRL(overallAvg)}/mês)
        </p>
      )}
    </div>
  );
}

// ── Custom Legend with clickable items and growth badges ────────────

function CustomLegend({
  series,
  hiddenCategories,
  onToggle,
  hiddenColor,
}: {
  series: TemporalComparisonData["series"];
  hiddenCategories: Set<string>;
  onToggle: (id: string) => void;
  hiddenColor: string;
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-2 justify-center">
      {series.map((s, i) => {
        const hidden = hiddenCategories.has(s.categoryId);
        const color =
          s.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
        const showGrowthBadge =
          s.growthPercent !== null && s.growthPercent > 20;

        return (
          <button
            key={s.categoryId}
            onClick={() => onToggle(s.categoryId)}
            className="flex items-center gap-1.5 text-xs cursor-pointer select-none"
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{
                backgroundColor: hidden ? hiddenColor : color,
              }}
            />
            <span
              className={
                hidden
                  ? "text-foreground-secondary line-through"
                  : "text-foreground"
              }
            >
              {s.name}
            </span>
            {showGrowthBadge && !hidden && (
              <span className="rounded bg-error/10 px-1 py-0.5 text-[10px] font-semibold text-error leading-none">
                ↑ {Math.round(s.growthPercent!)}%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
