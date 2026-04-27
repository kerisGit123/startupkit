import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/community",
  "/storytica(.*)",
  "/billing-policy",
  "/faq",
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
  "/api/ai-analyze(.*)",
  "/api/support/chat(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // Skip auth entirely for KIE AI callback — external webhook, no user session
  if (request.nextUrl.pathname.startsWith('/api/kie-callback')) {
    return;
  }

  // Allow the suspended page itself (and its API counterpart) to load
  // without triggering an infinite redirect loop.
  if (request.nextUrl.pathname === '/suspended') {
    return;
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // After auth, check if the account has been manually suspended by an admin.
  // publicMetadata.suspended is set via the Clerk Admin API from the
  // fraud-check tool's "Suspend account" button.
  const { sessionClaims } = await auth();
  const meta = sessionClaims?.public_metadata as Record<string, unknown> | undefined;
  if (meta?.suspended === true && request.nextUrl.pathname !== '/suspended') {
    const url = request.nextUrl.clone();
    url.pathname = '/suspended';
    return Response.redirect(url);
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
