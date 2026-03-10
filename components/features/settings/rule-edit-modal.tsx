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
  updateCategorizationRule,
  type CategorizationRuleRow,
} from "@/app/settings/actions";

interface RuleEditModalProps {
  rule: CategorizationRuleRow | null;
  categories: { id: string; name: string; isParent: boolean }[];
  onClose: () => void;
}

export function RuleEditModal({ rule, categories, onClose }: RuleEditModalProps) {
  const [matchPattern, setMatchPattern] = useState("");
  const [matchType, setMatchType] = useState("contains");
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const subcategories = categories.filter((c) => !c.isParent);

  useEffect(() => {
    if (rule) {
      setMatchPattern(rule.matchPattern);
      setMatchType(rule.matchType);
      setCategoryId(rule.categoryId);
      setError(null);
    }
  }, [rule]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rule) return;
    setError(null);

    setSubmitting(true);
    const result = await updateCategorizationRule(rule.id, {
      matchPattern,
      matchType,
      categoryId,
    });
    setSubmitting(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    onClose();
  }

  return (
    <Dialog open={!!rule} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Regra</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-md bg-error/10 p-2 text-sm text-error">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="rule-pattern">Padrão</Label>
            <Input
              id="rule-pattern"
              value={matchPattern}
              onChange={(e) => setMatchPattern(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={matchType} onValueChange={setMatchType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exact">Exato</SelectItem>
                <SelectItem value="contains">Contém</SelectItem>
                <SelectItem value="regex">Regex</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {subcategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
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
