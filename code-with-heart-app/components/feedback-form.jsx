"use client"

import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { UserSelector } from "@/components/user-selector"
import { Card, CardContent } from "@/components/ui/card"
import { Send } from "lucide-react"

export function FeedbackForm({ onSubmitSuccess, userId, currentUserName }) {
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
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId: recipient,
          text: feedbackText.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(`Failed to submit feedback: ${result?.error || "Unknown error"}`)
        setIsSubmitting(false)
        return
      }

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
      <Card className="transition-all hover:shadow-md border-border/40">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <UserSelector
              value={recipient}
              onValueChange={setRecipient}
              disabled={isSubmitting}
              currentUserName={currentUserName}
              currentUserId={userId}
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
