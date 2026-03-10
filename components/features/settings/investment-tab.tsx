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
import { INVESTMENT_CATEGORY_LABELS } from "@/lib/validations/investment";
import { formatBRL } from "@/lib/format";
import {
  toggleInvestmentActive,
  deleteInvestment,
} from "@/app/settings/actions";
import { InvestmentFormModal } from "./investment-form-modal";

export interface InvestmentRow {
  id: string;
  name: string;
  amount: number;
  category: string;
  isActive: boolean;
  effectiveFrom: string;
}

interface InvestmentTabProps {
  investments: InvestmentRow[];
  totalIncome: number;
}

export function InvestmentTab({ investments, totalIncome }: InvestmentTabProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] =
    useState<InvestmentRow | null>(null);

  const totalActive = investments
    .filter((i) => i.isActive)
    .reduce((sum, i) => sum + i.amount, 0);

  const percentage =
    totalIncome > 0 ? ((totalActive / totalIncome) * 100).toFixed(1) : "0.0";

  async function handleToggle(id: string) {
    await toggleInvestmentActive(id);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este investimento?")) return;
    await deleteInvestment(id);
  }

  function handleEdit(investment: InvestmentRow) {
    setEditingInvestment(investment);
    setModalOpen(true);
  }

  function handleAdd() {
    setEditingInvestment(null);
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="rounded-md border border-border bg-background-secondary p-5">
        <p className="text-sm text-foreground-secondary">Total Investido/mês</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">
          {formatBRL(totalActive)}{" "}
          <span className="text-base font-normal text-foreground-secondary">
            ({percentage}% da renda)
          </span>
        </p>
        <p className="mt-2 text-xs text-foreground-secondary">
          Rastreia aportes mensais. Rendimentos serão adicionados futuramente.
        </p>
      </div>

      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">Investimentos</h3>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="mr-1.5 h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {/* Table */}
      {investments.length === 0 ? (
        <div className="rounded-md border border-border p-8 text-center text-foreground-secondary">
          Nenhum investimento cadastrado.
        </div>
      ) : (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Valor Mensal</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {investments.map((inv) => (
                <TableRow
                  key={inv.id}
                  className={!inv.isActive ? "opacity-50" : ""}
                >
                  <TableCell className="font-medium">{inv.name}</TableCell>
                  <TableCell>{formatBRL(inv.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {INVESTMENT_CATEGORY_LABELS[
                        inv.category as keyof typeof INVESTMENT_CATEGORY_LABELS
                      ] ?? inv.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(inv.effectiveFrom + "T12:00:00").toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={inv.isActive}
                      onCheckedChange={() => handleToggle(inv.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(inv)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground-secondary hover:bg-muted hover:text-foreground transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(inv.id)}
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

      <InvestmentFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingInvestment={editingInvestment}
      />
    </div>
  );
}
