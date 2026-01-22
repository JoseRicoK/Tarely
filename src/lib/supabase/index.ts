/**
 * Exportaciones centralizadas de Supabase
 */

// Tipos
export * from './types';

// Nota: Los clientes se importan directamente desde sus archivos
// para evitar problemas con el bundler:
// - import { createClient } from '@/lib/supabase/server' (en server components)
// - import { createClient } from '@/lib/supabase/client' (en client components)
