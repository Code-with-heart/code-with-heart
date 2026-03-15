import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { user, supabaseResponse, supabase } = await updateSession(request);

  // Not authenticated → redirect to login
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check if the user has completed consent (has an app-level user record with consent)
  const email = user.email?.toLowerCase();
  if (email) {
    const { data: appUser } = await supabase
      .from("user")
      .select("tos_accepted_at, data_processing_accepted_at")
      .eq("email", email)
      .maybeSingle();

    const consentPending =
      !appUser || !appUser.tos_accepted_at || !appUser.data_processing_accepted_at;

    if (consentPending) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/profile", "/feedback", "/settings", "/search"],
};
