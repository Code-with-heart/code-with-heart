-- Add index and trigger for rejected status
-- This is in a separate migration because PostgreSQL doesn't allow using
-- a newly added enum value in the same transaction

-- Add index for rejected status (for sender viewing rejected feedback)
CREATE INDEX IF NOT EXISTS idx_feedback_rejected
  ON feedback(sender_id, status)
  WHERE status = 'rejected';

COMMENT ON INDEX idx_feedback_rejected IS 'Index for quickly finding rejected feedback by sender';

-- Create trigger for rejection notifications
-- This couldn't be in the previous migration due to enum constraint
DROP TRIGGER IF EXISTS feedback_rejected_notification ON feedback;
CREATE TRIGGER feedback_rejected_notification
  AFTER UPDATE OF status ON feedback
  FOR EACH ROW
  WHEN (NEW.status::text = 'rejected' AND (OLD.status IS NULL OR OLD.status::text != 'rejected'))
  EXECUTE FUNCTION notify_feedback_rejected();

COMMENT ON TRIGGER feedback_rejected_notification ON feedback IS 'Sends rejection notification email when feedback is rejected';
