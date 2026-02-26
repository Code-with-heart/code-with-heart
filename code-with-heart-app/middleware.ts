import withAuth from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  }
})

// Protect specific routes with the middleware
export const config = {
  matcher: ["/profile", "/feedback", "/settings", "/search"],
};
