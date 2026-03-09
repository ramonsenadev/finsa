"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <AlertCircle className="h-12 w-12 text-error" />
      <h2 className="mt-4 text-lg font-semibold text-foreground">
        Erro ao carregar o dashboard
      </h2>
      <p className="mt-1 text-sm text-foreground-secondary">
        {error.message || "Não foi possível carregar os dados."}
      </p>
      <Button variant="outline" className="mt-4" onClick={reset}>
        <RefreshCw className="h-4 w-4" />
        Tentar novamente
      </Button>
    </div>
  );
}
