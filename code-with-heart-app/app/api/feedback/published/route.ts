import { NextResponse } from "next/server";
import { getUserFromSession } from "@/utils/supabase/auth";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { userId } = await getUserFromSession();
  const { data: feedbackData, error: feedbackError } = await supabase
    .from("feedback")
    .select(
      "id, original_text, modified_text, status, is_published, created_at, published_at, sender_id, recipient_id"
    )
    .eq("is_published", true)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (feedbackError) {
    return NextResponse.json({ error: feedbackError.message }, { status: 500 });
  }

  const allUserIds = new Set<string>();
  (feedbackData || []).forEach((fb) => {
    allUserIds.add(fb.sender_id);
    if (fb.recipient_id) allUserIds.add(fb.recipient_id);
  });

  let usersMap = new Map();

  if (allUserIds.size > 0) {
    const { data: usersData, error: usersError } = await supabase
      .from("user")
      .select(
        "id, full_name, faculty:faculty_id (id, name, abbreviation, color)"
      )
      .in("id", Array.from(allUserIds));

    if (!usersError) {
      usersMap = new Map((usersData || []).map((u) => [u.id, u]));
    }
  }

  const feedbackIds = (feedbackData || []).map((fb) => fb.id);

  let likeCountMap = new Map<string, number>();
  let userLikedSet = new Set<string>();

  if (feedbackIds.length > 0) {
    const { data: likesData } = await supabase
      .from("feedback_likes")
      .select("feedback_id")
      .in("feedback_id", feedbackIds);

    (likesData || []).forEach(({ feedback_id }) => {
      likeCountMap.set(feedback_id, (likeCountMap.get(feedback_id) ?? 0) + 1);
    });

    if (userId) {
      const { data: userLikesData } = await supabase
        .from("feedback_likes")
        .select("feedback_id")
        .in("feedback_id", feedbackIds)
        .eq("user_id", userId);

      (userLikesData || []).forEach(({ feedback_id }) => {
        userLikedSet.add(feedback_id);
      });
    }
  }

  const data = (feedbackData || []).map((fb) => ({
    ...fb,
    sender: usersMap.get(fb.sender_id) || null,
    recipient: usersMap.get(fb.recipient_id) || null,
    like_count: likeCountMap.get(fb.id) ?? 0,
    userLiked: userLikedSet.has(fb.id),
  }));

  return NextResponse.json({ data });
}
