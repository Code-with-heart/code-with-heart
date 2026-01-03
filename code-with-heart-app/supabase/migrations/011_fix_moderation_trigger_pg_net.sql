-- Fix moderation trigger to use pg_net extension (Supabase's recommended approach)
-- The http extension doesn't work reliably in Supabase hosted environment

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Update the moderation function to use pg_net instead of http
CREATE OR REPLACE FUNCTION process_feedback_moderation()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url TEXT;
  service_role_key TEXT;
  request_id BIGINT;
BEGIN
  -- Only trigger for new feedback with pending_review status
  IF NEW.status = 'pending_review' AND (OLD IS NULL OR OLD.status != 'pending_review') THEN

    -- Get Edge Function URL - use Supabase project URL
    -- Format: https://<project-ref>.supabase.co/functions/v1/moderate-feedback
    edge_function_url := COALESCE(
      current_setting('app.edge_function_url', true),
      'https://pjwdbsgnztrjvighxegx.supabase.co/functions/v1'
    ) || '/moderate-feedback';

    -- Get service role key for authorization
    service_role_key := current_setting('app.service_role_key', true);

    -- Use pg_net for async HTTP call (non-blocking)
    SELECT net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
      ),
      body := jsonb_build_object(
        'feedbackId', NEW.id::text,
        'originalText', NEW.original_text
      )
    ) INTO request_id;

    RAISE NOTICE 'Moderation request sent with ID: %', request_id;

  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the insert
  RAISE WARNING 'Error in moderation trigger: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS feedback_moderation_trigger ON feedback;
CREATE TRIGGER feedback_moderation_trigger
  AFTER INSERT ON feedback
  FOR EACH ROW
  WHEN (NEW.status = 'pending_review')
  EXECUTE FUNCTION process_feedback_moderation();

COMMENT ON FUNCTION process_feedback_moderation() IS 'Triggers AI moderation via Edge Function using pg_net (async HTTP)';
