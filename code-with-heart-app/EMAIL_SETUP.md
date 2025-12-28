# Email Notification Setup

This guide explains how to set up email notifications for feedback delivery.

## Overview

When a feedback's status changes to "delivered", an email notification is automatically sent to the recipient. The email includes:
- The feedback content
- Sender information
- Date of the feedback
- A link to publish the feedback

## Prerequisites

1. **SMTP Email Server**: Access to an SMTP server (school, work, or personal email server)
2. **SMTP Credentials**: Username and password for authentication
3. **Supabase Database**: The database trigger needs to be set up (see below)

## Setup Instructions

### 1. Install Dependencies

The Nodemailer package is used for sending emails. Install it:

```bash
npm install nodemailer
```

### 2. Get Your SMTP Configuration

Contact your email provider (e.g., your high school IT department) or check their documentation for:
- **SMTP Host**: e.g., `smtp.yourschool.edu` or `mail.yourschool.edu`
- **SMTP Port**: Usually `587` (TLS) or `465` (SSL) or `25` (unsecured)
- **Authentication**: Your email username and password
- **Security**: Whether to use TLS/SSL

Common configurations:
- **Port 587**: Use with `SMTP_SECURE=false` (STARTTLS)
- **Port 465**: Use with `SMTP_SECURE=true` (SSL)
- **Port 25**: Usually unsecured (not recommended)

### 3. Configure Environment Variables

Create or update your `.env.local` file with the following variables:

```env
# SMTP Server Configuration
SMTP_HOST=smtp.yourschool.edu
SMTP_PORT=587
SMTP_SECURE=false

# SMTP Authentication
SMTP_USER=your-email@yourschool.edu
SMTP_PASSWORD=your-password

# Sender email address (optional, defaults to SMTP_USER)
SMTP_FROM_EMAIL="Code with Heart" <your-email@yourschool.edu>

# Your application URL (for email links)
NEXT_PUBLIC_APP_URL=https://your-domain.com
# Or for local development:
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Configuration Notes:**
- `SMTP_SECURE=true` for port 465 (SSL)
- `SMTP_SECURE=false` for port 587 (STARTTLS) or port 25
- `SMTP_FROM_EMAIL` is optional and defaults to your SMTP_USER

### 4. Set Up Database Trigger

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the migration file: `supabase/migrations/006_add_feedback_delivered_email_trigger.sql`
4. **Important**: Enable the HTTP extension if not already enabled:
   ```sql
   CREATE EXTENSION IF NOT EXISTS http;
   ```
5. Set the API URL for your database:
   ```sql
   ALTER DATABASE postgres SET app.api_url = 'https://your-domain.com';
   ```
   Or for local development:
   ```sql
   ALTER DATABASE postgres SET app.api_url = 'http://localhost:3000';
   ```

#### Option B: Using Supabase CLI

```bash
# Apply migrations
supabase db push

# Enable HTTP extension
supabase db execute "CREATE EXTENSION IF NOT EXISTS http;"

# Set API URL (replace with your actual URL)
supabase db execute "ALTER DATABASE postgres SET app.api_url = 'https://your-domain.com';"
```

### 5. Test Your Configuration

You can verify your SMTP settings are correct by sending a test email through the API.

## Common SMTP Providers

### High School / University Servers
- Check with your IT department for SMTP settings
- Usually requires you to be on campus network or VPN
- May have sending limits (e.g., 100-500 emails per day)

### Other Free Providers

**Gmail:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Requires App Password
```

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

**Yahoo:**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASSWORD=your-app-password  # Requires App Password
```

## How It Works

1. **Database Trigger**: When feedback status changes to "delivered", a database trigger fires
2. **API Call**: The trigger calls the Next.js API route `/api/feedback/notify-delivered`
3. **Email Sending**: The API route uses Nodemailer with your configured SMTP server to send the email notification

## Testing

### Test the API Route Directly

You can test the email functionality by making a POST request to the API route:

```bash
curl -X POST http://localhost:3000/api/feedback/notify-delivered \
  -H "Content-Type: application/json" \
  -d '{
    "feedbackId": "test-id",
    "recipientEmail": "recipient@example.com",
    "recipientName": "Test Recipient",
    "senderName": "Test Sender",
    "feedbackText": "This is a test feedback message.",
    "createdAt": "2024-01-01T00:00:00Z"
  }'
```

### Test with Database Trigger

1. Update a feedback's status to "delivered" in the database
2. Check the Supabase logs for any errors
3. Verify the email was received

## Troubleshooting

### Email Not Sending

1. **Check Resend API Key**: Verify `RESEND_API_KEY` is set correctly
2. **Check Sender Email**: Ensure `RESEND_FROM_EMAIL` uses a verified domain
3. **Check Database Trigger**: Verify the trigger is created and enabled
4. **Check HTTP Extension**: Ensure the `http` extension is enabled in Supabase
5. **Check API URL**: Verify `app.api_url` is set correctly in the database
6. **Check Logs**: Look at Supabase logs and Next.js server logs for errors

### Database Trigger Not Firing

1. Verify the trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'feedback_delivered_notification';
   ```
2. Check if the HTTP extension is enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'http';
   ```
3. Test the trigger function manually:
   ```sql
   -- This won't actually send an email, but will test the function
   SELECT notify_feedback_delivered();
   ```

### Alternative: Client-Side Approach

If the database trigger approach doesn't work, you can call the API route directly from your client code when updating the feedback status. See the example in `components/feedback-form.jsx` or wherever you update the feedback status.

## Security Notes

- The API route should be protected in production (consider adding authentication)
- The database trigger uses `SECURITY DEFINER` to bypass RLS for the HTTP call
- Consider rate limiting the email endpoint to prevent abuse
- Store sensitive keys in environment variables, never commit them to git

## Production Considerations

1. **Rate Limiting**: Implement rate limiting on the email API route
2. **Error Handling**: Set up error monitoring (e.g., Sentry)
3. **Email Queue**: For high volume, consider using a job queue (e.g., Bull, BullMQ)
4. **Monitoring**: Monitor email delivery rates and failures
5. **Backup Plan**: Have a fallback email service or notification method

