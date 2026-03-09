"use client";

import { RefreshCw, Shuffle, LayoutGrid } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RecurrenceFilter } from "@/lib/analytics/dashboard";

interface RecurrenceToggleProps {
  value: RecurrenceFilter;
  onChange: (value: RecurrenceFilter) => void;
}

export function RecurrenceToggle({ value, onChange }: RecurrenceToggleProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as RecurrenceFilter)}
    >
      <TabsList>
        <TabsTrigger value="all" className="gap-1.5 px-3">
          <LayoutGrid className="h-3.5 w-3.5" />
          Todos
        </TabsTrigger>
        <TabsTrigger value="recurring" className="gap-1.5 px-3">
          <RefreshCw className="h-3.5 w-3.5 text-recurring" />
          Recorrentes
        </TabsTrigger>
        <TabsTrigger value="variable" className="gap-1.5 px-3">
          <Shuffle className="h-3.5 w-3.5" />
          Variáveis
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
