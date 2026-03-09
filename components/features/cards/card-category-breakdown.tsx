"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/format";
import type { CardCategoryBreakdown as CategoryData } from "@/lib/analytics/card-detail";

interface CardCategoryBreakdownProps {
  data: CategoryData[];
}

const DEFAULT_COLOR = "#6366f1";

export function CardCategoryBreakdown({ data }: CardCategoryBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Categorias Predominantes</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-foreground-secondary">
            Nenhuma transação categorizada neste período.
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((cat) => (
              <div key={cat.categoryId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {cat.icon && <span className="text-sm">{cat.icon}</span>}
                    <span className="font-medium text-foreground">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground-secondary">
                      {formatBRL(cat.total)}
                    </span>
                    <span className="text-xs text-foreground-secondary w-12 text-right">
                      {cat.percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(cat.percent, 100)}%`,
                      backgroundColor: cat.color ?? DEFAULT_COLOR,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
