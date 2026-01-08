-- Enable pg_net extension for async HTTP requests from database triggers
-- This is Supabase's recommended approach for making HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to notify when feedback is delivered
-- This function will be called by the trigger and will call the Edge Function using pg_net


CREATE OR REPLACE FUNCTION notify_feedback_delivered()
RETURNS TRIGGER AS $$
DECLARE
  recipient_email TEXT;
  recipient_name TEXT;
  sender_name TEXT;
  feedback_text TEXT;
  feedback_id UUID;
  edge_function_url TEXT;
  service_role_key TEXT;
  request_id BIGINT;
BEGIN
  -- Only trigger when status changes to 'delivered' (on insert or update)
  IF NEW.status = 'delivered' THEN
    -- Get recipient email and name
    SELECT email, full_name INTO recipient_email, recipient_name
    FROM "user"
    WHERE id = NEW.recipient_id;

    -- Get sender name
    SELECT full_name INTO sender_name
    FROM "user"
    WHERE id = NEW.sender_id;

    -- Use modified_text if available, otherwise original_text
    feedback_text := COALESCE(NEW.modified_text, NEW.original_text);
    feedback_id := NEW.id;

    -- Get Edge Function URL - use Supabase project URL
    -- Format: https://<project-ref>.supabase.co/functions/v1/notify-feedback-delivered
    edge_function_url := COALESCE(
      current_setting('app.edge_function_url', true),
      'https://pjwdbsgnztrjvighxegx.supabase.co/functions/v1'
    ) || '/notify-feedback-delivered';

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
        'recipientEmail', recipient_email,
        'recipientName', COALESCE(recipient_name, 'User'),
        'senderName', COALESCE(sender_name, 'Someone'),
        'feedbackText', feedback_text,
        'createdAt', NEW.created_at::text
      )
    ) INTO request_id;

    RAISE NOTICE 'Email notification request sent with ID: %', request_id;

  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Error in email notification trigger: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to set delivered_at timestamp
CREATE OR REPLACE FUNCTION update_delivered_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND NEW.delivered_at IS NULL THEN
    NEW.delivered_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Create trigger to set delivered_at timestamp (BEFORE INSERT OR UPDATE)
DROP TRIGGER IF EXISTS feedback_set_delivered_at ON feedback;
CREATE TRIGGER feedback_set_delivered_at
  BEFORE INSERT OR UPDATE OF status ON feedback
  FOR EACH ROW
  WHEN (NEW.status = 'delivered' AND NEW.delivered_at IS NULL)
  EXECUTE FUNCTION update_delivered_at();


-- Create a single trigger for delivered (AFTER INSERT OR UPDATE)
DROP TRIGGER IF EXISTS feedback_delivered_notification ON feedback;
CREATE TRIGGER feedback_delivered_notification
  AFTER INSERT OR UPDATE OF status ON feedback
  FOR EACH ROW
  WHEN (NEW.status = 'delivered')
  EXECUTE FUNCTION notify_feedback_delivered();

-- Comments
COMMENT ON FUNCTION notify_feedback_delivered() IS 'Sends email notification when feedback status changes to delivered via Edge Function';
COMMENT ON FUNCTION update_delivered_at() IS 'Sets delivered_at timestamp when feedback status changes to delivered';
COMMENT ON TRIGGER feedback_set_delivered_at ON feedback IS 'Sets delivered_at timestamp when status changes to delivered';
COMMENT ON TRIGGER feedback_delivered_notification ON feedback IS 'Triggers email notification when status changes to delivered (INSERT or UPDATE)';

