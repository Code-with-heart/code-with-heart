-- Add OIDC subject mapping for NextAuth logins
ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS oidc_sub TEXT;

-- Ensure internal IDs are generated without Supabase Auth
ALTER TABLE "user"
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Drop Supabase Auth foreign key if it exists
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS user_id_fkey;

-- Unique index for OIDC subject mapping
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_oidc_sub ON "user"(oidc_sub);

COMMENT ON COLUMN "user".oidc_sub IS 'OIDC subject identifier for HTWG IdP';
