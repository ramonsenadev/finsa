"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Eye, Lock } from "lucide-react";
import {
  deleteCsvFormat,
  type CsvFormatRow,
} from "@/app/settings/actions";
import { CsvFormatFormModal } from "./csv-format-form-modal";
import { CsvFormatViewModal } from "./csv-format-view-modal";

interface CsvFormatsTabProps {
  formats: CsvFormatRow[];
}

export function CsvFormatsTab({ formats }: CsvFormatsTabProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFormat, setEditingFormat] = useState<CsvFormatRow | null>(null);
  const [viewingFormat, setViewingFormat] = useState<CsvFormatRow | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Excluir este formato CSV?")) return;
    await deleteCsvFormat(id);
  }

  function handleEdit(format: CsvFormatRow) {
    setEditingFormat(format);
    setModalOpen(true);
  }

  function handleAdd() {
    setEditingFormat(null);
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">Formatos CSV</h3>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="mr-1.5 h-4 w-4" />
          Novo Formato
        </Button>
      </div>

      {formats.length === 0 ? (
        <div className="rounded-md border border-border p-8 text-center text-foreground-secondary">
          Nenhum formato CSV cadastrado.
        </div>
      ) : (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Delimitador</TableHead>
                <TableHead>Colunas</TableHead>
                <TableHead>Encoding</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {formats.map((format) => (
                <TableRow key={format.id}>
                  <TableCell className="font-medium">{format.name}</TableCell>
                  <TableCell>
                    <code className="rounded bg-background-secondary px-1.5 py-0.5 text-xs">
                      {format.delimiter === "," ? "vírgula" : format.delimiter === ";" ? "ponto e vírgula" : format.delimiter}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        {format.dateColumn}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {format.descriptionColumn}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {format.amountColumn}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{format.encoding}</span>
                  </TableCell>
                  <TableCell>
                    {format.isSystem ? (
                      <Badge variant="secondary">
                        <Lock className="mr-1 h-3 w-3" />
                        Sistema
                      </Badge>
                    ) : (
                      <Badge>Customizado</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {format.isSystem ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setViewingFormat(format)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(format)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-error hover:text-error"
                            onClick={() => handleDelete(format.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CsvFormatFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingFormat={editingFormat}
      />

      <CsvFormatViewModal
        format={viewingFormat}
        onClose={() => setViewingFormat(null)}
      />
    </div>
  );
}
