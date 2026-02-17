"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, ArrowUpDown, SortAsc, SortDesc, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortField = "importance" | "createdAt";
export type SortOrder = "asc" | "desc";

export interface TagFilterItem {
  id: string;
  name: string;
  color: string;
}

interface TaskFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField, order: SortOrder) => void;
  availableTags?: TagFilterItem[];
  selectedTagIds?: string[];
  onSelectedTagsChange?: (tagIds: string[]) => void;
}

/** Genera estilos inline para tags: fondo sutil + texto coloreado */
function getTagStyle(color: string): React.CSSProperties {
  return {
    backgroundColor: `${color}18`,
    color: color,
    borderColor: `${color}30`,
  };
}

function getTagStyleActive(color: string): React.CSSProperties {
  return {
    backgroundColor: `${color}25`,
    color: color,
    borderColor: `${color}50`,
  };
}

export function TaskFilters({
  searchQuery,
  onSearchChange,
  sortField,
  sortOrder,
  onSortChange,
  availableTags = [],
  selectedTagIds = [],
  onSelectedTagsChange,
}: TaskFiltersProps) {
  const sortLabel =
    sortField === "importance"
      ? sortOrder === "desc"
        ? "Más importante primero"
        : "Menos importante primero"
      : sortOrder === "desc"
      ? "Más reciente primero"
      : "Más antiguo primero";

  const toggleTag = (tagId: string) => {
    if (!onSelectedTagsChange) return;
    if (selectedTagIds.includes(tagId)) {
      onSelectedTagsChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onSelectedTagsChange([...selectedTagIds, tagId]);
    }
  };

  const hasTagFilter = selectedTagIds.length > 0;

  return (
    <div className="flex gap-2 md:gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar tareas..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-10 md:h-10 text-sm md:text-base bg-background/95 backdrop-blur-sm border-border/50"
        />
      </div>

      {/* Tag filter */}
      {availableTags.length > 0 && onSelectedTagsChange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "relative gap-2 h-10 w-10 md:w-auto md:h-10 text-sm md:text-sm md:px-4 shrink-0",
                hasTagFilter && "border-ta/50 text-ta-light"
              )}
            >
              <Tag className="h-4 w-4" />
              <span className="hidden md:inline">
                {hasTagFilter ? `${selectedTagIds.length} etiqueta${selectedTagIds.length > 1 ? "s" : ""}` : "Etiquetas"}
              </span>
              {hasTagFilter && (
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-ta text-[10px] text-white flex items-center justify-center font-medium md:hidden">
                  {selectedTagIds.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-64 p-0 bg-background/95 backdrop-blur-xl border-border"
            align="end"
          >
            <div className="py-2">
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-xs font-medium text-muted-foreground">Filtrar por etiqueta</span>
                {hasTagFilter && (
                  <button
                    onClick={() => onSelectedTagsChange([])}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Limpiar
                  </button>
                )}
              </div>
              <div className="px-2 py-1 flex flex-wrap gap-1.5">
                {availableTags.map(tag => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all",
                        isSelected && "shadow-sm"
                      )}
                      style={isSelected ? getTagStyleActive(tag.color) : getTagStyle(tag.color)}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 h-10 w-10 md:w-auto md:h-10 text-sm md:text-sm md:px-4 shrink-0">
            <ArrowUpDown className="h-4 w-4" />
            <span className="hidden md:inline">{sortLabel}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={`${sortField}-${sortOrder}`}
            onValueChange={(value) => {
              const [field, order] = value.split("-") as [SortField, SortOrder];
              onSortChange(field, order);
            }}
          >
            <DropdownMenuRadioItem value="importance-desc">
              <SortDesc className="mr-2 h-4 w-4" />
              Más importante primero
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="importance-asc">
              <SortAsc className="mr-2 h-4 w-4" />
              Menos importante primero
            </DropdownMenuRadioItem>
            <DropdownMenuSeparator />
            <DropdownMenuRadioItem value="createdAt-desc">
              <SortDesc className="mr-2 h-4 w-4" />
              Más reciente primero
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="createdAt-asc">
              <SortAsc className="mr-2 h-4 w-4" />
              Más antiguo primero
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
