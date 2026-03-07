"use client";

import { useState } from "react";
import { X } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ManualMappingModal({
  rawLines,
  allHeaders,
  isLoading,
  onSave,
  onClose,
}: {
  rawLines: string[];
  allHeaders: string[];
  isLoading: boolean;
  onSave: (formatData: {
    delimiter: string;
    dateColumn: string;
    descriptionColumn: string;
    amountColumn: string;
    dateFormat: string;
    amountLocale: string;
    encoding: string;
  }) => void;
  onClose: () => void;
}) {
  const [delimiter, setDelimiter] = useState(",");
  const [dateColumn, setDateColumn] = useState("");
  const [descriptionColumn, setDescriptionColumn] = useState("");
  const [amountColumn, setAmountColumn] = useState("");
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD");
  const [amountLocale, setAmountLocale] = useState("en");
  const [encoding, setEncoding] = useState("UTF-8");

  // Parse raw lines with current delimiter for preview
  const parsedRows = rawLines.map((line) => line.split(delimiter));
  const headers =
    parsedRows.length > 0
      ? parsedRows[0].map((h) => h.trim().replace(/"/g, ""))
      : allHeaders;

  const canSave = dateColumn && descriptionColumn && amountColumn;

  function handleSave() {
    if (!canSave) return;
    onSave({
      delimiter,
      dateColumn,
      descriptionColumn,
      amountColumn,
      dateFormat,
      amountLocale,
      encoding,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-background p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Mapeamento Manual</h2>
            <p className="text-sm text-foreground-secondary">
              O formato do CSV não foi reconhecido. Mapeie as colunas
              manualmente.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-secondary"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Raw preview */}
        <div className="mb-6 overflow-x-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((h, i) => (
                  <TableHead key={i} className="whitespace-nowrap text-xs">
                    {h || `Col ${i + 1}`}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsedRows.slice(1, 5).map((row, i) => (
                <TableRow key={i}>
                  {row.map((cell, j) => (
                    <TableCell key={j} className="whitespace-nowrap text-xs">
                      {cell.trim().replace(/"/g, "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mapping controls */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Delimitador</Label>
            <Select value={delimiter} onValueChange={setDelimiter}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=",">Vírgula (,)</SelectItem>
                <SelectItem value=";">Ponto e vírgula (;)</SelectItem>
                <SelectItem value="\t">Tab</SelectItem>
                <SelectItem value="|">Pipe (|)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Encoding</Label>
            <Select value={encoding} onValueChange={setEncoding}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTF-8">UTF-8</SelectItem>
                <SelectItem value="ISO-8859-1">ISO-8859-1 (Latin-1)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Coluna de Data</Label>
            <Select value={dateColumn} onValueChange={setDateColumn}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {headers.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Formato de Data</Label>
            <Select value={dateFormat} onValueChange={setDateFormat}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Coluna de Descrição</Label>
            <Select
              value={descriptionColumn}
              onValueChange={setDescriptionColumn}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {headers.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Coluna de Valor</Label>
            <Select value={amountColumn} onValueChange={setAmountColumn}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {headers.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Formato de Valor</Label>
            <Select value={amountLocale} onValueChange={setAmountLocale}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">Ponto decimal (1234.56)</SelectItem>
                <SelectItem value="pt-BR">
                  Vírgula decimal (1.234,56)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSave || isLoading}>
            {isLoading ? "Salvando..." : "Salvar Formato"}
          </Button>
        </div>
      </div>
    </div>
  );
}
