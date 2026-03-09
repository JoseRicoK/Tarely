"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Loader2, CheckCircle2, AlertCircle, Link2, Link2Off, Info } from "lucide-react";
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
  const [showDetails, setShowDetails] = useState(false);

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
    <div className="relative group h-full">
      <div className="absolute -inset-0.5 bg-linear-to-r from-ta via-ta-secondary to-ta rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
      <div className="relative bg-background/60 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-xl h-full flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="h-5 w-5 text-ta-light" />
          <h2 className="font-semibold">Google Calendar</h2>
          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />}
          {!isLoading && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Más información"
            >
              <Info className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {status?.connected ? 'Conectado' : 'Sincroniza tareas con tu calendario'}
        </p>
        
        <div className="space-y-4 flex-1 flex flex-col">
        {!isLoading && status?.connected ? (
          <>
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

            {showDetails && (
              <div className="space-y-3 animate-in fade-in duration-200">
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
                  <p className="text-sm font-medium">¿Qué está sincronizado?</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Tareas con fecha y hora se crean automáticamente</li>
                    <li>Bloques ocupados visibles para evitar conflictos</li>
                    <li>Cambios se actualizan automáticamente</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="mt-auto pt-4 border-t">
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
                    Desconectar
                  </>
                )}
              </Button>
            </div>
          </>
        ) : !isLoading && (
          <>
            {showDetails && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <p className="text-sm font-medium">Beneficios:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Visualiza tareas y eventos en un solo lugar</li>
                  <li>Detecta conflictos de horarios automáticamente</li>
                  <li>Sincronización bidireccional</li>
                  <li>Ve bloques ocupados sin compartir detalles</li>
                </ul>
              </div>
            )}

            <div className="mt-auto pt-4 border-t">
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
                    Conectar
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Serás redirigido a Google
              </p>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
