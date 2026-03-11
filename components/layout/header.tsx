"use client";

import { Suspense, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Download, FileText, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSearchParams } from "next/navigation";
import {
  ManualTransactionModal,
} from "@/components/features/transactions/manual-transaction-modal";
import { ShortcutsHelp } from "./shortcuts-help";
import { MobileMenuButton } from "./sidebar";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { getCurrentMonthRef } from "@/components/ui/month-selector";

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
  const router = useRouter();
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleNewTransaction = useCallback(() => {
    setManualModalOpen(true);
  }, []);

  const handleSaved = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleSearch = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchValue.trim()) {
      router.push(`/transactions?search=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue("");
      (e.target as HTMLInputElement).blur();
    }
  }, [router, searchValue]);

  useKeyboardShortcuts({
    onNewTransaction: handleNewTransaction,
  });

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 md:px-6">
        <div className="flex items-center gap-2">
          <MobileMenuButton />
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Global search */}
          <div className="relative hidden w-72 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary" />
            <Input
              data-search-input
              placeholder="Buscar transações... ( / )"
              className="pl-9"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleSearch}
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
        onSaved={handleSaved}
      />
    </>
  );
}
