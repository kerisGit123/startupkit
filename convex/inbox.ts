import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Unified Inbox Backend
 * 
 * Consolidates communication from multiple channels:
 * - Email
 * - Chatbot conversations
 * - Support tickets
 * - SMS (future)
 * - Social media (future)
 */

// ============================================
// QUERIES
// ============================================

// Get all inbox messages with filtering
export const getAllMessages = query({
  args: {
    channel: v.optional(v.union(
      v.literal("email"),
      v.literal("chatbot"),
      v.literal("ticket"),
      v.literal("sms")
    )),
    status: v.optional(v.union(
      v.literal("unread"),
      v.literal("read"),
      v.literal("replied"),
      v.literal("archived")
    )),
    assignedTo: v.optional(v.id("users")),
    contactId: v.optional(v.id("contacts")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("inbox_messages");

    // Apply filters using indexes where possible
    if (args.channel) {
      query = query.withIndex("by_channel", (q) => q.eq("channel", args.channel!));
    } else if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status!));
    } else if (args.assignedTo) {
      query = query.withIndex("by_assigned", (q) => q.eq("assignedTo", args.assignedTo!));
    } else if (args.contactId) {
      query = query.withIndex("by_contact", (q) => q.eq("contactId", args.contactId!));
    }

    let messages = await query.collect();

    // Apply additional filters
    if (args.channel && args.status) {
      messages = messages.filter(m => m.status === args.status);
    }
    if (args.channel && args.assignedTo) {
      messages = messages.filter(m => m.assignedTo === args.assignedTo);
    }

    return messages.sort((a, b) => b.sentAt - a.sentAt);
  },
});

// Get unread message count
export const getUnreadCount = query({
  args: {
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let messages = await ctx.db
      .query("inbox_messages")
      .withIndex("by_status", (q) => q.eq("status", "unread"))
      .collect();

    if (args.assignedTo) {
      messages = messages.filter(m => m.assignedTo === args.assignedTo);
    }

    return {
      total: messages.length,
      byChannel: {
        email: messages.filter(m => m.channel === "email").length,
        chatbot: messages.filter(m => m.channel === "chatbot").length,
        ticket: messages.filter(m => m.channel === "ticket").length,
        sms: messages.filter(m => m.channel === "sms").length,
      },
    };
  },
});

// Get conversation thread with all messages
export const getThread = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const messages = await ctx.db
      .query("inbox_messages")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .collect();
    
    // Sort by sentAt to show conversation chronologically
    return messages.sort((a, b) => a.sentAt - b.sentAt);
  },
});

// Get contact's message history
export const getContactMessages = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, { contactId }) => {
    return await ctx.db
      .query("inbox_messages")
      .withIndex("by_contact", (q) => q.eq("contactId", contactId))
      .order("desc")
      .collect();
  },
});

// Get inbox statistics
export const getInboxStats = query({
  handler: async (ctx) => {
    const messages = await ctx.db.query("inbox_messages").collect();
    
    return {
      total: messages.length,
      unread: messages.filter(m => m.status === "unread").length,
      read: messages.filter(m => m.status === "read").length,
      replied: messages.filter(m => m.status === "replied").length,
      archived: messages.filter(m => m.status === "archived").length,
      byChannel: {
        email: messages.filter(m => m.channel === "email").length,
        chatbot: messages.filter(m => m.channel === "chatbot").length,
        ticket: messages.filter(m => m.channel === "ticket").length,
        sms: messages.filter(m => m.channel === "sms").length,
      },
      byPriority: {
        low: messages.filter(m => m.priority === "low").length,
        normal: messages.filter(m => m.priority === "normal").length,
        high: messages.filter(m => m.priority === "high").length,
        urgent: messages.filter(m => m.priority === "urgent").length,
      },
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

// Create inbox message (called by integrations)
export const createMessage = mutation({
  args: {
    contactId: v.id("contacts"),
    threadId: v.string(),
    channel: v.union(
      v.literal("email"),
      v.literal("chatbot"),
      v.literal("ticket"),
      v.literal("sms")
    ),
    direction: v.union(v.literal("inbound"), v.literal("outbound")),
    subject: v.optional(v.string()),
    body: v.string(),
    htmlBody: v.optional(v.string()),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    )),
    tags: v.optional(v.array(v.string())),
    externalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("inbox_messages", {
      contactId: args.contactId,
      threadId: args.threadId,
      channel: args.channel,
      direction: args.direction,
      subject: args.subject,
      body: args.body,
      htmlBody: args.htmlBody,
      status: args.direction === "inbound" ? "unread" : "read",
      priority: args.priority || "normal",
      tags: args.tags || [],
      sentAt: now,
      externalId: args.externalId,
    });
  },
});

// Reply to message
export const replyToMessage = mutation({
  args: {
    messageId: v.id("inbox_messages"),
    body: v.string(),
    htmlBody: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const originalMessage = await ctx.db.get(args.messageId);
    if (!originalMessage) {
      throw new Error("Message not found");
    }

    const now = Date.now();

    // Create reply message in same thread
    const replyId = await ctx.db.insert("inbox_messages", {
      contactId: originalMessage.contactId,
      threadId: originalMessage.threadId,
      channel: originalMessage.channel,
      direction: "outbound",
      subject: originalMessage.subject ? `Re: ${originalMessage.subject}` : undefined,
      body: args.body,
      htmlBody: args.htmlBody,
      status: "read",
      priority: originalMessage.priority,
      tags: originalMessage.tags,
      sentAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // Update original message status to replied
    await ctx.db.patch(args.messageId, {
      status: "replied",
      repliedAt: now,
      updatedAt: now,
    });

    // If it's a ticket, also add to ticket_messages
    if (originalMessage.channel === "ticket" && originalMessage.metadata?.ticketId) {
      await ctx.db.insert("ticket_messages", {
        ticketId: originalMessage.metadata.ticketId as any,
        senderId: "admin",
        senderType: "admin",
        senderName: "Support Team",
        message: args.body,
        isInternal: false,
        createdAt: now,
      });

      // Update ticket status
      await ctx.db.patch(originalMessage.metadata.ticketId as any, {
        status: "in_progress",
        updatedAt: now,
      });
    }

    return replyId;
  },
});

// Forward message
export const forwardMessage = mutation({
  args: {
    messageId: v.id("inbox_messages"),
    toEmail: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const originalMessage = await ctx.db.get(args.messageId);
    if (!originalMessage) {
      throw new Error("Message not found");
    }

    const now = Date.now();

    // Create forwarded message record
    const forwardedBody = `
${args.note ? `Note: ${args.note}\n\n` : ''}
---------- Forwarded message ----------
From: ${originalMessage.metadata?.userName || 'Unknown'}
Date: ${new Date(originalMessage.sentAt).toLocaleString()}
Subject: ${originalMessage.subject || 'No subject'}

${originalMessage.body}
    `.trim();

    const forwardId = await ctx.db.insert("inbox_messages", {
      threadId: `FWD-${originalMessage.threadId}`,
      channel: "email",
      direction: "outbound",
      subject: `Fwd: ${originalMessage.subject || 'No subject'}`,
      body: forwardedBody,
      status: "read",
      priority: originalMessage.priority,
      tags: [...(originalMessage.tags || []), "forwarded"],
      sentAt: now,
      createdAt: now,
      updatedAt: now,
      metadata: {
        forwardedFrom: args.messageId,
        forwardedTo: args.toEmail,
        originalThreadId: originalMessage.threadId,
      },
    });

    return forwardId;
  },
});

// Mark message as read
export const markAsRead = mutation({
  args: { id: v.id("inbox_messages") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, {
      status: "read",
      readAt: Date.now(),
    });
    return id;
  },
});

// Toggle star/favorite
export const toggleStar = mutation({
  args: { id: v.id("inbox_messages") },
  handler: async (ctx, { id }) => {
    const message = await ctx.db.get(id);
    if (!message) throw new Error("Message not found");
    
    await ctx.db.patch(id, {
      starred: !message.starred,
      updatedAt: Date.now(),
    });
    return id;
  },
});

// Update workflow status
export const updateWorkflowStatus = mutation({
  args: {
    id: v.id("inbox_messages"),
    workflowStatus: v.union(
      v.literal("urgent"),
      v.literal("follow-up"),
      v.literal("resolved"),
      v.literal("pending")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      workflowStatus: args.workflowStatus,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

// Delete message
export const deleteMessage = mutation({
  args: { id: v.id("inbox_messages") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
    return id;
  },
});

// Search messages by user
export const searchByUser = query({
  args: { userName: v.string() },
  handler: async (ctx, { userName }) => {
    const allMessages = await ctx.db.query("inbox_messages").collect();
    return allMessages.filter(msg => 
      msg.metadata?.userName?.toLowerCase().includes(userName.toLowerCase()) ||
      msg.metadata?.senderName?.toLowerCase().includes(userName.toLowerCase()) ||
      msg.metadata?.userEmail?.toLowerCase().includes(userName.toLowerCase())
    );
  },
});

// Clean up duplicate inbox entries - keep only original ticket messages
export const cleanupDuplicateInboxEntries = mutation({
  args: {},
  handler: async (ctx) => {
    const allMessages = await ctx.db.query("inbox_messages").collect();
    
    // Group by threadId
    const grouped = allMessages.reduce((acc, msg) => {
      if (!acc[msg.threadId]) {
        acc[msg.threadId] = [];
      }
      acc[msg.threadId].push(msg);
      return acc;
    }, {} as Record<string, typeof allMessages>);
    
    let deletedCount = 0;
    
    // For each thread, keep only the original message (oldest, direction=inbound)
    for (const [, messages] of Object.entries(grouped)) {
      if (messages.length <= 1) continue;
      
      // Sort by creation time, keep the first inbound message as the ticket
      const sortedMessages = messages.sort((a, b) => a.createdAt - b.createdAt);
      const originalTicket = sortedMessages.find(m => m.direction === "inbound" && !m.metadata?.isReply);
      
      if (originalTicket) {
        // Delete all other messages in this thread from inbox
        for (const msg of messages) {
          if (msg._id !== originalTicket._id) {
            await ctx.db.delete(msg._id);
            deletedCount++;
          }
        }
      }
    }
    
    return { deletedCount, threadsProcessed: Object.keys(grouped).length };
  },
});

// Mark message as replied
export const markAsReplied = mutation({
  args: { id: v.id("inbox_messages") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, {
      status: "replied",
      repliedAt: Date.now(),
    });
    return id;
  },
});

// Archive message
export const archiveMessage = mutation({
  args: { id: v.id("inbox_messages") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, {
      status: "archived",
    });
    return id;
  },
});

// Assign message to user
export const assignMessage = mutation({
  args: {
    id: v.id("inbox_messages"),
    assignedTo: v.id("users"),
  },
  handler: async (ctx, { id, assignedTo }) => {
    await ctx.db.patch(id, {
      assignedTo,
    });
    return id;
  },
});

// Update message priority
export const updatePriority = mutation({
  args: {
    id: v.id("inbox_messages"),
    priority: v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    ),
  },
  handler: async (ctx, { id, priority }) => {
    await ctx.db.patch(id, { priority });
    return id;
  },
});

// Add tags to message
export const addTags = mutation({
  args: {
    id: v.id("inbox_messages"),
    tags: v.array(v.string()),
  },
  handler: async (ctx, { id, tags }) => {
    const message = await ctx.db.get(id);
    if (!message) throw new Error("Message not found");

    const newTags = [...new Set([...message.tags, ...tags])];
    await ctx.db.patch(id, { tags: newTags });
    return id;
  },
});

// Bulk operations
export const bulkUpdateMessages = mutation({
  args: {
    ids: v.array(v.id("inbox_messages")),
    updates: v.object({
      status: v.optional(v.union(
        v.literal("unread"),
        v.literal("read"),
        v.literal("replied"),
        v.literal("archived")
      )),
      assignedTo: v.optional(v.id("users")),
      priority: v.optional(v.union(
        v.literal("low"),
        v.literal("normal"),
        v.literal("high"),
        v.literal("urgent")
      )),
    }),
  },
  handler: async (ctx, { ids, updates }) => {
    for (const id of ids) {
      await ctx.db.patch(id, updates);
    }
    return ids;
  },
});

// ============================================
// INTEGRATION HELPERS
// ============================================

// Sync chatbot conversation to inbox
export const syncChatbotToInbox = mutation({
  args: {
    conversationId: v.id("chatbot_conversations"),
  },
  handler: async (ctx, { conversationId }) => {
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) throw new Error("Conversation not found");

    // Find or create contact
    let contact;
    if (conversation.userEmail) {
      contact = await ctx.db
        .query("contacts")
        .withIndex("by_email", (q) => q.eq("email", conversation.userEmail!))
        .first();

      if (!contact) {
        // Create contact from chatbot lead
        const contactId = await ctx.db.insert("contacts", {
          name: conversation.userName || "Chatbot User",
          email: conversation.userEmail,
          phone: conversation.userPhone,
          company: conversation.userCompany,
          type: "lead",
          lifecycleStage: "prospect",
          status: "active",
          leadSource: "chatbot",
          tags: [],
          labels: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        contact = await ctx.db.get(contactId);
      }
    }

    if (!contact) {
      throw new Error("Cannot sync conversation without contact");
    }

    // Create inbox message for the conversation
    const threadId = `chatbot-${conversationId}`;
    const lastMessage = conversation.messages[conversation.messages.length - 1];

    await ctx.db.insert("inbox_messages", {
      contactId: contact._id,
      threadId,
      channel: "chatbot",
      direction: "inbound",
      subject: "Chatbot Conversation",
      body: lastMessage?.content || "New chatbot conversation",
      status: conversation.status === "waiting_for_agent" ? "unread" : "read",
      priority: conversation.interventionRequested ? "high" : "normal",
      tags: ["chatbot"],
      sentAt: conversation.createdAt,
      externalId: conversationId,
    });

    return { success: true, contactId: contact._id };
  },
});
