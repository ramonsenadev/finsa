import { prisma } from "@/lib/db";
import { CardList } from "@/components/features/cards/card-list";

export default async function CardsPage() {
  const user = await prisma.user.findFirst({
    where: { email: "ramon@finsa.local" },
  });

  const cards = user
    ? await prisma.card.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          issuer: true,
          lastFourDigits: true,
          holderName: true,
          isActive: true,
          csvFormatId: true,
        },
      })
    : [];

  return <CardList cards={cards} />;
}
