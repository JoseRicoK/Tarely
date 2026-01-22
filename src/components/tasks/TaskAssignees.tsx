"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, UserPlus, X, Crown, Users } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Assignee {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  assignedAt: string;
}

interface Member {
  user_id: string;
  name: string;
  avatar: string;
  role: string;
}

interface TaskAssigneesProps {
  taskId: string;
  workspaceId: string;
  assignees: Assignee[];
  onAssigneesChange: (assignees: Assignee[]) => void;
  compact?: boolean;
}

export function TaskAssignees({
  taskId,
  workspaceId,
  assignees,
  onAssigneesChange,
  compact = false,
}: TaskAssigneesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen, workspaceId]);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/assignable-members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch {
      toast.error("Error al cargar miembros");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async (userId: string) => {
    setAssigningUserId(userId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/assignees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      // Obtener datos actualizados
      const assigneesRes = await fetch(`/api/tasks/${taskId}/assignees`);
      if (assigneesRes.ok) {
        const data = await assigneesRes.json();
        onAssigneesChange(data.map((a: { id: string; user_id: string; name: string; avatar: string; assigned_at: string }) => ({
          id: a.id,
          userId: a.user_id,
          name: a.name,
          avatar: a.avatar,
          assignedAt: a.assigned_at,
        })));
      }

      toast.success("Usuario asignado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al asignar");
    } finally {
      setAssigningUserId(null);
    }
  };

  const handleRemove = async (userId: string) => {
    setRemovingUserId(userId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/assignees?userId=${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Error al desasignar");
      }

      onAssigneesChange(assignees.filter((a) => a.userId !== userId));
      toast.success("Usuario desasignado");
    } catch {
      toast.error("Error al desasignar usuario");
    } finally {
      setRemovingUserId(null);
    }
  };

  // Miembros que no están asignados
  const availableMembers = members.filter(
    (m) => !assignees.some((a) => a.userId === m.user_id)
  );

  if (compact) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2 gap-1 text-xs",
              assignees.length > 0 && "text-purple-400"
            )}
          >
            {assignees.length > 0 ? (
              <div className="flex -space-x-2">
                <TooltipProvider>
                  {assignees.slice(0, 3).map((assignee) => (
                    <Tooltip key={assignee.id}>
                      <TooltipTrigger asChild>
                        <div
                          className="relative w-5 h-5 rounded-full overflow-hidden border-2 border-background cursor-pointer"
                        >
                          <Image
                            src={`${supabaseUrl}/storage/v1/object/public/avatars/${assignee.avatar}`}
                            alt={assignee.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{assignee.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
                {assignees.length > 3 && (
                  <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[10px] text-white border-2 border-background">
                    +{assignees.length - 3}
                  </div>
                )}
              </div>
            ) : (
              <>
                <UserPlus className="h-3.5 w-3.5" />
                <span>Asignar</span>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0 bg-background/95 backdrop-blur-xl border-white/10" align="start">
          <AssigneePopoverContent
            assignees={assignees}
            availableMembers={availableMembers}
            isLoading={isLoading}
            assigningUserId={assigningUserId}
            removingUserId={removingUserId}
            supabaseUrl={supabaseUrl || ""}
            onAssign={handleAssign}
            onRemove={handleRemove}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Asignados
        </label>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              Añadir
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0 bg-background/95 backdrop-blur-xl border-white/10" align="end">
            <AssigneePopoverContent
              assignees={assignees}
              availableMembers={availableMembers}
              isLoading={isLoading}
              assigningUserId={assigningUserId}
              removingUserId={removingUserId}
              supabaseUrl={supabaseUrl || ""}
              onAssign={handleAssign}
              onRemove={handleRemove}
            />
          </PopoverContent>
        </Popover>
      </div>

      {assignees.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {assignees.map((assignee) => (
            <Badge
              key={assignee.id}
              variant="secondary"
              className="pl-1 pr-2 py-1 gap-2 bg-white/5 hover:bg-white/10"
            >
              <div className="relative w-5 h-5 rounded-full overflow-hidden">
                <Image
                  src={`${supabaseUrl}/storage/v1/object/public/avatars/${assignee.avatar}`}
                  alt={assignee.name}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-xs">{assignee.name}</span>
              <button
                onClick={() => handleRemove(assignee.userId)}
                disabled={removingUserId === assignee.userId}
                className="ml-1 hover:text-red-400 transition-colors"
              >
                {removingUserId === assignee.userId ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Sin asignar</p>
      )}
    </div>
  );
}

interface AssigneePopoverContentProps {
  assignees: Assignee[];
  availableMembers: Member[];
  isLoading: boolean;
  assigningUserId: string | null;
  removingUserId: string | null;
  supabaseUrl: string;
  onAssign: (userId: string) => void;
  onRemove: (userId: string) => void;
}

function AssigneePopoverContent({
  assignees,
  availableMembers,
  isLoading,
  assigningUserId,
  removingUserId,
  supabaseUrl,
  onAssign,
  onRemove,
}: AssigneePopoverContentProps) {
  return (
    <div className="py-2">
      {/* Asignados actuales */}
      {assignees.length > 0 && (
        <>
          <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
            Asignados
          </div>
          <ScrollArea className="max-h-32">
            {assignees.map((assignee) => (
              <div
                key={assignee.id}
                className="flex items-center justify-between px-3 py-2 hover:bg-white/5"
              >
                <div className="flex items-center gap-2">
                  <div className="relative w-6 h-6 rounded-full overflow-hidden">
                    <Image
                      src={`${supabaseUrl}/storage/v1/object/public/avatars/${assignee.avatar}`}
                      alt={assignee.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-sm">{assignee.name}</span>
                </div>
                <button
                  onClick={() => onRemove(assignee.userId)}
                  disabled={removingUserId === assignee.userId}
                  className="text-muted-foreground hover:text-red-400 transition-colors"
                >
                  {removingUserId === assignee.userId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </ScrollArea>
          <div className="border-t border-white/10 my-1" />
        </>
      )}

      {/* Miembros disponibles */}
      <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
        {assignees.length > 0 ? "Añadir" : "Asignar a"}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : availableMembers.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          {assignees.length > 0
            ? "Todos los miembros están asignados"
            : "No hay miembros disponibles"}
        </p>
      ) : (
        <ScrollArea className="max-h-40">
          {availableMembers.map((member) => (
            <button
              key={member.user_id}
              onClick={() => onAssign(member.user_id)}
              disabled={assigningUserId === member.user_id}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <div className="relative w-6 h-6 rounded-full overflow-hidden">
                  <Image
                    src={`${supabaseUrl}/storage/v1/object/public/avatars/${member.avatar}`}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-sm">{member.name}</span>
                {member.role === "owner" && (
                  <Crown className="h-3 w-3 text-yellow-500" />
                )}
              </div>
              {assigningUserId === member.user_id ? (
                <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
              ) : (
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ))}
        </ScrollArea>
      )}
    </div>
  );
}
