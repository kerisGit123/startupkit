import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { ConvexHttpClient } from "convex/browser";
import { getAnthropicClient, MAX_TOKENS, MAX_TOOL_ITERATIONS } from "@/lib/support/anthropic";
import { BOOKING_TOOLS } from "@/lib/booking/agent-tools";
import { dispatchBookingTool } from "@/lib/booking/tool-executor";
import { buildBookingSystemPrompt } from "@/lib/booking/system-prompt";
import type Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chatId, message, userId, type = "frontend", userEmail, userName } = body;

    if (!chatId || !message) {
      return NextResponse.json(
        { output: "Missing chatId or message." },
        { status: 200 }
      );
    }

    console.log("[chat] Claude booking agent — session:", chatId);

    const anthropic = getAnthropicClient();
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
    const convex = new ConvexHttpClient(convexUrl);

    // Load conversation history from Convex for multi-turn context
    const conversation = await fetchQuery(api.chatbot.getConversationBySession, {
      sessionId: chatId,
    });

    // Build Claude message history from stored conversation
    const claudeMessages: Anthropic.MessageParam[] = [];
    if (conversation?.messages) {
      const msgs = conversation.messages as Array<{ role: string; content: string }>;
      // Take last 20 messages to keep context manageable
      const recent = msgs.slice(-20);
      for (const msg of recent) {
        if (msg.role === "user" || msg.role === "assistant") {
          claudeMessages.push({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          });
        }
      }
    }

    // Add the current user message
    claudeMessages.push({ role: "user", content: message });

    // Build system prompt
    const now = new Date();
    const systemPrompt = buildBookingSystemPrompt({
      currentDateTime: now.toISOString(),
      timezone: "Asia/Kuala_Lumpur",
      isLoggedIn: type === "user_panel" && !!userEmail,
      userName,
      userEmail,
    });

    // Claude tool-use loop
    let currentMessages = claudeMessages;
    let finalOutput = "";

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        tools: BOOKING_TOOLS,
        messages: currentMessages,
      });

      // Check if Claude wants to use a tool
      const toolUseBlocks = response.content.filter(
        (b) => b.type === "tool_use"
      );

      if (toolUseBlocks.length === 0) {
        // No tool calls — extract text response
        const textBlocks = response.content.filter(
          (b) => b.type === "text"
        );
        finalOutput =
          textBlocks.map((b) => (b as any).text).join("\n") || "I'm here to help!";
        break;
      }

      // Execute each tool call and build tool_result messages
      const assistantContent = response.content;
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolBlock of toolUseBlocks) {
        const tb = toolBlock as any;
        console.log(`[booking-chat] tool: ${tb.name}`, tb.input);
        const result = await dispatchBookingTool(tb.name, tb.input, convex);
        toolResults.push({
          type: "tool_result",
          tool_use_id: tb.id,
          content: result.output,
          is_error: result.isError,
        });
      }

      // Continue the conversation with tool results
      currentMessages = [
        ...currentMessages,
        { role: "assistant", content: assistantContent },
        { role: "user", content: toolResults },
      ];

      // Safety: if we hit the iteration limit, respond gracefully
      if (i === MAX_TOOL_ITERATIONS - 1) {
        finalOutput =
          "I ran into a bit of trouble processing that. Could you try again?";
      }
    }

    // Store conversation in Convex
    try {
      let convexUserId: any = undefined;
      if (userId && type === "user_panel") {
        const user = await fetchQuery(api.users.getUserByClerkId, {
          clerkUserId: userId,
        });
        if (user) convexUserId = user._id;
      }

      await fetchMutation(api.chatbot.storeConversation, {
        sessionId: chatId,
        type,
        userMessage: message,
        aiResponse: finalOutput,
        userId: convexUserId,
      });
    } catch (convexError) {
      console.error("[chat] Failed to store conversation:", convexError);
    }

    return NextResponse.json({ output: finalOutput });
  } catch (error) {
    console.error("[chat] Error:", error);
    return NextResponse.json(
      {
        output:
          "Sorry, I'm having trouble right now. Please try again in a moment.",
      },
      { status: 200 }
    );
  }
}
