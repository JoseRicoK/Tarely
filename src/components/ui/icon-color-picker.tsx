"use client";

import { useState, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Folder,
  Briefcase,
  Code,
  Palette,
  BookOpen,
  Rocket,
  Target,
  Heart,
  Star,
  Zap,
  Coffee,
  Music,
  Camera,
  Film,
  Gamepad2,
  ShoppingCart,
  Home,
  Car,
  Plane,
  Globe,
  Building2,
  GraduationCap,
  Dumbbell,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Iconos disponibles
const ICONS: { name: string; Icon: LucideIcon }[] = [
  { name: "Folder", Icon: Folder },
  { name: "Briefcase", Icon: Briefcase },
  { name: "Code", Icon: Code },
  { name: "Palette", Icon: Palette },
  { name: "BookOpen", Icon: BookOpen },
  { name: "Rocket", Icon: Rocket },
  { name: "Target", Icon: Target },
  { name: "Heart", Icon: Heart },
  { name: "Star", Icon: Star },
  { name: "Zap", Icon: Zap },
  { name: "Coffee", Icon: Coffee },
  { name: "Music", Icon: Music },
  { name: "Camera", Icon: Camera },
  { name: "Film", Icon: Film },
  { name: "Gamepad2", Icon: Gamepad2 },
  { name: "ShoppingCart", Icon: ShoppingCart },
  { name: "Home", Icon: Home },
  { name: "Car", Icon: Car },
  { name: "Plane", Icon: Plane },
  { name: "Globe", Icon: Globe },
  { name: "Building2", Icon: Building2 },
  { name: "GraduationCap", Icon: GraduationCap },
  { name: "Dumbbell", Icon: Dumbbell },
  { name: "Utensils", Icon: Utensils },
];

// Colores disponibles
const COLORS = [
  "#6366f1", // Indigo (default)
  "#8b5cf6", // Violet
  "#a855f7", // Purple
  "#d946ef", // Fuchsia
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#eab308", // Yellow
  "#84cc16", // Lime
  "#22c55e", // Green
  "#10b981", // Emerald
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#0ea5e9", // Sky
  "#3b82f6", // Blue
  "#64748b", // Slate
];

// Helper para obtener el componente del icono
export function getIconComponent(iconName: string): LucideIcon {
  const found = ICONS.find(i => i.name === iconName);
  return found?.Icon || Folder;
}

interface IconColorPickerProps {
  icon: string;
  color: string;
  onIconChange: (icon: string) => void;
  onColorChange: (color: string) => void;
}

export function IconColorPicker({
  icon,
  color,
  onIconChange,
  onColorChange,
}: IconColorPickerProps) {
  const [open, setOpen] = useState(false);

  // Obtener el icono directamente del array
  const currentIconData = useMemo(() => {
    return ICONS.find(i => i.name === icon) || ICONS[0];
  }, [icon]);
  
  const IconComponent = currentIconData.Icon;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-12 w-12 p-0 rounded-lg transition-all hover:scale-105"
          style={{ backgroundColor: `${color}20`, borderColor: color }}
        >
          <IconComponent className="h-6 w-6" style={{ color }} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          {/* Iconos */}
          <div>
            <label className="text-sm font-medium mb-2 block">Icono</label>
            <div className="grid grid-cols-8 gap-1">
              {ICONS.map(({ name, Icon }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onIconChange(name)}
                  className={cn(
                    "h-8 w-8 flex items-center justify-center rounded-md transition-all",
                    "hover:bg-accent",
                    icon === name && "ring-2 ring-primary bg-accent"
                  )}
                >
                  <Icon className="h-4 w-4" style={{ color }} />
                </button>
              ))}
            </div>
          </div>

          {/* Colores */}
          <div>
            <label className="text-sm font-medium mb-2 block">Color</label>
            <div className="grid grid-cols-9 gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onColorChange(c)}
                  className={cn(
                    "h-6 w-6 rounded-full transition-all hover:scale-110",
                    color === c && "ring-2 ring-offset-2 ring-primary"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
