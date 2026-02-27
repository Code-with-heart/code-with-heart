import NextAuth, { type NextAuthOptions } from "next-auth";
import { createClient } from "../../../../utils/supabase/server";

const allowedEmailDomains = ["htwg-konstanz.de", "stud.htwg-konstanz.de"];

const isAllowedEmail = (email?: string | null) => {
  if (!email) return false;
  const domain = email.toLowerCase().split("@").pop();
  return Boolean(domain && allowedEmailDomains.includes(domain));
};

const upsertUserFromProfile = async (profile: Record<string, any>) => {
  const supabase = await createClient();
  const oidcSub = profile?.sub;
  const email = profile?.email?.toLowerCase?.() || profile?.email;
  const fullName =
    profile?.name || profile?.preferred_username || email || "HTWG User";

  if (!oidcSub || !email) {
    return null;
  }

  const { data: existingBySub, error: subError } = await supabase
    .from("user")
    .select("id, oidc_sub")
    .eq("oidc_sub", oidcSub)
    .maybeSingle();

  if (subError) {
    console.error("Failed to look up user by oidc_sub:", subError);
    return null;
  }

  if (existingBySub?.id) {
    const { data, error } = await supabase
      .from("user")
      .update({ full_name: fullName, email })
      .eq("id", existingBySub.id)
      .select("id, full_name, email")
      .single();

    if (error) {
      console.error("Failed to update user by oidc_sub:", error);
      return null;
    }

    return data ?? existingBySub;
  }

  const { data: existingByEmail, error: emailError } = await supabase
    .from("user")
    .select("id, oidc_sub")
    .eq("email", email)
    .maybeSingle();

  if (emailError) {
    console.error("Failed to look up user by email:", emailError);
    return null;
  }

  if (existingByEmail?.id) {
    const { data, error } = await supabase
      .from("user")
      .update({ oidc_sub: oidcSub, full_name: fullName })
      .eq("id", existingByEmail.id)
      .select("id, full_name, email")
      .single();

    if (error) {
      console.error("Failed to link oidc_sub to user:", error);
      return null;
    }

    return data ?? existingByEmail;
  }

  const { data, error } = await supabase
    .from("user")
    .insert({
      oidc_sub: oidcSub,
      email,
      full_name: fullName,
      user_type: "Student",
    })
    .select("id, full_name, email")
    .single();

  if (error) {
    console.error("Failed to create user from profile:", error);
    return null;
  }

  return data ?? null;
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    {
      id: "htwg-oidc",
      name: "HTWG OIDC",
      type: "oauth",
      wellKnown: "https://idp.htwg-konstanz.de/idp/profile/oidc/configuration",
      clientId: process.env.HTWG_OIDC_CLIENT_ID,
      clientSecret: process.env.HTWG_OIDC_CLIENT_SECRET,
      authorization: { params: { scope: "openid email profile" } },
      idToken: true,

      checks: ["pkce", "state"],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
    {
      id: "htwg-oidc-test",
      name: "HTWG OIDC Test",
      type: "oauth",
      clientId: process.env.HTWG_TEST_OIDC_CLIENT_ID,
      clientSecret: process.env.HTWG_TEST_OIDC_CLIENT_SECRET,
      authorization: {
        url: "https://idp-test.htwg-konstanz.de/idp/profile/oidc/authorize",
        params: { scope: "openid email profile" },
      },
      issuer: "https://idp-test.htwg-konstanz.de",
      token: "https://idp-test.htwg-konstanz.de/idp/profile/oidc/token",
      jwks_endpoint:
        "https://idp-test.htwg-konstanz.de/idp/profile/oidc/keyset",
      userinfo: "https://idp-test.htwg-konstanz.de/idp/profile/oidc/userinfo",
      idToken: true,
      checks: ["pkce", "state"],
      profile(profile) {
        console.log("Test OIDC provider profile:", profile);
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!isAllowedEmail(profile?.email)) {
        return false;
      }
      console.log("Signing in user with profile:", profile);
      const userRecord = await upsertUserFromProfile(
        profile as Record<string, any>,
      );
      return Boolean(userRecord?.id);
    },
    async jwt({ token, account, profile }) {
      console.log("JWT callback - account:", account, "profile:", profile);
      if (account && profile) {
        const userRecord = await upsertUserFromProfile(
          profile as Record<string, any>,
        );
        if (!userRecord?.id) {
          console.error("Unable to map OIDC profile to user record.");
        }
        token.userId = userRecord?.id || token.userId;
        token.oidcSub = profile.sub;
        token.name = profile.name || token.name;
        token.email = profile.email || token.email;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("Session callback - token:", token);
      if (session.user) {
        session.user.id = token.userId as string | undefined;
        session.user.oidcSub = token.oidcSub as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
