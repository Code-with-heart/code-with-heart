-- Allow anonymous users to view all users (for development/testing)
-- This enables the user selector to work without authentication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user'
    AND policyname = 'Allow anonymous users to view all users'
  ) THEN
    CREATE POLICY "Allow anonymous users to view all users"
      ON "user"
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;
