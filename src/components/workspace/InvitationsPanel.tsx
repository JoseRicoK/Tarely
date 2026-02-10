"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Mail, Check, X, FolderOpen } from "lucide-react";
import Image from "next/image";

interface Invitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  workspaceColor: string;
  invitedBy: {
    name: string;
    avatar: string;
  };
  createdAt: string;
}

export function InvitationsPanel() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const res = await fetch("/api/invitations");
      if (res.ok) {
        const data = await res.json();
        setInvitations(data);
      }
    } catch {
      toast.error("Error al cargar invitaciones");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (invitationId: string, accept: boolean) => {
    setRespondingId(invitationId);
    try {
      const res = await fetch("/api/invitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, accept }),
      });

      if (!res.ok) {
        throw new Error("Error al responder");
      }

      toast.success(accept ? "Invitación aceptada" : "Invitación rechazada");
      setInvitations(invitations.filter((i) => i.id !== invitationId));
    } catch {
      toast.error("Error al responder a la invitación");
    } finally {
      setRespondingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-foreground/5 border-border">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-foreground/5 border-border backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mail className="h-5 w-5 text-ta-light" />
          Invitaciones pendientes
          {invitations.length > 0 && (
            <Badge className="bg-ta ml-2">{invitations.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Workspaces a los que te han invitado a colaborar
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <div className="text-center py-6">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No tienes invitaciones pendientes
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 rounded-lg bg-foreground/5 border border-border hover:bg-foreground/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Workspace icon */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: invitation.workspaceColor + "30" }}
                  >
                    <FolderOpen
                      className="h-6 w-6"
                      style={{ color: invitation.workspaceColor }}
                    />
                  </div>

                  <div>
                    <p className="font-medium">{invitation.workspaceName}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Invitado por</span>
                      <div className="flex items-center gap-1">
                        <div className="relative w-4 h-4 rounded-full overflow-hidden">
                          <Image
                            src={`${supabaseUrl}/storage/v1/object/public/avatars/${invitation.invitedBy.avatar}`}
                            alt={invitation.invitedBy.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="font-medium text-foreground/80">
                          {invitation.invitedBy.name}
                        </span>
                      </div>
                      <span>•</span>
                      <span>{formatDate(invitation.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRespond(invitation.id, false)}
                    disabled={respondingId === invitation.id}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                  >
                    {respondingId === invitation.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Rechazar
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleRespond(invitation.id, true)}
                    disabled={respondingId === invitation.id}
                    className="bg-green-600 hover:bg-green-500"
                  >
                    {respondingId === invitation.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Aceptar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
