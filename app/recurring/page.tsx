import { prisma } from "@/lib/db";
import { fetchRecurringPageData } from "./actions";
import { RecurringContent } from "@/components/features/recurring/recurring-content";

const DEFAULT_USER_EMAIL = "ramon@finsa.local";

export default async function RecurringPage() {
  const data = await fetchRecurringPageData();

  const user = await prisma.user.findFirst({
    where: { email: DEFAULT_USER_EMAIL },
  });

  const categories = user
    ? await prisma.category.findMany({
        where: { OR: [{ userId: user.id }, { isSystem: true }] },
        select: { id: true, name: true, parentId: true, icon: true, color: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      })
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Recorrentes</h1>
        <p className="mt-1 text-foreground-secondary">
          Gastos fixos, assinaturas e despesas mensais.
        </p>
      </div>
      <RecurringContent initialData={data} categories={categories} />
    </div>
  );
}
