import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/community",
  "/storytica(.*)",
  "/billing-policy",
  "/sign-in(.*)",
  "/sign-up(.*)",

  "/api/clerk/webhook(.*)",
  "/api/stripe/webhook(.*)",
  "/api/n8n/callback(.*)",
  "/api/n8n-webhook(.*)",
  "/api/kie-callback(.*)",
  "/api/storyboard/kie-callback(.*)",
  "/api/booking/(.*)",
  "/api/chat(.*)",
  "/api/inpaint(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // Skip auth entirely for KIE AI callback — external webhook, no user session
  if (request.nextUrl.pathname.startsWith('/api/kie-callback')) {
    return;
  }

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
