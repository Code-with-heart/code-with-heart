-- Enable pg_net extension for async HTTP requests from database triggers
-- This is Supabase's recommended approach for making HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to notify when feedback is rejected
-- This function will be called by the trigger and will call the Edge Function using pg_net

CREATE OR REPLACE FUNCTION notify_feedback_rejected()
RETURNS TRIGGER AS $$
DECLARE
  sender_email TEXT;
  sender_name TEXT;
  recipient_name TEXT;
  feedback_text TEXT;
  feedback_id UUID;
  ai_feedback TEXT;
  edge_function_url TEXT;
  service_role_key TEXT;
  request_id BIGINT;
BEGIN
  -- Only trigger when status changes to 'rejected' (on insert or update)
  IF NEW.status = 'rejected' THEN
    -- Get sender email and name
    SELECT email, full_name INTO sender_email, sender_name
    FROM "user"
    WHERE id = NEW.sender_id;

    -- Get recipient name
    SELECT full_name INTO recipient_name
    FROM "user"
    WHERE id = NEW.recipient_id;

    -- Use original_text for rejected feedback
    feedback_text := NEW.original_text;
    feedback_id := NEW.id;
    ai_feedback := NEW.ai_feedback;

    -- Get Edge Function URL - use Supabase project URL
    -- Format: https://<project-ref>.supabase.co/functions/v1/notify-feedback-rejected
    edge_function_url := COALESCE(
      current_setting('app.edge_function_url', true),
      'https://pjwdbsgnztrjvighxegx.supabase.co/functions/v1'
    ) || '/notify-feedback-rejected';

    -- Get service role key for authorization
    service_role_key := current_setting('app.service_role_key', true);

    -- Call the Supabase Edge Function to send email using pg_net (async)
    SELECT net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
      ),
      body := jsonb_build_object(
        'feedbackId', feedback_id::text,
        'senderEmail', sender_email,
        'senderName', COALESCE(sender_name, 'User'),
        'recipientName', COALESCE(recipient_name, 'Someone'),
        'feedbackText', feedback_text,
        'aiFeedback', ai_feedback,
        'createdAt', NEW.created_at::text
      )
    ) INTO request_id;

    RAISE NOTICE 'Rejection email notification request sent with ID: %', request_id;

  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Error in rejection email notification trigger: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a single trigger for rejected (AFTER INSERT OR UPDATE)
DROP TRIGGER IF EXISTS feedback_rejected_notification ON feedback;
CREATE TRIGGER feedback_rejected_notification
  AFTER INSERT OR UPDATE OF status ON feedback
  FOR EACH ROW
  WHEN (NEW.status = 'rejected')
  EXECUTE FUNCTION notify_feedback_rejected();

-- Comments
COMMENT ON FUNCTION notify_feedback_rejected() IS 'Sends email notification when feedback status changes to rejected via Edge Function';
COMMENT ON TRIGGER feedback_rejected_notification ON feedback IS 'Triggers email notification when status changes to rejected (INSERT or UPDATE)';
