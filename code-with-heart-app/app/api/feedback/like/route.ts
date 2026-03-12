import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }
  
  const body = await request.json();
  const { feedbackId } = body;
  if (!feedbackId) {
    return NextResponse.json(
      { error: "feedbackId is required." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("feedback_likes")
    .select("feedback_id")
    .eq("feedback_id", feedbackId)
    .eq("user_id", userId)
    .single();

  if (existing) {
    await supabase
      .from("feedback_likes")
      .delete()
      .eq("feedback_id", feedbackId)
      .eq("user_id", userId);
  } else {
    await supabase
      .from("feedback_likes")
      .insert({ feedback_id: feedbackId, user_id: userId });
  }

  const { count } = await supabase
    .from("feedback_likes")
    .select("*", { count: "exact", head: true })
    .eq("feedback_id", feedbackId);

  return NextResponse.json({
    likeCount: count ?? 0,
    userLiked: !existing,
  });
}
