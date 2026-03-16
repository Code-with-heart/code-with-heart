-- Add AI-generated feedback summary column to user table
-- This column stores a periodically regenerated summary of the user's received feedback

ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS feedback_summary TEXT DEFAULT NULL;

COMMENT ON COLUMN "user".feedback_summary IS 'AI-generated summary of all received feedback (delivered + published). Regenerated automatically after each new delivery.';
