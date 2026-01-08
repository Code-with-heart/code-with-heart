-- Migration to remove 'draft' status from feedback workflow
-- Since there will be no draft functionality, feedback goes directly to 'pending_review' state

-- Update any existing 'draft' feedback to 'pending_review'
UPDATE feedback SET status = 'pending_review' WHERE status = 'draft';

-- Drop ALL policies that depend on the status column
DROP POLICY IF EXISTS "Users can update their own feedback" ON feedback;
DROP POLICY IF EXISTS "Recipients can update published status" ON feedback;

-- Drop ALL triggers that depend on the status column
DROP TRIGGER IF EXISTS feedback_set_delivered_at ON feedback;
DROP TRIGGER IF EXISTS update_feedback_updated_at ON feedback;

-- Drop the default value temporarily
ALTER TABLE feedback ALTER COLUMN status DROP DEFAULT;

-- Create new enum without 'draft'
CREATE TYPE feedback_status_new AS ENUM (
  'pending_review',     -- Awaiting AI review
  'ai_flagged',         -- AI detected inappropriate content
  'ai_modified',        -- AI suggested modifications
  'pending_approval',   -- User needs to approve AI changes
  'approved',           -- User approved, ready to send
  'delivered',          -- Delivered to recipient
  'published'           -- Recipient made it public
);

-- Update column to use new enum type
ALTER TABLE feedback
  ALTER COLUMN status TYPE feedback_status_new
  USING status::text::feedback_status_new;

-- Drop old enum
DROP TYPE feedback_status;

-- Rename new enum to original name
ALTER TYPE feedback_status_new RENAME TO feedback_status;

-- Set new default value to 'pending_review' (feedback immediately goes for AI review)
ALTER TABLE feedback
  ALTER COLUMN status SET DEFAULT 'pending_review';

-- Recreate policies without draft check
CREATE POLICY "Users can update their own feedback"
  ON feedback
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid() AND status NOT IN ('delivered', 'published'))
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Recipients can update published status"
  ON feedback
  FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid() AND status = 'delivered')
  WITH CHECK (recipient_id = auth.uid());

-- Recreate triggers
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER feedback_set_delivered_at
  BEFORE UPDATE OF status ON feedback
  FOR EACH ROW
  WHEN (NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') AND NEW.delivered_at IS NULL)
  EXECUTE FUNCTION update_delivered_at();

-- Add comment documenting the change
COMMENT ON COLUMN feedback.status IS 'Current status in the feedback workflow (draft status removed - feedback immediately goes to pending_review)';
