import { ReviewQueueContent } from "@/components/features/review/review-queue-content";

export default function ReviewQueuePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Fila de Revisão</h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Categorize transações pendentes ou com baixa confiança
        </p>
      </div>

      <ReviewQueueContent />
    </div>
  );
}
