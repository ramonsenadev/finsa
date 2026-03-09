"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent);
const mod = isMac ? "⌘" : "Ctrl";

const shortcuts = [
  { keys: `${mod}+I`, description: "Importar CSV" },
  { keys: `${mod}+N`, description: "Novo lançamento" },
  { keys: "← →", description: "Navegar meses" },
  { keys: "/", description: "Busca global" },
  { keys: "Esc", description: "Fechar modal" },
];

export function ShortcutsHelp() {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="text-foreground-secondary">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Atalhos de teclado</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-64 p-3">
        <p className="mb-2 text-xs font-semibold text-foreground-secondary uppercase tracking-wide">
          Atalhos de Teclado
        </p>
        <div className="space-y-1.5">
          {shortcuts.map((s) => (
            <div key={s.keys} className="flex items-center justify-between text-sm">
              <span className="text-foreground-secondary">{s.description}</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground-secondary">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
