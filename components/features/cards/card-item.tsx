"use client";

import Link from "next/link";
import {
  CreditCard,
  EllipsisVertical,
  Pencil,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    closingDay: number | null;
    dueDay: number | null;
    isActive: boolean;
    csvFormatId: string | null;
  };
  onEdit: (card: CardItemProps["card"]) => void;
  onDelete: (card: CardItemProps["card"]) => void;
}

export function CardItem({ card, onEdit, onDelete }: CardItemProps) {
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="rounded-md p-1.5 text-foreground-secondary opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100"
              aria-label="Opções do cartão"
            >
              <EllipsisVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(card);
              }}
            >
              <Pencil className="h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
            >
              {card.isActive ? (
                <>
                  <PowerOff className="h-4 w-4" />
                  Desativar
                </>
              ) : (
                <>
                  <Power className="h-4 w-4" />
                  Ativar
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(card);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
