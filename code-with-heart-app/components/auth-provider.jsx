"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const AuthContext = React.createContext({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  return React.useContext(AuthContext);
}

export function AuthProvider({ children, initialUser }) {
  const router = useRouter();
  const [user, setUser] = React.useState(initialUser ?? null);
  const [loading, setLoading] = React.useState(!initialUser);

  const fetchUser = React.useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Fetch app-level user record
    const { data } = await supabase
      .from("user")
      .select("id, full_name, email, oidc_sub, tos_accepted_at, data_processing_accepted_at")
      .eq("email", authUser.email?.toLowerCase())
      .maybeSingle();

    setUser(
      data
        ? { ...data, authId: authUser.id, authEmail: authUser.email }
        : { authId: authUser.id, authEmail: authUser.email, consentPending: true }
    );
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (!initialUser) {
      fetchUser();
    }

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
      } else {
        fetchUser();
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUser, initialUser]);

  const handleSignOut = React.useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
    router.refresh();
  }, [router]);

  const value = React.useMemo(
    () => ({
      user,
      loading,
      signOut: handleSignOut,
      refreshUser: fetchUser,
    }),
    [user, loading, handleSignOut, fetchUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
