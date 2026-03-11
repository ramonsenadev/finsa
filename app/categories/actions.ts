"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { categorySchema, type CategoryFormData } from "@/lib/validations/category";

const DEFAULT_USER_EMAIL = "ramon@finsa.local";

async function getUserId() {
  const user = await prisma.user.findFirst({
    where: { email: DEFAULT_USER_EMAIL },
  });
  if (!user) throw new Error("User not found");
  return user.id;
}

export async function createCategory(data: CategoryFormData) {
  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const userId = await getUserId();

  // Check unique name within same level
  const existing = await prisma.category.findFirst({
    where: {
      name: parsed.data.name,
      parentId: parsed.data.parentId,
    },
  });

  if (existing) {
    return { error: { name: ["Já existe uma categoria com este nome neste nível"] } };
  }

  // Get next sort order
  const maxSort = await prisma.category.aggregate({
    where: { parentId: parsed.data.parentId },
    _max: { sortOrder: true },
  });

  await prisma.category.create({
    data: {
      name: parsed.data.name,
      icon: parsed.data.icon,
      color: parsed.data.color,
      parentId: parsed.data.parentId,
      userId,
      isSystem: false,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath("/categories");
  return { success: true };
}

export async function updateCategory(id: string, data: CategoryFormData) {
  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return { error: { name: ["Categoria não encontrada"] } };
  }

  // Check unique name within same level (excluding self)
  const existing = await prisma.category.findFirst({
    where: {
      name: parsed.data.name,
      parentId: parsed.data.parentId,
      id: { not: id },
    },
  });

  if (existing) {
    return { error: { name: ["Já existe uma categoria com este nome neste nível"] } };
  }

  await prisma.category.update({
    where: { id },
    data: {
      name: parsed.data.name,
      icon: parsed.data.icon,
      color: parsed.data.color,
      parentId: parsed.data.parentId,
    },
  });

  revalidatePath("/categories");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: { select: { transactions: true, children: true } },
    },
  });

  if (!category) {
    return { error: "Categoria não encontrada" };
  }

  if (category.isSystem) {
    return { error: "Categorias de sistema não podem ser excluídas" };
  }

  if (category._count.transactions > 0) {
    return {
      error: `Esta categoria possui ${category._count.transactions} transação(ões) vinculada(s). Mova as transações para outra categoria antes de excluir.`,
      transactionCount: category._count.transactions,
    };
  }

  if (category._count.children > 0) {
    return {
      error: "Esta categoria possui subcategorias. Remova-as primeiro.",
    };
  }

  await prisma.category.delete({ where: { id } });

  revalidatePath("/categories");
  return { success: true };
}
