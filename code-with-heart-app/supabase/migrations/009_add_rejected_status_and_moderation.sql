-- Migration to add AI moderation system with 'rejected' status
-- This enables automatic feedback screening with OpenAI Moderation API

-- Add 'rejected' status to feedback_status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t
                 JOIN pg_enum e ON t.oid = e.enumtypid
                 WHERE t.typname = 'feedback_status'
                 AND e.enumlabel = 'rejected') THEN
    ALTER TYPE feedback_status ADD VALUE 'rejected';
  END IF;
END $$;

-- Update comment on status column
COMMENT ON COLUMN feedback.status IS 'Current status: pending_review → (rejected OR approved → delivered → published)';

-- Update RLS policy: Senders can update rejected feedback to resubmit
DROP POLICY IF EXISTS "Users can update their own feedback" ON feedback;
CREATE POLICY "Users can update their own feedback"
  ON feedback
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid() AND status NOT IN ('delivered', 'published', 'approved'))
  WITH CHECK (sender_id = auth.uid());

-- Function to process feedback moderation (calls Edge Function)
CREATE OR REPLACE FUNCTION process_feedback_moderation()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url TEXT;
  response_status INT;
BEGIN
  -- Only trigger for new feedback with pending_review status
  IF NEW.status = 'pending_review' AND (OLD IS NULL OR OLD.status != 'pending_review') THEN

    -- Get Edge Function URL from environment or use default
    edge_function_url := COALESCE(
      current_setting('app.edge_function_url', true),
      'http://localhost:54321/functions/v1'
    );

    -- Call Supabase Edge Function asynchronously
    BEGIN
      SELECT status INTO response_status
      FROM http((
        'POST',
        edge_function_url || '/moderate-feedback',
        ARRAY[
          http_header('Content-Type', 'application/json'),
          http_header('Authorization', 'Bearer ' || current_setting('app.service_role_key', true))
        ],
        'application/json',
        json_build_object(
          'feedbackId', NEW.id::text,
          'originalText', NEW.original_text
        )::text
      )::http_request);

      IF response_status NOT IN (200, 201, 202) THEN
        RAISE WARNING 'Moderation function returned status: %', response_status;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the insert
      RAISE WARNING 'Error calling moderation function: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for moderation processing
DROP TRIGGER IF EXISTS feedback_moderation_trigger ON feedback;
CREATE TRIGGER feedback_moderation_trigger
  AFTER INSERT ON feedback
  FOR EACH ROW
  WHEN (NEW.status = 'pending_review')
  EXECUTE FUNCTION process_feedback_moderation();

-- Function to notify sender when feedback is rejected
CREATE OR REPLACE FUNCTION notify_feedback_rejected()
RETURNS TRIGGER AS $$
DECLARE
  sender_email TEXT;
  sender_name TEXT;
  rejection_reason TEXT;
  feedback_text TEXT;
  feedback_id UUID;
  api_url TEXT;
  response_status INT;
BEGIN
  -- Only trigger when status changes to 'rejected'
  IF NEW.status::text = 'rejected' AND (OLD.status IS NULL OR OLD.status::text != 'rejected') THEN
    -- Get sender email and name
    SELECT email, full_name INTO sender_email, sender_name
    FROM "user"
    WHERE id = NEW.sender_id;

    feedback_text := NEW.original_text;
    rejection_reason := COALESCE(NEW.ai_feedback, 'Your feedback was flagged for review.');
    feedback_id := NEW.id;

    -- Get API URL from environment
    api_url := COALESCE(
      current_setting('app.api_url', true),
      'http://localhost:3000'
    );

    -- Call Next.js API to send rejection email
    BEGIN
      SELECT status INTO response_status
      FROM http((
        'POST',
        api_url || '/api/feedback/notify-rejected',
        ARRAY[
          http_header('Content-Type', 'application/json')
        ],
        'application/json',
        json_build_object(
          'feedbackId', feedback_id::text,
          'senderEmail', sender_email,
          'senderName', COALESCE(sender_name, 'User'),
          'feedbackText', feedback_text,
          'rejectionReason', rejection_reason,
          'createdAt', NEW.created_at::text
        )::text
      )::http_request);

      IF response_status != 200 THEN
        RAISE WARNING 'Failed to send rejection email. HTTP status: %', response_status;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error calling rejection notification API: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION process_feedback_moderation() IS 'Triggers AI moderation via Edge Function when feedback enters pending_review status';
COMMENT ON FUNCTION notify_feedback_rejected() IS 'Sends email notification to sender when feedback is rejected by AI moderation';
COMMENT ON TRIGGER feedback_moderation_trigger ON feedback IS 'Automatically processes feedback through AI moderation system';
