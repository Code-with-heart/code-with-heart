"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { UserSelector } from "@/components/user-selector"
import { createClient } from "@/utils/supabase/client"

export function FeedbackForm() {
  const [recipient, setRecipient] = React.useState("")
  const [feedbackText, setFeedbackText] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    setSuccess(false)

    try {
      const supabase = createClient()

      // TODO: Replace with actual authenticated user ID once auth is implemented
      // For now, using Max Mustermann (first test user) as sender
      const MOCK_SENDER_ID = '00000000-0000-0000-0000-000000000001'

      // Validate recipient
      if (!recipient) {
        setError("Please select a recipient")
        setIsSubmitting(false)
        return
      }

      // Validate feedback text
      if (!feedbackText.trim()) {
        setError("Please enter your feedback")
        setIsSubmitting(false)
        return
      }

      // Insert feedback into database
      const { data, error: insertError } = await supabase
        .from("feedback")
        .insert([
          {
            sender_id: MOCK_SENDER_ID,
            recipient_id: recipient,
            original_text: feedbackText.trim(),
            status: 'draft'
          }
        ])
        .select()

      if (insertError) {
        console.error("Error submitting feedback:", insertError)
        setError(`Failed to submit feedback: ${insertError.message}`)
        setIsSubmitting(false)
        return
      }

      console.log("Feedback submitted successfully:", data)

      // Reset form
      setRecipient("")
      setFeedbackText("")
      setSuccess(true)

      // Hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000)

    } catch (err) {
      console.error("Error submitting feedback:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Share constructive feedback with your peers and professors</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient</Label>
              <UserSelector
                value={recipient}
                onValueChange={setRecipient}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Your Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Write your feedback here..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                required
                disabled={isSubmitting}
                className="min-h-32"
              />
              <p className="text-xs text-muted-foreground">
                Your feedback will be reviewed by AI before being sent to ensure constructive communication.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !recipient || !feedbackText}
              className="w-full"
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm text-destructive text-center">
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-primary/10 border border-primary rounded-md">
              <p className="text-sm text-center">
                Feedback submitted successfully! It will be reviewed and sent to the recipient.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
