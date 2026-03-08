"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { formatBRL } from "@/lib/format";
import type { DailyExpenseSummary } from "@/lib/analytics/daily-expenses";

interface DailyChartProps {
  data: DailyExpenseSummary;
}

interface ChartDay {
  day: number;
  date: string;
  total: number;
  isWeekend: boolean;
  breakdown: { name: string; amount: number }[];
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDay }>;
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;

  const dateObj = new Date(d.date + "T12:00:00");
  const formatted = dateObj.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const top3 = d.breakdown.slice(0, 3);

  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 shadow-md min-w-[180px]">
      <p className="text-sm font-semibold text-foreground capitalize">
        {formatted}
      </p>
      <p className="text-sm font-medium text-accent mt-1">
        {formatBRL(d.total)}
      </p>
      {top3.length > 0 && (
        <div className="mt-2 space-y-0.5 border-t border-border pt-1.5">
          {top3.map((c) => (
            <div
              key={c.name}
              className="flex items-center justify-between gap-3 text-xs text-foreground-secondary"
            >
              <span className="truncate">{c.name}</span>
              <span className="font-medium tabular-nums whitespace-nowrap">
                {formatBRL(c.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getWeekendRanges(days: ChartDay[]) {
  const ranges: { x1: number; x2: number }[] = [];
  let start: number | null = null;

  for (const day of days) {
    if (day.isWeekend && start === null) {
      start = day.day - 0.5;
    } else if (!day.isWeekend && start !== null) {
      ranges.push({ x1: start, x2: day.day - 0.5 });
      start = null;
    }
  }
  // Close last range if month ends on weekend
  if (start !== null) {
    ranges.push({ x1: start, x2: days[days.length - 1].day + 0.5 });
  }

  return ranges;
}

export function DailyChart({ data }: DailyChartProps) {
  if (data.days.every((d) => d.total === 0)) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-foreground-secondary">
        Nenhuma transação neste período.
      </div>
    );
  }

  const weekendRanges = getWeekendRanges(data.days);
  const maxTotal = Math.max(...data.days.map((d) => d.total));
  const sign = data.weekendDeltaPercent >= 0 ? "+" : "";

  return (
    <div className="space-y-4">
      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart
          data={data.days}
          margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
        >
          {/* Weekend highlight bands */}
          {weekendRanges.map((r, i) => (
            <ReferenceArea
              key={i}
              x1={r.x1}
              x2={r.x2}
              y1={0}
              y2={maxTotal * 1.1}
              fill="#F3F4F6"
              fillOpacity={1}
              ifOverflow="extendDomain"
            />
          ))}
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            interval={1}
          />
          <YAxis
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
            }
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          <defs>
            <linearGradient id="dailyFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="total"
            stroke="#6366F1"
            strokeWidth={2}
            fill="url(#dailyFill)"
            dot={false}
            activeDot={{ r: 4, fill: "#6366F1", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Summary */}
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-2">
        <p className="text-sm text-foreground">
          <span className="font-medium">Média dias úteis:</span>{" "}
          {formatBRL(data.weekdayAvg)}
          <span className="mx-2 text-foreground-secondary">|</span>
          <span className="font-medium">Média fins de semana:</span>{" "}
          {formatBRL(data.weekendAvg)}
          <span
            className={`ml-1.5 text-xs font-medium ${
              data.weekendDeltaPercent > 0
                ? "text-error"
                : data.weekendDeltaPercent < 0
                  ? "text-success"
                  : "text-foreground-secondary"
            }`}
          >
            ({sign}
            {data.weekendDeltaPercent.toFixed(0)}%)
          </span>
        </p>

        {data.deltaCategories.length > 0 &&
          data.deltaCategories.some((c) => Math.abs(c.delta) > 0) && (
            <div className="text-xs text-foreground-secondary">
              <span className="font-medium text-foreground">
                Categorias que mais contribuem para o delta:
              </span>{" "}
              {data.deltaCategories
                .filter((c) => Math.abs(c.delta) > 0)
                .map(
                  (c) =>
                    `${c.name} (${c.delta >= 0 ? "+" : ""}${formatBRL(c.delta)}/dia)`
                )
                .join(", ")}
            </div>
          )}
      </div>
    </div>
  );
}
