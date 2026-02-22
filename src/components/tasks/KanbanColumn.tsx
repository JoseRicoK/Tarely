"use client";

import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { GripHorizontal, MoreHorizontal, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WorkspaceSection } from "@/lib/types";
import type { LucideIcon } from "lucide-react";

interface KanbanColumnProps {
  section: WorkspaceSection;
  count: number;
  children: React.ReactNode;
  onEditSection?: (section: WorkspaceSection) => void;
  onDeleteSection?: (section: WorkspaceSection) => void;
  onMoveLeft?: (section: WorkspaceSection) => void;
  onMoveRight?: (section: WorkspaceSection) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

// Map of icon names to components
const iconMap: Record<string, LucideIcon> = {
  "list-todo": LucideIcons.ListTodo,
  "eye": LucideIcons.Eye,
  "check-circle-2": LucideIcons.CheckCircle2,
  "folder": LucideIcons.Folder,
  "star": LucideIcons.Star,
  "heart": LucideIcons.Heart,
  "flag": LucideIcons.Flag,
  "bookmark": LucideIcons.Bookmark,
  "tag": LucideIcons.Tag,
  "calendar": LucideIcons.Calendar,
  "clock": LucideIcons.Clock,
  "alert-circle": LucideIcons.AlertCircle,
  "zap": LucideIcons.Zap,
  "target": LucideIcons.Target,
  "trophy": LucideIcons.Trophy,
  "rocket": LucideIcons.Rocket,
  "code": LucideIcons.Code,
  "file-text": LucideIcons.FileText,
  "bug": LucideIcons.Bug,
  "wrench": LucideIcons.Wrench,
  "settings": LucideIcons.Settings,
  "users": LucideIcons.Users,
  "message-circle": LucideIcons.MessageCircle,
  "mail": LucideIcons.Mail,
  "phone": LucideIcons.Phone,
  "home": LucideIcons.Home,
  "briefcase": LucideIcons.Briefcase,
  "shopping-cart": LucideIcons.ShoppingCart,
  "credit-card": LucideIcons.CreditCard,
  "dollar-sign": LucideIcons.DollarSign,
  "pie-chart": LucideIcons.PieChart,
  "bar-chart": LucideIcons.BarChart,
  "activity": LucideIcons.Activity,
  "layers": LucideIcons.Layers,
  "archive": LucideIcons.Archive,
};

export function KanbanColumn({
  section,
  count,
  children,
  onEditSection,
  onDeleteSection,
  onMoveLeft,
  onMoveRight,
  isFirst,
  isLast,
}: KanbanColumnProps) {
  // Sortable for column reordering (drag from header)
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
  });

  // Droppable for task dropping
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: section.id,
  });

  const Icon = useMemo(() => {
    return iconMap[section.icon] || LucideIcons.Folder;
  }, [section.icon]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={(node) => {
        setSortableRef(node);
        setDroppableRef(node);
      }}
      style={style}
      className={cn(
        "flex-shrink-0 w-64 sm:w-80 flex flex-col rounded-lg border bg-muted/30 overflow-hidden transition-colors",
        isOver && "ring-2 ring-ta/50 bg-ta/5",
        isDragging && "opacity-50"
      )}
    >
      {/* Column Header - Draggable */}
      <div
        className="flex items-center gap-2 p-3 border-b select-none"
        style={{ 
          backgroundColor: `${section.color}15`,
          borderColor: `${section.color}30`
        }}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <GripHorizontal className="h-4 w-4 text-muted-foreground/50" />
        </div>
        <Icon 
          className="h-4 w-4 flex-shrink-0" 
          style={{ color: section.color }}
        />
        <span className="font-medium text-sm truncate flex-1">{section.name}</span>
        <Badge
          variant="secondary"
          className="text-xs flex-shrink-0"
          style={{ 
            backgroundColor: `${section.color}25`,
            color: section.color
          }}
        >
          {count}
        </Badge>
        {/* Section options menu */}
        {(onEditSection || onDeleteSection || onMoveLeft || onMoveRight) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0 opacity-60 hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Opciones de sección</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(onMoveLeft || onMoveRight) && (
                <>
                  <DropdownMenuItem
                    onClick={() => onMoveLeft?.(section)}
                    disabled={isFirst}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Mover a la izquierda
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onMoveRight?.(section)}
                    disabled={isLast}
                  >
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Mover a la derecha
                  </DropdownMenuItem>
                  {(onEditSection || onDeleteSection) && <DropdownMenuSeparator />}
                </>
              )}
              {onEditSection && (
                <DropdownMenuItem onClick={() => onEditSection(section)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar sección
                </DropdownMenuItem>
              )}
              {onDeleteSection && !section.isSystem && (
                <DropdownMenuItem
                  onClick={() => onDeleteSection(section)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar sección
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Column Content with scroll */}
      <ScrollArea className="flex-1 max-h-[75vh]">
        <div className="p-2 space-y-2 min-h-[200px]">
          {children}
          {count === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Icon 
                className="h-8 w-8 mb-2 opacity-50" 
                style={{ color: section.color }}
              />
              <p className="text-xs text-muted-foreground">
                Sin tareas
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Arrastra tareas aquí
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
