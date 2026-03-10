"use client";

import Link from "next/link";
import { CreditCard, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  ISSUER_LABELS,
  ISSUER_COLORS,
  type Issuer,
} from "@/lib/validations/card";
import { toggleCardActive } from "@/app/cards/actions";

interface CardItemProps {
  card: {
    id: string;
    name: string;
    issuer: string;
    lastFourDigits: string | null;
    holderName: string | null;
    isActive: boolean;
    csvFormatId: string | null;
  };
  onEdit: (card: CardItemProps["card"]) => void;
}

export function CardItem({ card, onEdit }: CardItemProps) {
  const issuer = card.issuer as Issuer;
  const issuerColor = ISSUER_COLORS[issuer] ?? ISSUER_COLORS.outro;
  const issuerLabel = ISSUER_LABELS[issuer] ?? card.issuer;

  async function handleToggle() {
    await toggleCardActive(card.id);
  }

  return (
    <Link
      href={`/cards/${card.id}`}
      className={`group relative flex w-full flex-col gap-4 rounded-md border border-border bg-card p-5 text-left transition-shadow hover:shadow-md ${
        !card.isActive ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-md"
            style={{ backgroundColor: `${issuerColor}15` }}
          >
            <CreditCard className="h-5 w-5" style={{ color: issuerColor }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {card.name}
            </h3>
            {card.lastFourDigits && (
              <p className="text-xs text-foreground-secondary">
                **** {card.lastFourDigits}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(card);
            }}
            className="rounded-md p-1.5 text-foreground-secondary opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100"
            title="Editar cartão"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Switch
              checked={card.isActive}
              onCheckedChange={handleToggle}
              aria-label={card.isActive ? "Desativar cartão" : "Ativar cartão"}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Badge
          className="text-xs font-medium text-white"
          style={{ backgroundColor: issuerColor }}
        >
          {issuerLabel}
        </Badge>
        {card.holderName && (
          <span className="text-xs text-foreground-secondary">
            {card.holderName}
          </span>
        )}
      </div>

      {!card.isActive && (
        <span className="absolute right-3 bottom-3 text-xs text-foreground-secondary">
          Inativo
        </span>
      )}
    </Link>
  );
}
