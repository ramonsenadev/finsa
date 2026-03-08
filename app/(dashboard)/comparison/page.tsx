import { Suspense } from "react";
import { ComparisonContent } from "@/components/features/comparison/comparison-content";

export default function ComparisonPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">
        Comparação Temporal
      </h1>
      <Suspense>
        <ComparisonContent />
      </Suspense>
    </div>
  );
}
