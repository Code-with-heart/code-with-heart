"use client";

import * as React from "react";
import { Globe, Lock, Calendar, User, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

const MOCK_SENDER_ID = '00000000-0000-0000-0000-000000000001';

export default function ProfilePage() {
  const [feedback, setFeedback] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [updatingIds, setUpdatingIds] = React.useState(new Set());
  const [deletingIds, setDeletingIds] = React.useState(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = React.useState(null);

  React.useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError("");
      const supabase = createClient();

      // Fetch feedback where this user is the recipient and status is "delivered"
      const { data: feedbackData, error: fetchError } = await supabase
        .from("feedback")
        .select(`
          id,
          original_text,
          modified_text,
          status,
          is_published,
          created_at,
          updated_at,
          published_at,
          sender_id
        `)
        .eq("recipient_id", MOCK_SENDER_ID)
        .eq("status", "delivered")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Fetch sender information for each feedback
      const senderIds = [...new Set((feedbackData || []).map(f => f.sender_id))];
      let usersMap = new Map();
      
      if (senderIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("user")
          .select("id, full_name, email")
          .in("id", senderIds);

        if (usersError) {
          console.warn("Error fetching sender information:", usersError);
        } else {
          usersMap = new Map((usersData || []).map(u => [u.id, u]));
        }
      }

      // Combine feedback with sender data
      const data = (feedbackData || []).map(fb => ({
        ...fb,
        sender: usersMap.get(fb.sender_id) || null,
      }));

      setFeedback(data || []);
    } catch (err) {
      console.error("Error fetching feedback:", err);
      setError(`Failed to load feedback: ${err.message || "An unexpected error occurred. Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (feedbackItem) => {
    setFeedbackToDelete(feedbackItem);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!feedbackToDelete) return;

    try {
      setDeletingIds(prev => new Set(prev).add(feedbackToDelete.id));
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from("feedback")
        .delete()
        .eq("id", feedbackToDelete.id)
        .eq("recipient_id", MOCK_SENDER_ID); // Ensure we can only delete our own feedback

      if (deleteError) {
        console.error("Error deleting feedback:", deleteError);
        setError(`Failed to delete feedback: ${deleteError.message}`);
        setDeleteDialogOpen(false);
        setFeedbackToDelete(null);
      } else {
        // Remove from local state
        setFeedback(prev => prev.filter(fb => fb.id !== feedbackToDelete.id));
        setDeleteDialogOpen(false);
        setFeedbackToDelete(null);
      }
    } catch (err) {
      console.error("Error deleting feedback:", err);
      setError("An unexpected error occurred. Please try again.");
      setDeleteDialogOpen(false);
      setFeedbackToDelete(null);
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(feedbackToDelete?.id);
        return next;
      });
    }
  };

  const handleTogglePublish = async (feedbackId, currentPublishedState) => {
    try {
      setUpdatingIds(prev => new Set(prev).add(feedbackId));
      const supabase = createClient();

      const newPublishedState = !currentPublishedState;
      const updateData = {
        is_published: newPublishedState,
        status: newPublishedState ? "published" : "delivered",
      };

      if (newPublishedState) {
        updateData.published_at = new Date().toISOString();
      } else {
        updateData.published_at = null;
      }

      const { error: updateError } = await supabase
        .from("feedback")
        .update(updateData)
        .eq("id", feedbackId)
        .eq("recipient_id", MOCK_SENDER_ID); // Ensure we can only update our own feedback

      if (updateError) {
        console.error("Error updating feedback:", updateError);
        setError(`Failed to update feedback: ${updateError.message}`);
      } else {
        // Update local state
        setFeedback(prev =>
          prev.map(fb =>
            fb.id === feedbackId
              ? {
                  ...fb,
                  is_published: newPublishedState,
                  status: newPublishedState ? "published" : "delivered",
                  published_at: newPublishedState ? new Date().toISOString() : null,
                }
              : fb
          )
        );
      }
    } catch (err) {
      console.error("Error updating feedback:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(feedbackId);
        return next;
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground">Loading your feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-muted-foreground">
          View and manage feedback you've received
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {feedback.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                You haven't received any feedback yet.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {feedback.map((item) => (
            <Card
              key={item.id}
              className={cn(
                "flex flex-col",
                item.is_published && "border-primary/50"
              )}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base mb-1">
                      {item.sender?.full_name || "Unknown User"}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {item.sender?.email || "No email"}
                    </p>
                  </div>
                  {item.is_published && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md">
                      <Globe className="h-3 w-3" />
                      <span className="text-xs font-medium">Published</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm whitespace-pre-wrap mb-4">
                  {item.modified_text || item.original_text}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-muted rounded-md">
                    {item.status}
                  </span>
                </div>
                <div className="flex items-end justify-between gap-2 mt-auto pt-4 border-t">
                  <Button
                    variant={item.is_published ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleTogglePublish(item.id, item.is_published)}
                    disabled={updatingIds.has(item.id) || deletingIds.has(item.id)}
                  >
                    {updatingIds.has(item.id) ? (
                      "Updating..."
                    ) : item.is_published ? (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4 mr-2" />
                        Publish
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(item)}
                    disabled={updatingIds.has(item.id) || deletingIds.has(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Feedback</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this feedback? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {feedbackToDelete && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-2">From: {feedbackToDelete.sender?.full_name || "Unknown User"}</p>
              <p className="text-sm line-clamp-3">
                {feedbackToDelete.modified_text || feedbackToDelete.original_text}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setFeedbackToDelete(null);
              }}
              disabled={deletingIds.has(feedbackToDelete?.id)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deletingIds.has(feedbackToDelete?.id)}
            >
              {deletingIds.has(feedbackToDelete?.id) ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

