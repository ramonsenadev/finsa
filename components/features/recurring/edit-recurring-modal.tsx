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
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/validations/manual-transaction";
import {
  CategorySelector,
  type CategoryItem,
} from "@/components/features/transactions/category-selector";
import type { RecurringExpenseRow } from "@/app/recurring/actions";

interface EditRecurringModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recurring: RecurringExpenseRow | null;
  categories: CategoryItem[];
  onSave: (
    id: string,
    data: {
      name: string;
      categoryId: string | null;
      expectedAmount: number;
      dayOfMonth: number | null;
      sourceType: string;
      effectiveFrom: string | null;
    }
  ) => Promise<void>;
}


export function EditRecurringModal({
  open,
  onOpenChange,
  recurring,
  categories,
  onSave,
}: EditRecurringModalProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [dayOfMonth, setDayOfMonth] = useState("");
  const [sourceType, setSourceType] = useState("pix");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && recurring) {
      setName(recurring.name);
      setAmount(String(recurring.expectedAmount));
      setCategoryId(recurring.categoryId);
      setDayOfMonth(recurring.dayOfMonth ? String(recurring.dayOfMonth) : "");
      setSourceType(recurring.sourceType);
      setEffectiveFrom(recurring.effectiveFrom ?? "");
    }
  }, [open, recurring]);

  const selectedCategoryName = (() => {
    if (!categoryId) return null;
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return null;
    const parent = cat.parentId
      ? categories.find((c) => c.id === cat.parentId)
      : null;
    return parent ? `${parent.name} › ${cat.name}` : cat.name;
  })();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recurring) return;

    setSubmitting(true);
    await onSave(recurring.id, {
      name,
      categoryId,
      expectedAmount: parseFloat(amount) || 0,
      dayOfMonth: dayOfMonth ? parseInt(dayOfMonth, 10) : null,
      sourceType,
      effectiveFrom: effectiveFrom || null,
    });
    setSubmitting(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Editar Recorrente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rec-name">Nome</Label>
            <Input
              id="rec-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rec-amount">Valor esperado</Label>
            <CurrencyInput
              id="rec-amount"
              value={amount}
              onValueChange={setAmount}
            />
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <CategorySelector
              categories={categories}
              value={categoryId}
              categoryName={selectedCategoryName}
              onSelect={setCategoryId}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rec-day">Dia do mês</Label>
            <Input
              id="rec-day"
              type="number"
              min={1}
              max={31}
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              placeholder="Qualquer dia"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rec-effective-from">Vigência a partir de</Label>
            <Input
              id="rec-effective-from"
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              placeholder="Desde sempre"
            />
            <p className="text-xs text-foreground-secondary">
              Deixe vazio para considerar desde sempre.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Método de Pagamento</Label>
            <Select value={sourceType} onValueChange={setSourceType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </SelectItem>
                ))}
                <SelectItem value="card">Cartão</SelectItem>
              </SelectContent>
            </Select>
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
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
