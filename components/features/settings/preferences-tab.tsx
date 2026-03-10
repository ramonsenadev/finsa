"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      {/* Recurrence tolerance */}
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

      {/* Currency */}
      <div className="rounded-lg border border-border bg-white p-5">
        <h3 className="mb-4 text-base font-semibold">Moeda</h3>
        <div className="max-w-sm space-y-2">
          <Label>Moeda padrão</Label>
          <Select defaultValue="BRL" disabled>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRL">R$ — Real Brasileiro</SelectItem>
              <SelectItem value="USD">$ — Dólar Americano</SelectItem>
              <SelectItem value="EUR">€ — Euro</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-foreground-secondary">
            Suporte a outras moedas será adicionado em breve.
          </p>
        </div>
      </div>

      {/* Theme */}
      <div className="rounded-lg border border-border bg-white p-5">
        <h3 className="mb-4 text-base font-semibold">Tema</h3>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background-secondary">
            <span className="text-lg">🌙</span>
          </div>
          <div>
            <p className="text-sm font-medium">Dark mode</p>
            <p className="text-sm text-foreground-secondary">Em breve</p>
          </div>
        </div>
      </div>
    </div>
  );
}
