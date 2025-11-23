import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/signin", "/signup"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // If user is not authenticated and trying to access a protected route
  if (!req.auth && !isPublicRoute) {
    const signInUrl = new URL("/signin", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // If user is authenticated and trying to access signin/signup, redirect to home
  if (req.auth && isPublicRoute) {
    const homeUrl = new URL("/", req.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
