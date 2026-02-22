"use client";

import * as React from "react";
import { Globe, Lock, Calendar, Trash2, Search, AlertCircle, Edit3 } from "lucide-react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditRejectedFeedbackDialog } from "@/components/edit-rejected-feedback-dialog";

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [receivedFeedback, setReceivedFeedback] = React.useState([]);
  const [sentFeedback, setSentFeedback] = React.useState([]);
  const [filter, setFilter] = React.useState("all"); // "all", "received", "sent", "rejected"
  const [searchQuery, setSearchQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [updatingIds, setUpdatingIds] = React.useState(new Set());
  const [deletingIds, setDeletingIds] = React.useState(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = React.useState(null);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [feedbackToEdit, setFeedbackToEdit] = React.useState(null);
  const { data: session } = useSession();

  React.useEffect(() => {
    if (session?.user?.id) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/users/me");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to load profile");
      }

      if (result?.data) {
        setCurrentUser(result.data);
        fetchFeedback(result.data.id);
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
      setLoading(false);
    }
  };

  const fetchFeedback = async (userId) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/feedback/user");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to load feedback");
      }

      setReceivedFeedback(result.received || []);
      setSentFeedback(result.sent || []);
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
      const response = await fetch(`/api/feedback/${feedbackToDelete.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to delete feedback");
      }

      setReceivedFeedback(prev => prev.filter(fb => fb.id !== feedbackToDelete.id));
      setDeleteDialogOpen(false);
      setFeedbackToDelete(null);
    } catch (err) {
      console.error("Error deleting feedback:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
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
      const newPublishedState = !currentPublishedState;
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "toggle_publish",
          isPublished: newPublishedState,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to update feedback");
      }

      setReceivedFeedback(prev =>
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
    } catch (err) {
      console.error("Error updating feedback:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
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

  // Filter and search feedback
  const getFilteredFeedback = () => {
    let feedbackList = [];

    // First apply the category filter
    if (filter === "received") {
      feedbackList = receivedFeedback.map(fb => ({ ...fb, type: "received" }));
    } else if (filter === "sent") {
      feedbackList = sentFeedback.filter(fb => fb.status !== "rejected").map(fb => ({ ...fb, type: "sent" }));
    } else if (filter === "rejected") {
      feedbackList = sentFeedback.filter(fb => fb.status === "rejected").map(fb => ({ ...fb, type: "rejected" }));
    } else {
      // "all" - combine both
      feedbackList = [
        ...receivedFeedback.map(fb => ({ ...fb, type: "received" })),
        ...sentFeedback.map(fb => ({ ...fb, type: "sent" }))
      ];
    }

    // Then apply the search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      feedbackList = feedbackList.filter(item => {
        const text = (item.modified_text || item.original_text || "").toLowerCase();
        const senderName = (item.sender?.full_name || "").toLowerCase();
        const recipientName = (item.recipient?.full_name || "").toLowerCase();
        const senderEmail = (item.sender?.email || "").toLowerCase();
        const recipientEmail = (item.recipient?.email || "").toLowerCase();

        return (
          text.includes(query) ||
          senderName.includes(query) ||
          recipientName.includes(query) ||
          senderEmail.includes(query) ||
          recipientEmail.includes(query)
        );
      });
    }

    // Sort by creation date
    return feedbackList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const filteredFeedback = getFilteredFeedback();

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
          View and manage your feedback
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <h2 className="text-2xl font-semibold mb-4">My feedback</h2>

      {/* Search Input */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by content, sender, recipient, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          className="min-w-[100px]"
        >
          All ({receivedFeedback.length + sentFeedback.length})
        </Button>
        <Button
          variant={filter === "received" ? "default" : "outline"}
          onClick={() => setFilter("received")}
          className="min-w-[100px]"
        >
          Received ({receivedFeedback.length})
        </Button>
        <Button
          variant={filter === "sent" ? "default" : "outline"}
          onClick={() => setFilter("sent")}
          className="min-w-[100px]"
        >
          Sent ({sentFeedback.filter(f => f.status !== "rejected").length})
        </Button>
        <Button
          variant={filter === "rejected" ? "destructive" : "outline"}
          onClick={() => setFilter("rejected")}
          className="min-w-[100px]"
        >
          Rejected ({sentFeedback.filter(f => f.status === "rejected").length})
        </Button>
      </div>

      {/* Search Results Count */}
      {searchQuery.trim() && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Found {filteredFeedback.length} result{filteredFeedback.length !== 1 ? 's' : ''}
            {searchQuery.trim() && ` for "${searchQuery}"`}
          </p>
        </div>
      )}

      {/* Feedback Grid */}
      {filteredFeedback.length === 0 ? (
        <Card className="border-dashed border-border/40">
          <CardContent className="p-4">
            <div className="text-center py-12">
              {searchQuery.trim() ? (
                <>
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No feedback found matching your search.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your search terms or filters
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">
                  {filter === "received" && "You haven't received any feedback yet."}
                  {filter === "sent" && "You haven't sent any feedback yet."}
                  {filter === "rejected" && "You don't have any rejected feedback."}
                  {filter === "all" && "No feedback to display."}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFeedback.map((item) => (
            <Card
              key={item.id}
              className="flex flex-col"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base mb-1">
                      {item.type === "received"
                        ? `From: ${item.sender?.full_name || "Unknown User"}`
                        : `To: ${item.recipient?.full_name || "Unknown User"}`
                      }
                    </CardTitle>
                    {/* <p className="text-xs text-muted-foreground">
                      {item.type === "received"
                        ? `To: ${item.recipient?.full_name || "Unknown User"}`
                        : `From: ${item.sender?.full_name || "Unknown User"}`
                      }
                    </p> */}
                  </div>
                  {item.type === "received" && item.is_published && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md">
                      <Globe className="h-3 w-3" />
                      <span className="text-xs font-medium">Published</span>
                    </div>
                  )}
                  {item.type === "sent" && (
                    <span className="px-2 py-1 bg-muted text-muted-foreground rounded-md text-xs font-medium">
                      {item.status}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {/* Show rejection reason for rejected feedback */}
                {item.status === "rejected" && item.ai_feedback && (
                  <div className="border-l-4 border-destructive bg-destructive/10 p-3 rounded mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-destructive mb-1">
                          Requires Revision
                        </p>
                        <p className="text-xs text-destructive/90">
                          {item.ai_feedback}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap mb-4">
                  {item.modified_text || item.original_text}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                  {item.type === "sent" && item.delivered_at && (
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Delivered:</span>
                      <span>{formatDate(item.delivered_at)}</span>
                    </div>
                  )}
                  {item.type === "sent" && item.is_published && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-md">
                      <Globe className="h-3 w-3" />
                      <span>Published by recipient</span>
                    </div>
                  )}
                  {item.type === "received" && (
                    <span className="px-2 py-0.5 bg-muted rounded-md">
                      {item.status}
                    </span>
                  )}
                </div>
                {item.type === "received" && (
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
                      disabled={updatingIds.has(item.id) || deletingIds.has(item.id) || item.is_published}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {item.status === "rejected" && (
                  <div className="flex items-end justify-end gap-2 mt-auto pt-4 border-t">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setFeedbackToEdit(item);
                        setEditDialogOpen(true);
                      }}
                      className="w-full"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit & Resubmit
                    </Button>
                  </div>
                )}
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

      <EditRejectedFeedbackDialog
        feedback={feedbackToEdit}
        isOpen={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          if (currentUser) {
            fetchFeedback(currentUser.id);
          }
        }}
      />
    </div>
  );
}

