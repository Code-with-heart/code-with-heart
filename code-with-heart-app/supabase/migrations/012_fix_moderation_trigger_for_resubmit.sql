-- Fix moderation trigger to also fire on UPDATE (for resubmitting rejected feedback)
-- The original trigger only fired on INSERT, missing the resubmit flow

-- Drop existing trigger
DROP TRIGGER IF EXISTS feedback_moderation_trigger ON feedback;

-- Recreate trigger for both INSERT and UPDATE
-- This ensures moderation runs when:
-- 1. New feedback is submitted (INSERT with pending_review)
-- 2. Rejected feedback is edited and resubmitted (UPDATE to pending_review)
CREATE TRIGGER feedback_moderation_trigger
  AFTER INSERT OR UPDATE OF status ON feedback
  FOR EACH ROW
  WHEN (NEW.status = 'pending_review')
  EXECUTE FUNCTION process_feedback_moderation();

COMMENT ON TRIGGER feedback_moderation_trigger ON feedback IS 'Triggers AI moderation on new feedback or resubmitted rejected feedback';
