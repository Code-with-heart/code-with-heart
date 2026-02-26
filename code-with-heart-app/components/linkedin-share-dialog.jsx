"use client";

import * as React from "react";
import { Linkedin, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

function prettifyFeedbackText(feedback) {
  const senderName = feedback?.sender?.full_name || feedback?.sender?.email || "someone";
  const role = feedback?.sender?.user_type || "";
  const feedbackText = feedback?.modified_text || feedback?.original_text || "";

  return `I received feedback from ${role} ${senderName}:\n\n${feedbackText}\n\nThank you for the great feedback!\n\n#htwg #Feedback`;
}

export function LinkedInShareDialog({ open, onOpenChange, feedback, onShare }) {
  const [text, setText] = React.useState("");
  const [sharing, setSharing] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open && feedback) {
      setText(prettifyFeedbackText(feedback));
      setError("");
    }
  }, [open, feedback]);

  const handleShare = async () => {
    if (!feedback?.id) return;
    setSharing(true);
    setError("");
    try {
      const res = await fetch("/api/linkedin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId: feedback.id, customText: text }),
      });

      if (res.status === 402) {
        window.location.href = "/api/linkedin/connect";
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to share to LinkedIn");
      } else {
        onShare?.(feedback.id);
        onOpenChange(false);
      }
    } catch (err) {
      setError("An unexpected error occurred while sharing to LinkedIn.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Linkedin className="h-5 w-5 text-blue-600" />
            Share to LinkedIn
          </DialogTitle>
          <DialogDescription>
            Review and edit the post before sharing it to your LinkedIn profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label htmlFor="linkedin-post-text">Post text</Label>
          <Textarea
            id="linkedin-post-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="resize-none"
            placeholder="Write something..."
          />
          <p className="text-xs text-muted-foreground text-right">{text.length} characters</p>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sharing}>
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={sharing || !text.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {sharing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Linkedin className="h-4 w-4 mr-2" />
                Share
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
