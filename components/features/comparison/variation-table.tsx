"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";
import { getIconComponent } from "@/components/features/categories/icon-picker";
import type {
  TemporalComparisonData,
  ComparisonCategory,
} from "@/lib/analytics/temporal-comparison";

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function formatShortMonth(monthRef: string) {
  const [, month] = monthRef.split("-").map(Number);
  return MONTH_NAMES[month - 1];
}

interface VariationTableProps {
  data: TemporalComparisonData;
}

function TrendIndicator({
  trend,
  deltaPercent,
}: {
  trend: "up" | "down" | "stable";
  deltaPercent: number | null;
}) {
  if (trend === "stable" || deltaPercent === null) {
    return <span className="text-foreground-secondary">—</span>;
  }

  return (
    <span
      className={cn(
        "font-medium",
        trend === "up" ? "text-error" : "text-success",
      )}
    >
      {trend === "up" ? "↑" : "↓"}
    </span>
  );
}

function DeltaBadge({ deltaPercent }: { deltaPercent: number | null }) {
  if (deltaPercent === null) {
    return <span className="text-foreground-secondary text-xs">Novo</span>;
  }

  const isPositive = deltaPercent > 0;
  const isNegative = deltaPercent < 0;
  const isAlert = deltaPercent > 20;

  return (
    <span
      className={cn(
        "text-sm tabular-nums font-medium",
        isAlert
          ? "text-error"
          : isPositive
            ? "text-error/80"
            : isNegative
              ? "text-success"
              : "text-foreground-secondary",
      )}
    >
      {isPositive ? "+" : ""}
      {deltaPercent.toFixed(1)}%
    </span>
  );
}

function CategoryRow({
  category,
  startMonth,
  endMonth,
  depth = 0,
}: {
  category: ComparisonCategory;
  startMonth: string;
  endMonth: string;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = category.subcategories.length > 0;

  return (
    <>
      <tr
        className={cn(
          "border-b border-border/50 transition-colors hover:bg-muted/30",
          depth > 0 && "bg-muted/20",
        )}
      >
        {/* Category Name */}
        <td className="py-2.5 pr-3" style={{ paddingLeft: depth * 24 + 12 }}>
          <div className="flex items-center gap-2">
            {hasChildren && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-0.5 rounded hover:bg-border/50 transition-colors"
              >
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 text-foreground-secondary transition-transform",
                    expanded && "rotate-90",
                  )}
                />
              </button>
            )}
            {!hasChildren && depth === 0 && <span className="w-4.5" />}
            {category.icon && (() => {
              const Icon = getIconComponent(category.icon);
              return (
                <Icon
                  className="h-4 w-4 shrink-0"
                  style={{ color: category.color ?? undefined }}
                />
              );
            })()}
            {!category.icon && category.color && (
              <span
                className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: category.color }}
              />
            )}
            <span
              className={cn(
                "text-sm",
                depth === 0 ? "font-medium text-foreground" : "text-foreground-secondary",
              )}
            >
              {category.name}
            </span>
            {category.deltaPercent !== null && category.deltaPercent > 20 && depth === 0 && (
              <span className="rounded bg-error/10 px-1 py-0.5 text-[10px] font-semibold text-error leading-none">
                ↑ {Math.round(category.deltaPercent)}%
              </span>
            )}
          </div>
        </td>

        {/* First Month */}
        <td className="py-2.5 px-3 text-right text-sm tabular-nums text-foreground-secondary">
          {formatBRL(category.firstMonth)}
        </td>

        {/* Last Month */}
        <td className="py-2.5 px-3 text-right text-sm tabular-nums text-foreground">
          {formatBRL(category.lastMonth)}
        </td>

        {/* Delta R$ */}
        <td
          className={cn(
            "py-2.5 px-3 text-right text-sm tabular-nums font-medium",
            category.deltaAbsolute > 0
              ? "text-error"
              : category.deltaAbsolute < 0
                ? "text-success"
                : "text-foreground-secondary",
          )}
        >
          {category.deltaAbsolute > 0 ? "+" : ""}
          {formatBRL(category.deltaAbsolute)}
        </td>

        {/* Delta % */}
        <td className="py-2.5 px-3 text-right">
          <DeltaBadge deltaPercent={category.deltaPercent} />
        </td>

        {/* Trend */}
        <td className="py-2.5 px-3 text-center">
          <TrendIndicator
            trend={category.trend}
            deltaPercent={category.deltaPercent}
          />
        </td>
      </tr>

      {/* Subcategories */}
      {expanded &&
        category.subcategories.map((sub) => (
          <CategoryRow
            key={sub.categoryId}
            category={sub}
            startMonth={startMonth}
            endMonth={endMonth}
            depth={depth + 1}
          />
        ))}
    </>
  );
}

export function VariationTable({ data }: VariationTableProps) {
  const firstLabel = formatShortMonth(data.startMonth);
  const lastLabel = formatShortMonth(data.endMonth);

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="border-b border-border text-left">
            <th className="h-10 px-3 text-xs font-medium text-foreground-secondary">
              Categoria
            </th>
            <th className="h-10 px-3 text-right text-xs font-medium text-foreground-secondary">
              {firstLabel} (R$)
            </th>
            <th className="h-10 px-3 text-right text-xs font-medium text-foreground-secondary">
              {lastLabel} (R$)
            </th>
            <th className="h-10 px-3 text-right text-xs font-medium text-foreground-secondary">
              Delta (R$)
            </th>
            <th className="h-10 px-3 text-right text-xs font-medium text-foreground-secondary">
              Delta %
            </th>
            <th className="h-10 px-3 text-center text-xs font-medium text-foreground-secondary">
              Tendência
            </th>
          </tr>
        </thead>
        <tbody>
          {data.categories.map((cat) => (
            <CategoryRow
              key={cat.categoryId}
              category={cat}
              startMonth={data.startMonth}
              endMonth={data.endMonth}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
