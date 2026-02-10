import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Genera la URL completa para un avatar (predefinido o personalizado)
 * @param avatar - Nombre del archivo de avatar (ej: "avatar1.png" o "uuid/avatar.webp")
 * @param version - Versión del avatar para cache busting (solo para avatares personalizados)
 * @returns URL completa del avatar en Supabase Storage
 */
export function getAvatarUrl(avatar: string, version?: number): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const baseUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${avatar}`;
  
  // Si es un avatar personalizado (contiene "/"), agregar version para cache busting
  if (avatar.includes('/') && version) {
    return `${baseUrl}?v=${version}`;
  }
  
  return baseUrl;
}

/**
 * Genera la URL completa para una imagen del changelog
 * @param imagePath - Path de la imagen en el bucket changelog (ej: "1707123456.webp")
 * @returns URL completa de la imagen en Supabase Storage
 */
export function getChangelogImageUrl(imagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/changelog/${imagePath}`;
}
