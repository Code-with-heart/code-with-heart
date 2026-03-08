import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../[...nextauth]/route";
import { createClient } from "../../../../utils/supabase/server";

/**
 * POST /api/auth/consent
 *
 * Body: { accepted: boolean }
 *
 * If accepted === true  → create user record (new users) or update consent timestamps (existing users)
 * If accepted === false → no database changes; client will sign out
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const accepted = body?.accepted === true;

  if (!accepted) {
    // User declined – nothing is saved to the database. Client will sign out.
    return NextResponse.json({ accepted: false });
  }

  // User accepted – persist consent
  const supabase = await createClient();
  const now = new Date().toISOString();
  const pendingProfile = session.user.pendingProfile;

  if (pendingProfile) {
    // New user: create record with consent timestamps in a single write
    const { error } = await supabase
      .from("user")
      .insert({
        oidc_sub: pendingProfile.oidcSub,
        email: pendingProfile.email,
        full_name: pendingProfile.name,
        user_type: "Student",
        tos_accepted_at: now,
        data_processing_accepted_at: now,
      });

    if (error) {
      console.error("Failed to create user on consent:", error);
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }
  } else if (session.user.id) {
    // Existing user: update consent timestamps
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
  } else {
    return NextResponse.json({ error: "Invalid session state" }, { status: 400 });
  }

  return NextResponse.json({ accepted: true });
}
