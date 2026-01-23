/**
 * Cliente de Supabase para el lado del cliente (browser)
 * 
 * Usa el Supabase App Framework con las variables públicas:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';
import { getSupabaseEnvOrThrow } from './env';

export function createClient() {
  const { url, key } = getSupabaseEnvOrThrow();
  return createBrowserClient<Database>(url, key);
}
