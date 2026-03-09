"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatBRL } from "@/lib/format";
import type { InvestmentEvolutionData } from "@/lib/analytics/investment-evolution";

interface InvestmentPanelProps {
  data: InvestmentEvolutionData;
}

const CATEGORY_COLORS: Record<string, string> = {
  renda_fixa: "#6366F1",
  renda_variavel: "#8B5CF6",
  previdencia: "#A78BFA",
  outro: "#C4B5FD",
};

function EvolutionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { monthRef: string; amount: number; percentOfIncome: number | null } }>;
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;

  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 shadow-md min-w-[140px]">
      <p className="text-xs font-medium text-foreground-secondary">{d.monthRef}</p>
      <p className="text-sm font-semibold text-foreground mt-0.5">
        {formatBRL(d.amount)}
      </p>
      {d.percentOfIncome != null && (
        <p className="text-xs text-foreground-secondary mt-0.5">
          {d.percentOfIncome.toFixed(1)}% da renda
        </p>
      )}
    </div>
  );
}

export function InvestmentPanel({ data }: InvestmentPanelProps) {
  const hasEvolution = data.months.filter((m) => m.amount > 0).length >= 2;
  const maxAmount = Math.max(...data.months.map((m) => m.amount), 0);
  const maxPercent = Math.max(
    ...data.months.map((m) => m.percentOfIncome ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Total invested */}
        <div className="rounded-lg border border-border bg-background px-4 py-3">
          <p className="text-xs font-medium text-foreground-secondary">
            Total investido no mês
          </p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {formatBRL(data.currentTotal)}
          </p>
        </div>

        {/* % of income */}
        <div className="rounded-lg border border-border bg-background px-4 py-3">
          <p className="text-xs font-medium text-foreground-secondary">
            % da renda
          </p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {data.percentOfIncome != null
              ? `${data.percentOfIncome.toFixed(1)}%`
              : "—"}
          </p>
          {!data.hasIncome && (
            <p className="mt-0.5 text-xs text-foreground-secondary">
              Cadastre renda em Configurações
            </p>
          )}
        </div>

        {/* Delta vs previous month */}
        <div className="rounded-lg border border-border bg-background px-4 py-3">
          <p className="text-xs font-medium text-foreground-secondary">
            vs. mês anterior
          </p>
          {data.deltaPercent != null ? (
            <div className="mt-1 flex items-center gap-1.5">
              {data.deltaPercent >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-error" />
              )}
              <span
                className={`text-xl font-bold ${
                  data.deltaPercent >= 0 ? "text-success" : "text-error"
                }`}
              >
                {data.deltaPercent >= 0 ? "+" : ""}
                {data.deltaPercent.toFixed(1)}%
              </span>
            </div>
          ) : (
            <p className="mt-1 text-xl font-bold text-foreground">—</p>
          )}
        </div>
      </div>

      {/* Evolution chart */}
      {hasEvolution ? (
        <div>
          <h4 className="mb-3 text-sm font-medium text-foreground">
            Evolução Mensal
          </h4>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={data.months}
              margin={{ top: 8, right: 48, bottom: 0, left: 0 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="amount"
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                width={48}
                domain={[0, maxAmount * 1.15]}
              />
              <YAxis
                yAxisId="percent"
                orientation="right"
                tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                width={40}
                domain={[0, Math.max(maxPercent * 1.3, 1)]}
              />
              <Tooltip content={<EvolutionTooltip />} />
              {data.targetPercent != null && (
                <ReferenceLine
                  yAxisId="percent"
                  y={data.targetPercent}
                  stroke="#F59E0B"
                  strokeDasharray="6 3"
                  strokeWidth={1.5}
                  label={{
                    value: `Meta ${data.targetPercent}%`,
                    position: "right",
                    fontSize: 10,
                    fill: "#F59E0B",
                  }}
                />
              )}
              <Line
                yAxisId="amount"
                type="monotone"
                dataKey="amount"
                stroke="#6366F1"
                strokeWidth={2}
                dot={{ r: 3, fill: "#6366F1", stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 4, fill: "#6366F1", stroke: "#fff", strokeWidth: 2 }}
                name="Valor (R$)"
              />
              <Line
                yAxisId="percent"
                type="monotone"
                dataKey="percentOfIncome"
                stroke="#8B5CF6"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={{ r: 3, fill: "#8B5CF6", stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 4, fill: "#8B5CF6", stroke: "#fff", strokeWidth: 2 }}
                name="% da renda"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="mt-2 flex items-center justify-center gap-6 text-xs text-foreground-secondary">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded bg-accent" />
              Valor (R$)
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-0.5 w-4 rounded"
                style={{
                  background: "#8B5CF6",
                  backgroundImage:
                    "repeating-linear-gradient(90deg, #8B5CF6 0 4px, transparent 4px 6px)",
                }}
              />
              % da renda
            </span>
            {data.targetPercent != null && (
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-0.5 w-4 rounded"
                  style={{
                    background: "#F59E0B",
                    backgroundImage:
                      "repeating-linear-gradient(90deg, #F59E0B 0 6px, transparent 6px 9px)",
                  }}
                />
                Meta
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-sm text-foreground-secondary">
          Cadastre investimentos para ver a evolução ao longo dos meses.
        </div>
      )}

      {/* Breakdown by type */}
      {data.breakdown.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-foreground">
            Distribuição por Tipo
          </h4>
          <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
            {/* Bar chart */}
            <ResponsiveContainer width="100%" height={data.breakdown.length * 40 + 16}>
              <BarChart
                data={data.breakdown}
                layout="vertical"
                margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#374151" }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={20}>
                  {data.breakdown.map((entry) => (
                    <Cell
                      key={entry.category}
                      fill={CATEGORY_COLORS[entry.category] ?? "#C4B5FD"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Value list */}
            <div className="space-y-2">
              {data.breakdown.map((entry) => (
                <div
                  key={entry.category}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          CATEGORY_COLORS[entry.category] ?? "#C4B5FD",
                      }}
                    />
                    <span className="text-sm text-foreground">{entry.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium tabular-nums text-foreground">
                      {formatBRL(entry.amount)}
                    </span>
                    <span className="text-xs tabular-nums text-foreground-secondary">
                      {entry.percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
