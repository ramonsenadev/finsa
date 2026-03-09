"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateRecurringTolerance } from "@/app/settings/actions";

interface PreferencesTabProps {
  initialTolerance: number;
}

export function PreferencesTab({ initialTolerance }: PreferencesTabProps) {
  const [tolerance, setTolerance] = useState(String(initialTolerance));
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const val = parseInt(tolerance, 10);
    if (isNaN(val) || val < 0 || val > 100) return;

    startTransition(async () => {
      const result = await updateRecurringTolerance(val);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-white p-5">
        <h3 className="mb-4 text-base font-semibold">Detecção de Recorrências</h3>
        <div className="max-w-sm space-y-2">
          <Label htmlFor="tolerance">
            Tolerância de detecção de recorrências
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="tolerance"
              type="number"
              min={0}
              max={100}
              value={tolerance}
              onChange={(e) => {
                setTolerance(e.target.value);
                setSaved(false);
              }}
              className="w-24"
            />
            <span className="text-sm text-foreground-secondary">%</span>
          </div>
          <p className="text-sm text-foreground-secondary">
            Transações com variação de valor abaixo dessa tolerância serão
            consideradas recorrentes. Padrão: 10%.
          </p>
        </div>
        <div className="mt-4">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
          >
            {saved ? "Salvo!" : isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
