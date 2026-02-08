import { NextRequest, NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("cid");
  const email = searchParams.get("e");
  const url = searchParams.get("url");

  if (campaignId && email) {
    try {
      await fetchMutation(api.emails.tracking.recordClick, {
        campaignId: campaignId as Id<"email_campaigns">,
        userEmail: decodeURIComponent(email),
        url: url || "",
      });
    } catch (error) {
      console.error("Failed to record click:", error);
    }
  }

  // Redirect to the actual URL
  const redirectUrl = url ? decodeURIComponent(url) : "/";
  return NextResponse.redirect(redirectUrl, { status: 302 });
}
