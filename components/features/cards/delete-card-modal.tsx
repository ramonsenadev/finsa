"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { getCardDeleteInfo, deleteCard } from "@/app/cards/actions";

type DeleteMode = "keep" | "delete";

interface DeleteCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: string | null;
  cardName: string | null;
}

export function DeleteCardModal({
  open,
  onOpenChange,
  cardId,
  cardName,
}: DeleteCardModalProps) {
  const [info, setInfo] = useState<{
    transactionCount: number;
    importCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mode, setMode] = useState<DeleteMode>("keep");

  useEffect(() => {
    if (open && cardId) {
      setLoading(true);
      setInfo(null);
      setMode("keep");
      getCardDeleteInfo(cardId).then((result) => {
        if (result) {
          setInfo({
            transactionCount: result.transactionCount,
            importCount: result.importCount,
          });
        }
        setLoading(false);
      });
    }
  }, [open, cardId]);

  async function handleConfirm() {
    if (!cardId) return;
    setDeleting(true);
    const result = await deleteCard(cardId, mode === "delete");
    setDeleting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(
      mode === "delete"
        ? "Cartão e transações excluídos com sucesso."
        : "Cartão removido. Suas transações foram mantidas."
    );
    onOpenChange(false);
  }

  const hasTransactions = info && info.transactionCount > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Excluir cartão {cardName}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {loading
              ? "Verificando dados vinculados..."
              : hasTransactions
                ? `Este cartão possui ${info.transactionCount} transaç${info.transactionCount === 1 ? "ão" : "ões"}. Escolha o que fazer com elas.`
                : "Esta ação não pode ser desfeita."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {!loading && hasTransactions && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setMode("keep")}
              className={`flex w-full cursor-pointer items-start gap-3 rounded-md p-3 text-left transition-colors ${
                mode === "keep"
                  ? "bg-muted ring-1 ring-ring"
                  : "hover:bg-muted/50"
              }`}
            >
              <div
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  mode === "keep"
                    ? "border-primary bg-primary"
                    : "border-foreground-secondary"
                }`}
              >
                {mode === "keep" && (
                  <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">Manter transações</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Remove apenas o cartão. As transações continuam visíveis nos relatórios.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("delete")}
              className={`flex w-full cursor-pointer items-start gap-3 rounded-md p-3 text-left transition-colors ${
                mode === "delete"
                  ? "bg-destructive/10 ring-1 ring-destructive/30"
                  : "hover:bg-muted/50"
              }`}
            >
              <div
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  mode === "delete"
                    ? "border-destructive bg-destructive"
                    : "border-foreground-secondary"
                }`}
              >
                {mode === "delete" && (
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">Excluir tudo</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                    {info.transactionCount} transaç{info.transactionCount === 1 ? "ão" : "ões"} ser{info.transactionCount === 1 ? "á" : "ão"} removidas permanentemente.
                  </span>
                </p>
              </div>
            </button>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={deleting || loading}
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : mode === "delete" && hasTransactions ? (
              "Excluir cartão e transações"
            ) : (
              "Excluir cartão"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
