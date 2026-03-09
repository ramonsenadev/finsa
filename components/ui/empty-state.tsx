import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background-secondary">
        <Icon className="h-7 w-7 text-foreground-secondary" />
      </div>
      <h3 className="mt-4 text-base font-medium text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-center text-sm text-foreground-secondary">
        {description}
      </p>
      {action && (
        action.href ? (
          <Button asChild variant="outline" className="mt-4">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button variant="outline" className="mt-4" onClick={action.onClick}>
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}
