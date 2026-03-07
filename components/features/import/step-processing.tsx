"use client";

import { CheckCircle2, FileText, Tag, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type ImportResult = {
  success: true;
  importId: string;
  imported: number;
  autoCategorized: number;
  manualPending: number;
  skippedDuplicates: number;
};

export function StepProcessing({
  result,
  onReset,
}: {
  result: ImportResult;
  onReset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-lg border border-border bg-background p-8 text-center">
      <CheckCircle2 className="mx-auto mb-4 size-12 text-success" />
      <h2 className="text-lg font-semibold">Import concluído</h2>
      <p className="mt-1 text-sm text-foreground-secondary">
        As transações foram importadas com sucesso.
      </p>

      <div className="mt-6 space-y-3 text-left">
        <ResultRow
          icon={<FileText className="size-4 text-accent" />}
          label="Transações importadas"
          value={String(result.imported)}
        />
        <ResultRow
          icon={<Tag className="size-4 text-success" />}
          label="Categorizadas por regras"
          value={String(result.autoCategorized)}
        />
        <ResultRow
          icon={<AlertCircle className="size-4 text-warning" />}
          label="Pendentes de categorização"
          value={String(result.manualPending)}
        />
        {result.skippedDuplicates > 0 && (
          <ResultRow
            icon={<AlertCircle className="size-4 text-foreground-secondary" />}
            label="Duplicatas ignoradas"
            value={String(result.skippedDuplicates)}
          />
        )}
      </div>

      <div className="mt-8 flex gap-3 justify-center">
        {result.manualPending > 0 && (
          <Button asChild>
            <a href={`/transactions?import=${result.importId}&uncategorized=true`}>
              Revisar Pendentes
            </a>
          </Button>
        )}
        <Button variant="outline" onClick={onReset}>
          Novo Import
        </Button>
      </div>
    </div>
  );
}

function ResultRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-md bg-background-secondary px-4 py-3">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-medium">{value}</span>
    </div>
  );
}
