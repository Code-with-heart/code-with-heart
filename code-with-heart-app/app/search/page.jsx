"use client";

import * as React from "react";
import { Globe, Calendar, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";

export default function SearchPage() {
  const [publishedFeedback, setPublishedFeedback] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    fetchPublishedFeedback();
  }, []);

  const fetchPublishedFeedback = async () => {
    try {
      setLoading(true);
      setError("");
      const supabase = createClient();

      // Fetch all published feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback")
        .select(`
          id,
          original_text,
          modified_text,
          status,
          is_published,
          created_at,
          published_at,
          sender_id,
          recipient_id
        `)
        .eq("is_published", true)
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (feedbackError) {
        throw feedbackError;
      }

      // Fetch user information for all senders and recipients
      const senderIds = [...new Set((feedbackData || []).map(f => f.sender_id))];
      const recipientIds = [...new Set((feedbackData || []).map(f => f.recipient_id))];
      const allUserIds = [...new Set([...senderIds, ...recipientIds])];

      let usersMap = new Map();

      if (allUserIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("user")
          .select("id, full_name, email")
          .in("id", allUserIds);

        if (usersError) {
          console.warn("Error fetching user information:", usersError);
        } else {
          usersMap = new Map((usersData || []).map(u => [u.id, u]));
        }
      }

      // Combine feedback with user data
      const enrichedFeedback = (feedbackData || []).map(fb => ({
        ...fb,
        sender: usersMap.get(fb.sender_id) || null,
        recipient: usersMap.get(fb.recipient_id) || null,
      }));

      setPublishedFeedback(enrichedFeedback);
    } catch (err) {
      console.error("Error fetching published feedback:", err);
      setError(`Failed to load feedback: ${err.message || "An unexpected error occurred. Please try again."}`);
    } finally {
      setLoading(false);
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

  // Filter feedback based on search query
  const getFilteredFeedback = () => {
    if (!searchQuery.trim()) {
      return publishedFeedback;
    }

    const query = searchQuery.toLowerCase().trim();
    return publishedFeedback.filter(item => {
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
  };

  const filteredFeedback = getFilteredFeedback();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground">Loading published feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Find Published Feedback</h1>
        <p className="text-muted-foreground">
          Discover publicly shared feedback from the community
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

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

      {/* Search Results Count */}
      {searchQuery.trim() && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Found {filteredFeedback.length} result{filteredFeedback.length !== 1 ? 's' : ''}
            {searchQuery.trim() && ` for "${searchQuery}"`}
          </p>
        </div>
      )}

      {!searchQuery.trim() && publishedFeedback.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {publishedFeedback.length} published feedback{publishedFeedback.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Feedback Grid */}
      {filteredFeedback.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              {searchQuery.trim() ? (
                <>
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No published feedback found matching your search.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your search terms
                  </p>
                </>
              ) : (
                <>
                  <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No published feedback available yet.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Be the first to share your feedback publicly!
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFeedback.map((item) => (
            <Card
              key={item.id}
              className="flex flex-col border-primary/50"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base mb-1">
                      {item.sender?.full_name || "Unknown User"}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      To: {item.recipient?.full_name || "Unknown User"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md">
                    <Globe className="h-3 w-3" />
                    <span className="text-xs font-medium">Published</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm whitespace-pre-wrap mb-4">
                  {item.modified_text || item.original_text}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(item.published_at || item.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
