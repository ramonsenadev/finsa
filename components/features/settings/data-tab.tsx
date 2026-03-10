"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Trash2, AlertTriangle } from "lucide-react";
import { exportAllData, wipeAllData } from "@/app/settings/actions";

export function DataTab() {
  const [isPending, startTransition] = useTransition();
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [wiping, setWiping] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  function handleExport() {
    startTransition(async () => {
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finsa-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    });
  }

  async function handleWipe() {
    if (confirmText !== "CONFIRMAR") return;
    setWiping(true);
    await wipeAllData();
    setWiping(false);
    setShowWipeConfirm(false);
    setConfirmText("");
  }

  return (
    <div className="space-y-6">
      {/* Export */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-2 text-base font-semibold">Exportar Dados</h3>
        <p className="mb-4 text-sm text-foreground-secondary">
          Faça download de todos os seus dados em formato JSON para backup.
          Inclui transações, cartões, categorias, regras, rendas e investimentos.
        </p>
        <Button onClick={handleExport} disabled={isPending}>
          <Download className="mr-1.5 h-4 w-4" />
          {exportSuccess
            ? "Download iniciado!"
            : isPending
              ? "Exportando..."
              : "Exportar todos os dados"}
        </Button>
      </div>

      {/* Wipe */}
      <div className="rounded-lg border border-error/30 bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error/10">
            <AlertTriangle className="h-5 w-5 text-error" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-error">
              Limpar Todos os Dados
            </h3>
            <p className="mt-1 text-sm text-foreground-secondary">
              Esta ação é irreversível. Todos os seus dados serão permanentemente
              excluídos, incluindo transações, cartões, rendas, investimentos,
              regras de categorização e preferências.
            </p>

            {!showWipeConfirm ? (
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-error/30 px-3 py-2 text-sm font-medium text-error transition-colors hover:bg-error/10 hover:text-error"
                onClick={() => setShowWipeConfirm(true)}
              >
                <Trash2 className="h-4 w-4" />
                Limpar todos os dados
              </button>
            ) : (
              <div className="mt-4 space-y-3 rounded-md border border-error/20 bg-error/5 p-4">
                <p className="text-sm font-medium text-error">
                  Para confirmar, digite <strong>CONFIRMAR</strong> abaixo:
                </p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="confirm-wipe" className="sr-only">
                      Confirmação
                    </Label>
                    <Input
                      id="confirm-wipe"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="Digite CONFIRMAR"
                    />
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center rounded-md border border-error/30 px-3 py-2 text-sm font-medium text-error transition-colors hover:bg-error/10 hover:text-error disabled:pointer-events-none disabled:opacity-50"
                    onClick={handleWipe}
                    disabled={confirmText !== "CONFIRMAR" || wiping}
                  >
                    {wiping ? "Excluindo..." : "Confirmar exclusão"}
                  </button>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center rounded-md px-2.5 py-1.5 text-sm text-foreground-secondary transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => {
                    setShowWipeConfirm(false);
                    setConfirmText("");
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
