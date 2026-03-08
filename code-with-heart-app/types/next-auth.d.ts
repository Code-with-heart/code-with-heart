import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      oidcSub?: string;
      consentPending?: boolean;
      pendingProfile?: {
        oidcSub: string;
        email: string;
        name: string;
      };
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    oidcSub?: string;
    consentPending?: boolean;
    pendingProfile?: {
      oidcSub: string;
      email: string;
      name: string;
    };
  }
}
