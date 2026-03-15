import { createClient } from "./server";

/**
 * Get the currently authenticated Supabase auth user and their app-level user record.
 * Returns { authUser, user, userId } or nulls if not authenticated.
 */
export async function getUserFromSession() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { authUser: null, user: null, userId: null };
  }

  // Look up the app-level user record by email
  const email = authUser.email?.toLowerCase();
  if (!email) {
    return { authUser, user: null, userId: null };
  }

  const { data: user } = await supabase
    .from("user")
    .select("id, full_name, email, oidc_sub, tos_accepted_at, data_processing_accepted_at")
    .eq("email", email)
    .maybeSingle();

  return {
    authUser,
    user,
    userId: user?.id ?? null,
  };
}

/**
 * Check if the user has completed consent (tos + data processing).
 */
export function hasConsent(user: { tos_accepted_at?: string | null; data_processing_accepted_at?: string | null } | null): boolean {
  if (!user) return false;
  return Boolean(user.tos_accepted_at && user.data_processing_accepted_at);
}
