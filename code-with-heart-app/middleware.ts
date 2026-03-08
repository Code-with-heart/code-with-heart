import withAuth from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = (req as any).nextauth?.token
    const isConsentPending = token?.consentPending === true
    const { pathname } = req.nextUrl

    // Authenticated user with pending consent: redirect everything to /consent
    if (isConsentPending && pathname !== "/consent") {
      return NextResponse.redirect(new URL("/consent", req.url))
    }

    // Authenticated user who already consented: don't allow /consent page
    if (!isConsentPending && pathname === "/consent") {
      return NextResponse.redirect(new URL("/", req.url))
    }

    return NextResponse.next()
  },
  {
    pages: {
      signIn: "/login",
    },
  }
)

// Protect specific routes with the middleware
export const config = {
  matcher: ["/profile", "/feedback", "/settings", "/search", "/consent"],
};
