-- Enable the http extension for making HTTP requests from database triggers
-- This extension allows the database to call external APIs
CREATE EXTENSION IF NOT EXISTS http;

-- Create function to notify when feedback is delivered
-- This function will be called by the trigger and will attempt to call the Next.js API route

CREATE OR REPLACE FUNCTION notify_feedback_delivered()
RETURNS TRIGGER AS $$
DECLARE
  recipient_email TEXT;
  recipient_name TEXT;
  sender_name TEXT;
  feedback_text TEXT;
  feedback_id UUID;
  api_url TEXT;
  response_status INT;
BEGIN
  -- Only trigger when status changes to 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
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

    -- Get API URL from environment variable or use default
    -- Set this in Supabase: ALTER DATABASE postgres SET app.api_url = 'https://your-domain.com';
    -- Or use Supabase secrets for production
    api_url := COALESCE(
      current_setting('app.api_url', true),
      'http://localhost:3000'
    );

    -- Call the Next.js API route to send email using http extension
    -- This requires the http extension to be enabled
    BEGIN
      SELECT status INTO response_status
      FROM http((
        'POST',
        api_url || '/api/feedback/notify-delivered',
        ARRAY[
          http_header('Content-Type', 'application/json')
        ],
        'application/json',
        json_build_object(
          'feedbackId', feedback_id::text,
          'recipientEmail', recipient_email,
          'recipientName', COALESCE(recipient_name, 'User'),
          'senderName', COALESCE(sender_name, 'Someone'),
          'feedbackText', feedback_text,
          'createdAt', NEW.created_at::text
        )::text
      )::http_request);
      
      -- Log if there's an error (status != 200)
      IF response_status != 200 THEN
        RAISE WARNING 'Failed to send email notification. HTTP status: %', response_status;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- If http extension is not available, log the error but don't fail the transaction
      RAISE WARNING 'Error calling email notification API: %', SQLERRM;
    END;
  END IF;

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

-- Create trigger to set delivered_at timestamp (BEFORE UPDATE)
DROP TRIGGER IF EXISTS feedback_set_delivered_at ON feedback;
CREATE TRIGGER feedback_set_delivered_at
  BEFORE UPDATE OF status ON feedback
  FOR EACH ROW
  WHEN (NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') AND NEW.delivered_at IS NULL)
  EXECUTE FUNCTION update_delivered_at();

-- Create trigger to call the email notification function (AFTER UPDATE)
DROP TRIGGER IF EXISTS feedback_delivered_notification ON feedback;
CREATE TRIGGER feedback_delivered_notification
  AFTER UPDATE OF status ON feedback
  FOR EACH ROW
  WHEN (NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered'))
  EXECUTE FUNCTION notify_feedback_delivered();

-- Also handle the case when feedback is inserted with status 'delivered'
DROP TRIGGER IF EXISTS feedback_delivered_notification_insert ON feedback;
CREATE TRIGGER feedback_delivered_notification_insert
  AFTER INSERT ON feedback
  FOR EACH ROW
  WHEN (NEW.status = 'delivered')
  EXECUTE FUNCTION notify_feedback_delivered();

-- Comments
COMMENT ON FUNCTION notify_feedback_delivered() IS 'Sends email notification when feedback status changes to delivered via Next.js API route';
COMMENT ON FUNCTION update_delivered_at() IS 'Sets delivered_at timestamp when feedback status changes to delivered';
COMMENT ON TRIGGER feedback_set_delivered_at ON feedback IS 'Sets delivered_at timestamp when status changes to delivered';
COMMENT ON TRIGGER feedback_delivered_notification ON feedback IS 'Triggers email notification on status update to delivered';
COMMENT ON TRIGGER feedback_delivered_notification_insert ON feedback IS 'Triggers email notification on insert with delivered status';

