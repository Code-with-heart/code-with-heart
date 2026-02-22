"use client";

import * as React from "react";
import { Globe, Calendar, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SearchPage() {
  const [publishedFeedback, setPublishedFeedback] = React.useState([]);
  const [faculties, setFaculties] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [facultyFilter, setFacultyFilter] = React.useState("all");
  const [currentUserFaculty, setCurrentUserFaculty] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    fetchFaculties();
    fetchCurrentUserFaculty();
    fetchPublishedFeedback();
  }, []);

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

  const fetchCurrentUserFaculty = async () => {
    try {
      const response = await fetch("/api/users/me");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to load user");
      }

      if (result?.data?.faculty) {
        setCurrentUserFaculty(result.data.faculty);
      }
    } catch (err) {
      console.error("Error fetching current user faculty:", err);
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

      setPublishedFeedback(result.data || []);
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

  // Filter feedback based on faculty and search query
  const getFilteredFeedback = () => {
    let result = publishedFeedback;

    // Apply faculty filter first
    if (facultyFilter !== "all") {
      if (facultyFilter === "my-faculty") {
        if (currentUserFaculty?.id) {
          result = result.filter(fb =>
            fb.sender?.faculty?.id === currentUserFaculty.id ||
            fb.recipient?.faculty?.id === currentUserFaculty.id
          );
        }
      } else {
        // Specific faculty (facultyFilter is faculty ID)
        result = result.filter(fb =>
          fb.sender?.faculty?.id === facultyFilter ||
          fb.recipient?.faculty?.id === facultyFilter
        );
      }
    }

    // Then apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(item => {
        const text = (item.modified_text || item.original_text || "").toLowerCase();
        const senderName = (item.sender?.full_name || "").toLowerCase();
        const recipientName = (item.recipient?.full_name || "").toLowerCase();
        return (
          text.includes(query) ||
          senderName.includes(query) ||
          recipientName.includes(query)
        );
      });
    }

    return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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
            placeholder="Search by content, sender, or recipient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Faculty Filter */}
      {!loading && faculties.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Filter by Faculty</h2>
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
        </div>
      )}

      {/* Search and Filter Results Count */}
      {(searchQuery.trim() || facultyFilter !== "all" || filteredFeedback.length !== publishedFeedback.length) && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {searchQuery.trim() || facultyFilter !== "all" ? (
              <>
                Found {filteredFeedback.length} result{filteredFeedback.length !== 1 ? 's' : ''}
                {searchQuery.trim() && ` for "${searchQuery}"`}
                {filteredFeedback.length !== publishedFeedback.length && ` (${publishedFeedback.length} total)`}
              </>
            ) : (
              `Showing ${publishedFeedback.length} published feedback${publishedFeedback.length !== 1 ? 's' : ''}`
            )}
          </p>
        </div>
      )}

      {/* Feedback Grid */}
      {filteredFeedback.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              {searchQuery.trim() || facultyFilter !== "all" ? (
                <>
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No published feedback found matching your {searchQuery.trim() && facultyFilter !== "all" ? "search and filters" : searchQuery.trim() ? "search" : "filters"}.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your {searchQuery.trim() && facultyFilter !== "all" ? "search terms or filters" : searchQuery.trim() ? "search terms" : "filters"}
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
            <Card key={item.id} className="flex flex-col" >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base mb-1">
                      {item.recipient?.full_name || "Unknown User"}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      From: {item.sender?.full_name || "Unknown User"}
                    </p>
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
