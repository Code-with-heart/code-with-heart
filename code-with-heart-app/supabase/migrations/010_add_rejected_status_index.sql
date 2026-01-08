-- Add index and trigger for rejected status
-- This is in a separate migration because PostgreSQL doesn't allow using
-- a newly added enum value in the same transaction

-- Add index for rejected status (for sender viewing rejected feedback)
CREATE INDEX IF NOT EXISTS idx_feedback_rejected
  ON feedback(sender_id, status)
  WHERE status = 'rejected';

COMMENT ON INDEX idx_feedback_rejected IS 'Index for quickly finding rejected feedback by sender';
