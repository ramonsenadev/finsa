"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Plus, CreditCard, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { InvoiceInsights } from "./invoice-insights";
import { InvoiceSummaryCards } from "./invoice-summary-cards";
import { InvoiceEvolutionChart } from "./invoice-evolution-chart";
import { InvoicesTable } from "./invoices-table";
import type { InvoiceRow, InvoiceInsight } from "@/app/invoices/actions";

interface InvoicesContentProps {
  invoices: InvoiceRow[];
  cards: { id: string; name: string; color: string | null }[];
  insights: InvoiceInsight[];
}

export function InvoicesContent({ invoices, cards, insights }: InvoicesContentProps) {
  const [cardFilter, setCardFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = invoices.filter((i) => {
    if (cardFilter !== "all" && i.cardId !== cardFilter) return false;
    if (search && !i.fileName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Faturas</h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Gerencie as faturas dos seus cartões de crédito.
          </p>
        </div>
        <Button asChild>
          <Link href="/invoices/import">
            <Plus className="h-4 w-4" />
            Importar Fatura
          </Link>
        </Button>
      </div>

      {/* Insights */}
      {insights.length > 0 && invoices.length > 0 && (
        <div className="mb-6">
          <InvoiceInsights insights={insights} />
        </div>
      )}

      {invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma fatura importada"
          description="Importe a fatura do seu cartão de crédito para começar a categorizar seus gastos."
          action={{ label: "Importar Fatura", href: "/invoices/import" }}
        />
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <InvoiceSummaryCards invoices={filtered} />

          {/* Evolution chart */}
          <InvoiceEvolutionChart invoices={filtered} />

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-secondary" />
              <Input
                placeholder="Buscar por arquivo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <Select value={cardFilter} onValueChange={setCardFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os cartões" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cartões</SelectItem>
                {cards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    <span className="flex items-center gap-2">
                      <CreditCard className="size-3.5" />
                      {card.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary bar */}
          <div className="flex items-center justify-between rounded-lg bg-background-secondary px-4 py-2.5">
            <div className="flex items-center gap-4">
              <p className="text-sm text-foreground-secondary">
                <span className="font-medium text-foreground">{filtered.length}</span>{" "}
                fatura{filtered.length !== 1 ? "s" : ""}
              </p>
              {filtered.filter((i) => i.manualPendingCount > 0).length > 0 && (
                <p className="text-sm text-warning">
                  <span className="font-medium">
                    {filtered.filter((i) => i.manualPendingCount > 0).length}
                  </span>{" "}
                  com pendências
                </p>
              )}
              <p className="text-sm text-foreground-secondary">
                <span className="font-medium text-foreground">
                  {filtered.reduce((sum, i) => sum + i.txCount, 0)}
                </span>{" "}
                transações
              </p>
            </div>
            <p className="text-sm text-foreground-secondary">
              Total:{" "}
              <span className="font-semibold text-foreground">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(filtered.reduce((sum, i) => sum + i.totalAmount, 0))}
              </span>
            </p>
          </div>

          {/* Table */}
          <InvoicesTable invoices={filtered} />
        </div>
      )}
    </div>
  );
}
