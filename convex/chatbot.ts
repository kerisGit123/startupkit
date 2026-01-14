import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get chatbot configuration
export const getConfig = query({
  args: { type: v.union(v.literal("frontend"), v.literal("user_panel")) },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("chatbot_config")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();

    // Return default config if none exists
    if (!config) {
      return {
        type: args.type,
        isActive: false,
        n8nWebhookUrl: "",
        theme: "light" as const,
        position: "right" as const,
        roundness: 12,
        companyName: "Your Company",
        primaryColor: "#854fff",
        secondaryColor: "#6b3fd4",
        backgroundColor: "#ffffff",
        textColor: "#333333",
        userMessageBgColor: "#854fff",
        aiMessageBgColor: "#f1f1f1",
        userMessageTextColor: "#ffffff",
        aiMessageTextColor: "#333333",
        aiBorderColor: "#e0e0e0",
        aiTextColor: "#333333",
        welcomeMessage: "Hi 👋, how can we help?",
        responseTimeText: "We typically respond right away",
        firstBotMessage: "Hi there! How can we help today?",
        placeholderText: "Type your message...",
        showThemeToggle: false,
        showCompanyLogo: true,
        showResponseTime: true,
        enableSoundNotifications: false,
        enableTypingIndicator: true,
        mobileFullScreen: false,
        mobilePosition: "bottom" as const,
        updatedAt: Date.now(),
        updatedBy: "system",
      };
    }

    return config;
  },
});

// Update chatbot configuration
export const updateConfig = mutation({
  args: {
    type: v.union(v.literal("frontend"), v.literal("user_panel")),
    isActive: v.optional(v.boolean()),
    n8nWebhookUrl: v.optional(v.string()),
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"), v.literal("auto"))),
    position: v.optional(v.union(v.literal("left"), v.literal("right"))),
    roundness: v.optional(v.number()),
    companyName: v.optional(v.string()),
    companyLogoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    backgroundColor: v.optional(v.string()),
    textColor: v.optional(v.string()),
    userMessageBgColor: v.optional(v.string()),
    aiMessageBgColor: v.optional(v.string()),
    userMessageTextColor: v.optional(v.string()),
    aiMessageTextColor: v.optional(v.string()),
    aiBorderColor: v.optional(v.string()),
    aiTextColor: v.optional(v.string()),
    welcomeMessage: v.optional(v.string()),
    responseTimeText: v.optional(v.string()),
    firstBotMessage: v.optional(v.string()),
    placeholderText: v.optional(v.string()),
    showThemeToggle: v.optional(v.boolean()),
    showCompanyLogo: v.optional(v.boolean()),
    showResponseTime: v.optional(v.boolean()),
    enableSoundNotifications: v.optional(v.boolean()),
    enableTypingIndicator: v.optional(v.boolean()),
    mobileFullScreen: v.optional(v.boolean()),
    mobilePosition: v.optional(v.union(v.literal("bottom"), v.literal("top"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const { type, ...updates } = args;

    const existing = await ctx.db
      .query("chatbot_config")
      .withIndex("by_type", (q) => q.eq("type", type))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...updates,
        updatedAt: Date.now(),
        updatedBy: identity.subject,
      });
    } else {
      // Create new config with all required fields
      await ctx.db.insert("chatbot_config", {
        type,
        isActive: updates.isActive ?? false,
        n8nWebhookUrl: updates.n8nWebhookUrl ?? "",
        theme: updates.theme ?? "light",
        position: updates.position ?? "right",
        roundness: updates.roundness ?? 12,
        companyName: updates.companyName ?? "Your Company",
        companyLogoUrl: updates.companyLogoUrl,
        logoStorageId: undefined,
        primaryColor: updates.primaryColor ?? "#854fff",
        secondaryColor: updates.secondaryColor ?? "#6b3fd4",
        backgroundColor: updates.backgroundColor ?? "#ffffff",
        textColor: updates.textColor ?? "#333333",
        userMessageBgColor: updates.userMessageBgColor ?? "#854fff",
        aiMessageBgColor: updates.aiMessageBgColor ?? "#f1f1f1",
        userMessageTextColor: updates.userMessageTextColor ?? "#ffffff",
        aiMessageTextColor: updates.aiMessageTextColor ?? "#333333",
        aiBorderColor: updates.aiBorderColor ?? "#e0e0e0",
        aiTextColor: updates.aiTextColor ?? "#333333",
        darkPrimaryColor: undefined,
        darkSecondaryColor: undefined,
        darkBackgroundColor: undefined,
        darkTextColor: undefined,
        welcomeMessage: updates.welcomeMessage ?? "Hi 👋, how can we help?",
        responseTimeText: updates.responseTimeText ?? "We typically respond right away",
        firstBotMessage: updates.firstBotMessage ?? "Hi there! How can we help today?",
        placeholderText: updates.placeholderText ?? "Type your message...",
        showThemeToggle: updates.showThemeToggle ?? false,
        showCompanyLogo: updates.showCompanyLogo ?? true,
        showResponseTime: updates.showResponseTime ?? true,
        enableSoundNotifications: updates.enableSoundNotifications ?? false,
        enableTypingIndicator: updates.enableTypingIndicator ?? true,
        mobileFullScreen: updates.mobileFullScreen ?? false,
        mobilePosition: updates.mobilePosition ?? "bottom",
        updatedAt: Date.now(),
        updatedBy: identity.subject,
      });
    }
  },
});

// Get active conversations for admin
export const getActiveConversations = query({
  args: {
    type: v.union(v.literal("frontend"), v.literal("user_panel")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("chatbot_conversations");

    if (args.status && args.status !== "all") {
      query = query.withIndex("by_type_status", (q) =>
        q.eq("type", args.type).eq("status", args.status as any)
      );
    } else {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }

    const conversations = await query.collect();
    return conversations;
  },
});

// Admin takeover conversation
export const takeoverConversation = mutation({
  args: {
    conversationId: v.id("chatbot_conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    await ctx.db.patch(args.conversationId, {
      status: "admin_takeover",
      takenOverBy: identity.subject as any,
      takenOverAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Add system message
    const systemMessage = {
      role: "admin" as const,
      content: "An admin has joined the conversation",
      timestamp: Date.now(),
      senderId: identity.subject,
      messageType: "system" as const,
    };

    await ctx.db.patch(args.conversationId, {
      messages: [...conversation.messages, systemMessage],
    });
  },
});

// Send admin message
export const sendAdminMessage = mutation({
  args: {
    conversationId: v.id("chatbot_conversations"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const newMessage = {
      role: "admin" as const,
      content: args.message,
      timestamp: Date.now(),
      senderId: identity.subject,
      messageType: "text" as const,
    };

    await ctx.db.patch(args.conversationId, {
      messages: [...conversation.messages, newMessage],
      updatedAt: Date.now(),
    });
  },
});

// Resolve conversation
export const resolveConversation = mutation({
  args: {
    conversationId: v.id("chatbot_conversations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      status: "resolved",
      resolved: true,
      updatedAt: Date.now(),
    });
  },
});

// Update user attributes
export const updateUserAttributes = mutation({
  args: {
    conversationId: v.id("chatbot_conversations"),
    attributes: v.any(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    await ctx.db.patch(args.conversationId, {
      customAttributes: args.attributes,
      userName: args.attributes.name || conversation.userName,
      userEmail: args.attributes.email || conversation.userEmail,
      userPhone: args.attributes.phone || conversation.userPhone,
      userCompany: args.attributes.company || conversation.userCompany,
      updatedAt: Date.now(),
    });
  },
});
