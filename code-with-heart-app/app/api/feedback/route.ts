import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const recipientId = body?.recipientId;
  const text = body?.text?.trim?.();

  if (!recipientId || !text) {
    return NextResponse.json(
      { error: "Recipient and feedback text are required." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("feedback")
    .insert({
      sender_id: userId,
      recipient_id: recipientId,
      original_text: text,
      status: "pending_review",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
