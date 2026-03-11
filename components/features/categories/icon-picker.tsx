"use client";

import {
  Utensils, Home, Car, HeartPulse, GraduationCap, Baby,
  ShoppingBag, Repeat, Gamepad2, Wrench, TrendingUp, CircleDot,
  Coffee, Music, Plane, Gift, Briefcase, Book, Camera, Star,
  Zap, Shield, Smartphone, Tv, Scissors, Tag, Umbrella, Wallet,
  Dog, Flower2, Cloud, Wifi, Globe, CreditCard, Dumbbell,
  Bike, Bus, Train, Fuel, ParkingCircle, Stethoscope, Pill,
  Apple, ShoppingCart, Store, Sofa, Lightbulb, Droplets,
  PawPrint, Cat, Palette, Headphones, MonitorSmartphone,
  Laptop, HardDrive, Download, MapPin, Building2, Landmark,
  HandCoins, PiggyBank, Receipt, FileText, Percent, Crown,
  Gem, Wine, IceCreamCone, Popcorn, Shirt, Watch,
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
  cloud: Cloud,
  wifi: Wifi,
  globe: Globe,
  "credit-card": CreditCard,
  dumbbell: Dumbbell,
  bike: Bike,
  bus: Bus,
  train: Train,
  fuel: Fuel,
  "parking-circle": ParkingCircle,
  stethoscope: Stethoscope,
  pill: Pill,
  apple: Apple,
  "shopping-cart": ShoppingCart,
  store: Store,
  sofa: Sofa,
  lightbulb: Lightbulb,
  droplets: Droplets,
  "paw-print": PawPrint,
  cat: Cat,
  palette: Palette,
  headphones: Headphones,
  "monitor-smartphone": MonitorSmartphone,
  laptop: Laptop,
  "hard-drive": HardDrive,
  download: Download,
  "map-pin": MapPin,
  "building-2": Building2,
  landmark: Landmark,
  "hand-coins": HandCoins,
  "piggy-bank": PiggyBank,
  receipt: Receipt,
  "file-text": FileText,
  percent: Percent,
  crown: Crown,
  gem: Gem,
  wine: Wine,
  "ice-cream-cone": IceCreamCone,
  popcorn: Popcorn,
  shirt: Shirt,
  watch: Watch,
};

export function getIconComponent(name: string): LucideIcon {
  return ICON_MAP[name] ?? CircleDot;
}

export function DynamicIcon({
  name,
  ...props
}: { name: string } & React.ComponentProps<LucideIcon>) {
  const Icon = ICON_MAP[name] ?? CircleDot;
  return <Icon {...props} />;
}

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  color?: string;
}

export function IconPicker({ value, onChange, color }: IconPickerProps) {
  return (
    <div className="grid grid-cols-8 gap-1 max-h-60 overflow-y-auto rounded-md border border-border p-2">
      {Object.entries(ICON_MAP).map(([name, Icon]) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
            value === name
              ? "ring-2 ring-accent bg-accent/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Icon
            className="h-4.5 w-4.5"
            style={value === name && color ? { color } : undefined}
          />
        </button>
      ))}
    </div>
  );
}
