-- Allow anonymous users to view all users (for development/testing)
-- This enables the user selector to work without authentication
CREATE POLICY "Allow anonymous users to view all users"
  ON "user"
  FOR SELECT
  TO anon
  USING (true);
