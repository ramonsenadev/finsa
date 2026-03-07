"use client";

import { cn } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/validations/category";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "h-7 w-7 rounded-full transition-transform",
            value === color
              ? "ring-2 ring-offset-2 ring-accent scale-110"
              : "hover:scale-110"
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
