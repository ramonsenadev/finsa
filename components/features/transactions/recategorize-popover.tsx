"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CategorySelectorDropdown,
  type CategoryItem,
} from "./category-selector";
import {
  recategorizeTransaction,
  countSameMerchantTransactions,
} from "@/app/transactions/actions";

type RecategorizePopoverProps = {
  transactionId: string;
  currentCategoryId: string | null;
  currentCategoryName: string | null;
  categories: CategoryItem[];
  onComplete?: () => void;
};

type Step = "select" | "confirm";

export function RecategorizePopover({
  transactionId,
  currentCategoryId,
  currentCategoryName,
  categories,
  onComplete,
}: RecategorizePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("select");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [merchantInfo, setMerchantInfo] = useState<{
    count: number;
    merchant: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find category name for the selected ID
  const selectedCategoryName = selectedCategoryId
    ? (() => {
        const cat = categories.find((c) => c.id === selectedCategoryId);
        if (!cat) return null;
        if (cat.parentId) {
          const parent = categories.find((c) => c.id === cat.parentId);
          return parent ? `${parent.name} › ${cat.name}` : cat.name;
        }
        return cat.name;
      })()
    : null;

  const reset = useCallback(() => {
    setStep("select");
    setSelectedCategoryId(null);
    setMerchantInfo(null);
    setLoading(false);
    setApplying(false);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    reset();
  }, [reset]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, close]);

  async function handleCategorySelect(categoryId: string) {
    if (categoryId === currentCategoryId) {
      close();
      return;
    }

    setSelectedCategoryId(categoryId);
    setLoading(true);
    setStep("confirm");

    const info = await countSameMerchantTransactions(transactionId);
    setMerchantInfo(info);
    setLoading(false);
  }

  async function handleApply(applyToAll: boolean) {
    if (!selectedCategoryId) return;

    setApplying(true);
    await recategorizeTransaction(transactionId, selectedCategoryId, applyToAll);
    setApplying(false);
    toast.success("Categorização salva");
    close();
    onComplete?.();
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (isOpen) {
            close();
          } else {
            reset();
            setIsOpen(true);
          }
        }}
        className={cn(
          "rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted",
          currentCategoryName
            ? "text-foreground-secondary"
            : "text-foreground-secondary/60 italic",
          isOpen && "bg-muted ring-1 ring-accent/30"
        )}
      >
        {currentCategoryName ?? "Sem categoria"}
      </button>

      {isOpen && step === "select" && (
        <div className="absolute left-0 z-50 mt-1">
          <CategorySelectorDropdown
            categories={categories}
            value={currentCategoryId}
            onSelect={handleCategorySelect}
            onClose={close}
            autoFocus
          />
        </div>
      )}

      {isOpen && step === "confirm" && (
        <div className="absolute left-0 z-50 mt-1 w-80 rounded-md border border-border bg-popover p-4 shadow-lg">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
            </div>
          ) : (
            <>
              <p className="text-sm text-foreground">
                Alterar categoria para{" "}
                <span className="font-semibold text-accent">
                  {selectedCategoryName}
                </span>
              </p>

              {merchantInfo && merchantInfo.count > 1 && (
                <p className="mt-2 text-sm text-foreground-secondary">
                  Encontramos{" "}
                  <span className="font-semibold text-foreground">
                    {merchantInfo.count}
                  </span>{" "}
                  transações de{" "}
                  <span className="font-medium text-foreground">
                    {merchantInfo.merchant}
                  </span>
                  . Deseja aplicar esta categoria a todas?
                </p>
              )}

              <div className="mt-4 flex flex-col gap-2">
                {merchantInfo && merchantInfo.count > 1 && (
                  <Button
                    size="sm"
                    onClick={() => handleApply(true)}
                    disabled={applying}
                    className="w-full"
                  >
                    {applying ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    Aplicar a todas ({merchantInfo.count})
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleApply(false)}
                  disabled={applying}
                  className="w-full"
                >
                  {applying && (!merchantInfo || merchantInfo.count <= 1) ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  {merchantInfo && merchantInfo.count > 1
                    ? "Apenas esta"
                    : "Aplicar"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
