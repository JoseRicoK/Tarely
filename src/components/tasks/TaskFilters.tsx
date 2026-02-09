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
import { Search, ArrowUpDown, SortAsc, SortDesc } from "lucide-react";

export type SortField = "importance" | "createdAt";
export type SortOrder = "asc" | "desc";

interface TaskFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField, order: SortOrder) => void;
}

export function TaskFilters({
  searchQuery,
  onSearchChange,
  sortField,
  sortOrder,
  onSortChange,
}: TaskFiltersProps) {
  const sortLabel =
    sortField === "importance"
      ? sortOrder === "desc"
        ? "Más importante primero"
        : "Menos importante primero"
      : sortOrder === "desc"
      ? "Más reciente primero"
      : "Más antiguo primero";

  return (
    <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar tareas..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 md:h-10 text-sm"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 h-9 md:h-10 text-xs md:text-sm">
            <ArrowUpDown className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">{sortLabel}</span>
            <span className="sm:hidden">Ordenar</span>
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
