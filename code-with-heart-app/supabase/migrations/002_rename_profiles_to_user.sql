-- Rename profiles table to user
ALTER TABLE profiles RENAME TO "user";

-- Rename indexes
ALTER INDEX idx_profiles_full_name RENAME TO idx_user_full_name;
ALTER INDEX idx_profiles_email RENAME TO idx_user_email;
ALTER INDEX idx_profiles_user_type RENAME TO idx_user_user_type;
ALTER INDEX idx_profiles_full_name_search RENAME TO idx_user_full_name_search;

-- Rename trigger
ALTER TRIGGER update_profiles_updated_at ON "user" RENAME TO update_user_updated_at;

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view all profiles" ON "user";
DROP POLICY IF EXISTS "Users can insert their own profile" ON "user";
DROP POLICY IF EXISTS "Users can update their own profile" ON "user";

-- Create new RLS policies with updated names
CREATE POLICY "Users can view all users"
  ON "user"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own user record"
  ON "user"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own user record"
  ON "user"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Update comments
COMMENT ON TABLE "user" IS 'User records for HTWG community members';
COMMENT ON COLUMN "user".id IS 'UUID matching auth.users.id';
COMMENT ON COLUMN "user".full_name IS 'Full name of the user';
COMMENT ON COLUMN "user".email IS 'Email address (must be unique)';
COMMENT ON COLUMN "user".user_type IS 'Type of user: Student, Professor, HTWG Employee, or Lecturer';
COMMENT ON COLUMN "user".created_at IS 'Timestamp when user record was created';
COMMENT ON COLUMN "user".updated_at IS 'Timestamp when user record was last updated';
