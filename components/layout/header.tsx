"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      {/* Period selector placeholder */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground-secondary">
          Periodo:
        </span>
        <select className="rounded-sm border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent">
          <option>Marco 2026</option>
          <option>Fevereiro 2026</option>
          <option>Janeiro 2026</option>
        </select>
      </div>

      {/* Global search placeholder */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary" />
        <Input
          placeholder="Buscar transacoes..."
          className="pl-9"
        />
      </div>
    </header>
  );
}
