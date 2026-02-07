import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchMutation, fetchQuery } from "convex/nextjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, type, userId, lastMessages } = body;

    console.log("🚨 Escalation request:", { sessionId, type, hasUserId: !!userId });

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // Look up Convex user ID from Clerk ID if provided
    let convexUserId = undefined;
    let userName = "Anonymous Visitor";
    let userEmail = "";

    if (userId && type === "user_panel") {
      const user = await fetchQuery(api.users.getUserByClerkId, { clerkUserId: userId });
      if (user) {
        convexUserId = user._id;
        userName = user.fullName || user.firstName || user.email || "Registered User";
        userEmail = user.email || "";
      }
    }

    // Update conversation status to escalated
    await fetchMutation(api.chatbot.escalateConversation, {
      sessionId,
      userId: convexUserId,
    });

    // Create inbox message for the agent
    const lastMsgSummary = (lastMessages || [])
      .map((m: { role: string; content: string }) => `${m.role === "user" ? "Customer" : "AI"}: ${m.content}`)
      .join("\n");

    await fetchMutation(api.chatbot.createChatbotInboxEntry, {
      sessionId,
      type,
      userName,
      userEmail,
      subject: `Chat escalation from ${type === "user_panel" ? "logged-in user" : "website visitor"}`,
      body: lastMsgSummary || "Customer requested to speak with an agent.",
      userId: convexUserId,
    });

    console.log("✅ Escalation stored and inbox entry created");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Escalation error:", error);
    return NextResponse.json(
      { error: "Failed to process escalation", details: String(error) },
      { status: 500 }
    );
  }
}
