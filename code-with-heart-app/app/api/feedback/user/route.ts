import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  const { data: receivedData, error: receivedError } = await supabase
    .from("feedback")
    .select(
      "id, original_text, modified_text, status, is_published, created_at, updated_at, published_at, sender_id"
    )
    .eq("recipient_id", userId)
    .in("status", ["delivered", "published"])
    .order("created_at", { ascending: false });

  if (receivedError) {
    return NextResponse.json({ error: receivedError.message }, { status: 500 });
  }

  const { data: sentData, error: sentError } = await supabase
    .from("feedback")
    .select(
      "id, original_text, modified_text, status, is_published, created_at, updated_at, published_at, delivered_at, recipient_id, ai_feedback"
    )
    .eq("sender_id", userId)
    .order("created_at", { ascending: false });

  if (sentError) {
    return NextResponse.json({ error: sentError.message }, { status: 500 });
  }

  const senderIds = [...new Set((receivedData || []).map((f) => f.sender_id))];
  const recipientIds = [...new Set((sentData || []).map((f) => f.recipient_id))];
  const allUserIds = [...new Set([...senderIds, ...recipientIds])];

  let usersMap = new Map();

  if (allUserIds.length > 0) {
    const { data: usersData } = await supabase
      .from("user")
      .select(
        "id, full_name, email, faculty:faculty_id (id, name, abbreviation, color)"
      )
      .in("id", allUserIds);

    usersMap = new Map((usersData || []).map((u) => [u.id, u]));
  }

  const received = (receivedData || []).map((fb) => ({
    ...fb,
    sender: usersMap.get(fb.sender_id) || null,
  }));

  const sent = (sentData || []).map((fb) => ({
    ...fb,
    recipient: usersMap.get(fb.recipient_id) || null,
  }));

  return NextResponse.json({ received, sent });
}
