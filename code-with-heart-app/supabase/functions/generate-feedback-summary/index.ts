import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const SYSTEM_PROMPT = `You are an expert at synthesising professional feedback.
Your task is to produce a single, cohesive summary of all the feedback a person has received from their colleagues, students, or professors.

Guidelines:
- Write the summary in the same language(s) as the majority of the feedback texts. If feedback is mixed, default to the dominant language.
- Keep the summary concise: 3–5 sentences.
- Highlight recurring strengths and, if present, constructive areas for growth.
- Use a positive, professional tone.
- Do NOT quote individual messages verbatim.
- Do NOT include any preamble like "Here is a summary of ...". Start directly with the content.`;

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

  console.log(`Generating feedback summary for user ${userId}`);

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

  // Call OpenAI
  let summary: string;
  try {
    const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        max_tokens: 400,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Please summarise the following ${feedbackRows.length} feedback message(s):\n\n${combinedTexts}`,
          },
        ],
      }),
    });

    if (!openAiRes.ok) {
      const errBody = await openAiRes.text();
      console.error("OpenAI error:", openAiRes.status, errBody);
      return new Response(JSON.stringify({ error: "OpenAI request failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const openAiData = await openAiRes.json();
    summary = openAiData.choices?.[0]?.message?.content?.trim() ?? "";

    if (!summary) {
      console.error("OpenAI returned an empty summary");
      return new Response(JSON.stringify({ error: "Empty summary from OpenAI" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("OpenAI call threw an exception:", err);
    return new Response(JSON.stringify({ error: "OpenAI call failed" }), {
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

  console.log(`Successfully updated feedback_summary for user ${userId}`);
  return new Response(JSON.stringify({ success: true, summary }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
