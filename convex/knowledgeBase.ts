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

// Search articles by keyword
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
    
    return articles.filter((article) => {
      const titleMatch = article.title.toLowerCase().includes(searchLower);
      const contentMatch = article.content.toLowerCase().includes(searchLower);
      const keywordMatch = article.keywords.some((k) => k.toLowerCase().includes(searchLower));
      const tagMatch = article.tags.some((t) => t.toLowerCase().includes(searchLower));
      
      return titleMatch || contentMatch || keywordMatch || tagMatch;
    });
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
