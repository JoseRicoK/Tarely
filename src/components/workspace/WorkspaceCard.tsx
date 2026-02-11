"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Pencil, Trash2, Users, Clock, CheckCircle2 } from "lucide-react";
import { getIconComponent } from "@/components/ui/icon-color-picker";
import type { Workspace } from "@/lib/types";

interface WorkspaceCardProps {
  workspace: Workspace;
  onEdit: (workspace: Workspace) => void;
  onDelete: (workspace: Workspace) => void;
}

export function WorkspaceCard({
  workspace,
  onEdit,
  onDelete,
}: WorkspaceCardProps) {
  const router = useRouter();
  const timeAgo = formatDistanceToNow(new Date(workspace.updatedAt), {
    addSuffix: true,
    locale: es,
  });

  const WorkspaceIcon = getIconComponent(workspace.icon || "Folder");
  const workspaceColor = workspace.color || "#6366f1";

  const handleCardClick = (e: React.MouseEvent) => {
    // No navegar si se hizo clic en el menú
    if ((e.target as HTMLElement).closest('[data-menu]')) {
      return;
    }
    router.push(`/workspace/${workspace.id}`);
  };

  return (
    <Card 
      className="group relative flex flex-col gap-2 xl:gap-6 py-3 xl:py-6 transition-all duration-200 hover:shadow-xl hover:shadow-ta/10 hover:border-ta/30 cursor-pointer overflow-hidden"
      onClick={handleCardClick}
    >
      {/* Barra superior de color */}
      <div 
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: workspaceColor }}
      />

      {/* Badge de compartido */}
      {workspace.isShared && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge className="bg-ta hover:bg-ta-hover text-white shadow-lg">
            <Users className="h-3 w-3 mr-1" />
            Compartido
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-2 pt-3 xl:pt-4">
        <div className="flex items-center justify-between gap-3">
          {/* Icono */}
          <div 
            className="flex-shrink-0 h-9 w-9 xl:h-10 xl:w-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
            style={{ 
              backgroundColor: `${workspaceColor}20`,
              color: workspaceColor 
            }}
          >
            <WorkspaceIcon className="h-4 w-4 xl:h-5 xl:w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight line-clamp-1">
              {workspace.name}
            </CardTitle>
            {workspace.isShared && workspace.ownerName && (
              <p className="text-xs text-ta-light mt-1">
                por {workspace.ownerName}
              </p>
            )}
          </div>
          
          {/* Solo mostrar menu de opciones si NO es compartido */}
          {!workspace.isShared && (
            <div data-menu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Opciones</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(workspace); }}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onDelete(workspace); }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        {workspace.description && (
          <CardDescription className="line-clamp-2 mt-2">
            {workspace.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center gap-2">
          <div 
            className="flex-shrink-0 h-7 w-7 xl:h-8 xl:w-8 rounded-md flex items-center justify-center"
            style={{ 
              backgroundColor: `${workspaceColor}10`,
              color: workspaceColor 
            }}
          >
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <div className="text-base xl:text-lg font-semibold" style={{ color: workspaceColor }}>
              {workspace.pendingTasksCount ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">
              {workspace.pendingTasksCount === 1 ? "tarea pendiente" : "tareas pendientes"}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Actualizado {timeAgo}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
