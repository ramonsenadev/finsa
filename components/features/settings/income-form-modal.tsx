"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
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
  incomeSchema,
  INCOME_TYPES,
  INCOME_TYPE_LABELS,
} from "@/lib/validations/income";
import { createIncome, updateIncome } from "@/app/settings/actions";
import type { IncomeRow } from "./income-tab";

interface IncomeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingIncome: IncomeRow | null;
}

export function IncomeFormModal({
  open,
  onOpenChange,
  editingIncome,
}: IncomeFormModalProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<string>("salary");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingIncome) {
        setName(editingIncome.name);
        setAmount(String(editingIncome.amount));
        setType(editingIncome.type);
        setEffectiveFrom(editingIncome.effectiveFrom);
      } else {
        setName("");
        setAmount("");
        setType("salary");
        setEffectiveFrom(new Date().toISOString().slice(0, 10));
      }
      setErrors({});
    }
  }, [open, editingIncome]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const data = {
      name,
      amount: parseFloat(amount),
      type,
      effectiveFrom: new Date(effectiveFrom + "T12:00:00"),
    };

    const parsed = incomeSchema.safeParse(data);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    setSubmitting(true);
    const result: { success?: boolean; error?: unknown } = editingIncome
      ? await updateIncome(editingIncome.id, parsed.data)
      : await createIncome(parsed.data);
    setSubmitting(false);

    if (result.error) {
      setErrors(
        typeof result.error === "string"
          ? { name: [result.error] }
          : (result.error as Record<string, string[]>)
      );
      return;
    }

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingIncome ? "Editar Renda" : "Nova Fonte de Renda"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="income-name">Nome</Label>
            <Input
              id="income-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Salário Ramon"
            />
            {errors.name && (
              <p className="text-sm text-error">{errors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="income-amount">Valor</Label>
            <CurrencyInput
              id="income-amount"
              value={amount}
              onValueChange={setAmount}
            />
            {errors.amount && (
              <p className="text-sm text-error">{errors.amount[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INCOME_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {INCOME_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-error">{errors.type[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="income-date">Vigência a partir de</Label>
            <Input
              id="income-date"
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
            {errors.effectiveFrom && (
              <p className="text-sm text-error">{errors.effectiveFrom[0]}</p>
            )}
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
                : editingIncome
                  ? "Salvar"
                  : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
