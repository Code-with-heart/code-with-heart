-- Add trigger to generate / refresh the feedback summary whenever a feedback
-- record transitions to 'delivered' status (i.e. the recipient receives it).
-- Uses pg_net for an async, non-blocking HTTP call to the edge function –
-- the same pattern used by the moderation and notification triggers.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- -----------------------------------------------------------------------
-- Trigger function
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_generate_feedback_summary()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url TEXT;
  service_role_key  TEXT;
  request_id        BIGINT;
BEGIN
  -- Fire only when status transitions TO 'delivered'
  IF NEW.status = 'delivered' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'delivered') THEN

    edge_function_url := COALESCE(
      current_setting('app.edge_function_url', true),
      'https://pjwdbsgnztrjvighxegx.supabase.co/functions/v1'
    ) || '/generate-feedback-summary';

    service_role_key := current_setting('app.service_role_key', true);

    SELECT net.http_post(
      url     := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
      ),
      body    := jsonb_build_object(
        'userId', NEW.recipient_id::text
      )
    ) INTO request_id;

    RAISE NOTICE 'Feedback summary generation request sent with ID: % for user %', request_id, NEW.recipient_id;

  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log but never block the delivery transaction
  RAISE WARNING 'Error in feedback summary trigger: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------
-- Trigger
-- -----------------------------------------------------------------------
DROP TRIGGER IF EXISTS feedback_summary_trigger ON feedback;
CREATE TRIGGER feedback_summary_trigger
  AFTER INSERT OR UPDATE OF status ON feedback
  FOR EACH ROW
  WHEN (NEW.status = 'delivered')
  EXECUTE FUNCTION trigger_generate_feedback_summary();

COMMENT ON FUNCTION trigger_generate_feedback_summary() IS 'Calls generate-feedback-summary edge function via pg_net whenever a feedback is delivered to regenerate the recipient''s AI summary.';
COMMENT ON TRIGGER feedback_summary_trigger ON feedback IS 'Fires after status transitions to delivered and triggers AI summary regeneration for the recipient.';
