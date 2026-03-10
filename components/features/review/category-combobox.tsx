"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { ChevronDown, Search } from "lucide-react";

type Category = {
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
  depth: number;
};

function buildCategoryOptions(categories: Category[]): CategoryOption[] {
  const parentMap = new Map<string | null, Category[]>();
  const idMap = new Map<string, Category>();

  for (const cat of categories) {
    idMap.set(cat.id, cat);
    const siblings = parentMap.get(cat.parentId) ?? [];
    siblings.push(cat);
    parentMap.set(cat.parentId, siblings);
  }

  const options: CategoryOption[] = [];

  // Get top-level categories (parentId = null)
  const roots = parentMap.get(null) ?? [];
  for (const root of roots) {
    const children = parentMap.get(root.id) ?? [];
    if (children.length > 0) {
      // Only add children (subcategories) with parent context
      for (const child of children) {
        options.push({
          id: child.id,
          label: child.name,
          parentName: root.name,
          depth: 1,
        });
      }
    } else {
      // Root without children — add directly
      options.push({
        id: root.id,
        label: root.name,
        parentName: null,
        depth: 0,
      });
    }
  }

  return options;
}

export function CategoryCombobox({
  categories,
  value,
  onSelect,
  onClose,
  autoFocus = false,
  anchorRef,
}: {
  categories: Category[];
  value: string | null;
  onSelect: (categoryId: string) => void;
  onClose: () => void;
  autoFocus?: boolean;
  /** When provided, renders in a portal with fixed positioning anchored to this element */
  anchorRef?: React.RefObject<HTMLElement | null>;
}) {
  const [search, setSearch] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
  } | null>(null);

  const options = buildCategoryOptions(categories);

  const filtered = search.trim()
    ? options.filter((o) => {
        const term = search.toLowerCase();
        return (
          o.label.toLowerCase().includes(term) ||
          (o.parentName?.toLowerCase().includes(term) ?? false)
        );
      })
    : options;

  // Calculate fixed position from anchor
  useLayoutEffect(() => {
    if (!anchorRef?.current) return;
    const anchor = anchorRef.current;
    const rect = anchor.getBoundingClientRect();
    const popoverHeight = 300;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < popoverHeight && rect.top > popoverHeight;
    const left = Math.min(rect.left, window.innerWidth - 288 - 16);

    if (openUp) {
      setPosition({ bottom: window.innerHeight - rect.top + 4, left });
    } else {
      setPosition({ top: rect.bottom + 4, left });
    }
  }, [anchorRef]);

  // Close on scroll so the popover doesn't float away from its anchor
  useEffect(() => {
    if (!anchorRef) return;
    function handleScroll(e: Event) {
      // Ignore scrolls inside the popover itself (e.g. category list)
      if (popoverRef.current?.contains(e.target as Node)) return;
      onClose();
    }
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [anchorRef, onClose]);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [search]);

  // Scroll highlighted item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[highlightIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex]);

  // Close on outside click
  useEffect(() => {
    if (!anchorRef) return;
    function handleMouseDown(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef?.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [anchorRef, onClose]);

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
        e.preventDefault();
        if (filtered[highlightIndex]) {
          onSelect(filtered[highlightIndex].id);
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
      case "Tab":
        e.preventDefault();
        if (filtered[highlightIndex]) {
          onSelect(filtered[highlightIndex].id);
        }
        break;
    }
  }

  const content = (
    <div
      ref={popoverRef}
      className={cn(
        "w-72 rounded-md border border-border bg-popover shadow-lg",
        anchorRef ? "fixed z-50" : "absolute z-50 mt-1"
      )}
      style={
        anchorRef && position
          ? { top: position.top, bottom: position.bottom, left: position.left }
          : undefined
      }
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

  if (anchorRef) {
    return createPortal(content, document.body);
  }

  return content;
}

export function CategorySelect({
  categories,
  value,
  categoryName,
  isOpen,
  onToggle,
  onSelect,
}: {
  categories: Category[];
  value: string | null;
  categoryName: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (categoryId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onToggle();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onToggle]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-colors hover:border-accent/50 dark:bg-input/30",
          isOpen && "border-ring ring-2 ring-ring",
          !value && "text-foreground-secondary"
        )}
      >
        <span className="max-w-[140px] truncate">
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
        <CategoryCombobox
          categories={categories}
          value={value}
          onSelect={onSelect}
          onClose={onToggle}
          autoFocus
        />
      )}
    </div>
  );
}
