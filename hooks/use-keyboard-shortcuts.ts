"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  description: string;
  action: () => void;
}

export const SHORTCUT_DEFINITIONS = [
  { key: "i", ctrl: true, description: "Importar Fatura" },
  { key: "n", ctrl: true, description: "Novo lançamento" },
  { key: "ArrowLeft", ctrl: false, description: "Mês anterior" },
  { key: "ArrowRight", ctrl: false, description: "Próximo mês" },
  { key: "/", ctrl: false, description: "Focar na busca" },
  { key: "Escape", ctrl: false, description: "Fechar modal" },
] as const;

interface UseKeyboardShortcutsOptions {
  onNewTransaction?: () => void;
  onNavigateMonth?: (delta: number) => void;
}

export function useKeyboardShortcuts({
  onNewTransaction,
  onNavigateMonth,
}: UseKeyboardShortcutsOptions = {}) {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      // Ctrl/Cmd shortcuts work even in inputs
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === "i") {
        e.preventDefault();
        router.push("/invoices/import");
        return;
      }

      if (mod && e.key === "n") {
        e.preventDefault();
        onNewTransaction?.();
        return;
      }

      // Skip non-mod shortcuts if in input
      if (isInput) return;

      if (e.key === "/" ) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          '[data-search-input]'
        );
        searchInput?.focus();
        return;
      }

      if (e.key === "ArrowLeft" && !mod) {
        onNavigateMonth?.(-1);
        return;
      }

      if (e.key === "ArrowRight" && !mod) {
        onNavigateMonth?.(1);
        return;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router, onNewTransaction, onNavigateMonth]);
}
