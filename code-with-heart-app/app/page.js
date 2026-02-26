"use client";

import * as React from "react";
import { MessageSquare } from "lucide-react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeedbackForm } from "@/components/feedback-form";
import { UserAvatar } from "@/components/user-avatar";

export default function HomePage() {
  const [feedback, setFeedback] = React.useState([]);
  const [faculties, setFaculties] = React.useState([]);
  const [facultyFilter, setFacultyFilter] = React.useState("all");
  const [currentUserFaculty, setCurrentUserFaculty] = React.useState(null);
  const [currentUser, setCurrentUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const { data: session } = useSession();

  React.useEffect(() => {
    fetchFaculties();
    fetchPublishedFeedback();
  }, []);

  React.useEffect(() => {
    if (session?.user?.id) {
      fetchCurrentUser();
    } else {
      setCurrentUser(null);
      setCurrentUserFaculty(null);
    }
  }, [session?.user?.id]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/users/me");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to load user");
      }

      if (result?.data) {
        setCurrentUser(result.data);
        setCurrentUserFaculty(result.data.faculty || null);
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  const fetchFaculties = async () => {
    try {
      const response = await fetch("/api/faculties");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to load faculties");
      }

      setFaculties(result.data || []);
    } catch (err) {
      console.error("Error fetching faculties:", err);
    }
  };

  const fetchPublishedFeedback = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/feedback/published");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to load feedback");
      }

      setFeedback(result.data || []);
    } catch (err) {
      console.error("Error fetching published feedback:", err);
      setError(
        `Failed to load feedback: ${err.message || "An unexpected error occurred. Please try again."}`
      );
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

  const getRelativeTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return formatDate(dateString);
  };

  const FacultyBadge = ({ faculty, size = "default" }) => {
    if (!faculty) return null;
    const sizeClasses = size === "small"
      ? "text-[9px] px-1 py-px"
      : "text-[10px] px-1.5 py-0.5";
    return (
      <span
        className={`${sizeClasses} rounded-full border font-medium`}
        style={faculty.color ? {
          backgroundColor: `${faculty.color}50`,
          borderColor: faculty.color,
          color: `color-mix(in srgb, ${faculty.color} 100%, black 40%)`
        } : {}}
      >
        {faculty.abbreviation}
      </span>
    );
  };

  const getFilteredFeedback = () => {
    if (facultyFilter === "all") return feedback;

    if (facultyFilter === "my-faculty") {
      if (!currentUserFaculty?.id) return feedback;
      return feedback.filter(fb =>
        fb.recipient?.faculty?.id === currentUserFaculty.id
      );
    }

    // Specific faculty (facultyFilter is faculty ID)
    return feedback.filter(fb =>
      fb.recipient?.faculty?.id === facultyFilter
    );
  };

  const filteredFeedback = getFilteredFeedback();

  return (
    <div className="flex flex-1 flex-col bg-muted/20">
      {/* Feedback Form Section - only shown when logged in */}
      {currentUser ? (
        <div className="w-full bg-muted/20 sticky top-0 z-10">
          <div className="container max-w-3xl mx-auto px-4 py-3">
            <FeedbackForm
              onSubmitSuccess={fetchPublishedFeedback}
              userId={currentUser.id}
              currentUserName={currentUser.full_name}
            />
          </div>
        </div>
      ) : (
        <div className="w-full bg-muted/20">
          <div className="container max-w-3xl mx-auto px-4 py-3">
            <Card className="border-dashed border-border/40">
              <CardContent className="p-4">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Share Your Appreciation</h3>
                  <p className="text-muted-foreground mb-6">
                    Sign in to give heartfelt feedback to your fellow students and university community
                  </p>
                  <Button asChild size="lg">
                    <a href="/login">Sign in to get started</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Published Feedback Section */}
      <div className="container max-w-3xl mx-auto px-4 py-6">

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Faculty Filter */}
        {!loading && faculties.length > 0 && (
          <div className="mb-4 bg-background rounded-lg border p-4 shadow-sm">
            <h3 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Filter by Recipient's Faculty
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={facultyFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFacultyFilter("all")}
              >
                All
              </Button>
              {currentUserFaculty && (
                <Button
                  variant={facultyFilter === "my-faculty" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFacultyFilter("my-faculty")}
                >
                  My Faculty ({currentUserFaculty.abbreviation})
                </Button>
              )}
              {faculties.map((faculty) => (
                <Button
                  key={faculty.id}
                  variant={facultyFilter === faculty.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFacultyFilter(faculty.id)}
                  style={facultyFilter === faculty.id && faculty.color ? { backgroundColor: faculty.color, borderColor: faculty.color } : {}}
                >
                  {faculty.abbreviation}
                </Button>
              ))}
            </div>
            {filteredFeedback.length !== feedback.length && (
              <p className="text-xs text-muted-foreground mt-3">
                Showing {filteredFeedback.length} of {feedback.length} posts
              </p>
            )}
          </div>
        )}

        {/* Feedback Feed */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border/40 animate-pulse">
                <CardContent>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="aspect-square size-10 rounded-lg bg-muted"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                    <div className="h-3 bg-muted rounded w-4/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredFeedback.length === 0 ? (
          <Card className="border-dashed border-border/40">
            <CardContent>
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {facultyFilter === "all"
                    ? "No published feedback yet. Be the first to share!"
                    : "No feedback found for the selected faculty filter."
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredFeedback.map((item) => (
              <Card key={item.id} className="transition-all hover:shadow-md border-border/40">
                <CardContent>
                  <div className="flex items-start gap-3 mb-4">
                    <UserAvatar fullName={item.recipient?.full_name} size="large" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">
                            {item.recipient?.full_name || "Unknown User"}
                          </span>
                          <FacultyBadge faculty={item.recipient?.faculty} />
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {getRelativeTime(item.published_at || item.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs text-muted-foreground">
                          from: {item.sender?.full_name || "Unknown User"}
                        </p>
                        <FacultyBadge faculty={item.sender?.faculty} size="small" />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
                    {item.modified_text || item.original_text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
