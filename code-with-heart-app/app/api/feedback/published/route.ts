import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
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

  const data = (feedbackData || []).map((fb) => ({
    ...fb,
    sender: usersMap.get(fb.sender_id) || null,
    recipient: usersMap.get(fb.recipient_id) || null,
  }));

  return NextResponse.json({ data });
}
