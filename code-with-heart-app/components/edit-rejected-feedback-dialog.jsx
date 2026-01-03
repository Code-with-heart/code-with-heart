"use client"

import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export function EditRejectedFeedbackDialog({
  feedback,
  isOpen,
  onOpenChange,
  onSuccess
}) {
  const [editedText, setEditedText] = React.useState(feedback?.original_text || "")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (feedback?.original_text) {
      setEditedText(feedback.original_text)
    }
  }, [feedback])

  const handleResubmit = async () => {
    if (!editedText.trim()) {
      setError("Feedback cannot be empty")
      return
    }

    try {
      setIsSubmitting(true)
      setError("")
      const supabase = createClient()

      // Update feedback: reset to pending_review with new text
      const { error: updateError } = await supabase
        .from("feedback")
        .update({
          original_text: editedText.trim(),
          status: 'pending_review',
          ai_feedback: null, // Clear previous rejection reason
          updated_at: new Date().toISOString(),
        })
        .eq("id", feedback.id)

      if (updateError) {
        throw updateError
      }

      // Success - close dialog and refresh
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error("Error resubmitting feedback:", err)
      setError(`Failed to resubmit: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!feedback) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit and Resubmit Feedback</DialogTitle>
          <DialogDescription>
            Revise your feedback based on the moderation feedback below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Rejection Reason */}
          <div className="border-l-4 border-destructive bg-destructive/10 p-4 rounded">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-destructive mb-1">
                  Reason for rejection:
                </p>
                <p className="text-sm text-destructive/90">
                  {feedback.ai_feedback}
                </p>
              </div>
            </div>
          </div>

          {/* Recipient Info */}
          <div className="text-sm text-muted-foreground">
            <strong>To:</strong> {feedback.recipient?.full_name || "Unknown User"}
          </div>

          {/* Edit Textarea */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Your Feedback
            </label>
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              disabled={isSubmitting}
              className="min-h-32"
              placeholder="Write your revised feedback here..."
            />
          </div>

          {/* Tips */}
          <div className="bg-muted p-3 rounded text-xs">
            <p className="font-semibold mb-1">Tips for constructive feedback:</p>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
              <li>Focus on specific behaviors or outcomes, not personal attributes</li>
              <li>Be respectful and considerate in your language</li>
              <li>Provide actionable suggestions for improvement</li>
              <li>Avoid discriminatory, threatening, or harmful language</li>
            </ul>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResubmit}
            disabled={isSubmitting || !editedText.trim()}
          >
            {isSubmitting ? "Resubmitting..." : "Resubmit for Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
