"use client";

import { formatBRL } from "@/lib/format";

interface SourceSplitProps {
  totalCard: number;
  totalManual: number;
}

export function SourceSplit({ totalCard, totalManual }: SourceSplitProps) {
  const total = totalCard + totalManual;
  if (total === 0) return null;

  const cardPercent = (totalCard / total) * 100;
  const manualPercent = (totalManual / total) * 100;

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-foreground-secondary">Cartão</span>
          <span className="font-medium text-foreground">
            {formatBRL(totalCard)} ({cardPercent.toFixed(0)}%)
          </span>
        </div>
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-foreground-secondary">Manual</span>
          <span className="font-medium text-foreground">
            {formatBRL(totalManual)} ({manualPercent.toFixed(0)}%)
          </span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-background-secondary">
          <div
            className="rounded-l-full bg-accent"
            style={{ width: `${cardPercent}%` }}
          />
          <div
            className="bg-foreground-secondary/30"
            style={{ width: `${manualPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
