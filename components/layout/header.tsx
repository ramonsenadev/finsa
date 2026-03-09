"use client";

import { Suspense, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Plus, Download, FileText, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ManualTransactionModal,
} from "@/components/features/transactions/manual-transaction-modal";

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

function ExportDropdown() {
  const searchParams = useSearchParams();
  const monthRef = searchParams.get("month") || getCurrentMonthRef();
  const [loading, setLoading] = useState(false);

  async function handleExportPDF() {
    setLoading(true);
    try {
      const res = await fetch(`/api/export/monthly-pdf?month=${monthRef}`);
      if (!res.ok) throw new Error("Erro ao gerar PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finsa-relatorio-${monthRef}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Could add toast here
      console.error("Erro ao exportar PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          <Download className="mr-1.5 h-4 w-4" />
          {loading ? "Gerando..." : "Exportar"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="mr-2 h-4 w-4" />
          PDF Mensal
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          CSV (em breve)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const [manualModalOpen, setManualModalOpen] = useState(false);

  return (
    <>
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

        <div className="flex items-center gap-3">
          {/* Global search placeholder */}
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary" />
            <Input
              placeholder="Buscar transações..."
              className="pl-9"
            />
          </div>

          {/* Export dropdown */}
          <Suspense fallback={null}>
            <ExportDropdown />
          </Suspense>

          {/* Novo Lançamento button */}
          <Button size="sm" onClick={() => setManualModalOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Novo Lançamento
          </Button>
        </div>
      </header>

      <ManualTransactionModal
        open={manualModalOpen}
        onOpenChange={setManualModalOpen}
        editingTransaction={null}
      />
    </>
  );
}
