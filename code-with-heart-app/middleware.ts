import withAuth from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = (req as any).nextauth?.token
    const isConsentPending = token?.consentPending === true
    const { pathname } = req.nextUrl

    // Authenticated user with pending consent: redirect to /login to show consent dialog
    if (isConsentPending && pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", req.url))
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
  matcher: ["/profile", "/feedback", "/settings", "/search"],
};
