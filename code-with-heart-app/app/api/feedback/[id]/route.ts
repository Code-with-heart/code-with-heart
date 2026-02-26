import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {  createClient } from "@/utils/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const action = body?.action;

  const supabase = await createClient();

  if (action === "toggle_publish") {
    if (typeof body?.isPublished !== "boolean") {
      return NextResponse.json(
        { error: "isPublished must be a boolean." },
        { status: 400 },
      );
    }

    const isPublished = body.isPublished;
    const updateData: Record<string, any> = {
      is_published: isPublished,
      status: isPublished ? "published" : "delivered",
      published_at: isPublished ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from("feedback")
      .update(updateData)
      .eq("id", id)
      .eq("recipient_id", userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  }

  if (action === "resubmit") {
    const text = body?.text?.trim?.();
    if (!text) {
      return NextResponse.json(
        { error: "Feedback text is required." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("feedback")
      .update({
        original_text: text,
        status: "pending_review",
        ai_feedback: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("sender_id", userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from("feedback")
    .delete()
    .eq("id", id)
    .eq("recipient_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
