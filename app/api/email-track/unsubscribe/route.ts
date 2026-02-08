import { NextRequest, NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("e");

  if (email) {
    try {
      await fetchMutation(api.emails.tracking.recordUnsubscribe, {
        userEmail: decodeURIComponent(email),
      });
    } catch (error) {
      console.error("Failed to record unsubscribe:", error);
    }
  }

  // Show a simple confirmation page
  const html = `<!DOCTYPE html>
<html><head><title>Unsubscribed</title>
<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb}
.card{background:#fff;border-radius:12px;padding:48px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1);max-width:400px}
h1{font-size:24px;margin:0 0 8px}p{color:#6b7280;margin:0}
.check{width:64px;height:64px;background:#dcfce7;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:32px}</style>
</head><body><div class="card"><div class="check">✓</div><h1>Unsubscribed</h1><p>You have been successfully unsubscribed from our mailing list.</p></div></body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}
