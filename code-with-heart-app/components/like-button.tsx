"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export type LikeButtonProps = {
  feedbackId: string;
  initialLiked: boolean;
  initialCount: number;
  onUpdate?: (feedbackId: string, data: { userLiked: boolean; like_count: number }) => void;
};

export function LikeButton({ feedbackId, initialLiked, initialCount, onUpdate }: LikeButtonProps) {
  const { user } = useAuth();
  const [liked, setLiked] = React.useState(initialLiked);
  const [count, setCount] = React.useState(initialCount);
  const inFlight = React.useRef(false);

  React.useEffect(() => setLiked(initialLiked), [initialLiked]);
  React.useEffect(() => setCount(initialCount), [initialCount]);

  const handleClick = async () => {
    if (inFlight.current) {
      return;
    }
    inFlight.current = true;

    const prevLiked = liked;
    const prevCount = count;
    setLiked(!prevLiked);
    setCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      const response = await fetch("/api/feedback/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update like status");
      }

      const result = await response.json();
      setLiked(result.userLiked);
      setCount(result.likeCount);
      onUpdate?.(feedbackId, { userLiked: result.userLiked, like_count: result.likeCount });
    } catch (error) {
      console.error("Error liking feedback:", error);
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      inFlight.current = false;
    }
  };

  return (
    <div className="mt-4 flex items-center gap-2">
      <button
        disabled={!user}
        className="group h-6 w-6 flex items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        onClick={handleClick}
      >
        <Heart
          className={`h-5 w-5 transition-colors ${liked ? "text-red-500" : "text-gray-400 group-hover:text-gray-700"}`}
          fill={liked ? "currentColor" : "none"}
          stroke={liked ? "none" : "currentColor"}
        />
      </button>
      <span className="text-sm text-gray-500">
        {count} Like{count === 1 ? "" : "s"}
      </span>
    </div>
  );
}
