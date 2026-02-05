-- Tabla para registros pendientes de confirmación
CREATE TABLE IF NOT EXISTS pending_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  avatar TEXT,
  confirmation_token TEXT UNIQUE NOT NULL,
  confirmation_token_expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda rápida por token
CREATE INDEX IF NOT EXISTS idx_pending_registrations_token 
ON pending_registrations(confirmation_token);

-- Índice para búsqueda por email
CREATE INDEX IF NOT EXISTS idx_pending_registrations_email 
ON pending_registrations(email);

-- Habilitar RLS
ALTER TABLE pending_registrations ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas anteriores si existen
DROP POLICY IF EXISTS "Permitir registro pendiente a anónimos" ON pending_registrations;
DROP POLICY IF EXISTS "Permitir lectura con token válido" ON pending_registrations;

-- Crear políticas nuevas
CREATE POLICY "Permitir registro pendiente a anónimos"
ON pending_registrations
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Permitir lectura con token válido"
ON pending_registrations
FOR SELECT
TO anon
USING (confirmation_token_expires > NOW());
