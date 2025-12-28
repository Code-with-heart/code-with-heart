-- Create enum for feedback status
DO $$ BEGIN
  CREATE TYPE feedback_status AS ENUM (
    'draft',              -- Initial state after creation
    'pending_review',     -- Awaiting AI review
    'ai_flagged',         -- AI detected inappropriate content
    'ai_modified',        -- AI suggested modifications
    'pending_approval',   -- User needs to approve AI changes
    'approved',           -- User approved, ready to send
    'delivered',          -- Delivered to recipient
    'published'           -- Recipient made it public
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  modified_text TEXT,
  status feedback_status NOT NULL DEFAULT 'draft',
  ai_feedback TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  delivered_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT different_sender_recipient CHECK (sender_id != recipient_id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_feedback_sender ON feedback(sender_id);
CREATE INDEX IF NOT EXISTS idx_feedback_recipient ON feedback(recipient_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_published ON feedback(is_published) WHERE is_published = true;

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS update_feedback_updated_at ON feedback;
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Users can view feedback they sent
DROP POLICY IF EXISTS "Users can view feedback they sent" ON feedback;
CREATE POLICY "Users can view feedback they sent"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid());

-- Policy: Users can view feedback they received
DROP POLICY IF EXISTS "Users can view feedback they received" ON feedback;
CREATE POLICY "Users can view feedback they received"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

-- Policy: Anyone can view published feedback
DROP POLICY IF EXISTS "Anyone can view published feedback" ON feedback;
CREATE POLICY "Anyone can view published feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Policy: Users can insert their own feedback
DROP POLICY IF EXISTS "Users can insert their own feedback" ON feedback;
CREATE POLICY "Users can insert their own feedback"
  ON feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Policy: Users can update feedback they sent (before delivery)
DROP POLICY IF EXISTS "Users can update their own feedback" ON feedback;
CREATE POLICY "Users can update their own feedback"
  ON feedback
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid() AND status NOT IN ('delivered', 'published'))
  WITH CHECK (sender_id = auth.uid());

-- Policy: Recipients can update published status
DROP POLICY IF EXISTS "Recipients can update published status" ON feedback;
CREATE POLICY "Recipients can update published status"
  ON feedback
  FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid() AND status = 'delivered')
  WITH CHECK (recipient_id = auth.uid());

-- Policy: Only allow anonymous read of published feedback
DROP POLICY IF EXISTS "Anonymous users can view published feedback" ON feedback;
CREATE POLICY "Anonymous users can view published feedback"
  ON feedback
  FOR SELECT
  TO anon
  USING (is_published = true);

-- Comments for documentation
COMMENT ON TABLE feedback IS 'Feedback submissions between users';
COMMENT ON COLUMN feedback.id IS 'Unique identifier for the feedback';
COMMENT ON COLUMN feedback.sender_id IS 'User who created the feedback';
COMMENT ON COLUMN feedback.recipient_id IS 'User who will receive the feedback';
COMMENT ON COLUMN feedback.original_text IS 'Original feedback text as written by sender';
COMMENT ON COLUMN feedback.modified_text IS 'AI-modified version of the feedback (if applicable)';
COMMENT ON COLUMN feedback.status IS 'Current status in the feedback workflow';
COMMENT ON COLUMN feedback.ai_feedback IS 'AI analysis or suggestions';
COMMENT ON COLUMN feedback.is_published IS 'Whether the recipient made this feedback public';
COMMENT ON COLUMN feedback.created_at IS 'When the feedback was created';
COMMENT ON COLUMN feedback.updated_at IS 'When the feedback was last updated';
COMMENT ON COLUMN feedback.delivered_at IS 'When the feedback was delivered to recipient';
COMMENT ON COLUMN feedback.published_at IS 'When the feedback was made public';
