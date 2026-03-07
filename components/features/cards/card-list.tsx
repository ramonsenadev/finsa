"use client";

import { useState } from "react";
import { Plus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardItem } from "./card-item";
import { CardFormModal } from "./card-form-modal";

type CardData = {
  id: string;
  name: string;
  issuer: string;
  lastFourDigits: string | null;
  holderName: string | null;
  isActive: boolean;
  csvFormatId: string | null;
};

interface CardListProps {
  cards: CardData[];
}

export function CardList({ cards }: CardListProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardData | null>(null);

  function handleNew() {
    setEditingCard(null);
    setModalOpen(true);
  }

  function handleEdit(card: CardData) {
    setEditingCard(card);
    setModalOpen(true);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Cartões</h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Gerencie seus cartões de crédito.
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4" />
          Novo Cartão
        </Button>
      </div>

      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background-secondary">
            <CreditCard className="h-6 w-6 text-foreground-secondary" />
          </div>
          <h3 className="mt-4 text-sm font-medium text-foreground">
            Nenhum cartão cadastrado
          </h3>
          <p className="mt-1 text-sm text-foreground-secondary">
            Adicione seu primeiro cartão para começar a importar faturas.
          </p>
          <Button onClick={handleNew} variant="outline" className="mt-4">
            <Plus className="h-4 w-4" />
            Adicionar Cartão
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <CardItem key={card.id} card={card} onEdit={handleEdit} />
          ))}
        </div>
      )}

      <CardFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingCard={editingCard}
      />
    </div>
  );
}
