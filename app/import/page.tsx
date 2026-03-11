import { ImportWizard } from "@/components/features/import/import-wizard";
import { ImportList } from "@/components/features/settings/import-list";
import { getActiveCards } from "./actions";
import { getImportsList } from "@/app/settings/actions";

export default async function ImportPage() {
  const [cards, imports] = await Promise.all([
    getActiveCards(),
    getImportsList(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Import CSV</h1>
      <p className="mt-1 text-foreground-secondary">
        Importe faturas de cartão de crédito em CSV.
      </p>
      <div className="mt-6">
        <ImportWizard cards={cards} />
      </div>

      {imports.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Importações anteriores
          </h2>
          <ImportList imports={imports} />
        </div>
      )}
    </div>
  );
}
