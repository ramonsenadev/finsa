"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Search } from "lucide-react";
import {
  deleteCategorizationRule,
  type CategorizationRuleRow,
} from "@/app/settings/actions";
import { RuleEditModal } from "./rule-edit-modal";

const MATCH_TYPE_LABELS: Record<string, string> = {
  exact: "Exato",
  contains: "Contém",
  regex: "Regex",
};

const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  ai: "IA",
};

interface CategorizationRulesTabProps {
  rules: CategorizationRuleRow[];
  categories: { id: string; name: string; isParent: boolean }[];
}

export function CategorizationRulesTab({ rules, categories }: CategorizationRulesTabProps) {
  const [search, setSearch] = useState("");
  const [editingRule, setEditingRule] = useState<CategorizationRuleRow | null>(null);

  const filtered = useMemo(() => {
    if (!search) return rules;
    const q = search.toLowerCase();
    return rules.filter(
      (r) =>
        r.matchPattern.toLowerCase().includes(q) ||
        r.categoryName.toLowerCase().includes(q)
    );
  }, [rules, search]);

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta regra de categorização?")) return;
    await deleteCategorizationRule(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">
          Regras de Categorização
        </h3>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-foreground-secondary" />
          <Input
            placeholder="Buscar por padrão..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border border-border bg-background-secondary p-4">
        <p className="text-sm text-foreground-secondary">
          <strong>{rules.length}</strong> regra(s) cadastrada(s) — ordenadas por uso (mais usadas primeiro).
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-md border border-border p-8 text-center text-foreground-secondary">
          {search
            ? "Nenhuma regra encontrada para essa busca."
            : "Nenhuma regra de categorização cadastrada."}
        </div>
      ) : (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Padrão</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-right">Usos</TableHead>
                <TableHead>Último uso</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <code className="rounded bg-background-secondary px-1.5 py-0.5 text-xs">
                      {rule.matchPattern}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {MATCH_TYPE_LABELS[rule.matchType] ?? rule.matchType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{rule.categoryName}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        rule.source === "ai"
                          ? "border-warning/40 bg-warning/10 text-warning"
                          : "border-accent/40 bg-accent/10 text-accent"
                      }
                    >
                      {SOURCE_LABELS[rule.source] ?? rule.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {rule.usageCount}
                  </TableCell>
                  <TableCell className="text-sm text-foreground-secondary">
                    {rule.lastUsedAt
                      ? new Date(rule.lastUsedAt).toLocaleDateString("pt-BR")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingRule(rule)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground-secondary hover:bg-muted hover:text-foreground transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rule.id)}
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

      <RuleEditModal
        rule={editingRule}
        categories={categories}
        onClose={() => setEditingRule(null)}
      />
    </div>
  );
}
