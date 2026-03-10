"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────

export interface FilterValues {
  dateStart?: string;
  dateEnd?: string;
  cardIds?: string[];
  categoryIds?: string[];
  minAmount?: number;
  maxAmount?: number;
  categorizationMethod?: "rule" | "ai" | "manual";
  isRecurring?: boolean;
  search?: string;
}

export interface CardOption {
  id: string;
  name: string;
  color: string | null;
  lastFourDigits: string | null;
}

export interface CategoryOption {
  id: string;
  name: string;
  parentId: string | null;
  icon: string | null;
  color: string | null;
}

interface TransactionFiltersProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  cards: CardOption[];
  categories: CategoryOption[];
}

// ─── Multi-select dropdown ───────────────────────────────────────────

function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  renderOption,
}: {
  label: string;
  options: { id: string; label: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  renderOption?: (opt: { id: string; label: string }) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div ref={ref} className="relative">
      <label className="mb-1 block text-xs text-foreground-secondary">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex min-w-[140px] items-center justify-between gap-2 rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-xs transition-colors hover:border-accent/50 dark:bg-input/30",
          open && "border-ring ring-2 ring-ring",
          selected.length === 0 && "text-foreground-secondary"
        )}
      >
        <span className="truncate">
          {selected.length === 0
            ? "Todos"
            : selected.length === 1
              ? options.find((o) => o.id === selected[0])?.label ?? "1 selecionado"
              : `${selected.length} selecionados`}
        </span>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange([]);
            }}
            className="rounded p-0.5 hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </button>
      {open && (
        <div className="absolute left-0 z-50 mt-1 max-h-60 w-56 overflow-y-auto rounded-md border border-border/50 bg-popover p-1 shadow-lg dark:border-input/50">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                selected.includes(opt.id) && "bg-accent/15 text-accent font-medium"
              )}
            >
              <div
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded border",
                  selected.includes(opt.id)
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border"
                )}
              >
                {selected.includes(opt.id) && (
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              {renderOption ? renderOption(opt) : opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────

export function TransactionFilters({
  filters,
  onFiltersChange,
  cards,
  categories,
}: TransactionFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const [minInput, setMinInput] = useState(filters.minAmount?.toString() ?? "");
  const [maxInput, setMaxInput] = useState(filters.maxAmount?.toString() ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const update = useCallback(
    (partial: Partial<FilterValues>) => {
      onFiltersChange({ ...filters, ...partial });
    },
    [filters, onFiltersChange]
  );

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      update({ search: searchInput || undefined });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Card options
  const cardOptions = [
    { id: "manual", label: "Manual" },
    ...cards.map((c) => ({
      id: c.id,
      label: c.lastFourDigits ? `${c.name} (${c.lastFourDigits})` : c.name,
    })),
  ];

  // Category options — only parent categories
  const parentCategories = categories.filter((c) => c.parentId === null);
  const categoryOptions = parentCategories.map((c) => ({
    id: c.id,
    label: c.name,
  }));

  const hasFilters =
    filters.dateStart ||
    filters.dateEnd ||
    (filters.cardIds && filters.cardIds.length > 0) ||
    (filters.categoryIds && filters.categoryIds.length > 0) ||
    filters.minAmount !== undefined ||
    filters.maxAmount !== undefined ||
    filters.categorizationMethod ||
    filters.isRecurring !== undefined ||
    filters.search;

  function clearAll() {
    setSearchInput("");
    setMinInput("");
    setMaxInput("");
    onFiltersChange({});
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        {/* Date range */}
        <div>
          <label className="mb-1 block text-xs text-foreground-secondary">
            Período
          </label>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-secondary" />
              <input
                type="date"
                value={filters.dateStart ?? ""}
                onChange={(e) => update({ dateStart: e.target.value || undefined })}
                className="h-[34px] rounded-md border border-input bg-transparent pl-7 pr-2 text-sm shadow-xs dark:bg-input/30"
              />
            </div>
            <span className="text-xs text-foreground-secondary">até</span>
            <input
              type="date"
              value={filters.dateEnd ?? ""}
              onChange={(e) => update({ dateEnd: e.target.value || undefined })}
              className="h-[34px] rounded-md border border-input bg-transparent px-2 text-sm shadow-xs dark:bg-input/30"
            />
          </div>
        </div>

        {/* Card multi-select */}
        <MultiSelectDropdown
          label="Cartão"
          options={cardOptions}
          selected={filters.cardIds ?? []}
          onChange={(cardIds) => update({ cardIds: cardIds.length > 0 ? cardIds : undefined })}
          renderOption={(opt) => {
            if (opt.id === "manual") return <span>Manual</span>;
            const card = cards.find((c) => c.id === opt.id);
            return (
              <span className="flex items-center gap-1.5">
                {card?.color && (
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: card.color }}
                  />
                )}
                {opt.label}
              </span>
            );
          }}
        />

        {/* Category multi-select */}
        <MultiSelectDropdown
          label="Categoria"
          options={categoryOptions}
          selected={filters.categoryIds ?? []}
          onChange={(categoryIds) =>
            update({ categoryIds: categoryIds.length > 0 ? categoryIds : undefined })
          }
        />

        {/* Amount range */}
        <div>
          <label className="mb-1 block text-xs text-foreground-secondary">
            Valor
          </label>
          <div className="flex items-center gap-1.5">
            <CurrencyInput
              value={minInput}
              onValueChange={setMinInput}
              showPrefix={false}
              onBlur={() =>
                update({ minAmount: minInput ? parseFloat(minInput) : undefined })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  update({ minAmount: minInput ? parseFloat(minInput) : undefined });
              }}
              placeholder="Mín"
              className="h-[34px] w-24 text-sm"
            />
            <span className="text-xs text-foreground-secondary">–</span>
            <CurrencyInput
              value={maxInput}
              onValueChange={setMaxInput}
              showPrefix={false}
              onBlur={() =>
                update({ maxAmount: maxInput ? parseFloat(maxInput) : undefined })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  update({ maxAmount: maxInput ? parseFloat(maxInput) : undefined });
              }}
              placeholder="Máx"
              className="h-[34px] w-24 text-sm"
            />
          </div>
        </div>

        {/* Categorization method */}
        <div>
          <label className="mb-1 block text-xs text-foreground-secondary">
            Categorização
          </label>
          <select
            value={filters.categorizationMethod ?? ""}
            onChange={(e) => {
              const val = e.target.value as "" | "rule" | "ai" | "manual";
              update({ categorizationMethod: val || undefined });
            }}
            className="h-[34px] rounded-md border border-input bg-transparent px-2 text-sm shadow-xs dark:bg-input/30"
          >
            <option value="">Todos</option>
            <option value="rule">Regra</option>
            <option value="ai">IA</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        {/* Recurring */}
        <div>
          <label className="mb-1 block text-xs text-foreground-secondary">
            Recorrente
          </label>
          <select
            value={filters.isRecurring === undefined ? "" : String(filters.isRecurring)}
            onChange={(e) => {
              const val = e.target.value;
              update({
                isRecurring: val === "" ? undefined : val === "true",
              });
            }}
            className="h-[34px] rounded-md border border-input bg-transparent px-2 text-sm shadow-xs dark:bg-input/30"
          >
            <option value="">Todos</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        </div>
      </div>

      {/* Search + clear row */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary" />
          <Input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por descrição..."
            className="h-[34px] pl-8 text-sm"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-muted"
            >
              <X className="h-3.5 w-3.5 text-foreground-secondary" />
            </button>
          )}
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-foreground-secondary transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Limpar filtros
          </button>
        )}
      </div>

      {/* Active filter badges */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1.5">
          {filters.dateStart && (
            <Badge variant="secondary" className="gap-1 text-xs">
              De: {filters.dateStart}
              <button type="button" onClick={() => update({ dateStart: undefined })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.dateEnd && (
            <Badge variant="secondary" className="gap-1 text-xs">
              Até: {filters.dateEnd}
              <button type="button" onClick={() => update({ dateEnd: undefined })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.cardIds?.map((id) => {
            const label = cardOptions.find((o) => o.id === id)?.label ?? id;
            return (
              <Badge key={id} variant="secondary" className="gap-1 text-xs">
                {label}
                <button
                  type="button"
                  onClick={() =>
                    update({
                      cardIds: filters.cardIds!.filter((c) => c !== id),
                    })
                  }
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          {filters.categoryIds?.map((id) => {
            const label = categoryOptions.find((o) => o.id === id)?.label ?? id;
            return (
              <Badge key={id} variant="secondary" className="gap-1 text-xs">
                {label}
                <button
                  type="button"
                  onClick={() =>
                    update({
                      categoryIds: filters.categoryIds!.filter((c) => c !== id),
                    })
                  }
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          {filters.minAmount !== undefined && (
            <Badge variant="secondary" className="gap-1 text-xs">
              Min: R$ {filters.minAmount}
              <button type="button" onClick={() => { setMinInput(""); update({ minAmount: undefined }); }}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.maxAmount !== undefined && (
            <Badge variant="secondary" className="gap-1 text-xs">
              Max: R$ {filters.maxAmount}
              <button type="button" onClick={() => { setMaxInput(""); update({ maxAmount: undefined }); }}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.categorizationMethod && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {filters.categorizationMethod === "rule" ? "Regra" : filters.categorizationMethod === "ai" ? "IA" : "Manual"}
              <button type="button" onClick={() => update({ categorizationMethod: undefined })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.isRecurring !== undefined && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {filters.isRecurring ? "Recorrente" : "Não recorrente"}
              <button type="button" onClick={() => update({ isRecurring: undefined })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
