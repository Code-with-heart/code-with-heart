// supabase/functions/notify-feedback-delivered/index.ts
// Supabase Edge Function to send feedback delivered email notification
// This function receives a POST request from a database trigger and sends email via Resend API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const {
    feedbackId,
    recipientEmail,
    recipientName,
    senderName,
    feedbackText,
    createdAt
  } = body;

  // Validate required fields
  if (!recipientEmail || !feedbackId || !feedbackText) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { status: 400 }
    );
  }

  // Get the base URL for the feedback link
  const baseUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || "http://localhost:3000";
  const feedbackUrl = `${baseUrl}/profile`;

  // Format the date
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  // Create email HTML content
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Feedback Received</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
          <h1 style="color: #2563eb; margin-top: 0;">You've Received New Feedback!</h1>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hi ${recipientName || "there"},
          </p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            You've received new feedback from <strong>${senderName || "Someone"}</strong>.
          </p>
        </div>

        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; margin-bottom: 20px;">
          <h2 style="color: #1f2937; margin-top: 0; font-size: 18px;">Feedback Details</h2>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
            <p style="white-space: pre-wrap; margin: 0; font-size: 15px; line-height: 1.7;">
              ${feedbackText.replace(/\n/g, "<br>")}
            </p>
          </div>
          <div style="color: #6b7280; font-size: 14px; margin-top: 15px;">
            <p style="margin: 5px 0;"><strong>From:</strong> ${senderName || "Unknown"}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${feedbackUrl}" 
             style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Publish your feedback now
          </a>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; color: #6b7280; font-size: 14px; text-align: center;">
          <p style="margin: 5px 0;">This email was sent from Code with Heart</p>
          <p style="margin: 5px 0;">
            <a href="${feedbackUrl}" style="color: #2563eb; text-decoration: none;">View your feedback</a>
          </p>
        </div>
      </body>
    </html>
  `;

  // Plain text version
  const emailText = `
You've Received New Feedback!

Hi ${recipientName || "there"},

You've received new feedback from ${senderName || "Someone"}.

Feedback:
${feedbackText}

From: ${senderName || "Unknown"}
Date: ${formattedDate}

Publish your feedback now: ${feedbackUrl}

---
This email was sent from Code with Heart
View your feedback: ${feedbackUrl}
  `.trim();

  try {
    // Call Resend API directly using fetch
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM_EMAIL") || "Code with Heart <noreply@codewithheart.cloudappdev.site>",
        to: [recipientEmail],
        subject: `New Feedback from ${senderName || "Someone"}`,
        html: emailHtml,
        text: emailText,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      return new Response(
        JSON.stringify({ error: data.message || "Failed to send email" }),
        { status: response.status }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: data.id,
        message: "Email notification sent successfully" 
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error sending email:", err);
    return new Response(
      JSON.stringify({ error: "Failed to send email", details: String(err) }),
      { status: 500 }
    );
  }
});
