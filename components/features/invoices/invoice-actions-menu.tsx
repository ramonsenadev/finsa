"use client";

import { MoreHorizontal, Eye, ClipboardList, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InvoiceActionsMenuProps {
  importId: string;
  manualPending: number;
  onDelete: () => void;
}

export function InvoiceActionsMenu({
  importId,
  manualPending,
  onDelete,
}: InvoiceActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="text-foreground-secondary">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/transactions?import=${importId}`}>
            <Eye className="mr-2 size-4" />
            Ver transações
          </Link>
        </DropdownMenuItem>
        {manualPending > 0 && (
          <DropdownMenuItem asChild>
            <Link href={`/transactions/review?import=${importId}`}>
              <ClipboardList className="mr-2 size-4" />
              Revisar pendentes
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-error focus:text-error"
          onClick={onDelete}
        >
          <Trash2 className="mr-2 size-4" />
          Excluir fatura
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
