"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteImport } from "@/app/settings/actions";
import type { CardImportRecord } from "@/lib/analytics/card-detail";

interface CardImportsHistoryProps {
  imports: CardImportRecord[];
  onDeleted?: () => void;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatMonthRef(monthRef: string) {
  const [y, m] = monthRef.split("-");
  const date = new Date(parseInt(y), parseInt(m) - 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function CardImportsHistory({ imports: initialImports, onDeleted }: CardImportsHistoryProps) {
  const [imports, setImports] = useState(initialImports);
  const [deleteTarget, setDeleteTarget] = useState<CardImportRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    const result = await deleteImport(deleteTarget.id);

    if (result.success) {
      setImports((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      toast.success(`Import "${deleteTarget.fileName}" excluído com ${deleteTarget.txCount} transações`);
      onDeleted?.();
    } else {
      toast.error(result.error ?? "Erro ao excluir import");
    }

    setDeleting(false);
    setDeleteTarget(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Histórico de Imports</CardTitle>
      </CardHeader>
      <CardContent>
        {imports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <FileText className="h-8 w-8 text-foreground-secondary mb-2" />
            <p className="text-sm text-foreground-secondary">
              Nenhum import realizado para este cartão.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead>Mês Ref.</TableHead>
                <TableHead className="text-right">Transações</TableHead>
                <TableHead className="text-right">Auto-categorizadas</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {imports.map((imp) => (
                <TableRow key={imp.id}>
                  <TableCell className="text-foreground-secondary">
                    {formatDate(imp.importedAt)}
                  </TableCell>
                  <TableCell className="font-medium">{imp.fileName}</TableCell>
                  <TableCell className="capitalize text-foreground-secondary">
                    {formatMonthRef(imp.monthRef)}
                  </TableCell>
                  <TableCell className="text-right">{imp.txCount}</TableCell>
                  <TableCell className="text-right">
                    <span className="text-foreground">{imp.autoCategorizedCount}</span>
                    <span className="text-foreground-secondary">
                      {" "}/ {imp.txCount}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      title="Excluir importação e transações"
                      onClick={() => setDeleteTarget(imp)}
                      className="rounded-md p-1.5 text-foreground-secondary transition-colors hover:bg-error/10 hover:text-error"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir importação?</AlertDialogTitle>
            <AlertDialogDescription>
              O arquivo <strong>{deleteTarget?.fileName}</strong> e suas{" "}
              <strong>{deleteTarget?.txCount} transações</strong> serão
              permanentemente excluídos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
