import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/dashboard/users(.*)",
  "/api/clerk/webhook(.*)",
  "/api/stripe/webhook(.*)",
  "/api/n8n/callback(.*)",
  "/api/booking/(.*)",
  "/api/chat(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // IP/Country blocking has been moved to login tracking for better performance
  // Blocking is now checked only when users log in, not on every request
  // See: components/LoginTracker.tsx and convex/userActivity.ts
  
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
