"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  manualTransactionSchema,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/validations/manual-transaction";
import {
  CategorySelector,
  type CategoryItem,
} from "@/components/features/transactions/category-selector";
import {
  createManualTransaction,
  updateManualTransaction,
  fetchAllCategories,
} from "@/app/transactions/actions";
import { useQuery } from "@tanstack/react-query";

export interface ManualTransactionData {
  id: string;
  date: Date;
  description: string;
  amount: number;
  categoryId: string | null;
  paymentMethod: string | null;
  isRecurring: boolean;
}

interface ManualTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTransaction: ManualTransactionData | null;
  categories?: CategoryItem[];
  onSaved?: () => void;
}

function formatAmountForInput(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

function parseAmountInput(value: string): number {
  // Accept both "1.234,56" and "1234.56" formats
  const cleaned = value.replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

export function ManualTransactionModal({
  open,
  onOpenChange,
  editingTransaction,
  categories: externalCategories,
  onSaved,
}: ManualTransactionModalProps) {
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("pix");
  const [isRecurring, setIsRecurring] = useState(false);
  const [dayOfMonth, setDayOfMonth] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  // Load categories if not provided externally (for header usage)
  const { data: fetchedCategories = [] } = useQuery<CategoryItem[]>({
    queryKey: ["categories-list"],
    queryFn: () => fetchAllCategories(),
    enabled: !externalCategories,
  });

  const categories = externalCategories ?? fetchedCategories;

  // Find the display name for selected category
  const selectedCategoryName = (() => {
    if (!categoryId) return null;
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return null;
    const parent = cat.parentId
      ? categories.find((c) => c.id === cat.parentId)
      : null;
    return parent ? `${parent.name} › ${cat.name}` : cat.name;
  })();

  useEffect(() => {
    if (open) {
      if (editingTransaction) {
        const d = new Date(editingTransaction.date);
        setDate(d.toISOString().slice(0, 10));
        setDescription(editingTransaction.description);
        setAmount(formatAmountForInput(editingTransaction.amount));
        setCategoryId(editingTransaction.categoryId);
        setPaymentMethod(editingTransaction.paymentMethod ?? "pix");
        setIsRecurring(editingTransaction.isRecurring);
        setDayOfMonth(String(d.getDate()));
      } else {
        const today = new Date();
        setDate(today.toISOString().slice(0, 10));
        setDescription("");
        setAmount("");
        setCategoryId(null);
        setPaymentMethod("pix");
        setIsRecurring(false);
        setDayOfMonth(String(today.getDate()));
      }
      setErrors({});
    }
  }, [open, editingTransaction]);

  // Update dayOfMonth when date changes
  useEffect(() => {
    if (date && !editingTransaction) {
      const d = new Date(date + "T12:00:00");
      setDayOfMonth(String(d.getDate()));
    }
  }, [date, editingTransaction]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const data = {
      date: new Date(date + "T12:00:00"),
      description,
      amount: parseAmountInput(amount),
      categoryId: categoryId ?? "",
      paymentMethod,
      isRecurring,
      dayOfMonth: isRecurring ? parseInt(dayOfMonth, 10) : undefined,
    };

    const parsed = manualTransactionSchema.safeParse(data);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    setSubmitting(true);
    const result = editingTransaction
      ? await updateManualTransaction(editingTransaction.id, parsed.data)
      : await createManualTransaction(parsed.data);
    setSubmitting(false);

    if ("error" in result && result.error) {
      if (typeof result.error === "string") {
        setErrors({ description: [result.error] });
      } else {
        setErrors(result.error as Record<string, string[]>);
      }
      return;
    }

    toast.success(
      editingTransaction ? "Lançamento atualizado" : "Lançamento adicionado"
    );
    onSaved?.();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {editingTransaction ? "Editar Lançamento" : "Novo Lançamento"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="tx-date">Data</Label>
            <Input
              id="tx-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {errors.date && (
              <p className="text-sm text-error">{errors.date[0]}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="tx-description">Descrição</Label>
            <Input
              id="tx-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Babá, Condomínio, Escola"
            />
            {errors.description && (
              <p className="text-sm text-error">{errors.description[0]}</p>
            )}
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="tx-amount">Valor (R$)</Label>
            <Input
              id="tx-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
            />
            {errors.amount && (
              <p className="text-sm text-error">{errors.amount[0]}</p>
            )}
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <CategorySelector
              categories={categories}
              value={categoryId}
              categoryName={selectedCategoryName}
              onSelect={setCategoryId}
            />
            {errors.categoryId && (
              <p className="text-sm text-error">{errors.categoryId[0]}</p>
            )}
          </div>

          {/* Método de pagamento */}
          <div className="space-y-2">
            <Label>Método de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.paymentMethod && (
              <p className="text-sm text-error">{errors.paymentMethod[0]}</p>
            )}
          </div>

          {/* Recorrente */}
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <Label htmlFor="tx-recurring" className="cursor-pointer">
              Gasto recorrente
            </Label>
            <Switch
              id="tx-recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>

          {/* Dia do mês (if recurring) */}
          {isRecurring && (
            <div className="space-y-2">
              <Label htmlFor="tx-day">Dia do mês</Label>
              <Input
                id="tx-day"
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
              />
              {errors.dayOfMonth && (
                <p className="text-sm text-error">{errors.dayOfMonth[0]}</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting
                ? "Salvando..."
                : editingTransaction
                  ? "Salvar"
                  : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
