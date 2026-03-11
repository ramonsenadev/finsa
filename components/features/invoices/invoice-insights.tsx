"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  TrendingUp,
  CalendarPlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InvoiceInsight } from "@/app/invoices/actions";

const iconMap = {
  pending_review: AlertCircle,
  month_variation: TrendingUp,
  missing_import: CalendarPlus,
} as const;

const colorMap = {
  pending_review: {
    bg: "bg-warning/10",
    border: "border-warning/20",
    icon: "text-warning",
  },
  month_variation: {
    bg: "bg-accent/5",
    border: "border-accent/20",
    icon: "text-accent",
  },
  missing_import: {
    bg: "bg-muted",
    border: "border-border",
    icon: "text-foreground-secondary",
  },
} as const;

interface InvoiceInsightsProps {
  insights: InvoiceInsight[];
}

export function InvoiceInsights({ insights }: InvoiceInsightsProps) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const visible = insights.filter((_, i) => !dismissed.has(i));

  if (visible.length === 0) return null;

  return (
    <div className="space-y-3">
      {insights.map((insight, idx) => {
        if (dismissed.has(idx)) return null;

        const Icon = iconMap[insight.type];
        const colors = colorMap[insight.type];

        return (
          <div
            key={idx}
            className={`flex items-start gap-3 rounded-lg border ${colors.border} ${colors.bg} px-4 py-3`}
          >
            <Icon className={`mt-0.5 size-4 shrink-0 ${colors.icon}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {insight.message}
              </p>
              <p className="mt-0.5 text-xs text-foreground-secondary">
                {insight.detail}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="outline" asChild>
                <Link href={insight.actionHref}>{insight.actionLabel}</Link>
              </Button>
              <button
                type="button"
                onClick={() =>
                  setDismissed((prev) => new Set([...prev, idx]))
                }
                className="rounded-md p-1 text-foreground-secondary transition-colors hover:bg-background hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
