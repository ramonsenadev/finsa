"use client";

import { useState, useCallback } from "react";
import { Upload, CreditCard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Card = {
  id: string;
  name: string;
  issuer: string;
  lastFourDigits: string | null;
  csvFormatId: string | null;
};

export function StepSelect({
  cards,
  isLoading,
  onUpload,
}: {
  cards: Card[];
  isLoading: boolean;
  onUpload: (cardId: string, content: string, fileName: string) => void;
}) {
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!selectedCardId) return;
      if (!file.name.endsWith(".csv")) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onUpload(selectedCardId, content, file.name);
      };
      reader.readAsText(file);
    },
    [selectedCardId, onUpload]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  if (cards.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background-secondary p-8 text-center">
        <CreditCard className="mx-auto mb-3 size-10 text-foreground-secondary" />
        <p className="font-medium">Nenhum cartão ativo</p>
        <p className="mt-1 text-sm text-foreground-secondary">
          Cadastre um cartão em Cartões antes de importar.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/cards">Ir para Cartões</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card selector */}
      <div>
        <label className="mb-2 block text-sm font-medium">Cartão</label>
        <Select value={selectedCardId} onValueChange={setSelectedCardId}>
          <SelectTrigger className="w-full max-w-sm">
            <SelectValue placeholder="Selecione um cartão" />
          </SelectTrigger>
          <SelectContent>
            {cards.map((card) => (
              <SelectItem key={card.id} value={card.id}>
                <span className="flex items-center gap-2">
                  <CreditCard className="size-4" />
                  {card.name}
                  {card.lastFourDigits && (
                    <span className="text-foreground-secondary">
                      •••• {card.lastFourDigits}
                    </span>
                  )}
                  <span className="text-xs text-foreground-secondary capitalize">
                    {card.issuer}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
          isDragOver
            ? "border-accent bg-accent/5"
            : selectedCardId
              ? "border-border hover:border-accent/50 cursor-pointer"
              : "border-border/50 opacity-50 cursor-not-allowed"
        }`}
        onClick={() => {
          if (!selectedCardId || isLoading) return;
          document.getElementById("csv-input")?.click();
        }}
      >
        <input
          id="csv-input"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleInputChange}
          disabled={!selectedCardId || isLoading}
        />
        <Upload
          className={`mx-auto mb-3 size-10 ${
            isDragOver ? "text-accent" : "text-foreground-secondary"
          }`}
        />
        <p className="font-medium">
          {isLoading
            ? "Processando..."
            : isDragOver
              ? "Solte o arquivo aqui"
              : "Arraste um arquivo CSV ou clique para selecionar"}
        </p>
        <p className="mt-1 text-sm text-foreground-secondary">
          {selectedCardId
            ? "Formatos suportados: Nubank, Itaú, Inter e customizados"
            : "Selecione um cartão primeiro"}
        </p>
      </div>
    </div>
  );
}
