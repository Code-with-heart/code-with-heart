-- Create faculty table
CREATE TABLE faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  abbreviation TEXT NOT NULL UNIQUE,
  description TEXT,
  website_url TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_faculty_name ON faculty(name);
CREATE INDEX idx_faculty_abbreviation ON faculty(abbreviation);

-- Add updated_at trigger
CREATE TRIGGER update_faculty_updated_at
  BEFORE UPDATE ON faculty
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view faculties
CREATE POLICY "Anyone can view faculties"
  ON faculty
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Comments
COMMENT ON TABLE faculty IS 'Academic faculties at HTWG Konstanz';
COMMENT ON COLUMN faculty.name IS 'Full name of the faculty';
COMMENT ON COLUMN faculty.abbreviation IS '3-letter abbreviation code';
COMMENT ON COLUMN faculty.description IS 'Longer description of the faculty';
COMMENT ON COLUMN faculty.website_url IS 'URL to faculty website';
COMMENT ON COLUMN faculty.color IS 'Hex color code for UI display';

-- Add faculty_id to user table
ALTER TABLE "user"
ADD COLUMN faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL;

-- Create index for efficient faculty filtering
CREATE INDEX idx_user_faculty_id ON "user"(faculty_id);

-- Update comment
COMMENT ON COLUMN "user".faculty_id IS 'Reference to user''s faculty';
