import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import type Anthropic from "@anthropic-ai/sdk";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  getAnthropicClient,
  MAX_TOKENS,
  MAX_TOOL_ITERATIONS,
  SUPPORT_MODEL,
} from "@/lib/support/anthropic";
import { buildSystemPrompt } from "@/lib/support/systemPrompt";
import {
  ANON_TOOLS,
  AUTHED_TOOLS,
  dispatchTool,
  type ToolContext,
} from "@/lib/support/tools";

export const runtime = "nodejs";
export const maxDuration = 120;

const RATE_LIMIT_AUTHED = 30;
const RATE_LIMIT_ANON = 10;

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function sseLine(obj: unknown): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`data: ${JSON.stringify(obj)}\n\n`);
}

interface ClientMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  message: string;
  variant: "landing" | "studio";
  sessionId?: string;
  clientHistory?: ClientMessage[];
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const userMessage = (body.message ?? "").trim();
  if (!userMessage) return new Response("message is required", { status: 400 });
  if (userMessage.length > 4000)
    return new Response("message too long (max 4000 chars)", { status: 400 });
  const variant: "landing" | "studio" =
    body.variant === "studio" ? "studio" : "landing";

  const secret = process.env.SUPPORT_INTERNAL_SECRET;
  if (!secret) {
    return new Response("SUPPORT_INTERNAL_SECRET not configured", {
      status: 500,
    });
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return new Response("NEXT_PUBLIC_CONVEX_URL not configured", {
      status: 500,
    });
  }

  const { userId, orgId } = await auth();
  const authed = Boolean(userId);
  const convex = new ConvexHttpClient(convexUrl);

  // Rate limit
  const rateKey = authed ? `user:${userId}` : `ip:${getClientIp(req)}`;
  const rateLimit = authed ? RATE_LIMIT_AUTHED : RATE_LIMIT_ANON;
  const rate = await convex.mutation(
    api.supportChat.checkAndIncrementRateLimit,
    { key: rateKey, limit: rateLimit }
  );
  if (!rate.allowed) {
    return new Response(
      JSON.stringify({
        error: "rate_limited",
        message: `You've reached the chat limit (${rateLimit} messages/hour). Please try again later.`,
        resetAt: rate.resetAt,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  let userProfile: { email: string; name: string } = {
    email: "",
    name: "there",
  };
  let companyId: string | null = null;
  let sessionId: Id<"support_chat_sessions"> | null = null;

  if (authed && userId) {
    const clerkUser = await currentUser();
    userProfile = {
      email: clerkUser?.primaryEmailAddress?.emailAddress ?? "",
      name:
        clerkUser?.firstName ??
        clerkUser?.username ??
        clerkUser?.primaryEmailAddress?.emailAddress?.split("@")[0] ??
        "there",
    };
    companyId = orgId ?? userId;

    if (body.sessionId) {
      sessionId = body.sessionId as Id<"support_chat_sessions">;
    } else {
      sessionId = await convex.mutation(api.supportChat.createSession, {
        userId,
        orgId: orgId ?? undefined,
        variant,
      });
    }

    await convex.mutation(api.supportChat.appendMessage, {
      sessionId,
      role: "user",
      content: userMessage,
    });
  }

  // Build message history for Anthropic
  const anthropicMessages: Anthropic.MessageParam[] = [];

  if (authed && sessionId) {
    const loaded = await convex.query(api.supportChat.getSessionForServer, {
      sessionId,
    });
    if (loaded) {
      for (const m of loaded.messages) {
        if (m.role === "user") {
          anthropicMessages.push({ role: "user", content: m.content });
        } else if (m.role === "assistant") {
          anthropicMessages.push({ role: "assistant", content: m.content });
        }
      }
    }
    // Ensure trailing user message matches the one we just wrote (idempotency)
    if (
      anthropicMessages.length === 0 ||
      anthropicMessages[anthropicMessages.length - 1].role !== "user"
    ) {
      anthropicMessages.push({ role: "user", content: userMessage });
    }
  } else {
    // Anon: use the client-provided history (text only)
    if (Array.isArray(body.clientHistory)) {
      for (const m of body.clientHistory.slice(-12)) {
        if (
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.length > 0
        ) {
          anthropicMessages.push({ role: m.role, content: m.content });
        }
      }
    }
    anthropicMessages.push({ role: "user", content: userMessage });
  }

  const system = buildSystemPrompt({ authed, variant });
  const anthropic = getAnthropicClient();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (sessionId) {
          controller.enqueue(
            sseLine({ type: "session", sessionId: String(sessionId) })
          );
        }

        // Both authed and anon sessions get a tool context so both can search
        // the knowledge base. Only authed sessions receive the full tool set.
        const toolCtx: ToolContext =
          authed && userId && companyId
            ? {
                convex,
                secret,
                userId,
                companyId,
                userEmail: userProfile.email,
                userName: userProfile.name,
              }
            : {
                convex,
                secret,
                userId: "",
                companyId: "",
                userEmail: "",
                userName: "",
              };

        const toolsForRequest = authed ? AUTHED_TOOLS : ANON_TOOLS;

        let assistantFullText = "";
        const allToolCalls: Array<{
          toolName: string;
          toolUseId: string;
          input: string;
          output?: string;
          isError?: boolean;
        }> = [];
        let totalInTokens = 0;
        let totalOutTokens = 0;

        for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
          // Mark the last block of the last message as a cache breakpoint so
          // the cached prefix is tools + system + full conversation history.
          // (Without this, the marker on `system` alone never crosses Haiku's
          // 4096-token minimum and caching never activates.)
          const lastIdx = anthropicMessages.length - 1;
          const messagesForApi: Anthropic.MessageParam[] = anthropicMessages.map(
            (m, i) => {
              if (i !== lastIdx) return m;
              if (typeof m.content === "string") {
                return {
                  role: m.role,
                  content: [
                    {
                      type: "text",
                      text: m.content,
                      cache_control: { type: "ephemeral" },
                    },
                  ],
                };
              }
              if (!Array.isArray(m.content) || m.content.length === 0) return m;
              return {
                role: m.role,
                content: m.content.map((b, bi) =>
                  bi === m.content.length - 1
                    ? { ...b, cache_control: { type: "ephemeral" } }
                    : b
                ),
              };
            }
          );

          const messageStream = anthropic.messages.stream({
            model: SUPPORT_MODEL,
            max_tokens: MAX_TOKENS,
            system: [
              {
                type: "text",
                text: system,
                cache_control: { type: "ephemeral" },
              },
            ],
            tools: toolsForRequest,
            messages: messagesForApi,
          });

          messageStream.on("text", (delta: string) => {
            assistantFullText += delta;
            controller.enqueue(sseLine({ type: "text", delta }));
          });

          const final = await messageStream.finalMessage();
          totalInTokens += final.usage?.input_tokens ?? 0;
          totalOutTokens += final.usage?.output_tokens ?? 0;

          console.log("[support-chat] usage", {
            input: final.usage?.input_tokens,
            cache_write: (final.usage as { cache_creation_input_tokens?: number })
              ?.cache_creation_input_tokens,
            cache_read: (final.usage as { cache_read_input_tokens?: number })
              ?.cache_read_input_tokens,
            output: final.usage?.output_tokens,
          });

          const toolUses = final.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
          );

          if (final.stop_reason === "end_turn" || toolUses.length === 0) {
            // Append assistant turn to history (for any future tool loops — noop here)
            anthropicMessages.push({ role: "assistant", content: final.content });
            break;
          }

          // Append assistant turn with tool_use blocks
          anthropicMessages.push({ role: "assistant", content: final.content });

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const tu of toolUses) {
            controller.enqueue(
              sseLine({
                type: "tool_call",
                name: tu.name,
              })
            );
            const { output, isError } = await dispatchTool(
              tu.name,
              tu.input,
              toolCtx
            );
            allToolCalls.push({
              toolName: tu.name,
              toolUseId: tu.id,
              input: JSON.stringify(tu.input ?? {}),
              output,
              isError,
            });
            controller.enqueue(
              sseLine({
                type: "tool_result",
                name: tu.name,
                isError,
              })
            );
            toolResults.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: output,
              is_error: isError,
            });
          }

          anthropicMessages.push({ role: "user", content: toolResults });
        }

        // Persist assistant message for authed users
        if (authed && sessionId) {
          await convex.mutation(api.supportChat.appendMessage, {
            sessionId,
            role: "assistant",
            content: assistantFullText,
            toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
            tokensIn: totalInTokens,
            tokensOut: totalOutTokens,
          });
        }

        controller.enqueue(sseLine({ type: "done" }));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[support-chat] Anthropic/pipeline failed:", err);

        // Graceful degradation. Stream back a normal assistant message (not
        // an error event) so the chat UI stays seamless. For signed-in users,
        // auto-create a support ticket with their last question so the team
        // can follow up.
        let ticketNumber: string | null = null;
        if (authed && userId && companyId) {
          try {
            const ticketResult = await convex.mutation(
              api.supportTools.createSupportTicketForUser,
              {
                secret,
                userId,
                companyId,
                userEmail: userProfile.email,
                userName: userProfile.name,
                subject:
                  userMessage.length > 80
                    ? userMessage.slice(0, 77) + "..."
                    : userMessage,
                description: `Customer message via support chat:\n\n${userMessage}\n\n[Auto-created because AI assistant was unavailable at ${new Date().toISOString()}. Reason: ${msg}]`,
                category: "technical",
                priority: "medium",
              }
            );
            ticketNumber = ticketResult.ticketNumber;
          } catch (ticketErr) {
            console.error(
              "[support-chat] fallback ticket creation also failed:",
              ticketErr
            );
          }
        }

        let fallback: string;
        if (ticketNumber) {
          fallback = `I'm having a temporary issue reaching my AI brain right now. I've logged your question as ticket **${ticketNumber}** — our support team will email you back within a few hours.\n\nYou can also try sending the message again in a moment.`;
        } else if (authed) {
          fallback = `I'm having a temporary issue reaching my AI brain right now, and I couldn't automatically create a ticket for you. Please try again in a moment. If it keeps happening, visit [your support page](/dashboard) or email our team directly.`;
        } else {
          fallback = `I'm having a temporary issue reaching my AI brain right now. Please try again in a moment. For urgent questions, please [sign up](/sign-up) and reach our support team from your dashboard.`;
        }

        try {
          controller.enqueue(sseLine({ type: "text", delta: fallback }));
        } catch {}

        if (authed && sessionId) {
          try {
            await convex.mutation(api.supportChat.appendMessage, {
              sessionId,
              role: "assistant",
              content: fallback,
            });
          } catch (persistErr) {
            console.error(
              "[support-chat] failed to persist fallback message:",
              persistErr
            );
          }
        }

        try {
          controller.enqueue(sseLine({ type: "done" }));
        } catch {}
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
