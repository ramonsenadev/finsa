"use client";

import { FileText, AlertCircle, CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { InvoiceRow } from "@/app/invoices/actions";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
  className?: string;
}) {
  return (
    <Card className={`gap-3 py-4 ${className ?? ""}`}>
      <div className="px-4">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-xs font-medium text-foreground-secondary">{label}</p>
        </div>
        <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        {detail && (
          <p className="mt-0.5 text-xs text-foreground-secondary">{detail}</p>
        )}
      </div>
    </Card>
  );
}

interface InvoiceSummaryCardsProps {
  invoices: InvoiceRow[];
}

export function InvoiceSummaryCards({ invoices }: InvoiceSummaryCardsProps) {
  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const pendingCount = invoices.filter((i) => i.manualPendingCount > 0).length;
  const pendingTx = invoices.reduce((sum, i) => sum + i.manualPendingCount, 0);
  const uniqueCards = new Set(invoices.map((i) => i.cardId)).size;
  const uniqueMonths = new Set(invoices.map((i) => i.monthRef)).size;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        icon={<FileText className="size-4 text-accent" />}
        label="Total Faturas"
        value={String(totalInvoices)}
        detail={`${uniqueMonths} ${uniqueMonths === 1 ? "mês" : "meses"}`}
      />
      <SummaryCard
        icon={<CreditCard className="size-4 text-accent" />}
        label="Valor Total"
        value={formatBRL(totalAmount)}
        detail={`${uniqueCards} ${uniqueCards === 1 ? "cartão" : "cartões"}`}
      />
      <SummaryCard
        icon={<AlertCircle className={`size-4 ${pendingCount > 0 ? "text-warning" : "text-success"}`} />}
        label="Pendentes"
        value={String(pendingCount)}
        detail={pendingTx > 0 ? `${pendingTx} transações sem categoria` : "Tudo categorizado"}
      />
      <SummaryCard
        icon={<FileText className="size-4 text-foreground-secondary" />}
        label="Transações"
        value={String(invoices.reduce((sum, i) => sum + i.txCount, 0))}
        detail={`${invoices.reduce((sum, i) => sum + i.autoCategorizedCount + i.aiCategorizedCount, 0)} auto-categorizadas`}
      />
    </div>
  );
}
