import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      feedbackId,
      senderEmail,
      senderName,
      feedbackText,
      rejectionReason,
      createdAt
    } = body;

    // Validate required fields
    if (!senderEmail || !feedbackId || !feedbackText || !rejectionReason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get base URL for edit link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                    'http://localhost:3000';

    const editUrl = `${baseUrl}/profile?edit=${feedbackId}`;

    // Format date
    const formattedDate = createdAt
      ? new Date(createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

    // Create email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Feedback Requires Revision</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h1 style="color: #dc2626; margin-top: 0;">Feedback Requires Revision</h1>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hi ${senderName || 'there'},
            </p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Your feedback submission was reviewed by our AI moderation system and requires some revisions before it can be delivered.
            </p>
          </div>

          <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 18px;">Reason for Review</h2>
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin-bottom: 15px;">
              <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #991b1b;">
                ${rejectionReason}
              </p>
            </div>

            <h2 style="color: #1f2937; margin-top: 25px; font-size: 18px;">Your Original Feedback</h2>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
              <p style="white-space: pre-wrap; margin: 0; font-size: 15px; line-height: 1.7;">
                ${feedbackText.replace(/\n/g, '<br>')}
              </p>
            </div>

            <div style="color: #6b7280; font-size: 14px; margin-top: 15px;">
              <p style="margin: 5px 0;"><strong>Submitted:</strong> ${formattedDate}</p>
            </div>
          </div>

          <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #0369a1; margin-top: 0; font-size: 16px;">What happens next?</h3>
            <p style="font-size: 14px; margin: 10px 0; color: #0c4a6e;">
              You can edit your feedback and resubmit it. We encourage constructive feedback that helps your peers grow while maintaining a respectful and supportive environment.
            </p>
            <p style="font-size: 14px; margin: 10px 0; color: #0c4a6e;">
              <strong>Tips for constructive feedback:</strong>
            </p>
            <ul style="font-size: 14px; color: #0c4a6e; margin: 10px 0;">
              <li>Focus on specific behaviors or outcomes, not personal attributes</li>
              <li>Be respectful and considerate in your language</li>
              <li>Provide actionable suggestions for improvement</li>
              <li>Avoid discriminatory, threatening, or harmful language</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${editUrl}"
               style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Edit and Resubmit Feedback
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; color: #6b7280; font-size: 14px; text-align: center;">
            <p style="margin: 5px 0;">This email was sent from Code with Heart</p>
            <p style="margin: 5px 0;">
              <a href="${editUrl}" style="color: #2563eb; text-decoration: none;">View your feedback</a>
            </p>
          </div>
        </body>
      </html>
    `;

    const emailText = `
Feedback Requires Revision

Hi ${senderName || 'there'},

Your feedback submission was reviewed by our AI moderation system and requires some revisions before it can be delivered.

REASON FOR REVIEW:
${rejectionReason}

YOUR ORIGINAL FEEDBACK:
${feedbackText}

Submitted: ${formattedDate}

WHAT HAPPENS NEXT?
You can edit your feedback and resubmit it. We encourage constructive feedback that helps your peers grow while maintaining a respectful and supportive environment.

Tips for constructive feedback:
- Focus on specific behaviors or outcomes, not personal attributes
- Be respectful and considerate in your language
- Provide actionable suggestions for improvement
- Avoid discriminatory, threatening, or harmful language

Edit and resubmit your feedback: ${editUrl}

---
This email was sent from Code with Heart
View your feedback: ${editUrl}
    `.trim();

    // Send email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || `"Code with Heart" <${process.env.SMTP_USER}>`,
      to: senderEmail,
      subject: 'Your Feedback Requires Revision',
      html: emailHtml,
      text: emailText,
    });

    return NextResponse.json(
      {
        success: true,
        messageId: info.messageId,
        message: 'Rejection notification sent successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending rejection notification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
