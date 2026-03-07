"use client";

import {
  Utensils, Home, Car, HeartPulse, GraduationCap, Baby,
  ShoppingBag, Repeat, Gamepad2, Wrench, TrendingUp, CircleDot,
  Coffee, Music, Plane, Gift, Briefcase, Book, Camera, Star,
  Zap, Shield, Smartphone, Tv, Scissors, Tag, Umbrella, Wallet,
  Dog, Flower2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  utensils: Utensils,
  home: Home,
  car: Car,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  baby: Baby,
  "shopping-bag": ShoppingBag,
  repeat: Repeat,
  "gamepad-2": Gamepad2,
  wrench: Wrench,
  "trending-up": TrendingUp,
  "circle-dot": CircleDot,
  coffee: Coffee,
  music: Music,
  plane: Plane,
  gift: Gift,
  briefcase: Briefcase,
  book: Book,
  camera: Camera,
  star: Star,
  zap: Zap,
  shield: Shield,
  smartphone: Smartphone,
  tv: Tv,
  scissors: Scissors,
  tag: Tag,
  umbrella: Umbrella,
  wallet: Wallet,
  dog: Dog,
  "flower-2": Flower2,
};

export function getIconComponent(name: string): LucideIcon {
  return ICON_MAP[name] ?? CircleDot;
}

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  color?: string;
}

export function IconPicker({ value, onChange, color }: IconPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {Object.entries(ICON_MAP).map(([name, Icon]) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
            value === name
              ? "ring-2 ring-accent bg-accent/10"
              : "hover:bg-background-secondary"
          )}
        >
          <Icon
            className="h-4 w-4"
            style={value === name && color ? { color } : undefined}
          />
        </button>
      ))}
    </div>
  );
}
