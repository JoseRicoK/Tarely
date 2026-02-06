-- Agregar columna para rastrear si el usuario ya vio el onboarding
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS has_seen_onboarding BOOLEAN DEFAULT FALSE;

-- Establecer como TRUE para usuarios existentes (para que no les salga)
UPDATE profiles 
SET has_seen_onboarding = TRUE 
WHERE has_seen_onboarding IS NULL OR has_seen_onboarding = FALSE;
