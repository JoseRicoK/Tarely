"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "./UserContext";

export function UserMenu() {
  const router = useRouter();
  const { profile, isLoading, clearProfile } = useUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("Sesión cerrada");
      clearProfile(); // Actualizar inmediatamente el estado
      router.push("/login");
    } catch {
      toast.error("Error al cerrar sesión");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (!profile) {
    return (
      <Link href="/login">
        <Button variant="outline" size="sm">
          Iniciar Sesión
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500/50 hover:border-purple-400 transition-colors">
            <Image
              src={`${supabaseUrl}/storage/v1/object/public/avatars/${profile.avatar}`}
              alt={profile.name}
              fill
              sizes="40px"
              className="object-cover object-center"
              style={{ objectFit: 'cover' }}
            />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {profile.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/perfil" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Ajustes</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          {isLoggingOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
