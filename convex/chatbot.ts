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
    // Dark theme colors
    darkPrimaryColor: v.optional(v.string()),
    darkSecondaryColor: v.optional(v.string()),
    darkBackgroundColor: v.optional(v.string()),
    darkTextColor: v.optional(v.string()),
    darkUserMessageTextColor: v.optional(v.string()),
    darkAiMessageBgColor: v.optional(v.string()),
    darkAiBorderColor: v.optional(v.string()),
    darkAiTextColor: v.optional(v.string()),
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
        darkPrimaryColor: updates.darkPrimaryColor,
        darkSecondaryColor: updates.darkSecondaryColor,
        darkBackgroundColor: updates.darkBackgroundColor,
        darkTextColor: updates.darkTextColor,
        darkUserMessageTextColor: updates.darkUserMessageTextColor,
        darkAiMessageBgColor: updates.darkAiMessageBgColor,
        darkAiBorderColor: updates.darkAiBorderColor,
        darkAiTextColor: updates.darkAiTextColor,
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
    let conversations;

    if (args.status && args.status !== "all") {
      conversations = await ctx.db
        .query("chatbot_conversations")
        .withIndex("by_type_status", (q) =>
          q.eq("type", args.type).eq("status", args.status as "active" | "waiting_for_agent" | "admin_takeover" | "resolved" | "escalated")
        )
        .collect();
    } else {
      conversations = await ctx.db
        .query("chatbot_conversations")
        .filter((q) => q.eq(q.field("type"), args.type))
        .collect();
    }

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
      // takenOverBy stores Clerk user ID string; schema expects Id<"users"> but we use subject
      takenOverBy: identity.subject as unknown as import("./_generated/dataModel").Id<"users">,
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

// Store conversation after n8n response
export const storeConversation = mutation({
  args: {
    sessionId: v.string(),
    type: v.union(v.literal("frontend"), v.literal("user_panel")),
    userMessage: v.string(),
    aiResponse: v.string(),
    userId: v.optional(v.id("users")),
    quickReplies: v.optional(v.array(v.object({
      label: v.string(),
      value: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    console.log("💾 CONVEX: storeConversation called", {
      sessionId: args.sessionId,
      type: args.type,
      hasUserId: !!args.userId,
      messageLength: args.userMessage.length,
    });
    
    const now = Date.now();

    // Find existing conversation by sessionId
    const existing = await ctx.db
      .query("chatbot_conversations")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
    
    console.log("💾 CONVEX: Existing conversation found:", !!existing);

    const userMsg = {
      role: "user" as const,
      content: args.userMessage,
      timestamp: now,
      messageType: "text" as const,
    };

    const aiMsg = {
      role: "assistant" as const,
      content: args.aiResponse,
      timestamp: now + 1,
      messageType: "text" as const,
      quickReplies: args.quickReplies,
    };

    if (existing) {
      // Append to existing conversation
      console.log("💾 CONVEX: Appending to existing conversation", existing._id);
      await ctx.db.patch(existing._id, {
        messages: [...existing.messages, userMsg, aiMsg],
        updatedAt: now,
      });
      console.log("✅ CONVEX: Conversation updated successfully");
      return existing._id;
    } else {
      // Create new conversation
      console.log("💾 CONVEX: Creating new conversation");
      const conversationId = await ctx.db.insert("chatbot_conversations", {
        sessionId: args.sessionId,
        userId: args.userId,
        type: args.type,
        messages: [userMsg, aiMsg],
        status: "active",
        resolved: false,
        escalatedToSupport: false,
        interventionRequested: false,
        leadCaptured: false,
        createdAt: now,
        updatedAt: now,
      });
      console.log("✅ CONVEX: New conversation created", conversationId);
      return conversationId;
    }
  },
});

// Get conversation by sessionId
export const getConversationBySession = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db
      .query("chatbot_conversations")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    return conversation;
  },
});

// Store file attachment message
export const storeFileMessage = mutation({
  args: {
    sessionId: v.string(),
    type: v.union(v.literal("frontend"), v.literal("user_panel")),
    fileStorageId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find existing conversation by sessionId
    const existing = await ctx.db
      .query("chatbot_conversations")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    const fileUrl = await ctx.storage.getUrl(args.fileStorageId as import("./_generated/dataModel").Id<"_storage">);

    const fileMsg = {
      role: "user" as const,
      content: `Sent a file: ${args.fileName}`,
      timestamp: now,
      messageType: "file" as const,
      fileStorageId: args.fileStorageId,
      fileUrl: fileUrl || undefined,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
    };

    if (existing) {
      // Append to existing conversation
      await ctx.db.patch(existing._id, {
        messages: [...existing.messages, fileMsg],
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new conversation with file message
      const conversationId = await ctx.db.insert("chatbot_conversations", {
        sessionId: args.sessionId,
        userId: args.userId,
        type: args.type,
        messages: [fileMsg],
        status: "active",
        resolved: false,
        escalatedToSupport: false,
        interventionRequested: false,
        leadCaptured: false,
        createdAt: now,
        updatedAt: now,
      });
      return conversationId;
    }
  },
});

// Generate upload URL for file attachments
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get file URL from storage ID
export const getFileUrl = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId as import("./_generated/dataModel").Id<"_storage">);
    return url;
  },
});

// Escalate conversation to human agent
export const escalateConversation = mutation({
  args: {
    sessionId: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db
      .query("chatbot_conversations")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (conversation) {
      await ctx.db.patch(conversation._id, {
        escalatedToSupport: true,
        interventionRequested: true,
        status: "escalated",
        updatedAt: Date.now(),
      });
      return conversation._id;
    }
    return null;
  },
});

// Create inbox entry for chatbot conversation (for admin inbox)
export const createChatbotInboxEntry = mutation({
  args: {
    sessionId: v.string(),
    type: v.union(v.literal("frontend"), v.literal("user_panel")),
    userName: v.string(),
    userEmail: v.optional(v.string()),
    subject: v.string(),
    body: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if inbox entry already exists for this session
    const existing = await ctx.db
      .query("inbox_messages")
      .withIndex("by_thread", (q) => q.eq("threadId", `chatbot_${args.sessionId}`))
      .first();

    if (existing) {
      // Update existing entry
      await ctx.db.patch(existing._id, {
        body: args.body,
        status: "unread",
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new inbox message
    return await ctx.db.insert("inbox_messages", {
      threadId: `chatbot_${args.sessionId}`,
      channel: "chatbot",
      direction: "inbound",
      subject: args.subject,
      body: args.body,
      status: "unread",
      priority: "normal",
      tags: [args.type, args.type === "user_panel" ? "logged-in" : "visitor"],
      sentAt: now,
      createdAt: now,
      updatedAt: now,
      metadata: {
        sessionId: args.sessionId,
        chatType: args.type,
        userName: args.userName,
        userEmail: args.userEmail || "",
        userId: args.userId ? String(args.userId) : undefined,
      },
    });
  },
});

// Get all chatbot conversations for admin inbox
export const getChatbotConversations = query({
  args: {
    status: v.optional(v.string()),
    type: v.optional(v.union(v.literal("frontend"), v.literal("user_panel"))),
  },
  handler: async (ctx, args) => {
    let conversations = await ctx.db
      .query("chatbot_conversations")
      .order("desc")
      .collect();

    // Filter by type if specified
    if (args.type) {
      conversations = conversations.filter(c => c.type === args.type);
    }

    // Filter by status if specified
    if (args.status) {
      conversations = conversations.filter(c => c.status === args.status);
    }

    // Enrich with user data
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        let userName = "Anonymous Visitor";
        let userEmail = conv.userEmail || "";
        let userPhone = conv.userPhone || "";
        const userCompany = conv.userCompany || "";
        let userType: "visitor" | "registered" = "visitor";

        if (conv.userId) {
          const user = await ctx.db.get(conv.userId);
          if (user) {
            userName = user.fullName || user.firstName || user.email || "Registered User";
            userEmail = userEmail || user.email || "";
            userType = "registered";
          }
        }

        // For anonymous visitors, try to extract contact info from user messages
        if (userType === "visitor" && conv.messages) {
          const userMsgs = conv.messages.filter(m => m.role === "user").map(m => m.content).join(" ");
          // Extract email from messages
          if (!userEmail) {
            const emailMatch = userMsgs.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
            if (emailMatch) userEmail = emailMatch[0];
          }
          // Extract phone from messages
          if (!userPhone) {
            const phoneMatch = userMsgs.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
            if (phoneMatch) userPhone = phoneMatch[0];
          }
          // Extract name - look for "my name is X" or "I'm X" patterns
          if (conv.userName) {
            userName = conv.userName;
          } else {
            const nameMatch = userMsgs.match(/(?:my name is|i'?m|i am|name:?\s*)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
            if (nameMatch) userName = nameMatch[1];
          }
        }

        const messageCount = conv.messages?.length || 0;
        const lastMessage = conv.messages?.[conv.messages.length - 1];

        // Check for appointments
        const appointments = await ctx.db
          .query("chat_appointments")
          .filter(q => q.eq(q.field("conversationId"), conv._id))
          .collect();

        return {
          ...conv,
          userName,
          userEmail,
          userPhone,
          userCompany,
          userType,
          messageCount,
          hasAppointment: appointments.length > 0,
          appointmentCount: appointments.length,
          lastMessageContent: lastMessage?.content?.substring(0, 100) || "",
          lastMessageRole: lastMessage?.role || "",
          lastMessageTime: lastMessage?.timestamp || conv.updatedAt,
        };
      })
    );

    return enriched;
  },
});

// Submit rating for conversation
export const submitRating = mutation({
  args: {
    sessionId: v.string(),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db
      .query("chatbot_conversations")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    await ctx.db.patch(conversation._id, {
      rating: args.rating,
      ratingComment: args.comment,
      ratedAt: Date.now(),
      status: "resolved",
      resolved: true,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// User sends a message during admin takeover (bypasses n8n, goes directly to conversation)
export const addUserMessageToConversation = mutation({
  args: {
    conversationId: v.id("chatbot_conversations"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const now = Date.now();

    const userMsg = {
      role: "user" as const,
      content: args.message,
      timestamp: now,
      messageType: "text" as const,
    };

    await ctx.db.patch(args.conversationId, {
      messages: [...conversation.messages, userMsg],
      updatedAt: now,
    });

    return { success: true };
  },
});

// Admin sends a message to a chatbot conversation (takeover)
export const adminReplyToConversation = mutation({
  args: {
    conversationId: v.id("chatbot_conversations"),
    message: v.string(),
    adminName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const now = Date.now();

    const adminMsg = {
      role: "admin" as const,
      content: args.message,
      timestamp: now,
      messageType: "text" as const,
      senderId: args.adminName || "Support Admin",
    };

    await ctx.db.patch(args.conversationId, {
      messages: [...conversation.messages, adminMsg],
      status: "admin_takeover" as const,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Update chatbot conversation label (urgent, follow-up, resolved)
export const updateConversationLabel = mutation({
  args: {
    conversationId: v.id("chatbot_conversations"),
    label: v.optional(v.union(
      v.literal("urgent"),
      v.literal("follow-up"),
      v.literal("resolved")
    )),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      label: args.label,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// Get appointments linked to a chatbot conversation
export const getConversationAppointments = query({
  args: {
    conversationId: v.id("chatbot_conversations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chat_appointments")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();
  },
});
