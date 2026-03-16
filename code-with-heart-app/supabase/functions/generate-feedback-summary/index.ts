import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { getModerationService } from './moderation-service.ts';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODERATION_PROVIDER = 'gemini';

const SYSTEM_PROMPT = `You are an expert at synthesising professional feedback into a short, insightful profile.
Your task is to produce a concise but substantive summary of all the feedback a person has received from their colleagues, students, or professors.

Guidelines:
- Write 1-2 complete sentences. Every sentence must be fully finished — never cut off mid-idea. Maximum of 300 words.
- Be specific: name the concrete skills, behaviours, or qualities that recur across the feedback (e.g. "clear technical explanations", "proactive problem-solving", "reliable under deadlines").
- If the feedback mentions areas for growth, include one balanced, constructive sentence about it.
- Write in the same language(s) as the majority of the feedback. If mixed, default to the dominant language.
- Use a warm, professional tone — as if written for a LinkedIn recommendation or a performance review.
- Do NOT include any recommendations or advice. Focus only on summarising the feedback received.
- Do NOT quote individual messages verbatim.
- Do NOT start with "Here is a summary", "Based on the feedback", or any preamble. Start directly with the person's name or a key strength.`;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let userId: string | undefined;
  try {
    const body = await req.json();
    userId = body.userId;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(`Generating feedback summary for user ${userId} using ${MODERATION_PROVIDER}`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Fetch all delivered or published feedback for this recipient
  const { data: feedbackRows, error: fetchError } = await supabase
    .from("feedback")
    .select("original_text, modified_text")
    .eq("recipient_id", userId)
    .in("status", ["delivered", "published"])
    .order("created_at", { ascending: true });

  if (fetchError) {
    console.error("Failed to fetch feedback:", fetchError.message);
    return new Response(JSON.stringify({ error: "Failed to fetch feedback" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!feedbackRows || feedbackRows.length === 0) {
    console.log(`No delivered/published feedback found for user ${userId}. Skipping.`);
    return new Response(JSON.stringify({ message: "No feedback to summarise" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Combine all feedback texts
  const combinedTexts = feedbackRows
    .map((row, idx) => `[${idx + 1}] ${row.modified_text || row.original_text}`)
    .join("\n\n");

  // Generate summary via the configured AI service
  let summary: string;
  try {
    const summaryService = await getModerationService(MODERATION_PROVIDER);
    console.log(`Generating summary with ${summaryService.getName()}`);
    summary = await summaryService.generateSummary(SYSTEM_PROMPT, combinedTexts, feedbackRows.length);
  } catch (err) {
    console.error("Summary generation failed:", err);
    return new Response(JSON.stringify({ error: "Summary generation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Persist the summary to the user row
  const { error: updateError } = await supabase
    .from("user")
    .update({ feedback_summary: summary })
    .eq("id", userId);

  if (updateError) {
    console.error("Failed to update feedback_summary:", updateError.message);
    return new Response(JSON.stringify({ error: "Failed to save summary" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(`Successfully updated feedback_summary for user ${userId} with summary: ${summary}`);
  return new Response(JSON.stringify({ success: true, summary }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
