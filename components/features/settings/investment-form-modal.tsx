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
  investmentSchema,
  INVESTMENT_CATEGORIES,
  INVESTMENT_CATEGORY_LABELS,
} from "@/lib/validations/investment";
import { createInvestment, updateInvestment } from "@/app/settings/actions";
import type { InvestmentRow } from "./investment-tab";

interface InvestmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingInvestment: InvestmentRow | null;
}

export function InvestmentFormModal({
  open,
  onOpenChange,
  editingInvestment,
}: InvestmentFormModalProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("renda_fixa");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingInvestment) {
        setName(editingInvestment.name);
        setAmount(String(editingInvestment.amount));
        setCategory(editingInvestment.category);
        setEffectiveFrom(editingInvestment.effectiveFrom);
      } else {
        setName("");
        setAmount("");
        setCategory("renda_fixa");
        setEffectiveFrom(new Date().toISOString().slice(0, 10));
      }
      setErrors({});
    }
  }, [open, editingInvestment]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const data = {
      name,
      amount: parseFloat(amount),
      category,
      effectiveFrom: new Date(effectiveFrom + "T12:00:00"),
    };

    const parsed = investmentSchema.safeParse(data);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    setSubmitting(true);
    const result: { success?: boolean; error?: unknown } = editingInvestment
      ? await updateInvestment(editingInvestment.id, parsed.data)
      : await createInvestment(parsed.data);
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
            {editingInvestment ? "Editar Investimento" : "Novo Investimento"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inv-name">Nome</Label>
            <Input
              id="inv-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Tesouro Selic"
            />
            {errors.name && (
              <p className="text-sm text-error">{errors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="inv-amount">Valor Mensal (R$)</Label>
            <Input
              id="inv-amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
            />
            {errors.amount && (
              <p className="text-sm text-error">{errors.amount[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVESTMENT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {INVESTMENT_CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-error">{errors.category[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="inv-date">Vigência a partir de</Label>
            <Input
              id="inv-date"
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
                : editingInvestment
                  ? "Salvar"
                  : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
