"use client";

import { Suspense } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function getCurrentMonthRef() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(monthRef: string) {
  const [year, month] = monthRef.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function shiftMonth(monthRef: string, delta: number) {
  const [year, month] = monthRef.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function PeriodSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const monthRef = searchParams.get("month") || getCurrentMonthRef();

  function navigate(newMonth: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (newMonth === getCurrentMonthRef()) {
      params.delete("month");
    } else {
      params.set("month", newMonth);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex items-center gap-1">
      <span className="mr-2 text-sm font-medium text-foreground-secondary">
        Período:
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => navigate(shiftMonth(monthRef, -1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-35 text-center text-sm font-semibold text-foreground">
        {formatMonthLabel(monthRef)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => navigate(shiftMonth(monthRef, 1))}
        disabled={monthRef >= getCurrentMonthRef()}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <Suspense
        fallback={
          <div className="flex items-center gap-1">
            <span className="mr-2 text-sm font-medium text-foreground-secondary">
              Período:
            </span>
            <span className="min-w-35 text-center text-sm font-semibold text-foreground">
              {formatMonthLabel(getCurrentMonthRef())}
            </span>
          </div>
        }
      >
        <PeriodSelector />
      </Suspense>

      {/* Global search placeholder */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary" />
        <Input
          placeholder="Buscar transações..."
          className="pl-9"
        />
      </div>
    </header>
  );
}
