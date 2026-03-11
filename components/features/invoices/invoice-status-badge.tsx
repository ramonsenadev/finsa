"use client";

import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

type InvoiceStatus = "pending" | "partial" | "complete";

function deriveStatus(manualPending: number, txCount: number): InvoiceStatus {
  if (manualPending === 0) return "complete";
  if (manualPending === txCount) return "pending";
  return "partial";
}

const statusConfig: Record<
  InvoiceStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  complete: {
    label: "Categorizada",
    icon: CheckCircle2,
    className: "text-success",
  },
  partial: {
    label: "",
    icon: AlertCircle,
    className: "text-warning",
  },
  pending: {
    label: "Pendente",
    icon: Clock,
    className: "text-warning",
  },
};

export function InvoiceStatusBadge({
  manualPending,
  txCount,
}: {
  manualPending: number;
  txCount: number;
}) {
  const status = deriveStatus(manualPending, txCount);
  const config = statusConfig[status];
  const Icon = config.icon;

  const label =
    status === "partial"
      ? `${manualPending} pendente${manualPending > 1 ? "s" : ""}`
      : config.label;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.className}`}>
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}
