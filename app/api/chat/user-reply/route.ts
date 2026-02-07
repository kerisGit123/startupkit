import { NextRequest, NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export async function POST(req: NextRequest) {
  try {
    const { conversationId, message, sessionId } = await req.json();

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: "conversationId and message are required" },
        { status: 400 }
      );
    }

    // Add the user's message to the conversation using a dedicated mutation
    await fetchMutation(api.chatbot.addUserMessageToConversation, {
      conversationId: conversationId as Id<"chatbot_conversations">,
      message,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User reply error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
