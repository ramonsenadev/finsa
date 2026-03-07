import { ImportWizard } from "@/components/features/import/import-wizard";
import { getActiveCards } from "./actions";

export default async function ImportPage() {
  const cards = await getActiveCards();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Import CSV</h1>
      <p className="mt-1 text-foreground-secondary">
        Importe faturas de cartão de crédito em CSV.
      </p>
      <div className="mt-6">
        <ImportWizard cards={cards} />
      </div>
    </div>
  );
}
