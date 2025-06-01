import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/uploadthing",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const pathname = req.nextUrl.pathname;

  // Handle public routes
  if (isPublicRoute(req)) {
    // If user is logged in and tries to access auth pages, redirect to conversations
    if (
      userId &&
      (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up"))
    ) {
      return NextResponse.redirect(new URL("/conversations", req.url));
    }
    return NextResponse.next();
  }

  // Handle protected routes
  if (!userId) {
    // User is not authenticated, redirect to sign-in with return URL
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // If user is on root path, redirect to conversations
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/conversations", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
