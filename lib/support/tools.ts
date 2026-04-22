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
  | "create_support_ticket"
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
      "List recent credit ledger entries (purchases, monthly grants, usage deductions, refunds) for the user's active workspace. Use when the user asks why their balance changed, what they spent credits on, or to track recent generation costs.",
    input_schema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "How many recent transactions to return (1-20, default 10).",
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
      "List the user's most recent storyboard generations (image, video, music) with status and model used. Use when the user asks 'where's my video', 'what's the status of my generation', or wants to see their recent work.",
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
  {
    name: "create_support_ticket",
    description:
      "Create a support ticket for the user. Use when you cannot resolve the issue yourself (refund requests, account under review, payment problems, bug reports, explicit human escalation requests). Always include specific context in the description — what the user is trying to do, what went wrong, and any data you already looked up. After success, tell the user the ticket number.",
    input_schema: {
      type: "object",
      properties: {
        subject: {
          type: "string",
          description: "Short title for the ticket, under 80 characters.",
        },
        description: {
          type: "string",
          description:
            "Detailed description of the issue. Include what the user wants, what's blocking them, and any relevant data you already looked up (credit balance, subscription, etc).",
        },
        category: {
          type: "string",
          enum: [
            "billing",
            "plans",
            "usage",
            "general",
            "credit",
            "technical",
            "invoice",
            "service",
            "other",
          ],
          description: "Best-fit category for routing.",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "urgent"],
          description:
            "Priority: low (minor), medium (normal, default), high (blocking work), urgent (account suspended / payment failure).",
        },
      },
      required: ["subject", "description", "category", "priority"],
    },
  },
  SEARCH_KNOWLEDGE_BASE_TOOL,
];

const PRICING_OVERVIEW = `
Storytica credit costs are calculated per generation based on the model, resolution, duration, and whether audio is included. The exact cost is always shown in the UI before you click generate, so there are no surprise charges.

General ranges:
- Image generation (Nano Banana, Flux 2 Pro, etc.): typically 4-15 credits per image, varies by model and resolution.
- Video generation (Seedance 1.5 / 2.0, Kling 3.0, Veo 3.1, Grok): typically 7-80+ credits depending on resolution (480P / 720P / 1080P), duration (4s / 8s / 12s), and audio inclusion. Higher resolution + longer duration = more credits. Audio roughly doubles the cost.
- Upscaling (Topaz): adds credits proportional to the source resolution.
- Music generation (Suno-based): fixed cost per track.

The Free plan gives 5 AI generations per month at no cost. Paid plans include a monthly credit grant plus the ability to top up anytime. Full pricing: /pricing page.
`.trim();

function renderPricing(modelName?: string): string {
  if (!modelName) return PRICING_OVERVIEW;
  const m = modelName.toLowerCase();
  if (m.includes("seedance"))
    return `Seedance pricing: base cost around 7 credits, multiplied by resolution (480P x1, 720P x2, 1080P x4) and duration (4s x1, 8s x2, 12s x4). Audio adds a 2x multiplier. Example: a 8s 720P Seedance 1.5 clip with audio ≈ 7 × 2 × 2 × 2 = 56 credits. The UI always shows the final cost before you generate.\n\n${PRICING_OVERVIEW}`;
  if (m.includes("veo") || m.includes("kling") || m.includes("grok"))
    return `${modelName} pricing uses a similar structure: a base cost multiplied by resolution and duration. Check the cost shown in the studio before generating — it reflects your exact choices.\n\n${PRICING_OVERVIEW}`;
  if (m.includes("banana") || m.includes("flux") || m.includes("gpt"))
    return `${modelName} is an image model. Cost is typically 4-15 credits per image depending on resolution. Exact cost shown in the UI before generating.\n\n${PRICING_OVERVIEW}`;
  if (m.includes("suno") || m.includes("music"))
    return `Music generation (Suno-based) uses a fixed per-track cost. Exact cost shown in the UI before generating.\n\n${PRICING_OVERVIEW}`;
  if (m.includes("topaz") || m.includes("upscale"))
    return `Topaz upscaling adds credits proportional to the source resolution and duration. Exact cost shown before you upscale.\n\n${PRICING_OVERVIEW}`;
  return PRICING_OVERVIEW;
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
              "No active subscription found. This user is likely on the Free plan.",
            isError: false,
          };
        return {
          output: stringifyResult({
            plan: sub.plan,
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
        const limit = Math.min(Math.max(Number(input.limit) || 10, 1), 20);
        const rows = await ctx.convex.query(
          api.supportTools.listCreditTransactions,
          { secret: ctx.secret, companyId: ctx.companyId, limit }
        );
        if (rows.length === 0)
          return { output: "No credit transactions yet.", isError: false };
        return {
          output: stringifyResult(
            rows.map((r) => ({
              date: fmtDate(r.createdAt),
              type: r.type,
              tokens: r.tokens,
              reason: r.reason,
              amountPaid: r.amountPaid,
            }))
          ),
          isError: false,
        };
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
          return { output: "No invoices on file.", isError: false };
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
