"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function getCurrentMonthRef() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(monthRef: string) {
  const [year, month] = monthRef.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function shiftMonth(monthRef: string, delta: number) {
  const [year, month] = monthRef.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

interface MonthSelectorProps {
  monthRef: string;
  onChange: (newMonth: string) => void;
  /** Disable navigating past the current month — default true */
  disableFuture?: boolean;
}

export function MonthSelector({
  monthRef,
  onChange,
  disableFuture = true,
}: MonthSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onChange(shiftMonth(monthRef, -1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[160px] text-center text-sm font-semibold text-foreground">
        {formatMonthLabel(monthRef)}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onChange(shiftMonth(monthRef, 1))}
        disabled={disableFuture && monthRef >= getCurrentMonthRef()}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
