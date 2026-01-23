/**
 * Configuración centralizada de las variables de entorno de Supabase
 * 
 * Acepta tanto NEXT_PUBLIC_SUPABASE_ANON_KEY como NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 * para mayor compatibilidad con diferentes configuraciones de Supabase/Vercel.
 */

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  
  return { url, key };
}

export function getSupabaseEnvOrThrow() {
  const { url, key } = getSupabaseEnv();
  
  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. Required: NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
    );
  }
  
  return { url, key };
}
