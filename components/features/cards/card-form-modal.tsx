"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  cardSchema,
  ISSUERS,
  ISSUER_LABELS,
  type Issuer,
  type CardFormData,
  type CustomCsvFormatData,
} from "@/lib/validations/card";
import { createCard, updateCard } from "@/app/cards/actions";

interface CardFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCard?: {
    id: string;
    name: string;
    issuer: string;
    lastFourDigits: string | null;
    holderName: string | null;
    csvFormatId: string | null;
  } | null;
}

export function CardFormModal({
  open,
  onOpenChange,
  editingCard,
}: CardFormModalProps) {
  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState<Issuer>("nubank");
  const [lastFourDigits, setLastFourDigits] = useState("");
  const [holderName, setHolderName] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  // Custom CSV format fields
  const [csvDelimiter, setCsvDelimiter] = useState(";");
  const [csvDateColumn, setCsvDateColumn] = useState("");
  const [csvDescriptionColumn, setCsvDescriptionColumn] = useState("");
  const [csvAmountColumn, setCsvAmountColumn] = useState("");
  const [csvDateFormat, setCsvDateFormat] = useState("DD/MM/YYYY");
  const [csvEncoding, setCsvEncoding] = useState("UTF-8");

  const isEditing = !!editingCard;

  useEffect(() => {
    if (editingCard) {
      setName(editingCard.name);
      setIssuer(editingCard.issuer as Issuer);
      setLastFourDigits(editingCard.lastFourDigits ?? "");
      setHolderName(editingCard.holderName ?? "");
    } else {
      setName("");
      setIssuer("nubank");
      setLastFourDigits("");
      setHolderName("");
    }
    setErrors({});
    setCsvDelimiter(";");
    setCsvDateColumn("");
    setCsvDescriptionColumn("");
    setCsvAmountColumn("");
    setCsvDateFormat("DD/MM/YYYY");
    setCsvEncoding("UTF-8");
  }, [editingCard, open]);

  function handleDigitsChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setLastFourDigits(digits);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const formData: CardFormData = {
      name,
      issuer,
      lastFourDigits,
      holderName,
    };

    const parsed = cardSchema.safeParse(formData);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    let customCsv: CustomCsvFormatData | undefined;
    if (issuer === "outro") {
      customCsv = {
        delimiter: csvDelimiter,
        dateColumn: csvDateColumn,
        descriptionColumn: csvDescriptionColumn,
        amountColumn: csvAmountColumn,
        dateFormat: csvDateFormat,
        encoding: csvEncoding,
      };
    }

    setSubmitting(true);
    try {
      const result = isEditing
        ? await updateCard(editingCard!.id, formData, customCsv)
        : await createCard(formData, customCsv);

      if ("error" in result) {
        const err = result.error;
        setErrors(
          typeof err === "string"
            ? { _form: [err] }
            : (err as Record<string, string[]>)
        );
        return;
      }

      toast.success(isEditing ? "Cartão atualizado" : "Cartão criado");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Cartão" : "Novo Cartão"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome do cartão</Label>
            <Input
              id="name"
              placeholder="Ex: Nubank Pessoal"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && (
              <p className="text-xs text-error">{errors.name[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="issuer">Instituição</Label>
            <Select
              value={issuer}
              onValueChange={(v) => setIssuer(v as Issuer)}
            >
              <SelectTrigger id="issuer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ISSUERS.map((iss) => (
                  <SelectItem key={iss} value={iss}>
                    {ISSUER_LABELS[iss]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.issuer && (
              <p className="text-xs text-error">{errors.issuer[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lastFourDigits">Últimos 4 dígitos</Label>
            <Input
              id="lastFourDigits"
              placeholder="0000"
              value={lastFourDigits}
              onChange={(e) => handleDigitsChange(e.target.value)}
              maxLength={4}
              inputMode="numeric"
            />
            {errors.lastFourDigits && (
              <p className="text-xs text-error">{errors.lastFourDigits[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="holderName">Titular</Label>
            <Input
              id="holderName"
              placeholder="Nome do titular"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
            />
            {errors.holderName && (
              <p className="text-xs text-error">{errors.holderName[0]}</p>
            )}
          </div>

          {issuer === "outro" && (
            <div className="flex flex-col gap-3 rounded-md border border-border bg-background-secondary p-4">
              <p className="text-sm font-medium text-foreground">
                Mapeamento de colunas CSV
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="csvDelimiter" className="text-xs">
                    Separador
                  </Label>
                  <Input
                    id="csvDelimiter"
                    value={csvDelimiter}
                    onChange={(e) => setCsvDelimiter(e.target.value)}
                    placeholder=","
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="csvEncoding" className="text-xs">
                    Encoding
                  </Label>
                  <Select value={csvEncoding} onValueChange={setCsvEncoding}>
                    <SelectTrigger id="csvEncoding">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTF-8">UTF-8</SelectItem>
                      <SelectItem value="ISO-8859-1">ISO-8859-1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="csvDateColumn" className="text-xs">
                    Coluna de data
                  </Label>
                  <Input
                    id="csvDateColumn"
                    value={csvDateColumn}
                    onChange={(e) => setCsvDateColumn(e.target.value)}
                    placeholder="date"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="csvDateFormat" className="text-xs">
                    Formato de data
                  </Label>
                  <Select value={csvDateFormat} onValueChange={setCsvDateFormat}>
                    <SelectTrigger id="csvDateFormat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="csvDescriptionColumn" className="text-xs">
                    Coluna de descrição
                  </Label>
                  <Input
                    id="csvDescriptionColumn"
                    value={csvDescriptionColumn}
                    onChange={(e) => setCsvDescriptionColumn(e.target.value)}
                    placeholder="description"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="csvAmountColumn" className="text-xs">
                    Coluna de valor
                  </Label>
                  <Input
                    id="csvAmountColumn"
                    value={csvAmountColumn}
                    onChange={(e) => setCsvAmountColumn(e.target.value)}
                    placeholder="amount"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting
                ? "Salvando..."
                : isEditing
                  ? "Salvar"
                  : "Criar Cartão"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
