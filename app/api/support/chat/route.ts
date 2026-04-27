import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import type Anthropic from "@anthropic-ai/sdk";
import type OpenAI from "openai";
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
import {
  getOpenRouterClient,
  DEEPSEEK_MODEL,
  anthropicToolsToOpenAI,
  anthropicMessagesToOpenAI,
  extractToolCalls,
} from "@/lib/openrouter";

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

// ── OpenRouter / DeepSeek streaming pipeline ────────────────────────────────

async function runDeepSeekPipeline(opts: {
  openrouter: OpenAI;
  system: string;
  messages: { role: "user" | "assistant"; content: string | unknown[] }[];
  tools: Anthropic.Tool[];
  toolCtx: ToolContext;
  controller: ReadableStreamDefaultController;
  maxIterations: number;
}): Promise<{
  assistantFullText: string;
  allToolCalls: Array<{
    toolName: string;
    toolUseId: string;
    input: string;
    output?: string;
    isError?: boolean;
  }>;
  totalInTokens: number;
  totalOutTokens: number;
}> {
  const { openrouter, system, messages, tools, toolCtx, controller, maxIterations } = opts;

  const openaiTools = anthropicToolsToOpenAI(tools);
  let openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: system },
    ...anthropicMessagesToOpenAI(messages),
  ];

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

  for (let iter = 0; iter < maxIterations; iter++) {
    const stream = await openrouter.chat.completions.create({
      model: DEEPSEEK_MODEL,
      max_tokens: MAX_TOKENS,
      messages: openaiMessages,
      tools: openaiTools.length > 0 ? openaiTools : undefined,
      stream: true,
    });

    let currentText = "";
    let currentToolCalls: Map<number, { id: string; name: string; arguments: string }> = new Map();
    let finishReason: string | null = null;
    let promptTokens = 0;
    let completionTokens = 0;

    for await (const chunk of stream) {
      const choice = chunk.choices?.[0];
      if (!choice) continue;

      if (choice.delta?.content) {
        const delta = choice.delta.content;
        currentText += delta;
        assistantFullText += delta;
        controller.enqueue(sseLine({ type: "text", delta }));
      }

      if (choice.delta?.tool_calls) {
        for (const tc of choice.delta.tool_calls) {
          const idx = tc.index;
          if (!currentToolCalls.has(idx)) {
            currentToolCalls.set(idx, { id: tc.id || "", name: tc.function?.name || "", arguments: "" });
          }
          const existing = currentToolCalls.get(idx)!;
          if (tc.id) existing.id = tc.id;
          if (tc.function?.name) existing.name = tc.function.name;
          if (tc.function?.arguments) existing.arguments += tc.function.arguments;
        }
      }

      if (choice.finish_reason) {
        finishReason = choice.finish_reason;
      }

      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens ?? 0;
        completionTokens = chunk.usage.completion_tokens ?? 0;
      }
    }

    totalInTokens += promptTokens;
    totalOutTokens += completionTokens;

    const toolCallList = Array.from(currentToolCalls.values()).filter((tc) => tc.name);

    if (finishReason !== "tool_calls" || toolCallList.length === 0) break;

    // Build assistant message with tool_calls
    openaiMessages.push({
      role: "assistant",
      content: currentText || null,
      tool_calls: toolCallList.map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: { name: tc.name, arguments: tc.arguments },
      })),
    });

    // Execute tools and add results
    for (const tc of toolCallList) {
      controller.enqueue(sseLine({ type: "tool_call", name: tc.name }));

      let input: Record<string, unknown> = {};
      try { input = JSON.parse(tc.arguments || "{}"); } catch {}

      const { output, isError } = await dispatchTool(tc.name, input, toolCtx);

      allToolCalls.push({
        toolName: tc.name,
        toolUseId: tc.id,
        input: tc.arguments,
        output,
        isError,
      });

      controller.enqueue(sseLine({ type: "tool_result", name: tc.name, isError }));

      openaiMessages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: output,
      });
    }
  }

  return { assistantFullText, allToolCalls, totalInTokens, totalOutTokens };
}

// ── Anthropic / Haiku streaming pipeline (fallback) ─────────────────────────

async function runHaikuPipeline(opts: {
  anthropic: Anthropic;
  system: string;
  messages: Anthropic.MessageParam[];
  tools: Anthropic.Tool[];
  toolCtx: ToolContext;
  controller: ReadableStreamDefaultController;
  maxIterations: number;
}): Promise<{
  assistantFullText: string;
  allToolCalls: Array<{
    toolName: string;
    toolUseId: string;
    input: string;
    output?: string;
    isError?: boolean;
  }>;
  totalInTokens: number;
  totalOutTokens: number;
}> {
  const { anthropic, system, messages, tools, toolCtx, controller, maxIterations } = opts;

  const anthropicMessages = [...messages];
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

  for (let iter = 0; iter < maxIterations; iter++) {
    // Cache breakpoint on last message
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
      tools,
      messages: messagesForApi,
    });

    messageStream.on("text", (delta: string) => {
      assistantFullText += delta;
      controller.enqueue(sseLine({ type: "text", delta }));
    });

    const final = await messageStream.finalMessage();
    totalInTokens += final.usage?.input_tokens ?? 0;
    totalOutTokens += final.usage?.output_tokens ?? 0;

    const toolUses = final.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    if (final.stop_reason === "end_turn" || toolUses.length === 0) {
      anthropicMessages.push({ role: "assistant", content: final.content });
      break;
    }

    anthropicMessages.push({ role: "assistant", content: final.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      controller.enqueue(sseLine({ type: "tool_call", name: tu.name }));
      const { output, isError } = await dispatchTool(tu.name, tu.input, toolCtx);
      allToolCalls.push({
        toolName: tu.name,
        toolUseId: tu.id,
        input: JSON.stringify(tu.input ?? {}),
        output,
        isError,
      });
      controller.enqueue(sseLine({ type: "tool_result", name: tu.name, isError }));
      toolResults.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: output,
        is_error: isError,
      });
    }

    anthropicMessages.push({ role: "user", content: toolResults });
  }

  return { assistantFullText, allToolCalls, totalInTokens, totalOutTokens };
}

// ── Main route ──────────────────────────────────────────────────────────────

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

  // Build message history
  const chatMessages: { role: "user" | "assistant"; content: string }[] = [];

  if (authed && sessionId) {
    const loaded = await convex.query(api.supportChat.getSessionForServer, {
      sessionId,
    });
    if (loaded) {
      for (const m of loaded.messages) {
        if (m.role === "user" || m.role === "assistant") {
          chatMessages.push({ role: m.role, content: m.content });
        }
      }
    }
    if (
      chatMessages.length === 0 ||
      chatMessages[chatMessages.length - 1].role !== "user"
    ) {
      chatMessages.push({ role: "user", content: userMessage });
    }
  } else {
    if (Array.isArray(body.clientHistory)) {
      for (const m of body.clientHistory.slice(-12)) {
        if (
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.length > 0
        ) {
          chatMessages.push({ role: m.role, content: m.content });
        }
      }
    }
    chatMessages.push({ role: "user", content: userMessage });
  }

  const system = buildSystemPrompt({ authed, variant });

  // Determine which provider to use: OpenRouter (DeepSeek) preferred, Haiku fallback
  const openrouter = getOpenRouterClient();
  const useDeepSeek = Boolean(openrouter);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (sessionId) {
          controller.enqueue(
            sseLine({ type: "session", sessionId: String(sessionId) })
          );
        }

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

        let result: {
          assistantFullText: string;
          allToolCalls: Array<{
            toolName: string;
            toolUseId: string;
            input: string;
            output?: string;
            isError?: boolean;
          }>;
          totalInTokens: number;
          totalOutTokens: number;
        };

        if (useDeepSeek) {
          try {
            result = await runDeepSeekPipeline({
              openrouter: openrouter!,
              system,
              messages: chatMessages,
              tools: toolsForRequest,
              toolCtx,
              controller,
              maxIterations: MAX_TOOL_ITERATIONS,
            });
            console.log("[support-chat] DeepSeek usage", {
              input: result.totalInTokens,
              output: result.totalOutTokens,
              provider: "openrouter/deepseek",
            });
          } catch (deepseekErr) {
            // DeepSeek failed — fall back to Haiku
            console.warn("[support-chat] DeepSeek failed, falling back to Haiku:", deepseekErr);
            const anthropic = getAnthropicClient();
            result = await runHaikuPipeline({
              anthropic,
              system,
              messages: chatMessages as Anthropic.MessageParam[],
              tools: toolsForRequest,
              toolCtx,
              controller,
              maxIterations: MAX_TOOL_ITERATIONS,
            });
            console.log("[support-chat] Haiku fallback usage", {
              input: result.totalInTokens,
              output: result.totalOutTokens,
              provider: "anthropic/haiku-fallback",
            });
          }
        } else {
          // No OpenRouter key — use Haiku directly
          const anthropic = getAnthropicClient();
          result = await runHaikuPipeline({
            anthropic,
            system,
            messages: chatMessages as Anthropic.MessageParam[],
            tools: toolsForRequest,
            toolCtx,
            controller,
            maxIterations: MAX_TOOL_ITERATIONS,
          });
          console.log("[support-chat] Haiku usage", {
            input: result.totalInTokens,
            output: result.totalOutTokens,
            provider: "anthropic/haiku",
          });
        }

        // Persist assistant message for authed users
        if (authed && sessionId) {
          await convex.mutation(api.supportChat.appendMessage, {
            sessionId,
            role: "assistant",
            content: result.assistantFullText,
            toolCalls: result.allToolCalls.length > 0 ? result.allToolCalls : undefined,
            tokensIn: result.totalInTokens,
            tokensOut: result.totalOutTokens,
          });
        }

        controller.enqueue(sseLine({ type: "done" }));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[support-chat] pipeline failed:", err);

        // Graceful degradation — auto-create support ticket on failure
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
