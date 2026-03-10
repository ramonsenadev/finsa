"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

interface PeriodSelectorProps {
  startMonth: string;
  endMonth: string;
  onPreset: (months: number) => void;
  onYearPreset: () => void;
  onCustomRange: (start: string, end: string) => void;
}

const presets = [
  { label: "3 meses", value: 3 },
  { label: "6 meses", value: 6 },
  { label: "12 meses", value: 12 },
];

function formatMonthLabel(monthRef: string) {
  const [year, month] = monthRef.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function getActivePreset(
  startMonth: string,
  endMonth: string,
): number | "year" | null {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (endMonth !== currentMonth) return null;

  const year = now.getFullYear();
  if (startMonth === `${year}-01`) return "year";

  for (const p of presets) {
    const d = new Date(now.getFullYear(), now.getMonth() - (p.value - 1), 1);
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (startMonth === expected) return p.value;
  }

  return null;
}

export function PeriodSelector({
  startMonth,
  endMonth,
  onPreset,
  onYearPreset,
  onCustomRange,
}: PeriodSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState(startMonth);
  const [customEnd, setCustomEnd] = useState(endMonth);
  const activePreset = getActivePreset(startMonth, endMonth);

  function handleApplyCustom() {
    if (customStart <= customEnd) {
      onCustomRange(customStart, customEnd);
      setShowCustom(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((p) => (
          <Button
            key={p.value}
            variant={activePreset === p.value ? "default" : "outline"}
            size="sm"
            onClick={() => {
              onPreset(p.value);
              setShowCustom(false);
            }}
          >
            {p.label}
          </Button>
        ))}
        <Button
          variant={activePreset === "year" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            onYearPreset();
            setShowCustom(false);
          }}
        >
          Ano corrente
        </Button>
        <Button
          variant={showCustom ? "default" : "outline"}
          size="sm"
          onClick={() => setShowCustom(!showCustom)}
        >
          Personalizado
        </Button>

        <span className="ml-auto text-sm text-foreground-secondary">
          {formatMonthLabel(startMonth)} — {formatMonthLabel(endMonth)}
        </span>
      </div>

      {showCustom && (
        <div className="flex items-end gap-3 rounded-lg border border-border bg-muted/30 p-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground-secondary">
              Início
            </label>
            <input
              type="month"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className={cn(
                "rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs dark:bg-input/30",
                "focus:outline-none focus:ring-2 focus:ring-ring",
              )}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground-secondary">
              Fim
            </label>
            <input
              type="month"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className={cn(
                "rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs dark:bg-input/30",
                "focus:outline-none focus:ring-2 focus:ring-ring",
              )}
            />
          </div>
          <Button size="sm" onClick={handleApplyCustom}>
            Aplicar
          </Button>
        </div>
      )}
    </div>
  );
}
