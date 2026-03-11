"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  activeMonthRef: string;
  headerActions: ReactNode;
}

// ─── Helper: check if dates match active month ──────────────────────

function datesMatchMonth(filters: FilterValues, monthRef: string): boolean {
  if (!filters.dateStart || !filters.dateEnd) return false;
  const [year, month] = monthRef.split("-").map(Number);
  const expectedStart = `${monthRef}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const expectedEnd = `${monthRef}-${String(lastDay).padStart(2, "0")}`;
  return filters.dateStart === expectedStart && filters.dateEnd === expectedEnd;
}

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// ─── Multi-select dropdown (inline) ─────────────────────────────────

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
  renderOption?: (opt: { id: string; label: string }) => ReactNode;
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
      <label className="mb-1 block text-xs font-medium text-foreground-secondary">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-xs transition-colors hover:border-accent/50 dark:bg-input/30",
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
  activeMonthRef,
  headerActions,
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

  // Category options — only parent categories + "Sem categoria"
  const parentCategories = categories.filter((c) => c.parentId === null);
  const categoryOptions = [
    { id: "uncategorized", label: "Sem categoria" },
    ...parentCategories.map((c) => ({
      id: c.id,
      label: c.name,
    })),
  ];

  // Count active filters (excluding date range that matches active month, and search)
  const activeFilterCount = [
    filters.cardIds && filters.cardIds.length > 0,
    filters.categoryIds && filters.categoryIds.length > 0,
    filters.minAmount !== undefined,
    filters.maxAmount !== undefined,
    filters.categorizationMethod,
    filters.isRecurring !== undefined,
  ].filter(Boolean).length;

  // Non-month date filters (custom date range)
  const hasCustomDateRange = (filters.dateStart || filters.dateEnd) && !datesMatchMonth(filters, activeMonthRef);

  // Any active filters (for badges)
  const hasAnyNonSearchFilter =
    activeFilterCount > 0 || hasCustomDateRange;

  function clearAll() {
    setSearchInput("");
    setMinInput("");
    setMaxInput("");
    onFiltersChange({});
  }

  function clearAdvancedFilters() {
    setMinInput("");
    setMaxInput("");
    onFiltersChange({
      ...filters,
      cardIds: undefined,
      categoryIds: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      categorizationMethod: undefined,
      isRecurring: undefined,
    });
  }

  return (
    <div className="space-y-3">
      {/* Search + Filters + New Transaction */}
      <div className="flex items-center gap-2">
        {/* Search — primary control */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary" />
          <Input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por descrição..."
            className="h-9 pl-9 text-sm"
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

        {/* Filters popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Filtros</p>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearAdvancedFilters}
                  className="text-xs text-foreground-secondary hover:text-foreground"
                >
                  Limpar filtros
                </button>
              )}
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
              renderOption={(opt) =>
                opt.id === "uncategorized" ? (
                  <span className="italic text-foreground-secondary">Sem categoria</span>
                ) : (
                  opt.label
                )
              }
            />

            {/* Amount range */}
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground-secondary">
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
                  className="h-8.5 flex-1 text-sm"
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
                  className="h-8.5 flex-1 text-sm"
                />
              </div>
            </div>

            {/* Categorization method */}
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground-secondary">
                Categorização
              </label>
              <select
                value={filters.categorizationMethod ?? ""}
                onChange={(e) => {
                  const val = e.target.value as "" | "rule" | "ai" | "manual";
                  update({ categorizationMethod: val || undefined });
                }}
                className="h-8.5 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-xs dark:bg-input/30"
              >
                <option value="">Todos</option>
                <option value="rule">Regra</option>
                <option value="ai">IA</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            {/* Recurring */}
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground-secondary">
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
                className="h-8.5 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-xs dark:bg-input/30"
              >
                <option value="">Todos</option>
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </div>
          </PopoverContent>
        </Popover>

        {/* Header actions (+ Transação) */}
        {headerActions}
      </div>

      {/* Row 2: Active filter badges (only non-month, non-search filters) */}
      {hasAnyNonSearchFilter && (
        <div className="flex flex-wrap items-center gap-1.5">
          {hasCustomDateRange && filters.dateStart && (
            <Badge variant="secondary" className="gap-1 text-xs">
              De: {formatDateBR(filters.dateStart)}
              <button type="button" onClick={() => update({ dateStart: undefined })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {hasCustomDateRange && filters.dateEnd && (
            <Badge variant="secondary" className="gap-1 text-xs">
              Até: {formatDateBR(filters.dateEnd)}
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

          <button
            type="button"
            onClick={clearAll}
            className="ml-1 text-xs text-foreground-secondary hover:text-foreground"
          >
            Limpar todos
          </button>
        </div>
      )}
    </div>
  );
}
