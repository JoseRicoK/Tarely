-- Add locale column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'es' CHECK (locale IN ('es', 'en'));

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_locale ON users(locale);

-- Update existing users to 'es' if null
UPDATE users SET locale = 'es' WHERE locale IS NULL;

COMMENT ON COLUMN users.locale IS 'User preferred language: es (Spanish) or en (English)';
