"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Search, UserPlus, Users, Crown, X, Check } from "lucide-react";
import Image from "next/image";
import { getAvatarUrl } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string;
  role: "owner" | "member";
  status: "pending" | "accepted" | "rejected";
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceName: string;
}

export function ShareDialog({
  open,
  onOpenChange,
  workspaceId,
  workspaceName,
}: ShareDialogProps) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembersData = async () => {
      setIsLoadingMembers(true);
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/members`);
        if (res.ok) {
          const data = await res.json();
          setMembers(data);
        }
      } catch {
        toast.error("Error al cargar miembros");
      } finally {
        setIsLoadingMembers(false);
      }
    };

    if (open) {
      fetchMembersData();
    }
  }, [open, workspaceId]);

  useEffect(() => {
    const fetchUsersData = async () => {
      setIsLoadingUsers(true);
      try {
        const res = await fetch(
          `/api/users?search=${encodeURIComponent(search)}&excludeWorkspace=${workspaceId}`
        );
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch {
        toast.error("Error al buscar usuarios");
      } finally {
        setIsLoadingUsers(false);
      }
    };

    if (open && search.length >= 2) {
      const timer = setTimeout(() => {
        fetchUsersData();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setUsers([]);
    }
  }, [search, open, workspaceId]);

  const fetchMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch {
      toast.error("Error al cargar miembros");
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleInvite = async (userId: string) => {
    setInvitingUserId(userId);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      toast.success("Invitación enviada");
      setUsers(users.filter((u) => u.id !== userId));
      fetchMembers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al enviar invitación"
      );
    } finally {
      setInvitingUserId(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setRemovingMemberId(memberId);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/members?memberId=${memberId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        throw new Error("Error al eliminar miembro");
      }

      toast.success("Miembro eliminado");
      fetchMembers();
    } catch {
      toast.error("Error al eliminar miembro");
    } finally {
      setRemovingMemberId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-background/95 backdrop-blur-xl border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-ta-light" />
            Compartir &quot;{workspaceName}&quot;
          </DialogTitle>
          <DialogDescription>
            Invita a otros usuarios a colaborar en este workspace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Buscar usuarios */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Invitar usuarios</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-foreground/5 border-border"
              />
            </div>

            {/* Lista de usuarios encontrados */}
            {search.length >= 2 && (
              <div className="rounded-lg border border-border bg-foreground/5 overflow-hidden">
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No se encontraron usuarios
                  </p>
                ) : (
                  <ScrollArea className="max-h-40">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 hover:bg-foreground/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden">
                            <Image
                              src={getAvatarUrl(user.avatar, user.id)}
                              alt={user.name}
                              fill
                              sizes="32px"
                              className="object-cover object-center"
                              style={{ objectFit: 'cover' }}
                              unoptimized
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleInvite(user.id)}
                          disabled={invitingUserId === user.id}
                          className="bg-ta hover:bg-ta-hover text-white border-0"
                        >
                          {invitingUserId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-1 text-white" />
                              <span className="text-white font-medium">Invitar</span>
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </ScrollArea>
                )}
              </div>
            )}
          </div>

          {/* Miembros actuales */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Miembros ({members.length})
            </Label>
            <div className="rounded-lg border border-border bg-foreground/5 overflow-hidden">
              {isLoadingMembers ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="max-h-60">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 hover:bg-foreground/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden">
                          <Image
                            src={getAvatarUrl(member.avatar, member.userId)}
                            alt={member.name}
                            fill
                            sizes="32px"
                            className="object-cover object-center"
                            style={{ objectFit: 'cover' }}
                            unoptimized
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{member.name}</p>
                            {member.role === "owner" && (
                              <Crown className="h-3 w-3 text-yellow-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.status === "pending" ? (
                          <Badge variant="outline" className="text-yellow-400 border-yellow-400/50">
                            Pendiente
                          </Badge>
                        ) : member.status === "accepted" ? (
                          <Badge variant="outline" className="text-green-400 border-green-400/50">
                            <Check className="h-3 w-3 mr-1" />
                            Activo
                          </Badge>
                        ) : null}
                        {member.role !== "owner" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={removingMemberId === member.id}
                            className="h-8 w-8 text-muted-foreground hover:text-red-400"
                          >
                            {removingMemberId === member.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
