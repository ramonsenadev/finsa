"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  FolderTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getIconComponent } from "./icon-picker";
import { CategoryFormModal } from "./category-form-modal";
import { deleteCategory } from "@/app/categories/actions";

export type CategoryNode = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  isSystem: boolean;
  parentId: string | null;
  _count: { transactions: number };
  children: CategoryNode[];
};

interface CategoryTreeProps {
  categories: CategoryNode[];
}

export function CategoryTree({ categories }: CategoryTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryNode | null>(
    null
  );
  const [preselectedParentId, setPreselectedParentId] = useState<string | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const parentCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
  }));

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleNew(parentId?: string) {
    setEditingCategory(null);
    setPreselectedParentId(parentId ?? null);
    if (parentId) {
      setExpanded((prev) => new Set([...prev, parentId]));
    }
    setModalOpen(true);
    setDeleteError(null);
  }

  function handleEdit(category: CategoryNode) {
    setEditingCategory(category);
    setPreselectedParentId(null);
    setModalOpen(true);
    setDeleteError(null);
  }

  async function handleDelete(category: CategoryNode) {
    setDeleteError(null);
    if (category.isSystem) {
      setDeleteError("Categorias de sistema não podem ser excluídas.");
      return;
    }

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir "${category.name}"?`
    );
    if (!confirmed) return;

    const result = await deleteCategory(category.id);
    if ("error" in result && result.error) {
      setDeleteError(typeof result.error === "string" ? result.error : "Erro ao excluir");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Categorias</h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Gerencie a árvore de categorias e subcategorias.
          </p>
        </div>
        <Button onClick={() => handleNew()}>
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {deleteError && (
        <div className="mb-4 rounded-md border border-error/30 bg-error/5 p-3 text-sm text-error">
          {deleteError}
        </div>
      )}

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background-secondary">
            <FolderTree className="h-6 w-6 text-foreground-secondary" />
          </div>
          <h3 className="mt-4 text-sm font-medium text-foreground">
            Nenhuma categoria encontrada
          </h3>
          <p className="mt-1 text-sm text-foreground-secondary">
            Execute o seed para criar as categorias padrão.
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-border">
          {categories.map((parent, idx) => (
            <ParentRow
              key={parent.id}
              category={parent}
              isExpanded={expanded.has(parent.id)}
              onToggle={() => toggleExpand(parent.id)}
              onEdit={() => handleEdit(parent)}
              onDelete={() => handleDelete(parent)}
              onAddChild={() => handleNew(parent.id)}
              isLast={idx === categories.length - 1}
            >
              {expanded.has(parent.id) &&
                parent.children.map((child, childIdx) => (
                  <ChildRow
                    key={child.id}
                    category={child}
                    onEdit={() => handleEdit(child)}
                    onDelete={() => handleDelete(child)}
                    isLast={childIdx === parent.children.length - 1}
                    parentIsLast={idx === categories.length - 1}
                  />
                ))}
            </ParentRow>
          ))}
        </div>
      )}

      <CategoryFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingCategory={editingCategory}
        parentCategories={parentCategories}
        preselectedParentId={preselectedParentId}
      />
    </div>
  );
}

function ParentRow({
  category,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
  isLast,
  children,
}: {
  category: CategoryNode;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddChild: () => void;
  isLast: boolean;
  children: React.ReactNode;
}) {
  const Icon = getIconComponent(category.icon ?? "circle-dot");
  const totalTransactions =
    category._count.transactions +
    category.children.reduce((sum, c) => sum + c._count.transactions, 0);

  return (
    <div>
      <div className={`group flex items-center gap-3 px-4 py-3 bg-card hover:bg-background-secondary transition-colors ${!isLast ? "border-b border-input/50" : ""}`}>
        <button
          type="button"
          onClick={onToggle}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-foreground-secondary hover:text-foreground"
        >
          {category.children.length > 0 ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <span className="h-4 w-4" />
          )}
        </button>

        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `${category.color}15` }}
        >
          <Icon className="h-4 w-4" style={{ color: category.color ?? undefined }} />
        </span>

        <span className="font-medium text-foreground">{category.name}</span>

        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: category.color ?? "var(--color-foreground-secondary)" }}
        />

        {category.isSystem && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            sistema
          </Badge>
        )}

        {totalTransactions > 0 && (
          <span className="text-xs text-foreground-secondary">
            {totalTransactions} transação{totalTransactions !== 1 ? "ões" : ""}
          </span>
        )}

        <span className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onAddChild}
            className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-secondary hover:bg-background-secondary hover:text-foreground"
            title="Adicionar subcategoria"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-secondary hover:bg-background-secondary hover:text-foreground"
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {!category.isSystem && (
            <button
              type="button"
              onClick={onDelete}
              className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-secondary hover:bg-error/10 hover:text-error"
              title="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </span>
      </div>
      {children}
    </div>
  );
}

function ChildRow({
  category,
  onEdit,
  onDelete,
  isLast,
  parentIsLast,
}: {
  category: CategoryNode;
  onEdit: () => void;
  onDelete: () => void;
  isLast: boolean;
  parentIsLast: boolean;
}) {
  const Icon = getIconComponent(category.icon ?? "circle-dot");

  return (
    <div
      className={`group flex items-center gap-3 pl-12 pr-4 py-2.5 bg-background hover:bg-background-secondary/50 transition-colors ${
        !isLast || !parentIsLast ? "border-b border-border/50" : ""
      }`}
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: `${category.color}10` }}
      >
        <Icon
          className="h-3.5 w-3.5"
          style={{ color: category.color ?? undefined }}
        />
      </span>

      <span className="text-sm text-foreground-secondary">{category.name}</span>

      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: category.color ?? "var(--color-foreground-secondary)" }}
      />

      {category.isSystem && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          sistema
        </Badge>
      )}

      {category._count.transactions > 0 && (
        <span className="text-xs text-foreground-secondary">
          {category._count.transactions} transação
          {category._count.transactions !== 1 ? "ões" : ""}
        </span>
      )}

      <span className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onEdit}
          className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-secondary hover:bg-background-secondary hover:text-foreground"
          title="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        {!category.isSystem && (
          <button
            type="button"
            onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-secondary hover:bg-error/10 hover:text-error"
            title="Excluir"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </span>
    </div>
  );
}
