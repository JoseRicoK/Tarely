/**
 * Cliente de Supabase para el lado del servidor (Server Components, API Routes, etc.)
 * 
 * Usa el Supabase App Framework con las variables públicas:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';
import { getSupabaseEnvOrThrow } from './env';

// Tipo para el cookieStore
type CookieStore = Awaited<ReturnType<typeof cookies>>;

export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseEnvOrThrow();

  return createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // El método setAll es llamado desde un Server Component.
            // Esto puede ser ignorado si hay middleware refrescando las sesiones.
          }
        },
      },
    }
  );
}

/**
 * Crea un cliente de Supabase usando un cookieStore ya obtenido.
 * Útil en API routes donde ya tienes el cookieStore.
 */
export function createClientWithCookies(cookieStore: CookieStore) {
  const { url, key } = getSupabaseEnvOrThrow();

  return createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored for Server Components
          }
        },
      },
    }
  );
}
