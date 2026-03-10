"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  /** Numeric value in BRL (e.g. 1234.56) */
  value: number | string;
  /** Called with the raw numeric value */
  onValueChange: (value: string) => void;
  /** Show "R$" prefix — default true */
  showPrefix?: boolean;
}

function formatDisplay(raw: string): string {
  // Remove everything except digits
  const digits = raw.replace(/\D/g, "");
  if (digits === "") return "";

  // Pad to at least 3 digits (1 integer + 2 decimal)
  const padded = digits.padStart(3, "0");
  const intPart = padded.slice(0, -2).replace(/^0+(?=\d)/, "") || "0";
  const decPart = padded.slice(-2);

  // Add thousand separators
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formatted},${decPart}`;
}

function toNumericString(display: string): string {
  if (!display) return "";
  return display.replace(/\./g, "").replace(",", ".");
}

function valueToDisplay(value: number | string): string {
  if (value === "" || value === undefined || value === null) return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return "";
  return formatDisplay(Math.round(num * 100).toString());
}

function CurrencyInput({
  value,
  onValueChange,
  showPrefix = true,
  className,
  placeholder = "0,00",
  ...props
}: CurrencyInputProps) {
  const [display, setDisplay] = useState(() => valueToDisplay(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes (e.g. form reset, editing existing)
  useEffect(() => {
    const externalDisplay = valueToDisplay(value);
    setDisplay((prev) => {
      // Only update if the numeric values differ (avoid cursor jumps)
      const prevNumeric = toNumericString(prev);
      const extNumeric = toNumericString(externalDisplay);
      if (prevNumeric === extNumeric) return prev;
      return externalDisplay;
    });
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "");

    if (digits === "") {
      setDisplay("");
      onValueChange("");
      return;
    }

    const formatted = formatDisplay(digits);
    setDisplay(formatted);
    onValueChange(toNumericString(formatted));
  }

  return (
    <div className="relative">
      {showPrefix && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          R$
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        data-slot="input"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
          "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
          showPrefix && "pl-10",
          className
        )}
        {...props}
      />
    </div>
  );
}

export { CurrencyInput };
