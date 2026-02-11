import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Genera la URL de DiceBear identicon para un seed dado
 * @param seed - Texto usado como seed para generar avatar determinista
 * @returns URL del avatar generado por DiceBear
 */
export function getDiceBearUrl(seed: string): string {
  const params = new URLSearchParams({
    seed,
    backgroundType: "gradientLinear",
    backgroundColor: "b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf",
  });
  return `https://api.dicebear.com/7.x/identicon/svg?${params.toString()}`;
}

/**
 * Genera un seed aleatorio para DiceBear
 * @returns String aleatorio para usar como seed
 */
export function generateRandomAvatarSeed(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

/**
 * Genera la URL completa para un avatar.
 * - Si el avatar contiene "/" → es una foto subida en Supabase Storage.
 * - Si el avatar es un string sin "/" → es un seed de DiceBear elegido por el usuario.
 * - Si el avatar es null/undefined → DiceBear con userId como seed por defecto.
 * @param avatar - Valor del campo avatar en la DB (ej: "uuid/avatar.webp", "abc123seed", o null)
 * @param userId - UUID del usuario (fallback para generar DiceBear)
 * @param version - Versión del avatar para cache busting (solo para avatares personalizados)
 * @returns URL completa del avatar
 */
export function getAvatarUrl(avatar: string | null | undefined, userId: string, version?: number): string {
  // Si tiene avatar personalizado (contiene "/"), es una foto subida en Storage
  if (avatar && avatar.includes('/')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const baseUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${avatar}`;
    return version ? `${baseUrl}?v=${version}` : baseUrl;
  }
  
  // Si tiene un seed de DiceBear guardado, usarlo; si no, usar userId
  const seed = avatar || userId;
  return getDiceBearUrl(seed);
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
