import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getAnthropicClient, MAX_TOKENS, MAX_TOOL_ITERATIONS } from "@/lib/support/anthropic";
import { DIRECTOR_TOOLS } from "@/lib/director/agent-tools";
import { dispatchDirectorTool, type DirectorToolContext } from "@/lib/director/tool-executor";
import { buildDirectorSystemPrompt } from "@/lib/director/system-prompt";
import type Anthropic from "@anthropic-ai/sdk";

/**
 * AI Director — SSE streaming endpoint.
 *
 * POST /api/director/chat
 * Body: { projectId, message, currentFrameNumber?, currentSceneId? }
 * Response: text/event-stream (SSE)
 */
export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────
  const { userId: clerkUserId, orgId } = await auth();
  if (!clerkUserId) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await req.json();
  const { projectId, message, currentFrameNumber, currentSceneId } = body;

  if (!projectId || !message) {
    return new Response(
      JSON.stringify({ error: "projectId and message are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── Convex client ─────────────────────────────────────────────────
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  const convex = new ConvexHttpClient(convexUrl);

  // ── Load project context for system prompt ────────────────────────
  const project = await convex.query(api.storyboard.projects.get, {
    id: projectId as any,
  });
  if (!project) {
    return new Response(
      JSON.stringify({ error: "Project not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const companyId = (project as any).companyId || orgId || clerkUserId;

  // Get element summary for system prompt
  const elements = await convex.query(
    api.storyboard.storyboardElements.listByProject,
    { projectId: projectId as any }
  );
  const elementsByType: Record<string, string[]> = {};
  for (const el of elements as any[]) {
    if (!elementsByType[el.type]) elementsByType[el.type] = [];
    elementsByType[el.type].push(el.name);
  }
  const elementSummary = Object.entries(elementsByType)
    .map(([type, names]) => `${type}s: ${names.join(", ")}`)
    .join(". ");

  const items = await convex.query(
    api.storyboard.storyboardItems.listByProject,
    { projectId: projectId as any }
  );
  const sceneIds = new Set((items as any[]).map((i) => i.sceneId));

  // ── Load conversation history ─────────────────────────────────────
  const session = await convex.query(api.directorChat.getSession, {
    projectId: projectId as any,
    userId: clerkUserId,
  });

  const claudeMessages: Anthropic.MessageParam[] = [];
  if (session?.messages) {
    const recent = session.messages.slice(-20);
    for (const msg of recent) {
      if (msg.role === "user" || msg.role === "assistant") {
        claudeMessages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }
  }
  claudeMessages.push({ role: "user", content: message });

  // ── Build system prompt ───────────────────────────────────────────
  const systemPrompt = buildDirectorSystemPrompt({
    projectName: project.name,
    frameCount: items.length,
    sceneCount: sceneIds.size,
    elementSummary,
    currentStyle: (project as any).stylePrompt || (project as any).style || "",
    formatPreset: (project as any).formatPreset || "",
    currentFrameNumber,
    currentSceneId,
  });

  // ── Tool context ──────────────────────────────────────────────────
  const toolCtx: DirectorToolContext = {
    convex,
    projectId,
    companyId,
    userId: clerkUserId,
  };

  // ── SSE streaming response ────────────────────────────────────────
  const anthropic = getAnthropicClient();

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        let currentMessages = claudeMessages;
        let finalOutput = "";
        const toolCallLog: { name: string; input?: unknown; output?: string }[] = [];

        for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
          const response = await anthropic.messages.create({
            model: "claude-haiku-4-5",
            max_tokens: MAX_TOKENS,
            system: systemPrompt,
            tools: DIRECTOR_TOOLS,
            messages: currentMessages,
          });

          // Separate text and tool_use blocks
          const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");
          const textBlocks = response.content.filter((b) => b.type === "text");

          // Stream text blocks
          for (const block of textBlocks) {
            const text = (block as any).text || "";
            if (text) {
              send({ type: "text", delta: text });
              finalOutput += text;
            }
          }

          // If no tool calls, we're done
          if (toolUseBlocks.length === 0 || response.stop_reason === "end_turn") {
            break;
          }

          // Execute tool calls
          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const block of toolUseBlocks) {
            const tb = block as any;
            send({ type: "tool_call", name: tb.name });

            const result = await dispatchDirectorTool(tb.name, tb.input, toolCtx);
            toolCallLog.push({ name: tb.name, input: tb.input, output: result.output });

            send({ type: "tool_result", name: tb.name, isError: result.isError });

            toolResults.push({
              type: "tool_result",
              tool_use_id: tb.id,
              content: result.output,
              is_error: result.isError,
            });
          }

          // Continue conversation with tool results
          currentMessages = [
            ...currentMessages,
            { role: "assistant", content: response.content },
            { role: "user", content: toolResults },
          ];
        }

        send({ type: "done" });

        // ── Persist to Convex ──────────────────────────────────────
        try {
          const sessionId = await convex.mutation(
            api.directorChat.getOrCreateSession,
            {
              projectId: projectId as any,
              userId: clerkUserId,
              companyId,
            }
          );

          await convex.mutation(api.directorChat.appendMessages, {
            sessionId,
            userMessage: message,
            assistantMessage: finalOutput || "I'm here to help with your storyboard.",
            toolCalls: toolCallLog.length > 0 ? toolCallLog : undefined,
          });
        } catch (e) {
          console.error("[ai-director] Failed to persist session:", e);
        }
      } catch (err) {
        console.error("[ai-director] Stream error:", err);
        send({
          type: "error",
          message: err instanceof Error ? err.message : "An error occurred",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
