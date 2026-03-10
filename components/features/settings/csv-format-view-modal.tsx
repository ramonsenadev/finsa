"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { CsvFormatRow } from "@/app/settings/actions";

interface CsvFormatViewModalProps {
  format: CsvFormatRow | null;
  onClose: () => void;
}

export function CsvFormatViewModal({ format, onClose }: CsvFormatViewModalProps) {
  if (!format) return null;

  const fields = [
    { label: "Nome", value: format.name },
    {
      label: "Delimitador",
      value: format.delimiter === "," ? "Vírgula (,)" : format.delimiter === ";" ? "Ponto e vírgula (;)" : format.delimiter,
    },
    { label: "Coluna de data", value: format.dateColumn },
    { label: "Coluna de descrição", value: format.descriptionColumn },
    { label: "Coluna de valor", value: format.amountColumn },
    { label: "Formato de data", value: format.dateFormat },
    {
      label: "Locale do valor",
      value: format.amountLocale === "en" ? "en (1,234.56)" : "pt-BR (1.234,56)",
    },
    { label: "Pular linhas", value: String(format.skipRows) },
    { label: "Encoding", value: format.encoding },
  ];

  return (
    <Dialog open={!!format} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {format.name}
            <Badge variant="secondary" className="text-xs">Sistema</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {fields.map((field) => (
            <div key={field.label} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
              <span className="text-sm text-foreground-secondary">{field.label}</span>
              <span className="text-sm font-medium">{field.value}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
