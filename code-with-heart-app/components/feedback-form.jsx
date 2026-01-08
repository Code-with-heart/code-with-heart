"use client"

import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { UserSelector } from "@/components/user-selector"
import { Card, CardContent } from "@/components/ui/card"
import { Send } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export function FeedbackForm({ onSubmitSuccess, userId }) {
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

      // Validate user is authenticated
      if (!userId) {
        setError("You must be logged in to submit feedback")
        setIsSubmitting(false)
        return
      }

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
      // Feedback is immediately sent for AI review (no draft state)
      const { data, error: insertError } = await supabase
        .from("feedback")
        .insert([
          {
            sender_id: userId,
            recipient_id: recipient,
            original_text: feedbackText.trim(),
            status: 'pending_review'
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

      // Call the success callback if provided
      if (onSubmitSuccess) {
        onSubmitSuccess()
      }

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
    <div className="w-full">
      <Card className="shadow-sm border-border/40">
        <CardContent className="px-4 py-1">
          <form onSubmit={handleSubmit} className="space-y-3">
            <UserSelector
              value={recipient}
              onValueChange={setRecipient}
              disabled={isSubmitting}
            />

            {recipient && (
              <>
                <Textarea
                  id="feedback"
                  placeholder="Write your feedback here..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="min-h-24 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Your feedback will be reviewed by AI and delivered to the recipient.
                </p>
              </>
            )}

            <div className="flex items-center gap-2 justify-end pt-2 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRecipient("")
                  setFeedbackText("")
                  setError("")
                  setSuccess(false)
                }}
                disabled={isSubmitting}
              >
                Clear
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !recipient || !feedbackText}
                size="sm"
                className="gap-2"
              >
                {isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="mt-3 p-3 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-xs text-destructive text-center">
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="mt-3 p-3 bg-primary/10 border border-primary rounded-md animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-xs text-center font-medium">
            Feedback submitted successfully! It will be reviewed and sent to the recipient.
          </p>
        </div>
      )}
    </div>
  )
}
