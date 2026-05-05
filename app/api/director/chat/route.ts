import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getAnthropicClient, MAX_TOKENS, MAX_TOOL_ITERATIONS } from "@/lib/support/anthropic";
import { getToolsForMode } from "@/lib/director/agent-tools";
import { dispatchDirectorTool, type DirectorToolContext } from "@/lib/director/tool-executor";
import { buildDirectorSystemPrompt, buildAgentSystemPrompt } from "@/lib/director/system-prompt";
import type Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  try {
    // ── Auth + Convex token ───────────────────────────────────────────
    const authResult = await auth();
    const clerkUserId = authResult.userId;
    const orgId = authResult.orgId ?? null;
    if (!clerkUserId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }

    // Get Convex JWT from Clerk so ConvexHttpClient is authenticated
    let convexToken: string | null = null;
    try {
      convexToken = await authResult.getToken({ template: "convex" });
    } catch {
      // If no "convex" template, try default token
      try { convexToken = await authResult.getToken(); } catch {}
    }

    const body = await req.json();
    const { projectId, message, currentFrameNumber, currentSceneId, mode = "director", scriptMode = "quick" } = body;
    if (!projectId || !message) {
      return new Response(JSON.stringify({ error: "projectId and message are required" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    // ── Authenticated Convex client ─────────────────────────────────
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return new Response(JSON.stringify({ error: "NEXT_PUBLIC_CONVEX_URL not set" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }
    const convex = new ConvexHttpClient(convexUrl);
    if (convexToken) {
      convex.setAuth(convexToken);
    } else {
      console.warn("[ai-director] No Convex token from Clerk — queries may fail");
    }

    // ── Load project context ────────────────────────────────────────
    const project = await convex.query(api.storyboard.projects.get, {
      id: projectId as any,
    });
    if (!project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404, headers: { "Content-Type": "application/json" },
      });
    }

    const companyId = (project as any).companyId || orgId || clerkUserId;

    // ── Agent seat check ────────────────────────────────────────────
    if (mode === "agent") {
      const agentEnabled = await convex.query(api.directorChat.getAgentAccess, {
        companyId,
      });
      if (!agentEnabled) {
        return new Response(
          JSON.stringify({ error: "Agent mode requires an active seat subscription.", code: "AGENT_SEAT_REQUIRED" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

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
          claudeMessages.push({ role: msg.role, content: msg.content });
        }
      }
    }
    claudeMessages.push({ role: "user", content: message });

    // ── System prompt ───────────────────────────────────────────────
    const promptOptions = {
      projectName: project.name,
      frameCount: items.length,
      sceneCount: sceneIds.size,
      elementSummary,
      currentStyle: (project as any).stylePrompt || (project as any).style || "",
      formatPreset: (project as any).formatPreset || "",
      currentFrameNumber,
      currentSceneId,
    };
    const basePrompt = mode === "agent"
      ? buildAgentSystemPrompt(promptOptions)
      : buildDirectorSystemPrompt(promptOptions);
    const systemPromptText = mode === "agent"
      ? `${basePrompt}\n\n---\nUSER SCRIPT MODE: ${scriptMode === "cinematic" ? "CINEMATIC (Sonnet, 18cr/min)" : "QUICK (Haiku, 8cr/min)"}. Always pass quality: "${scriptMode}" when calling invoke_skill. Never ask the user to choose — they already chose via the UI toggle.`
      : basePrompt;

    // Cached system prompt — stable per project within a session
    const systemContent: Anthropic.TextBlockParam[] = [
      { type: "text", text: systemPromptText, cache_control: { type: "ephemeral" } },
    ];

    // Select tools based on mode, cache the full tool list (never changes per request)
    const rawTools = getToolsForMode(mode);
    const tools = rawTools.map((tool, i) =>
      i === rawTools.length - 1
        ? { ...tool, cache_control: { type: "ephemeral" as const } }
        : tool
    ) as Anthropic.Tool[];

    // ── SSE streaming ───────────────────────────────────────────────
    const anthropic = getAnthropicClient();

    const stream = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder();
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        // Tool context — created inside start() so onProgress can call send()
        const toolCtx: DirectorToolContext = {
          convex,
          projectId,
          companyId,
          userId: clerkUserId,
          convexToken: convexToken ?? undefined,
          onProgress: (message: string) => {
            send({ type: "tool_progress", message });
          },
        };

        try {
          let currentMessages = claudeMessages;
          let finalOutput = "";
          const toolCallLog: { name: string; input?: unknown; output?: string }[] = [];
          let nextModel = "claude-haiku-4-5";
          let planApprovalPending = false; // stops the loop when create_execution_plan fires

          for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
            // Cache the stable history prefix: mark second-to-last message so
            // everything before the current volatile exchange is cached.
            const messagesForCall: Anthropic.MessageParam[] = currentMessages.length >= 2
              ? currentMessages.map((msg, i) => {
                  if (i !== currentMessages.length - 2) return msg;
                  const raw = msg.content;
                  const content = typeof raw === "string"
                    ? [{ type: "text" as const, text: raw, cache_control: { type: "ephemeral" as const } }]
                    : (raw as any[]).map((block: any, j: number) =>
                        j === (raw as any[]).length - 1
                          ? { ...block, cache_control: { type: "ephemeral" as const } }
                          : block
                      );
                  return { ...msg, content } as Anthropic.MessageParam;
                })
              : currentMessages;

            const modelForThisCall = nextModel;
            nextModel = "claude-haiku-4-5"; // reset — only stays Sonnet for one iteration

            const response = await anthropic.messages.create({
              model: modelForThisCall,
              max_tokens: MAX_TOKENS,
              system: systemContent,
              tools: tools,
              messages: messagesForCall,
            });

            const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");
            const textBlocks = response.content.filter((b) => b.type === "text");

            for (const block of textBlocks) {
              const text = (block as any).text || "";
              if (text) {
                send({ type: "text", delta: text });
                finalOutput += text;
              }
            }

            if (toolUseBlocks.length === 0 || response.stop_reason === "end_turn") break;

            const toolResults: Anthropic.ToolResultBlockParam[] = [];
            for (const block of toolUseBlocks) {
              const tb = block as any;
              send({ type: "tool_call", name: tb.name });
              const result = await dispatchDirectorTool(tb.name, tb.input, toolCtx);
              toolCallLog.push({ name: tb.name, input: tb.input, output: result.output });
              send({ type: "tool_result", name: tb.name, isError: result.isError });

              // Upgrade to Sonnet for the next loop iteration when invoke_skill succeeds —
              // ensures the Director follows "pass raw text to save_script" instructions precisely.
              if (tb.name === "invoke_skill" && !result.isError) {
                nextModel = "claude-sonnet-4-6";
                // Signal the UI to open the Batch Generate dialog when frames were built
                try {
                  const skillData = JSON.parse(result.output);
                  if (skillData.framesCreated > 0) {
                    send({ type: "open_batch_generate" });
                  }
                } catch { /* non-fatal */ }
              }

              // Check if tool returned a plan approval request — stop the loop so the
              // user must click Approve before any generation tool fires.
              if (tb.name === "create_execution_plan" && !result.isError) {
                try {
                  const planData = JSON.parse(result.output);
                  if (planData.__plan_approval) {
                    send({
                      type: "plan_approval",
                      steps: planData.steps,
                      totalCredits: planData.totalCredits,
                      balance: planData.balance,
                    });
                    planApprovalPending = true;
                  }
                } catch {}
              }

              // Emit quick action buttons for suggest_actions tool
              if (tb.name === "suggest_actions" && !result.isError) {
                try {
                  const data = JSON.parse(result.output);
                  if (data.__quick_actions) {
                    send({ type: "quick_actions", actions: data.actions });
                  }
                } catch {}
              }

              // Vision: if tool returns imageUrl, fetch it and include as image content block
              if (result.imageUrl && !result.isError) {
                const contentBlocks: Anthropic.ToolResultBlockParam["content"] = [
                  { type: "text", text: result.output },
                ];
                try {
                  const imgRes = await fetch(result.imageUrl, { signal: AbortSignal.timeout(10000) });
                  if (imgRes.ok) {
                    let buffer = Buffer.from(await imgRes.arrayBuffer());
                    let mediaType: "image/png" | "image/jpeg" | "image/gif" | "image/webp" = "image/jpeg";

                    const MAX_IMAGE_BYTES = 4.5 * 1024 * 1024; // 4.5 MB (safe margin under 5 MB API limit)
                    if (buffer.byteLength > MAX_IMAGE_BYTES) {
                      // Resize large images: scale down and compress as JPEG
                      const metadata = await sharp(buffer).metadata();
                      const scaleFactor = Math.sqrt(MAX_IMAGE_BYTES / buffer.byteLength);
                      const newWidth = Math.round((metadata.width || 1920) * scaleFactor);
                      buffer = await sharp(buffer)
                        .resize({ width: newWidth, withoutEnlargement: true })
                        .jpeg({ quality: 80 })
                        .toBuffer() as Buffer<ArrayBuffer>;
                      mediaType = "image/jpeg";
                    } else {
                      const ct = imgRes.headers.get("content-type") || "image/png";
                      mediaType = (ct.startsWith("image/") ? ct : "image/png") as typeof mediaType;
                    }

                    const base64 = buffer.toString("base64");
                    contentBlocks.push({
                      type: "image",
                      source: { type: "base64", media_type: mediaType, data: base64 },
                    });
                  }
                } catch (imgErr) {
                  console.warn("[ai-director] Failed to fetch image for vision:", imgErr);
                  contentBlocks.push({ type: "text", text: "(Could not load image for visual analysis)" });
                }
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: tb.id,
                  content: contentBlocks,
                  is_error: false,
                });
              } else {
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: tb.id,
                  content: result.output,
                  is_error: result.isError,
                });
              }
            }

            // Cap large text tool results to ~1200 chars in the accumulated history.
            // Claude already processed the full output in this iteration; subsequent
            // iterations only need the summary, not the full JSON payload.
            const MAX_TOOL_RESULT_HISTORY = 1200;
            const toolResultsForHistory = toolResults.map((tr) => {
              if (typeof tr.content !== "string" || tr.content.length <= MAX_TOOL_RESULT_HISTORY) return tr;
              return {
                ...tr,
                content: tr.content.substring(0, MAX_TOOL_RESULT_HISTORY) +
                  `\n[...${tr.content.length - MAX_TOOL_RESULT_HISTORY} chars omitted]`,
              };
            });

            currentMessages = [
              ...currentMessages,
              { role: "assistant", content: response.content },
              { role: "user", content: toolResultsForHistory },
            ];

            // Plan approval gates all further tool execution — stop here and wait for user.
            if (planApprovalPending) break;
          }

          send({ type: "done", toolsUsed: toolCallLog.map((t) => t.name) });

          // Persist session
          try {
            const sessionId = await convex.mutation(
              api.directorChat.getOrCreateSession,
              { projectId: projectId as any, userId: clerkUserId!, companyId }
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
          send({ type: "error", message: err instanceof Error ? err.message : "An error occurred" });
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
  } catch (outerErr) {
    console.error("[ai-director] Unhandled error:", outerErr);
    return new Response(
      JSON.stringify({ error: outerErr instanceof Error ? outerErr.message : "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
