import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List all articles for a chatbot type
export const listArticles = query({
  args: { type: v.union(v.literal("frontend"), v.literal("user_panel")) },
  handler: async (ctx, args) => {
    const articles = await ctx.db
      .query("knowledge_base")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();
    
    return articles;
  },
});

// Get a single article
export const getArticle = query({
  args: { articleId: v.id("knowledge_base") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.articleId);
  },
});

// Search articles by keyword (scoped to a single chatbot type — legacy).
export const searchArticles = query({
  args: {
    type: v.union(v.literal("frontend"), v.literal("user_panel")),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const articles = await ctx.db
      .query("knowledge_base")
      .withIndex("by_type", (q) => q.eq("type", args.type).eq("status", "published"))
      .collect();

    const searchLower = args.query.toLowerCase();
    const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0);

    return articles.filter((article) => {
      const titleLower = article.title.toLowerCase();
      const contentLower = article.content.toLowerCase();
      const keywordsLower = article.keywords.map(k => k.toLowerCase());
      const tagsLower = article.tags.map(t => t.toLowerCase());

      // Match if ANY search word is found in title, content, keywords, or tags
      return searchWords.some(word => {
        return titleLower.includes(word) ||
               contentLower.includes(word) ||
               keywordsLower.some(k => k.includes(word)) ||
               tagsLower.some(t => t.includes(word));
      });
    });
  },
});

// Search across BOTH chatbot types with relevance ranking. Used by the
// AI-powered support bot — it treats the knowledge base as a single unified
// source regardless of which tab an admin filed the article under.
//
// Ranking heuristic: keyword/tag hits weight 3×, title hits 2×, content hits 1×.
// More search words matched = higher score.
export const searchArticlesUnified = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const articles = await ctx.db
      .query("knowledge_base")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    const searchLower = args.query.toLowerCase();
    const searchWords = searchLower.split(/\s+/).filter((w) => w.length > 0);
    if (searchWords.length === 0) return [];

    const scored = articles
      .map((article) => {
        const titleLower = article.title.toLowerCase();
        const contentLower = article.content.toLowerCase();
        const keywordsLower = article.keywords.map((k) => k.toLowerCase());
        const tagsLower = article.tags.map((t) => t.toLowerCase());

        let score = 0;
        for (const word of searchWords) {
          if (keywordsLower.some((k) => k.includes(word))) score += 3;
          if (tagsLower.some((t) => t.includes(word))) score += 3;
          if (titleLower.includes(word)) score += 2;
          if (contentLower.includes(word)) score += 1;
        }
        return { article, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    const limit = Math.min(Math.max(args.limit ?? 8, 1), 20);
    return scored.slice(0, limit).map((s) => s.article);
  },
});

// ============================================
// Seed the support-bot starter articles. Idempotent: skips any article
// whose title already exists. Safe to re-run. Admin only.
//
// Run once from the CLI after Convex deploy:
//   npx convex run knowledgeBase:seedSupportStarterArticles
//
// Or from the Convex dashboard Functions tab.
// ============================================
export const seedSupportStarterArticles = mutation({
  args: {},
  handler: async (ctx) => {
    // Intentionally no auth check — this is run manually by the developer
    // from the CLI (`npx convex run knowledgeBase:seedSupportStarterArticles`)
    // where no user session exists. Safe because it's idempotent by title
    // and only inserts a fixed, whitelisted set of articles.
    const identity = await ctx.auth.getUserIdentity();
    const createdBy = identity?.subject ?? "seed-script";

    const STARTER_ARTICLES = [
      {
        title: "Credit Top-Up Packs",
        category: "Pricing",
        tags: ["credits", "top-up", "pricing"],
        keywords: [
          "credits",
          "top-up",
          "top up",
          "pack",
          "buy credits",
          "pricing",
          "price",
          "cost",
          "$9.90",
          "$44.90",
          "$199",
          "1000 credits",
          "5000 credits",
          "25000 credits",
        ],
        content: [
          "Storytica offers three one-time credit top-up packs that you can buy anytime in addition to your subscription:",
          "",
          "- 1,000 credits — USD $9.90",
          "- 5,000 credits — USD $44.90 (Save 9%)",
          "- 25,000 credits — USD $199.00 (Save 20%)",
          "",
          "All packs come out to an effective rate of USD $0.01 per credit. Top-up credits are valid for 12 months from the date of purchase.",
          "",
          "To buy: open the Billing & Subscription page in your dashboard, pick the Credits tab, and click Buy Now on the pack you want.",
        ].join("\n"),
      },
      {
        title: "Subscription Plans",
        category: "Pricing",
        tags: ["plans", "subscription", "pricing", "tiers"],
        keywords: [
          "plans",
          "plan",
          "subscription",
          "tier",
          "tiers",
          "monthly",
          "yearly",
          "annual",
          "pro",
          "starter",
          "free plan",
          "upgrade",
          "downgrade",
        ],
        content: [
          "Storytica has a Free plan and paid subscription plans.",
          "",
          "**Free plan:** 5 AI generations per month, 1 project, PDF export. No credit card required.",
          "",
          "**Paid plans:** Available in both Personal and Organization modes, with monthly or yearly billing. Each paid plan includes a monthly credit grant plus access to more projects, higher resolution options, and team features.",
          "",
          "Full pricing details and plan comparison are on the /pricing page, or in the Plans tab of Billing & Subscription inside the dashboard. Please visit /pricing for the current list of plans and prices.",
        ].join("\n"),
      },
      {
        title: "How Credits Work",
        category: "Credits",
        tags: ["credits", "usage"],
        keywords: [
          "credits",
          "credit",
          "deduct",
          "deducted",
          "usage",
          "generation",
          "how many credits",
          "cost",
          "free plan",
        ],
        content: [
          "Credits are Storytica's unit of AI generation. Every AI image, video, or music generation deducts credits from your workspace balance.",
          "",
          "- The exact cost of a generation is always shown to you in the studio **before** you click Generate — there are no surprise charges.",
          "- Cost depends on the model, resolution, duration, and whether audio is included. Higher-quality outputs cost more.",
          "- Free plan includes 5 generations per month at no credit cost. Paid plans include a monthly credit grant that refills automatically each billing cycle.",
          "- When a generation fails due to a system error, the credits are refunded automatically.",
          "- You can top up anytime with a credit pack (see the Credit Top-Up Packs article).",
        ].join("\n"),
      },
      {
        title: "Refund Policy",
        category: "Billing",
        tags: ["refund", "billing", "cancel"],
        keywords: [
          "refund",
          "money back",
          "return",
          "reimbursement",
          "chargeback",
          "refund policy",
        ],
        content: [
          "If you believe you're entitled to a refund, please contact our support team — we review refund requests case by case.",
          "",
          "General guidelines:",
          "- **Failed generations:** Credits used on generations that fail due to a Storytica or model-side error are refunded automatically.",
          "- **Subscription cancellation:** You can cancel anytime; your plan stays active until the end of the current billing period. We do not typically prorate partial months.",
          "- **Unused credits:** Top-up credits are valid for 12 months and are generally non-refundable once issued.",
          "",
          "To request a refund, open a support ticket with the subject \"Refund request\" and include your order reference or invoice number. Please note: this article is a summary — the final policy and any special cases are decided by our support team.",
        ].join("\n"),
      },
      {
        title: "Cancel Subscription",
        category: "Account",
        tags: ["cancel", "subscription", "unsubscribe"],
        keywords: [
          "cancel",
          "cancellation",
          "unsubscribe",
          "stop",
          "end subscription",
          "downgrade",
        ],
        content: [
          "You can cancel your Storytica subscription at any time:",
          "",
          "1. Sign in and open your dashboard.",
          "2. Go to Billing & Subscription → Plans tab.",
          "3. Click Manage on your current plan and choose Cancel Plan.",
          "4. Follow the confirmation prompts.",
          "",
          "Your paid features stay active until the end of the current billing period. After that, your workspace reverts to the Free plan and any unused monthly-grant credits expire. Top-up credits remain usable until their 12-month validity ends.",
          "",
          "If you run into any issues cancelling, contact our support team and we'll help you out.",
        ].join("\n"),
      },
      {
        title: "Privacy & Data",
        category: "Policy",
        tags: ["privacy", "data", "training"],
        keywords: [
          "privacy",
          "training",
          "data",
          "model training",
          "storage",
          "retention",
          "confidential",
          "secure",
        ],
        content: [
          "Storytica treats your creative work as private:",
          "",
          "- **No AI training on your content.** Your scripts, prompts, uploaded reference images, and generated outputs are never used to train AI models — ours or our providers'.",
          "- **Private file storage.** Your files are stored on Cloudflare R2 with access limited to your workspace and team members you've invited.",
          "- **Team access.** Within an organization, members with Admin or Member roles can see the workspace's projects. Viewer role is read-only.",
          "- **Data retention for lapsed accounts.** Workspaces whose paid subscription has lapsed for more than 90 days may have their R2-stored files purged as part of routine cleanup. Transaction and billing records are retained longer for audit and tax purposes.",
          "",
          "If you have a specific data request (export, deletion, portability), please contact our support team.",
        ].join("\n"),
      },
    ];

    const now = Date.now();
    const existing = await ctx.db.query("knowledge_base").collect();
    const existingTitles = new Set(
      existing.map((a) => a.title.toLowerCase().trim())
    );

    let created = 0;
    let skipped = 0;
    const createdTitles: string[] = [];
    const skippedTitles: string[] = [];

    for (const a of STARTER_ARTICLES) {
      if (existingTitles.has(a.title.toLowerCase().trim())) {
        skipped++;
        skippedTitles.push(a.title);
        continue;
      }
      await ctx.db.insert("knowledge_base", {
        type: "frontend",
        title: a.title,
        content: a.content,
        category: a.category,
        tags: a.tags,
        keywords: a.keywords,
        status: "published",
        version: 1,
        createdAt: now,
        updatedAt: now,
        createdBy,
      });
      created++;
      createdTitles.push(a.title);
    }

    return { created, skipped, createdTitles, skippedTitles };
  },
});

// Create a new article
export const createArticle = mutation({
  args: {
    type: v.union(v.literal("frontend"), v.literal("user_panel")),
    title: v.string(),
    content: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    keywords: v.array(v.string()),
    status: v.union(v.literal("draft"), v.literal("published")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const articleId = await ctx.db.insert("knowledge_base", {
      type: args.type,
      title: args.title,
      content: args.content,
      category: args.category,
      tags: args.tags,
      keywords: args.keywords,
      status: args.status,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: identity.subject,
    });

    return articleId;
  },
});

// Update an existing article
export const updateArticle = mutation({
  args: {
    articleId: v.id("knowledge_base"),
    type: v.optional(v.union(v.literal("frontend"), v.literal("user_panel"))),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    keywords: v.optional(v.array(v.string())),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const { articleId, ...updates } = args;
    const article = await ctx.db.get(articleId);
    
    if (!article) throw new Error("Article not found");

    await ctx.db.patch(articleId, {
      ...updates,
      version: article.version + 1,
      updatedAt: Date.now(),
    });
  },
});

// Delete an article
export const deleteArticle = mutation({
  args: { articleId: v.id("knowledge_base") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.delete(args.articleId);
  },
});

// Get published articles by category
export const getArticlesByCategory = query({
  args: {
    type: v.union(v.literal("frontend"), v.literal("user_panel")),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const articles = await ctx.db
      .query("knowledge_base")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), args.type),
          q.eq(q.field("status"), "published")
        )
      )
      .collect();

    return articles;
  },
});
