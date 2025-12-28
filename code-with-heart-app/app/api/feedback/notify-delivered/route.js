import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
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
      recipientEmail,
      recipientName,
      senderName,
      feedbackText,
      createdAt
    } = body;

    // Validate required fields
    if (!recipientEmail || !feedbackId || !feedbackText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the base URL for the feedback link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    'http://localhost:3000';
    
    const feedbackUrl = `${baseUrl}/profile`;

    // Format the date
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
          <title>New Feedback Received</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin-top: 0;">You've Received New Feedback!</h1>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hi ${recipientName || 'there'},
            </p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              You've received new feedback from <strong>${senderName || 'Someone'}</strong>.
            </p>
          </div>

          <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 18px;">Feedback Details</h2>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
              <p style="white-space: pre-wrap; margin: 0; font-size: 15px; line-height: 1.7;">
                ${feedbackText.replace(/\n/g, '<br>')}
              </p>
            </div>
            <div style="color: #6b7280; font-size: 14px; margin-top: 15px;">
              <p style="margin: 5px 0;"><strong>From:</strong> ${senderName || 'Unknown'}</p>
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

    // Plain text version for email clients that don't support HTML
    const emailText = `
You've Received New Feedback!

Hi ${recipientName || 'there'},

You've received new feedback from ${senderName || 'Someone'}.

Feedback:
${feedbackText}

From: ${senderName || 'Unknown'}
Date: ${formattedDate}

Publish your feedback now: ${feedbackUrl}

---
This email was sent from Code with Heart
View your feedback: ${feedbackUrl}
    `.trim();

    // Send email using Nodemailer
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || `\"Code with Heart\" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: `New Feedback from ${senderName || 'Someone'}`,
      html: emailHtml,
      text: emailText,
    });

    return NextResponse.json(
      { 
        success: true, 
        messageId: info.messageId,
        message: 'Email notification sent successfully' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending email notification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

