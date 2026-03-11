"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

export type ImportRecord = {
  id: string;
  fileName: string;
  monthRef: string;
  importedAt: Date;
  txCount: number;
  autoCategorizedCount: number;
  cardName: string;
  cardColor: string | null;
};

interface ImportListProps {
  imports: ImportRecord[];
  showCard?: boolean;
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

export function ImportList({ imports: initialImports, showCard = true, onDeleted }: ImportListProps) {
  const [imports, setImports] = useState(initialImports);
  const [deleteTarget, setDeleteTarget] = useState<ImportRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    const result = await deleteImport(deleteTarget.id);

    if (result.success) {
      setImports((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      toast.success(`Fatura "${deleteTarget.fileName}" excluída com ${deleteTarget.txCount} transações`);
      onDeleted?.();
    } else {
      toast.error(result.error ?? "Erro ao excluir fatura");
    }

    setDeleting(false);
    setDeleteTarget(null);
  }

  if (imports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <FileText className="mb-2 h-8 w-8 text-foreground-secondary" />
        <p className="text-sm text-foreground-secondary">
          Nenhuma importação realizada.
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Arquivo</TableHead>
            {showCard && <TableHead>Cartão</TableHead>}
            <TableHead>Mês Ref.</TableHead>
            <TableHead className="text-right">Transações</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {imports.map((imp) => (
            <TableRow key={imp.id}>
              <TableCell className="whitespace-nowrap text-foreground-secondary">
                {formatDate(imp.importedAt)}
              </TableCell>
              <TableCell className="font-medium">{imp.fileName}</TableCell>
              {showCard && (
                <TableCell>
                  <Badge
                    variant="outline"
                    className="gap-1 text-xs"
                    style={
                      imp.cardColor
                        ? {
                            borderColor: imp.cardColor + "40",
                            backgroundColor: imp.cardColor + "10",
                            color: imp.cardColor,
                          }
                        : undefined
                    }
                  >
                    {imp.cardColor && (
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: imp.cardColor }}
                      />
                    )}
                    {imp.cardName}
                  </Badge>
                </TableCell>
              )}
              <TableCell className="capitalize text-foreground-secondary">
                {formatMonthRef(imp.monthRef)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {imp.txCount}
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
    </>
  );
}
