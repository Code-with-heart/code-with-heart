import NextAuth, { type NextAuthOptions } from "next-auth";
import { createClient } from "../../../../utils/supabase/server";

const allowedEmailDomains = ["htwg-konstanz.de", "stud.htwg-konstanz.de"];

const isAllowedEmail = (email?: string | null) => {
  if (!email) return false;
  const domain = email.toLowerCase().split("@").pop();
  return Boolean(domain && allowedEmailDomains.includes(domain));
};

/**
 * Look up an existing user by oidc_sub or email.
 * If found, updates name/email and links oidc_sub when needed.
 * Does NOT create records for new users – creation is deferred to the consent step.
 */
const findAndUpdateExistingUser = async (profile: Record<string, any>) => {
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
    .select("id, oidc_sub, tos_accepted_at, data_processing_accepted_at")
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
      .select("id, full_name, email, tos_accepted_at, data_processing_accepted_at")
      .single();

    if (error) {
      console.error("Failed to update user by oidc_sub:", error);
      return null;
    }

    return data ?? existingBySub;
  }

  const { data: existingByEmail, error: emailError } = await supabase
    .from("user")
    .select("id, oidc_sub, tos_accepted_at, data_processing_accepted_at")
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
      .select("id, full_name, email, tos_accepted_at, data_processing_accepted_at")
      .single();

    if (error) {
      console.error("Failed to link oidc_sub to user:", error);
      return null;
    }

    return data ?? existingByEmail;
  }

  // No existing user found – new user; record will be created after consent.
  return null;
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
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
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
        params: {
          scope: "openid email profile",
          claims: {
            id_token: {
              email: { essential: true },
              preferred_username: { essential: true },
              given_name: { essential: false },
              family_name: { essential: false },
            },
          },
        },
      },
      issuer: "https://idp-test.htwg-konstanz.de",
      token: "https://idp-test.htwg-konstanz.de/idp/profile/oidc/token",
      jwks_endpoint:
        "https://idp-test.htwg-konstanz.de/idp/profile/oidc/keyset",
      userinfo: "https://idp-test.htwg-konstanz.de/idp/profile/oidc/userinfo",
      idToken: true,
      profile(profile) {
        console.log("Test OIDC provider profile:", profile);
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          given_name: profile.given_name,
          family_name: profile.family_name,
          preferred_username: profile.preferred_username,
        };
      },
    },
  ],
  callbacks: {
    async signIn({ profile }) {
      console.log("Signing in user with profile:", profile);
      if (!isAllowedEmail(profile?.email)) {
        console.log("Email domain not allowed for user:", profile?.email);
        return false;
      }
      console.log("Email domain allowed for user:", profile?.email);
      // Allow sign-in for all valid HTWG emails.
      // DB record creation for new users is deferred to the consent step.
      return true;
    },
    async jwt({ token, account, profile, trigger }) {
      console.log("JWT callback - account:", account, "profile:", profile, "trigger:", trigger);

      // On session.update() call: re-fetch user from DB (e.g. after consent)
      if (trigger === "update") {
        if (token.oidcSub) {
          const supabase = await createClient();
          const { data } = await supabase
            .from("user")
            .select("id, tos_accepted_at, data_processing_accepted_at")
            .eq("oidc_sub", token.oidcSub as string)
            .single();
          if (data?.id) {
            token.userId = data.id;
            token.consentPending = !data.tos_accepted_at || !data.data_processing_accepted_at;
            delete token.pendingProfile;
          }
        }
        return token;
      }

      if (account && profile) {
        const p = profile as Record<string, any>;
        const existingUser = await findAndUpdateExistingUser(p);

        if (existingUser?.id) {
          token.userId = existingUser.id;
          token.consentPending =
            !existingUser.tos_accepted_at || !existingUser.data_processing_accepted_at;
        } else {
          // New user – store profile in token, defer DB creation to consent
          token.consentPending = true;
          token.pendingProfile = {
            oidcSub: p.sub,
            email: p.email?.toLowerCase?.() || p.email,
            name: p.name || p.preferred_username || p.email || "HTWG User",
          };
        }

        token.oidcSub = p.sub;
        token.name = p.name || token.name;
        token.email = p.email || token.email;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("Session callback - token:", token);
      if (session.user) {
        session.user.id = token.userId as string | undefined;
        session.user.oidcSub = token.oidcSub as string | undefined;
        session.user.consentPending = token.consentPending as boolean | undefined;
        session.user.pendingProfile = token.pendingProfile;
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
