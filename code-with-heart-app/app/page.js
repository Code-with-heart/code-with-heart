"use client";

import * as React from "react";
import { Calendar, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";

export default function HomePage() {
  const [feedback, setFeedback] = React.useState([]);
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

      // Fetch feedback where status is "delivered" OR "published" AND is_published is true
      const { data: feedbackData, error: fetchError } = await supabase
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
        .in("status", ["delivered", "published"])
        .order("published_at", { ascending: false, nullsLast: true })
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Fetch sender and recipient information
      const allUserIds = new Set();
      (feedbackData || []).forEach(fb => {
        allUserIds.add(fb.sender_id);
        if (fb.recipient_id) allUserIds.add(fb.recipient_id);
      });

      let usersMap = new Map();
      
      if (allUserIds.size > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("user")
          .select("id, full_name, email")
          .in("id", Array.from(allUserIds));

        if (usersError) {
          console.warn("Error fetching user information:", usersError);
        } else {
          usersMap = new Map((usersData || []).map(u => [u.id, u]));
        }
      }

      // Combine feedback with user data
      const data = (feedbackData || []).map(fb => ({
        ...fb,
        sender: usersMap.get(fb.sender_id) || null,
        recipient: usersMap.get(fb.recipient_id) || null,
      }));

      setFeedback(data || []);
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

  return (
    <div className="flex flex-1 flex-col p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Code with Heart</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading feedback feed...</p>
        </div>
      ) : feedback.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No published feedback yet. Be the first to share some feedback!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center w-full">
          <div className="w-full max-w-2xl space-y-6">
            {feedback.map((item) => (
              <Card key={item.id} className="w-full">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                          {item.sender?.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <CardTitle className="text-base mb-0">
                            {item.sender?.full_name || "Unknown User"}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            Feedback to {item.recipient?.full_name || "Unknown User"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap mb-4 leading-relaxed">
                    {item.modified_text || item.original_text}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatDate(item.published_at || item.created_at)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
