"use client";

import { useState, useEffect } from "react";
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
  createCsvFormat,
  updateCsvFormat,
  type CsvFormatRow,
} from "@/app/settings/actions";

interface CsvFormatFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingFormat: CsvFormatRow | null;
}

export function CsvFormatFormModal({
  open,
  onOpenChange,
  editingFormat,
}: CsvFormatFormModalProps) {
  const [name, setName] = useState("");
  const [delimiter, setDelimiter] = useState(",");
  const [dateColumn, setDateColumn] = useState("");
  const [descriptionColumn, setDescriptionColumn] = useState("");
  const [amountColumn, setAmountColumn] = useState("");
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD");
  const [amountLocale, setAmountLocale] = useState("en");
  const [skipRows, setSkipRows] = useState("0");
  const [encoding, setEncoding] = useState("UTF-8");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingFormat) {
        setName(editingFormat.name);
        setDelimiter(editingFormat.delimiter);
        setDateColumn(editingFormat.dateColumn);
        setDescriptionColumn(editingFormat.descriptionColumn);
        setAmountColumn(editingFormat.amountColumn);
        setDateFormat(editingFormat.dateFormat);
        setAmountLocale(editingFormat.amountLocale);
        setSkipRows(String(editingFormat.skipRows));
        setEncoding(editingFormat.encoding);
      } else {
        setName("");
        setDelimiter(",");
        setDateColumn("");
        setDescriptionColumn("");
        setAmountColumn("");
        setDateFormat("YYYY-MM-DD");
        setAmountLocale("en");
        setSkipRows("0");
        setEncoding("UTF-8");
      }
      setError(null);
    }
  }, [open, editingFormat]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const data = {
      name,
      delimiter,
      dateColumn,
      descriptionColumn,
      amountColumn,
      dateFormat,
      amountLocale,
      skipRows: parseInt(skipRows, 10) || 0,
      encoding,
    };

    setSubmitting(true);
    const result = editingFormat
      ? await updateCsvFormat(editingFormat.id, data)
      : await createCsvFormat(data);
    setSubmitting(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingFormat ? "Editar Formato CSV" : "Novo Formato CSV"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-md bg-error/10 p-2 text-sm text-error">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="fmt-name">Nome</Label>
            <Input
              id="fmt-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Banco X"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Delimitador</Label>
              <Select value={delimiter} onValueChange={setDelimiter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=",">Vírgula (,)</SelectItem>
                  <SelectItem value=";">Ponto e vírgula (;)</SelectItem>
                  <SelectItem value="\t">Tab</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Encoding</Label>
              <Select value={encoding} onValueChange={setEncoding}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTF-8">UTF-8</SelectItem>
                  <SelectItem value="ISO-8859-1">ISO-8859-1</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fmt-date-col">Coluna data</Label>
              <Input
                id="fmt-date-col"
                value={dateColumn}
                onChange={(e) => setDateColumn(e.target.value)}
                placeholder="date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fmt-desc-col">Coluna descrição</Label>
              <Input
                id="fmt-desc-col"
                value={descriptionColumn}
                onChange={(e) => setDescriptionColumn(e.target.value)}
                placeholder="title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fmt-amount-col">Coluna valor</Label>
              <Input
                id="fmt-amount-col"
                value={amountColumn}
                onChange={(e) => setAmountColumn(e.target.value)}
                placeholder="amount"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Formato de data</Label>
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Locale do valor</Label>
              <Select value={amountLocale} onValueChange={setAmountLocale}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">en (1,234.56)</SelectItem>
                  <SelectItem value="pt-BR">pt-BR (1.234,56)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fmt-skip">Pular linhas</Label>
              <Input
                id="fmt-skip"
                type="number"
                min="0"
                value={skipRows}
                onChange={(e) => setSkipRows(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Salvando..."
                : editingFormat
                  ? "Salvar"
                  : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
