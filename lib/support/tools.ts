import type Anthropic from "@anthropic-ai/sdk";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export interface ToolContext {
  convex: ConvexHttpClient;
  secret: string;
  // Auth-dependent fields. For anon users, these are empty strings — the bot
  // never calls AUTHED_TOOLS without auth because the API route only binds
  // AUTHED_TOOLS for signed-in requests.
  userId: string;
  companyId: string;
  userEmail: string;
  userName: string;
}

export type ToolName =
  | "get_my_profile"
  | "get_my_subscription"
  | "get_my_credit_balance"
  | "list_my_credit_transactions"
  | "get_ai_model_pricing"
  | "list_my_recent_generations"
  | "get_generation_details"
  | "list_my_invoices"
  | "list_my_support_tickets"
  | "create_support_ticket" // kept for error-fallback auto-ticket only
  | "search_knowledge_base";

const SEARCH_KNOWLEDGE_BASE_TOOL: Anthropic.Tool = {
  name: "search_knowledge_base",
  description:
    "Search the Storytica knowledge base for articles written by the team. Use this FIRST for any factual question about features, pricing (credit packs, subscription tiers), how-to instructions, account policies, or product capabilities — even if you think you know the answer from context. The knowledge base is the source of truth and may contain details not in your baseline instructions. Only fall back to your baseline knowledge if the search returns no relevant articles. Pass concise keyword-style queries (e.g. 'credit pack pricing', 'cancel subscription', 'export PDF') rather than full sentences.",
  input_schema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "Keyword-style search query. Short and focused on the topic. Examples: 'credit pack pricing', 'password reset', 'invoice download'.",
      },
    },
    required: ["query"],
  },
};

export const ANON_TOOLS: Anthropic.Tool[] = [SEARCH_KNOWLEDGE_BASE_TOOL];

export const AUTHED_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_my_profile",
    description:
      "Look up the signed-in user's profile (name, email, account creation date). Use when the user asks about their own account info.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_my_subscription",
    description:
      "Look up the user's current subscription plan, status, renewal date, and whether they've scheduled a cancellation. Use for 'what plan am I on', 'when does my subscription renew', 'did I cancel my subscription' type questions.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_my_credit_balance",
    description:
      "Get the current credit balance for the user's active workspace. Use whenever the user asks how many credits they have left.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "list_my_credit_transactions",
    description:
      "List credit ledger entries (purchases, monthly grants, usage deductions, refunds) for the user's active workspace. Use when the user asks why their balance changed, what they spent credits on, or to track generation costs. IMPORTANT: When the user asks about a specific time period (e.g. 'this month', 'last week'), always set since_date to the start of that period (ISO date string like '2026-04-01'). The response includes a pre-computed 'summary' with exact totals and a 'breakdownByCategory' with per-feature spent/refunded/net — use those numbers directly in your answer. Do NOT re-derive totals from the raw transactions list.",
    input_schema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "How many transactions to return (1-1000, default 500). Use a higher value when the user is very active.",
        },
        since_date: {
          type: "string",
          description:
            "Only return transactions on or after this ISO date (e.g. '2026-04-01'). Use this when the user asks about a specific period like 'this month' or 'last 7 days'.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_ai_model_pricing",
    description:
      "Explain how AI generation pricing works in Storytica — base costs, resolution multipliers, duration multipliers, audio multipliers. Use for 'how much does it cost to generate X' questions. The exact price is always shown to the user in the UI before they generate.",
    input_schema: {
      type: "object",
      properties: {
        model_name: {
          type: "string",
          description:
            "Optional model name the user asked about (e.g. 'seedance', 'veo', 'kling'). If omitted, returns a general pricing overview.",
        },
      },
      required: [],
    },
  },
  {
    name: "list_my_recent_generations",
    description:
      "List the user's most recent storyboard frame generations (image, video, music) with status and model used. Use when the user asks 'where's my video', 'what's the status of my generation', or wants to see their recent work. NOTE: This only covers frame-level generations. AI Analyze operations (image/video/audio analysis) are NOT tracked here — check list_my_credit_transactions for refund entries to find AI Analyze failures.",
    input_schema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "How many recent generations to return (1-20, default 10).",
        },
      },
      required: [],
    },
  },
  {
    name: "get_generation_details",
    description:
      "Get detailed status for a specific generation by its item ID (returned from list_my_recent_generations). Use to check why a generation failed, how many credits it used, or what model produced it.",
    input_schema: {
      type: "object",
      properties: {
        item_id: {
          type: "string",
          description: "The generation item ID (from list_my_recent_generations).",
        },
      },
      required: ["item_id"],
    },
  },
  {
    name: "list_my_invoices",
    description:
      "List the user's recent invoices with amount, currency, status, and date. Use when the user asks for receipts, invoices, or billing history.",
    input_schema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "How many recent invoices to return (1-10, default 5).",
        },
      },
      required: [],
    },
  },
  {
    name: "list_my_support_tickets",
    description:
      "List the user's existing support tickets with status and subject. Use when the user asks about an earlier ticket or asks 'what's the status of my issue'.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  // create_support_ticket removed from AI tools — tickets are created by users
  // through the Support page only. The AI diagnoses issues and directs users
  // to the Support page when it cannot resolve the problem.
  // The tool dispatch still exists for the error-fallback auto-ticket flow.
  SEARCH_KNOWLEDGE_BASE_TOOL,
];

// ── Model pricing table (built from pricing.ts source of truth) ──────────
// User-facing credit costs (what the user pays). These are the final prices
// shown in the UI. NEVER expose supplier costs, factors, or margins.
const MODEL_PRICING: {
  name: string;
  type: string;
  credits: string;
  note?: string;
}[] = [
  // Image models
  { name: "Nano Banana 2", type: "image", credits: "1K: 5, 2K: 10, 4K: 18" },
  { name: "Nano Banana Pro", type: "image", credits: "1K: 18, 2K: 18, 4K: 24" },
  { name: "Z-Image", type: "image", credits: "1", note: "Cheapest image model. Quick drafts." },
  { name: "GPT Image 2", type: "image", credits: "4", note: "Text-to-image or image-to-image." },
  { name: "Nano Banana Edit", type: "image", credits: "5" },
  { name: "Character Edit", type: "image", credits: "6" },
  { name: "Ideogram V3 Reframe", type: "image", credits: "8" },
  { name: "Remove Background", type: "image", credits: "1" },
  { name: "Crisp Upscale", type: "image", credits: "1" },
  { name: "Topaz Upscale (image)", type: "image", credits: "1x: 10, 2x: 12, 4x: 15" },
  // Video models
  { name: "Seedance 1.5 Pro", type: "video", credits: "480P 4s: 5, 720P 4s: 9, 1080P 4s: 19. Audio doubles cost.", note: "Duration multiplier: 8s ×2, 12s ×3." },
  { name: "Seedance 2.0", type: "video", credits: "480P: 8–12/s, 720P: 16–26/s", note: "Per-second. Video-input cheaper than text-only." },
  { name: "Seedance 2.0 Fast", type: "video", credits: "480P: 6–10/s, 720P: 13–21/s", note: "Per-second. Faster, slightly cheaper." },
  { name: "Kling 3.0 Motion", type: "video", credits: "720P: 24, 1080P: 33" },
  { name: "Veo 3.1", type: "video", credits: "Fast: 72, Quality: 300" },
  { name: "Grok Imagine", type: "video", credits: "480P: 2, 720P: 4" },
  { name: "InfiniteTalk (Lip Sync)", type: "video", credits: "480P: 4/s, 720P: 15/s" },
  { name: "Topaz Video Upscale", type: "video", credits: "1x/2x: 10/s, 4x: 17/s" },
  // Audio models
  { name: "AI Music Generator", type: "audio", credits: "15", note: "Up to 4 min, 2 variations." },
  { name: "Cover Song", type: "audio", credits: "15" },
  { name: "Extend Music", type: "audio", credits: "15" },
  { name: "Create Persona", type: "audio", credits: "0", note: "Free." },
  { name: "ElevenLabs TTS", type: "audio", credits: "12 per 1,000 chars (max 5,000)" },
  // AI Analyze
  { name: "AI Analyze Image", type: "analyze", credits: "1" },
  { name: "AI Analyze Video", type: "analyze", credits: "3" },
  { name: "AI Analyze Audio", type: "analyze", credits: "1" },
  { name: "Prompt Enhance", type: "utility", credits: "1" },
];

function renderPricing(modelName?: string): string {
  const footer = `\nThe exact cost is always shown in the UI before you generate. Paid plans include a monthly credit grant plus the ability to top up anytime. Full pricing: /pricing page.`;

  if (!modelName) {
    // Full pricing table
    const lines = MODEL_PRICING.map(
      (m) => `- ${m.name} (${m.type}): ${m.credits} credits${m.note ? ` — ${m.note}` : ""}`
    );
    return `Storytica credit costs by model:\n\n${lines.join("\n")}${footer}`;
  }

  // Find matching model(s)
  const q = modelName.toLowerCase();
  const matches = MODEL_PRICING.filter(
    (m) => m.name.toLowerCase().includes(q) || q.includes(m.name.toLowerCase())
  );

  if (matches.length > 0) {
    const lines = matches.map(
      (m) => `${m.name}: ${m.credits} credits${m.note ? ` — ${m.note}` : ""}`
    );
    return `${lines.join("\n")}${footer}`;
  }

  // No exact match — return full table
  const lines = MODEL_PRICING.map(
    (m) => `- ${m.name} (${m.type}): ${m.credits} credits${m.note ? ` — ${m.note}` : ""}`
  );
  return `No exact match for "${modelName}". Here are all available models:\n\n${lines.join("\n")}${footer}`;
}

function fmtDate(ms: number | null | undefined): string {
  if (!ms) return "unknown";
  return new Date(ms).toISOString().slice(0, 10);
}

function stringifyResult(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export async function dispatchTool(
  toolName: string,
  rawInput: unknown,
  ctx: ToolContext
): Promise<{ output: string; isError: boolean }> {
  const input = (rawInput ?? {}) as Record<string, unknown>;
  try {
    switch (toolName as ToolName) {
      case "get_my_profile": {
        const profile = await ctx.convex.query(api.supportTools.getUserProfile, {
          secret: ctx.secret,
          clerkUserId: ctx.userId,
        });
        if (!profile)
          return { output: "No profile found for this user.", isError: false };
        return {
          output: stringifyResult({
            name: profile.fullName ?? profile.firstName ?? ctx.userName,
            email: profile.email ?? ctx.userEmail,
            accountCreated: fmtDate(profile.createdAt),
            blocked: profile.isBlocked,
          }),
          isError: false,
        };
      }

      case "get_my_subscription": {
        const sub = await ctx.convex.query(
          api.supportTools.getActiveSubscription,
          { secret: ctx.secret, companyId: ctx.companyId }
        );
        if (!sub)
          return {
            output:
              "No active subscription found. This user is on the Free plan.",
            isError: false,
          };
        // Map internal plan keys to friendly names
        const planNames: Record<string, string> = {
          free: "Free",
          pro_personal: "Pro ($39.90/mo annual, $45/mo monthly)",
          business: "Business ($89.90/mo annual, $119/mo monthly)",
        };
        return {
          output: stringifyResult({
            plan: sub.plan,
            planName: planNames[sub.plan] ?? sub.plan,
            status: sub.status ?? "unknown",
            cancelScheduled: sub.cancelAtPeriodEnd,
            renewsOn: fmtDate(sub.currentPeriodEnd),
          }),
          isError: false,
        };
      }

      case "get_my_credit_balance": {
        const res = await ctx.convex.query(api.supportTools.getCreditBalance, {
          secret: ctx.secret,
          companyId: ctx.companyId,
        });
        return {
          output: `Current credit balance: ${res.balance} credits.`,
          isError: false,
        };
      }

      case "list_my_credit_transactions": {
        const limit = Math.min(Math.max(Number(input.limit) || 500, 1), 1000);
        const sinceDate =
          typeof input.since_date === "string" ? input.since_date : undefined;
        const sinceMs = sinceDate ? new Date(sinceDate).getTime() : undefined;

        const rows = await ctx.convex.query(
          api.supportTools.listCreditTransactions,
          {
            secret: ctx.secret,
            companyId: ctx.companyId,
            limit,
            sinceMs: sinceMs && !Number.isNaN(sinceMs) ? sinceMs : undefined,
          }
        );

        if (rows.length === 0)
          return { output: "No credit transactions found for this period.", isError: false };

        // Pre-compute summary so the model doesn't have to do math.
        // Normalize reason strings into short categories so spend + refund
        // for the same feature land in one bucket.
        function normalizeCategory(reason: string | null | undefined): string {
          if (!reason) return "Other";
          const r = reason.toLowerCase();
          if (r.includes("analyze audio")) return "AI Analyze Audio";
          if (r.includes("analyze video")) return "AI Analyze Video";
          if (r.includes("analyze image")) return "AI Analyze Image";
          if (r.includes("video generation") || r.includes("video gen"))
            return "AI Video Generation";
          if (r.includes("image generation") || r.includes("image gen"))
            return "AI Image Generation";
          if (r.includes("music generation") || r.includes("music gen"))
            return "AI Music Generation";
          if (r.includes("cover song")) return "AI Cover Song";
          if (r.includes("lip sync")) return "AI Lip Sync";
          if (r.includes("extend music")) return "AI Extend Music";
          if (r.includes("tts") || r.includes("text-to-speech") || r.includes("elevenlabs"))
            return "Text-to-Speech";
          if (r.includes("upscal")) return "AI Upscaling";
          // KIE callback refunds: "AI Generation Failed - filename.ext"
          // Try to infer the original category from the filename extension
          if (r.includes("ai generation failed")) {
            if (r.endsWith(".mp4") || r.endsWith(".mov") || r.endsWith(".webm"))
              return "AI Video Generation";
            if (r.endsWith(".png") || r.endsWith(".jpg") || r.endsWith(".jpeg") || r.endsWith(".webp"))
              return "AI Image Generation";
            if (r.endsWith(".mp3") || r.endsWith(".wav") || r.endsWith(".ogg"))
              return "AI Music/Audio Generation";
            return "AI Generation (Failed)";
          }
          // Other refund patterns from specific error handlers
          if (r.includes("refund") && r.includes("cover")) return "AI Cover Song";
          if (r.includes("refund") && r.includes("tts")) return "Text-to-Speech";
          if (r.includes("refund") && r.includes("extend")) return "AI Extend Music";
          if (r.includes("refund") && r.includes("music")) return "AI Music Generation";
          if (r.includes("wrongly marked")) return "AI Cover Song";
          if (r.includes("copyrighted")) return "AI Cover Song";
          if (r.includes("refund")) return "Other";
          return reason.length > 40 ? reason.slice(0, 40) : reason;
        }

        // Only count usage + refund rows in the spending summary.
        // Exclude subscription grants, clawbacks, purchases, plan changes etc.
        const usageTypes = new Set(["usage", "refund"]);
        let totalSpent = 0;
        let totalRefunded = 0;
        let totalReceived = 0;
        const categories: Record<
          string,
          { spent: number; refunded: number; attempts: number; failedAttempts: number }
        > = {};
        for (const r of rows) {
          const t = r.tokens ?? 0;
          if (!usageTypes.has(r.type ?? "")) {
            // Count non-usage positive tokens as "received" (grants, purchases)
            if (t > 0) totalReceived += t;
            continue;
          }
          const cat = normalizeCategory(r.reason);
          if (t < 0 && r.type === "usage") {
            totalSpent += Math.abs(t);
            if (!categories[cat])
              categories[cat] = { spent: 0, refunded: 0, attempts: 0, failedAttempts: 0 };
            categories[cat].spent += Math.abs(t);
            categories[cat].attempts += 1;
          } else if (r.type === "refund" && t > 0) {
            totalRefunded += t;
            if (!categories[cat])
              categories[cat] = { spent: 0, refunded: 0, attempts: 0, failedAttempts: 0 };
            categories[cat].refunded += t;
            categories[cat].failedAttempts += 1;
          }
        }

        // Build a simple per-category breakdown with net
        const breakdown = Object.entries(categories).map(([name, c]) => ({
          category: name,
          creditsSpent: c.spent,
          creditsRefunded: c.refunded,
          netCredits: c.spent - c.refunded,
          attempts: c.attempts,
          failedAttempts: c.failedAttempts,
        }));

        // Only include the 20 most recent usage/refund rows in the raw list
        // to keep the AI context small. The summary already covers everything.
        const recentUsageRows = rows
          .filter((r) => usageTypes.has(r.type ?? ""))
          .slice(0, 20);

        const usageCount = rows.filter((r) => usageTypes.has(r.type ?? "")).length;

        const summary = {
          INSTRUCTION: "ONLY use the exact numbers below in your response. Do NOT invent, fabricate, or modify any transaction, amount, or date. If a field is missing, say you do not have that data.",
          period: sinceDate
            ? `Since ${sinceDate}`
            : `Last ${rows.length} transactions`,
          summary: {
            totalCreditsDeducted: totalSpent,
            totalCreditsRefunded: totalRefunded,
            netCreditsUsed: totalSpent - totalRefunded,
            totalCreditsReceived: totalReceived,
            usageTransactionCount: usageCount,
          },
          breakdownByCategory: breakdown,
          recentTransactions: recentUsageRows.map((r) => ({
            date: fmtDate(r.createdAt),
            type: r.type,
            credits: r.tokens,
            reason: r.reason,
          })),
          note: recentUsageRows.length < usageCount
            ? `Showing ${recentUsageRows.length} most recent usage transactions. The summary above covers all ${usageCount} usage/refund transactions.`
            : undefined,
        };
        return { output: stringifyResult(summary), isError: false };
      }

      case "get_ai_model_pricing": {
        const modelName =
          typeof input.model_name === "string" ? input.model_name : undefined;
        return { output: renderPricing(modelName), isError: false };
      }

      case "list_my_recent_generations": {
        const limit = Math.min(Math.max(Number(input.limit) || 10, 1), 20);
        const rows = await ctx.convex.query(
          api.supportTools.listRecentGenerations,
          { secret: ctx.secret, companyId: ctx.companyId, limit }
        );
        if (rows.length === 0)
          return {
            output: "No generations yet in this workspace.",
            isError: false,
          };
        return {
          output: stringifyResult(
            rows.map((r) => ({
              itemId: r.itemId,
              title: r.title,
              status: r.generationStatus,
              image: r.imageGeneration,
              video: r.videoGeneration,
              hasImage: r.hasImage,
              hasVideo: r.hasVideo,
              updatedAt: fmtDate(r.updatedAt),
            }))
          ),
          isError: false,
        };
      }

      case "get_generation_details": {
        const itemId = String(input.item_id || "");
        if (!itemId)
          return {
            output: "Missing item_id. Call list_my_recent_generations first.",
            isError: true,
          };
        const details = await ctx.convex.query(
          api.supportTools.getGenerationDetails,
          {
            secret: ctx.secret,
            companyId: ctx.companyId,
            // biome-ignore lint/suspicious/noExplicitAny: Convex id type
            itemId: itemId as any,
          }
        );
        if (!details)
          return {
            output:
              "Generation not found, or it belongs to a different workspace.",
            isError: false,
          };
        return { output: stringifyResult(details), isError: false };
      }

      case "list_my_invoices": {
        const limit = Math.min(Math.max(Number(input.limit) || 5, 1), 10);
        const rows = await ctx.convex.query(api.supportTools.listInvoices, {
          secret: ctx.secret,
          companyId: ctx.companyId,
          limit,
        });
        if (rows.length === 0)
          return {
            output: "No invoices found in the system. Note: Subscriptions managed through Clerk billing may not generate invoices in this table. The user can check their billing details under Billing in the studio sidebar. Do NOT guess why there are no invoices — just state the fact.",
            isError: false,
          };
        return {
          output: stringifyResult(
            rows.map((r) => ({
              invoiceNo: r.invoiceNo,
              amount: r.amount,
              currency: r.currency,
              status: r.status,
              type: r.invoiceType,
              date: fmtDate(r.createdAt),
            }))
          ),
          isError: false,
        };
      }

      case "list_my_support_tickets": {
        const rows = await ctx.convex.query(api.supportTools.listMyTickets, {
          secret: ctx.secret,
          userId: ctx.userId,
          limit: 10,
        });
        if (rows.length === 0)
          return { output: "No support tickets yet.", isError: false };
        return {
          output: stringifyResult(
            rows.map((r) => ({
              ticketNumber: r.ticketNumber,
              subject: r.subject,
              category: r.category,
              priority: r.priority,
              status: r.status,
              created: fmtDate(r.createdAt),
            }))
          ),
          isError: false,
        };
      }

      case "create_support_ticket": {
        const subject = String(input.subject || "").slice(0, 200);
        const description = String(input.description || "");
        const category = String(input.category || "general") as
          | "billing"
          | "plans"
          | "usage"
          | "general"
          | "credit"
          | "technical"
          | "invoice"
          | "service"
          | "other";
        const priority = String(input.priority || "medium") as
          | "low"
          | "medium"
          | "high"
          | "urgent";

        if (!subject || !description)
          return {
            output: "subject and description are required.",
            isError: true,
          };

        const result = await ctx.convex.mutation(
          api.supportTools.createSupportTicketForUser,
          {
            secret: ctx.secret,
            userId: ctx.userId,
            companyId: ctx.companyId,
            userEmail: ctx.userEmail,
            userName: ctx.userName,
            subject,
            description,
            category,
            priority,
          }
        );
        return {
          output: `Ticket created: ${result.ticketNumber}. The support team has been notified.`,
          isError: false,
        };
      }

      case "search_knowledge_base": {
        const query = String(input.query || "").trim();
        if (!query)
          return {
            output: "search_knowledge_base requires a 'query' argument.",
            isError: true,
          };
        const articles = await ctx.convex.query(
          api.knowledgeBase.searchArticlesUnified,
          { query, limit: 8 }
        );
        if (!articles || articles.length === 0) {
          return {
            output: `No articles found in the knowledge base for "${query}". You can fall back to your baseline knowledge or offer to create a support ticket.`,
            isError: false,
          };
        }
        // Cap to 5 articles, 1200 chars of content each, to keep context small.
        const MAX_ARTICLES = 5;
        const MAX_CONTENT = 1200;
        const trimmed = articles.slice(0, MAX_ARTICLES).map((a) => ({
          title: a.title,
          category: a.category,
          tags: a.tags,
          content:
            a.content.length > MAX_CONTENT
              ? a.content.slice(0, MAX_CONTENT) + "…"
              : a.content,
        }));
        const header =
          articles.length > MAX_ARTICLES
            ? `Found ${articles.length} articles; showing the ${MAX_ARTICLES} most relevant.\n\n`
            : "";
        return {
          output: header + stringifyResult(trimmed),
          isError: false,
        };
      }

      default:
        return { output: `Unknown tool: ${toolName}`, isError: true };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `[support-chat] tool "${toolName}" failed for user=${ctx.userId} company=${ctx.companyId}:`,
      err
    );
    return {
      output: `Tool error: ${msg}. You can tell the user we hit a temporary issue looking that up.`,
      isError: true,
    };
  }
}
