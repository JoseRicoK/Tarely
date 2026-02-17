"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Loader2, CheckCircle2, AlertCircle, Link2, Link2Off } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface GoogleCalendarStatus {
  connected: boolean;
  tokenExpiry?: string;
  isExpired?: boolean;
  connectedSince?: string;
}

export function GoogleCalendarSettings() {
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      setIsLoading(true);
      const res = await fetch('/api/google-calendar/status');
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error('Error checking Google Calendar status:', error);
      toast.error('Error al verificar conexión con Google Calendar');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConnect() {
    try {
      setIsConnecting(true);
      const res = await fetch('/api/google-calendar/auth');
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No auth URL received');
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      toast.error('Error al conectar con Google Calendar');
      setIsConnecting(false);
    }
  }

  async function handleDisconnect() {
    try {
      setIsDisconnecting(true);
      const res = await fetch('/api/google-calendar/disconnect', {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to disconnect');
      }

      toast.success('Google Calendar desconectado correctamente');
      setStatus({ connected: false });
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      toast.error('Error al desconectar Google Calendar');
    } finally {
      setIsDisconnecting(false);
    }
  }

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-linear-to-r from-ta via-ta-secondary to-ta rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
      <div className="relative bg-background/60 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="h-5 w-5 text-ta-light" />
          <h2 className="font-semibold">Google Calendar</h2>
          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />}
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          {status?.connected
            ? 'Tu cuenta de Google Calendar está conectada'
            : 'Conecta tu cuenta de Google Calendar para sincronizar tareas y ver tu disponibilidad'}
        </p>
        
        <div className="space-y-4">
        {!isLoading && status?.connected ? (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Conectado
                </Badge>
                {status.isExpired && (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Token expirado
                  </Badge>
                )}
              </div>

              {status.connectedSince && (
                <div className="text-sm text-muted-foreground">
                  Conectado desde: {format(new Date(status.connectedSince), "PPP", { locale: es })}
                </div>
              )}

              {status.tokenExpiry && !status.isExpired && (
                <div className="text-sm text-muted-foreground">
                  Token válido hasta: {format(new Date(status.tokenExpiry), "PPP 'a las' p", { locale: es })}
                </div>
              )}

              <div className="pt-2 space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>¿Qué está sincronizado?</strong>
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Tareas con fecha y hora se crean automáticamente en Google Calendar</li>
                  <li>Puedes ver bloques ocupados de tu calendario para evitar conflictos</li>
                  <li>Los cambios en las tareas se actualizan automáticamente</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="w-full"
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Desconectando...
                  </>
                ) : (
                  <>
                    <Link2Off className="h-4 w-4 mr-2" />
                    Desconectar Google Calendar
                  </>
                )}
              </Button>
            </div>
          </>
        ) : !isLoading && (
          <>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Beneficios de conectar Google Calendar:</strong>
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Visualiza tus tareas y eventos de Google en un solo lugar</li>
                <li>Detecta automáticamente conflictos de horarios al asignar fechas</li>
                <li>Sincronización bidireccional: tareas ↔ Google Calendar</li>
                <li>Ve bloques ocupados sin compartir detalles privados</li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    Conectar Google Calendar
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Serás redirigido a Google para autorizar el acceso
              </p>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
