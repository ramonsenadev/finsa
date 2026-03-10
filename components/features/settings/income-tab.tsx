"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { INCOME_TYPE_LABELS } from "@/lib/validations/income";
import { formatBRL } from "@/lib/format";
import {
  toggleIncomeActive,
  deleteIncome,
} from "@/app/settings/actions";
import { IncomeFormModal } from "./income-form-modal";

export interface IncomeRow {
  id: string;
  name: string;
  amount: number;
  type: string;
  isActive: boolean;
  effectiveFrom: string; // ISO date
}

interface IncomeTabProps {
  incomes: IncomeRow[];
}

export function IncomeTab({ incomes }: IncomeTabProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeRow | null>(null);

  const totalActive = incomes
    .filter((i) => i.isActive)
    .reduce((sum, i) => sum + i.amount, 0);

  async function handleToggle(id: string) {
    await toggleIncomeActive(id);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta fonte de renda?")) return;
    await deleteIncome(id);
  }

  function handleEdit(income: IncomeRow) {
    setEditingIncome(income);
    setModalOpen(true);
  }

  function handleAdd() {
    setEditingIncome(null);
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="rounded-md border border-border bg-background-secondary p-5">
        <p className="text-sm text-foreground-secondary">Renda Total Familiar</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">
          {formatBRL(totalActive)}
        </p>
        <p className="mt-1 text-xs text-foreground-secondary">
          {incomes.filter((i) => i.isActive).length} fonte(s) ativa(s)
        </p>
      </div>

      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">Fontes de Renda</h3>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="mr-1.5 h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {/* Table */}
      {incomes.length === 0 ? (
        <div className="rounded-md border border-border p-8 text-center text-foreground-secondary">
          Nenhuma fonte de renda cadastrada.
        </div>
      ) : (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomes.map((income) => (
                <TableRow
                  key={income.id}
                  className={!income.isActive ? "opacity-50" : ""}
                >
                  <TableCell className="font-medium">{income.name}</TableCell>
                  <TableCell>{formatBRL(income.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {INCOME_TYPE_LABELS[income.type as keyof typeof INCOME_TYPE_LABELS] ?? income.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(income.effectiveFrom + "T12:00:00").toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={income.isActive}
                      onCheckedChange={() => handleToggle(income.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(income)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground-secondary hover:bg-muted hover:text-foreground transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(income.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground-secondary hover:bg-error/10 hover:text-error transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <IncomeFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingIncome={editingIncome}
      />
    </div>
  );
}
