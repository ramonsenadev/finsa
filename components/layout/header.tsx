"use client";

import { Suspense, useState, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, Plus, Download, FileText, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
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
import { ShortcutsHelp } from "./shortcuts-help";
import { MobileMenuButton } from "./sidebar";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

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
      toast.success("PDF exportado com sucesso");
    } catch {
      toast.error("Erro ao exportar PDF");
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

  const handleNewTransaction = useCallback(() => {
    setManualModalOpen(true);
  }, []);

  useKeyboardShortcuts({
    onNewTransaction: handleNewTransaction,
  });

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 md:px-6">
        <div className="flex items-center gap-2">
          <MobileMenuButton />
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
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Global search */}
          <div className="relative hidden w-72 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary" />
            <Input
              data-search-input
              placeholder="Buscar transações... ( / )"
              className="pl-9"
            />
          </div>

          {/* Shortcuts help */}
          <ShortcutsHelp />

          {/* Export dropdown */}
          <Suspense fallback={null}>
            <ExportDropdown />
          </Suspense>

          {/* Novo Lançamento button */}
          <Button size="sm" onClick={handleNewTransaction}>
            <Plus className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Novo Lançamento</span>
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
