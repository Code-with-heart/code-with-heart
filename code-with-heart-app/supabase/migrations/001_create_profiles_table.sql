-- Create enum for user types
CREATE TYPE user_type AS ENUM ('Student', 'Professor', 'HTWG Employee', 'Lecturer');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  user_type user_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient searching
CREATE INDEX idx_profiles_full_name ON profiles(full_name);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_profiles_full_name_search ON profiles USING gin(to_tsvector('english', full_name));

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on row updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Users can view all profiles (needed for the user selector)
CREATE POLICY "Users can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users cannot delete their own profile (admin-only operation)
-- No delete policy means only service role can delete

-- Comments for documentation
COMMENT ON TABLE profiles IS 'User profiles for HTWG community members';
COMMENT ON COLUMN profiles.id IS 'UUID matching auth.users.id';
COMMENT ON COLUMN profiles.full_name IS 'Full name of the user';
COMMENT ON COLUMN profiles.email IS 'Email address (must be unique)';
COMMENT ON COLUMN profiles.user_type IS 'Type of user: Student, Professor, HTWG Employee, or Lecturer';
COMMENT ON COLUMN profiles.created_at IS 'Timestamp when profile was created';
COMMENT ON COLUMN profiles.updated_at IS 'Timestamp when profile was last updated';
