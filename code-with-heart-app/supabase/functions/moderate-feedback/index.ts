import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { getModerationService } from './moderation-service.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const MODERATION_PROVIDER = Deno.env.get('MODERATION_PROVIDER') || 'openai';

// Log API key info for debugging (only first/last 4 chars)
const apiKey = Deno.env.get('OPENAI_API_KEY') || '';
console.log(`OpenAI API Key configured: ${apiKey ? `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}` : 'NOT SET'}`);

serve(async (req) => {
  // Parse request body once and store it
  let feedbackId: string | undefined;
  let originalText: string | undefined;

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse body once
    const body = await req.json();
    feedbackId = body.feedbackId;
    originalText = body.originalText;

    // Validate input
    if (!feedbackId || !originalText) {
      return new Response(JSON.stringify({
        error: 'Missing feedbackId or originalText'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing moderation for feedback ${feedbackId} using ${MODERATION_PROVIDER}`);

    // Get moderation service via abstraction layer
    const moderationService = await getModerationService(MODERATION_PROVIDER);
    const result = await moderationService.moderateContent(originalText);

    console.log(`Moderation result from ${moderationService.getName()}:`, {
      shouldReject: result.shouldReject,
      categories: result.categories
    });

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    if (result.shouldReject) {
      // Update feedback status to 'rejected'
      const { error: updateError } = await supabase
        .from('feedback')
        .update({
          status: 'rejected',
          ai_feedback: result.rejectionReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', feedbackId);

      if (updateError) {
        throw new Error(`Database update error: ${updateError.message}`);
      }

      console.log(`Feedback ${feedbackId} rejected by ${moderationService.getName()}`);

      return new Response(JSON.stringify({
        success: true,
        action: 'rejected',
        reason: result.rejectionReason,
        provider: moderationService.getName()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Feedback is acceptable - approve and deliver
      const { error: updateError } = await supabase
        .from('feedback')
        .update({
          status: 'approved',
          ai_feedback: `Passed moderation (${moderationService.getName()})`,
          updated_at: new Date().toISOString()
        })
        .eq('id', feedbackId);

      if (updateError) {
        throw new Error(`Database update error: ${updateError.message}`);
      }

      // Immediately transition to 'delivered' status
      const { error: deliverError } = await supabase
        .from('feedback')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', feedbackId);

      if (deliverError) {
        throw new Error(`Delivery update error: ${deliverError.message}`);
      }

      console.log(`Feedback ${feedbackId} approved and delivered`);

      return new Response(JSON.stringify({
        success: true,
        action: 'approved_and_delivered',
        provider: moderationService.getName()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error in moderate-feedback function:', error);

    // Graceful degradation: mark for manual review (using stored feedbackId)
    if (feedbackId) {
      try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
        await supabase
          .from('feedback')
          .update({
            status: 'pending_approval',
            ai_feedback: `Automatic moderation unavailable: ${error.message}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', feedbackId);

        console.log(`Feedback ${feedbackId} marked for manual review due to error`);
      } catch (fallbackError) {
        console.error('Fallback update failed:', fallbackError);
      }
    }

    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
