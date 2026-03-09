import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CardDetailContent } from "@/components/features/cards/card-detail-content";

interface CardDetailPageProps {
  params: Promise<{ cardId: string }>;
}

export default async function CardDetailPage({ params }: CardDetailPageProps) {
  const { cardId } = await params;

  const user = await prisma.user.findFirst({
    where: { email: "ramon@finsa.local" },
  });

  if (!user) notFound();

  const card = await prisma.card.findFirst({
    where: { id: cardId, userId: user.id },
    select: { id: true, name: true },
  });

  if (!card) notFound();

  return (
    <Suspense>
      <CardDetailContent cardId={cardId} />
    </Suspense>
  );
}
