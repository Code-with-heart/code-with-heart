import { NextResponse } from "next/server";
import { getUserFromSession } from "@/utils/supabase/auth";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/auth/consent
 *
 * Body: { accepted: boolean }
 *
 * If accepted === true  → create user record (new users) or update consent timestamps (existing users)
 * If accepted === false → no database changes; client will sign out
 */
export async function POST(request: Request) {
  const { authUser, user } = await getUserFromSession();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const accepted = body?.accepted === true;

  if (!accepted) {
    return NextResponse.json({ accepted: false });
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const email = authUser.email?.toLowerCase();
  const fullName =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    email ||
    "HTWG User";

  if (!user) {
    // New user: create record with consent timestamps
    const { error } = await supabase
      .from("user")
      .insert({
        id: authUser.id,
        oidc_sub: authUser.id,
        email,
        full_name: fullName,
        user_type: "Student",
        tos_accepted_at: now,
        data_processing_accepted_at: now,
      });

    if (error) {
      console.error("Failed to create user on consent:", error);
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }
  } else {
    // Existing user: update consent timestamps
    const { error } = await supabase
      .from("user")
      .update({
        tos_accepted_at: now,
        data_processing_accepted_at: now,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Failed to save consent timestamps:", error);
      return NextResponse.json({ error: "Failed to save consent" }, { status: 500 });
    }
  }

  return NextResponse.json({ accepted: true });
}
