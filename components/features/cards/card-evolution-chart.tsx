"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/format";
import { getChartColors } from "@/lib/chart-theme";
import type { CardMonthlyEvolution } from "@/lib/analytics/card-detail";

interface CardEvolutionChartProps {
  data: CardMonthlyEvolution[];
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: CardMonthlyEvolution }>;
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const [y, m] = d.monthRef.split("-");
  const date = new Date(parseInt(y), parseInt(m) - 1);
  const label = date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-foreground capitalize">{label}</p>
      <p className="text-sm font-semibold text-accent">{formatBRL(d.total)}</p>
    </div>
  );
}

export function CardEvolutionChart({ data }: CardEvolutionChartProps) {
  const { resolvedTheme } = useTheme();
  const colors = getChartColors(resolvedTheme);
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-sm text-foreground-secondary">
            Nenhum dado de evolução disponível.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Evolução Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={data}
            margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="cardEvolutionFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.accentPrimary} stopOpacity={0.15} />
                <stop offset="100%" stopColor={colors.accentPrimary} stopOpacity={0.02} />
              </linearGradient>
            </defs>
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
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="total"
              stroke={colors.accentPrimary}
              strokeWidth={2}
              fill="url(#cardEvolutionFill)"
              dot={{ r: 3, fill: colors.accentPrimary, stroke: colors.dotStroke, strokeWidth: 2 }}
              activeDot={{ r: 5, fill: colors.accentPrimary, stroke: colors.dotStroke, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
