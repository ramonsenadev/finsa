import { getInvoices, getInvoiceCards, getInvoiceInsights } from "./actions";
import { InvoicesContent } from "@/components/features/invoices/invoices-content";

export default async function InvoicesPage() {
  const [invoices, cards] = await Promise.all([
    getInvoices(),
    getInvoiceCards(),
  ]);

  const insights = await getInvoiceInsights(invoices);

  return <InvoicesContent invoices={invoices} cards={cards} insights={insights} />;
}
