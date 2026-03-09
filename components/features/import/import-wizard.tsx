"use client";

import { useState } from "react";
import { toast } from "sonner";
import { StepSelect } from "./step-select";
import { StepPreview } from "./step-preview";
import { StepProcessing } from "./step-processing";
import { ManualMappingModal } from "./manual-mapping-modal";
import { parseCsvFile, processImport, saveCustomFormat } from "@/app/import/actions";

type Card = {
  id: string;
  name: string;
  issuer: string;
  lastFourDigits: string | null;
  csvFormatId: string | null;
};

export type PreviewTransaction = {
  date: string;
  originalTitle: string;
  description: string;
  amount: number;
  installmentCurrent?: number;
  installmentTotal?: number;
  rawLine: string;
  isDuplicate: boolean;
  categorization: {
    categoryId: string;
    categoryName: string;
  } | null;
};

export type ParseResultData = {
  success: true;
  formatSource: "card" | "detected";
  formatMismatch: boolean;
  transactions: PreviewTransaction[];
  stats: {
    total: number;
    parsed: number;
    skipped: number;
    dateRange: { from: string; to: string } | null;
  };
  errors: string[];
  categorization: {
    byRules: number;
    byAi: number;
    manual: number;
  };
  duplicateCount: number;
  fileName: string;
};

type ImportResult = {
  success: true;
  importId: string;
  imported: number;
  autoCategorized: number;
  manualPending: number;
  skippedDuplicates: number;
};

export function ImportWizard({ cards }: { cards: Card[] }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [csvContent, setCsvContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [parseResult, setParseResult] = useState<ParseResultData | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual mapping state
  const [showManualMapping, setShowManualMapping] = useState(false);
  const [rawLines, setRawLines] = useState<string[]>([]);
  const [allHeaders, setAllHeaders] = useState<string[]>([]);

  async function handleFileUpload(cardId: string, content: string, name: string) {
    setSelectedCardId(cardId);
    setCsvContent(content);
    setFileName(name);
    setError(null);
    setIsLoading(true);

    try {
      const result = await parseCsvFile(cardId, content, name);

      if ("error" in result) {
        setError(result.error as string);
        setIsLoading(false);
        return;
      }

      if ("needsManualMapping" in result && result.needsManualMapping) {
        setRawLines(result.rawLines as string[]);
        setAllHeaders(result.allHeaders as string[]);
        setShowManualMapping(true);
        setIsLoading(false);
        return;
      }

      if ("success" in result && result.success) {
        setParseResult(result as ParseResultData);
        setStep(2);
      }
    } catch (err) {
      setError("Erro ao processar o arquivo CSV");
    }

    setIsLoading(false);
  }

  async function handleConfirmImport(skipDuplicates: boolean) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await processImport(
        selectedCardId,
        csvContent,
        fileName,
        skipDuplicates
      );

      if ("error" in result) {
        setError(result.error as string);
        setIsLoading(false);
        return;
      }

      if ("success" in result) {
        setImportResult(result as ImportResult);
        setStep(3);
        toast.success(`Import concluído: ${(result as ImportResult).imported} transações`);
      }
    } catch {
      setError("Erro ao processar o import");
      toast.error("Erro ao processar o import");
    }

    setIsLoading(false);
  }

  async function handleSaveFormat(formatData: {
    delimiter: string;
    dateColumn: string;
    descriptionColumn: string;
    amountColumn: string;
    dateFormat: string;
    amountLocale: string;
    encoding: string;
  }) {
    setIsLoading(true);

    try {
      const result = await saveCustomFormat(selectedCardId, formatData);
      if ("success" in result) {
        setShowManualMapping(false);
        // Retry parsing with new format
        await handleFileUpload(selectedCardId, csvContent, fileName);
      }
    } catch {
      setError("Erro ao salvar formato");
    }

    setIsLoading(false);
  }

  function handleReset() {
    setStep(1);
    setSelectedCardId("");
    setCsvContent("");
    setFileName("");
    setParseResult(null);
    setImportResult(null);
    setError(null);
  }

  return (
    <>
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-3">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step >= s
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-foreground-secondary"
              }`}
            >
              {s}
            </div>
            <span
              className={`text-sm ${
                step >= s ? "text-foreground font-medium" : "text-foreground-secondary"
              }`}
            >
              {s === 1 ? "Seleção" : s === 2 ? "Preview" : "Resultado"}
            </span>
            {s < 3 && (
              <div
                className={`h-px w-12 ${
                  step > s ? "bg-accent" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {step === 1 && (
        <StepSelect
          cards={cards}
          isLoading={isLoading}
          onUpload={handleFileUpload}
        />
      )}

      {step === 2 && parseResult && (
        <StepPreview
          data={parseResult}
          isLoading={isLoading}
          onConfirm={handleConfirmImport}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && importResult && (
        <StepProcessing result={importResult} onReset={handleReset} />
      )}

      {showManualMapping && (
        <ManualMappingModal
          rawLines={rawLines}
          allHeaders={allHeaders}
          isLoading={isLoading}
          onSave={handleSaveFormat}
          onClose={() => setShowManualMapping(false)}
        />
      )}
    </>
  );
}
