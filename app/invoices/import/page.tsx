import { ImportWizard } from "@/components/features/import/import-wizard";
import { getActiveCards } from "@/app/invoices/import/actions";

export default async function ImportInvoicePage() {
  const cards = await getActiveCards();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Importar Fatura</h1>
      <p className="mt-1 text-foreground-secondary">
        Importe a fatura do seu cartão de crédito em CSV.
      </p>
      <div className="mt-6">
        <ImportWizard cards={cards} />
      </div>
    </div>
  );
}
