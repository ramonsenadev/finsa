"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Search } from "lucide-react";

export type CategoryItem = {
  id: string;
  name: string;
  parentId: string | null;
  icon: string | null;
  color: string | null;
};

type CategoryOption = {
  id: string;
  label: string;
  parentName: string | null;
};

function buildOptions(categories: CategoryItem[]): CategoryOption[] {
  const parentMap = new Map<string | null, CategoryItem[]>();
  const idMap = new Map<string, CategoryItem>();

  for (const cat of categories) {
    idMap.set(cat.id, cat);
    const siblings = parentMap.get(cat.parentId) ?? [];
    siblings.push(cat);
    parentMap.set(cat.parentId, siblings);
  }

  const options: CategoryOption[] = [];
  const roots = parentMap.get(null) ?? [];

  for (const root of roots) {
    const children = parentMap.get(root.id) ?? [];
    if (children.length > 0) {
      for (const child of children) {
        options.push({
          id: child.id,
          label: child.name,
          parentName: root.name,
        });
      }
    } else {
      options.push({ id: root.id, label: root.name, parentName: null });
    }
  }

  return options;
}

export function CategorySelectorDropdown({
  categories,
  value,
  onSelect,
  onClose,
  autoFocus = false,
}: {
  categories: CategoryItem[];
  value: string | null;
  onSelect: (categoryId: string) => void;
  onClose: () => void;
  autoFocus?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const options = buildOptions(categories);

  const filtered = search.trim()
    ? options.filter((o) => {
        const term = search.toLowerCase();
        return (
          o.label.toLowerCase().includes(term) ||
          (o.parentName?.toLowerCase().includes(term) ?? false)
        );
      })
    : options;

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [search]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[highlightIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex]);

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
      case "Tab":
        e.preventDefault();
        if (filtered[highlightIndex]) onSelect(filtered[highlightIndex].id);
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
    }
  }

  return (
    <div
      className="w-72 rounded-md border border-border bg-popover shadow-lg"
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-3 py-2 dark:bg-input/30">
        <Search className="h-3.5 w-3.5 text-foreground-secondary" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar categoria..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-secondary"
        />
      </div>
      <div ref={listRef} className="max-h-60 overflow-y-auto p-1">
        {filtered.length === 0 && (
          <div className="px-3 py-2 text-sm text-foreground-secondary">
            Nenhuma categoria encontrada
          </div>
        )}
        {filtered.map((option, i) => (
          <button
            key={option.id}
            type="button"
            className={cn(
              "flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-left text-sm transition-colors",
              i === highlightIndex
                ? "bg-accent/10 text-accent"
                : "text-foreground hover:bg-muted",
              option.id === value && "font-medium"
            )}
            onMouseEnter={() => setHighlightIndex(i)}
            onClick={() => onSelect(option.id)}
          >
            {option.parentName && (
              <span className="text-xs text-foreground-secondary">
                {option.parentName} &rsaquo;
              </span>
            )}
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function CategorySelector({
  categories,
  value,
  categoryName,
  onSelect,
}: {
  categories: CategoryItem[];
  value: string | null;
  categoryName: string | null;
  onSelect: (categoryId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-colors hover:border-accent/50 dark:bg-input/30",
          isOpen && "border-ring ring-2 ring-ring",
          !value && "text-foreground-secondary"
        )}
      >
        <span className="max-w-[180px] truncate">
          {categoryName ? (
            categoryName.includes(" › ") ? (
              <>
                <span className="text-foreground-secondary">{categoryName.split(" › ")[0]} ›</span>{" "}
                <span className="font-medium text-foreground">{categoryName.split(" › ")[1]}</span>
              </>
            ) : (
              <span className="font-medium text-foreground">{categoryName}</span>
            )
          ) : (
            "Selecionar..."
          )}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-foreground-secondary" />
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1">
          <CategorySelectorDropdown
            categories={categories}
            value={value}
            onSelect={(catId) => {
              onSelect(catId);
              setIsOpen(false);
            }}
            onClose={() => setIsOpen(false)}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
