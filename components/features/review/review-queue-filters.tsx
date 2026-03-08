"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ImportOption = {
  id: string;
  fileName: string;
  importedAt: Date;
};

export function ReviewQueueFilters({
  imports,
  importId,
  hasSuggestion,
  onImportChange,
  onSuggestionChange,
}: {
  imports: ImportOption[];
  importId: string;
  hasSuggestion: string;
  onImportChange: (value: string) => void;
  onSuggestionChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Select value={importId} onValueChange={onImportChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Todos os imports" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os imports</SelectItem>
          {imports.map((imp) => (
            <SelectItem key={imp.id} value={imp.id}>
              {imp.fileName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={hasSuggestion} onValueChange={onSuggestionChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Todas as transações" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="with">Com sugestão de IA</SelectItem>
          <SelectItem value="without">Sem sugestão</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
