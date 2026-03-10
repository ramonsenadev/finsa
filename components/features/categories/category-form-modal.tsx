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
  categorySchema,
  CATEGORY_COLORS,
  type CategoryFormData,
} from "@/lib/validations/category";
import { createCategory, updateCategory } from "@/app/categories/actions";
import { IconPicker } from "./icon-picker";
import { ColorPicker } from "./color-picker";

interface ParentCategory {
  id: string;
  name: string;
  color: string | null;
}

interface EditingCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  parentId: string | null;
  isSystem: boolean;
}

interface CategoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory?: EditingCategory | null;
  parentCategories: ParentCategory[];
  preselectedParentId?: string | null;
}

export function CategoryFormModal({
  open,
  onOpenChange,
  editingCategory,
  parentCategories,
  preselectedParentId,
}: CategoryFormModalProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("circle-dot");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [parentId, setParentId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!editingCategory;

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setIcon(editingCategory.icon ?? "circle-dot");
      setColor(editingCategory.color ?? CATEGORY_COLORS[0]);
      setParentId(editingCategory.parentId);
    } else {
      setName("");
      setIcon("circle-dot");
      const preParent = preselectedParentId
        ? parentCategories.find((c) => c.id === preselectedParentId)
        : null;
      setColor(preParent?.color ?? CATEGORY_COLORS[0]);
      setParentId(preselectedParentId ?? null);
    }
    setErrors({});
  }, [editingCategory, open, preselectedParentId, parentCategories]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const formData: CategoryFormData = {
      name,
      icon,
      color,
      parentId,
    };

    const parsed = categorySchema.safeParse(formData);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const result = isEditing
        ? await updateCategory(editingCategory!.id, formData)
        : await createCategory(formData);

      if ("error" in result && result.error) {
        const err = result.error;
        setErrors(
          typeof err === "string"
            ? { _form: [err] }
            : (err as Record<string, string[]>)
        );
        return;
      }

      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-name">Nome</Label>
            <Input
              id="cat-name"
              placeholder="Ex: Farmácia"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && (
              <p className="text-xs text-error">{errors.name[0]}</p>
            )}
          </div>

          {!(isEditing && editingCategory?.isSystem) && (
            <div className="flex flex-col gap-1.5">
              <Label>Categoria pai (opcional)</Label>
              <Select
                value={parentId ?? "__none__"}
                onValueChange={(v) => {
                  const newParentId = v === "__none__" ? null : v;
                  setParentId(newParentId);
                  if (newParentId) {
                    const parent = parentCategories.find((c) => c.id === newParentId);
                    if (parent?.color) setColor(parent.color);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma (categoria raiz)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    Nenhuma (categoria raiz)
                  </SelectItem>
                  {parentCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Cor</Label>
            <ColorPicker value={color} onChange={setColor} />
            {errors.color && (
              <p className="text-xs text-error">{errors.color[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Ícone</Label>
            <IconPicker value={icon} onChange={setIcon} color={color} />
            {errors.icon && (
              <p className="text-xs text-error">{errors.icon[0]}</p>
            )}
          </div>

          {errors._form && (
            <p className="text-xs text-error">{errors._form[0]}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
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
                : isEditing
                  ? "Salvar"
                  : "Criar Categoria"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
