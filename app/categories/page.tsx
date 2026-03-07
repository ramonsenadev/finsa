import { prisma } from "@/lib/db";
import { CategoryTree, type CategoryNode } from "@/components/features/categories/category-tree";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { transactions: true } },
      children: {
        orderBy: { sortOrder: "asc" },
        include: {
          _count: { select: { transactions: true } },
        },
      },
    },
  });

  const tree: CategoryNode[] = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    isSystem: cat.isSystem,
    parentId: cat.parentId,
    _count: cat._count,
    children: cat.children.map((child) => ({
      id: child.id,
      name: child.name,
      icon: child.icon,
      color: child.color,
      isSystem: child.isSystem,
      parentId: child.parentId,
      _count: child._count,
      children: [],
    })),
  }));

  return <CategoryTree categories={tree} />;
}
