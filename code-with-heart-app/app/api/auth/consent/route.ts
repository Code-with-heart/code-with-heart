import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../[...nextauth]/route";
import { createClient } from "../../../../utils/supabase/server";

/**
 * POST /api/auth/consent
 *
 * Body: { accepted: boolean }
 *
 * If accepted === true  → write tos_accepted_at + data_processing_accepted_at to DB
 * If accepted === false → delete the user record from DB (abort registration)
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const accepted = body?.accepted === true;

  const supabase = await createClient();

  if (!accepted) {
    // Verify that consent is actually pending before deleting the account.
    // This prevents already-consented users from silently deleting their account.
    const { data: userRecord, error: fetchError } = await supabase
      .from("user")
      .select("tos_accepted_at, data_processing_accepted_at")
      .eq("id", session.user.id)
      .single();

    if (fetchError) {
      console.error("Failed to fetch user for consent check:", fetchError);
      return NextResponse.json({ error: "Failed to verify consent status" }, { status: 500 });
    }

    if (userRecord?.tos_accepted_at || userRecord?.data_processing_accepted_at) {
      return NextResponse.json(
        { error: "Consent has already been given and cannot be revoked through this endpoint" },
        { status: 403 },
      );
    }

    // User declined during onboarding – remove account so they are not registered
    const { error } = await supabase
      .from("user")
      .delete()
      .eq("id", session.user.id);

    if (error) {
      console.error("Failed to delete user on consent decline:", error);
      return NextResponse.json({ error: "Failed to remove account" }, { status: 500 });
    }

    return NextResponse.json({ accepted: false });
  }

  // User accepted – persist consent timestamps
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("user")
    .update({
      tos_accepted_at: now,
      data_processing_accepted_at: now,
    })
    .eq("id", session.user.id);

  if (error) {
    console.error("Failed to save consent timestamps:", error);
    return NextResponse.json({ error: "Failed to save consent" }, { status: 500 });
  }

  return NextResponse.json({ accepted: true });
}
