import { ReviewQueueContent } from "@/components/features/review/review-queue-content";
import { ClipboardList } from "lucide-react";

export default function ReviewQueuePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
          <ClipboardList className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Fila de Revisão</h1>
          <p className="text-sm text-foreground-secondary">
            Categorize transações pendentes ou com baixa confiança
          </p>
        </div>
      </div>

      <ReviewQueueContent />
    </div>
  );
}
