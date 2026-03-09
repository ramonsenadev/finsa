import { Suspense } from "react";
import { TransactionsContent } from "@/components/features/transactions/transactions-content";

export default function TransactionsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Transações</h1>
      <p className="mt-1 text-sm text-foreground-secondary">
        Listagem completa com filtros avançados e exportação.
      </p>

      <div className="mt-6">
        <Suspense
          fallback={
            <div className="space-y-4">
              <div className="h-10 animate-pulse rounded-lg bg-muted" />
              <div className="h-64 animate-pulse rounded-lg bg-muted" />
            </div>
          }
        >
          <TransactionsContent />
        </Suspense>
      </div>
    </div>
  );
}
