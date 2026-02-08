import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get counts of old data by age for preview before cleanup
export const getCleanupPreview = query({
  args: {
    olderThanDays: v.number(),
  },
  handler: async (ctx, { olderThanDays }) => {
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

    const chatbotConversations = await ctx.db
      .query("chatbot_conversations")
      .collect();
    const oldChatbot = chatbotConversations.filter(
      (c) => (c.updatedAt || c.createdAt) < cutoff
    );

    const tickets = await ctx.db.query("inbox_messages").collect();
    const oldTickets = tickets.filter(
      (t) => (t.updatedAt || t.sentAt || t.createdAt) < cutoff
    );

    const emailLogs = await ctx.db.query("email_logs").collect();
    const oldEmails = emailLogs.filter((e) => e.createdAt < cutoff);

    return {
      chatbot: { total: chatbotConversations.length, old: oldChatbot.length },
      tickets: { total: tickets.length, old: oldTickets.length },
      emailLogs: { total: emailLogs.length, old: oldEmails.length },
    };
  },
});

// Clean old chatbot conversations (including attached files/images from storage)
export const cleanOldChatbot = mutation({
  args: { olderThanDays: v.number() },
  handler: async (ctx, { olderThanDays }) => {
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    const conversations = await ctx.db
      .query("chatbot_conversations")
      .collect();
    let deleted = 0;
    let filesDeleted = 0;

    for (const conv of conversations) {
      if ((conv.updatedAt || conv.createdAt) < cutoff) {
        // Delete storage files (images/attachments) from messages
        for (const msg of conv.messages || []) {
          if (msg.imageStorageId) {
            try {
              await ctx.storage.delete(msg.imageStorageId as import("./_generated/dataModel").Id<"_storage">);
              filesDeleted++;
            } catch { /* file may already be deleted */ }
          }
          if (msg.fileStorageId) {
            try {
              await ctx.storage.delete(msg.fileStorageId as import("./_generated/dataModel").Id<"_storage">);
              filesDeleted++;
            } catch { /* file may already be deleted */ }
          }
        }
        await ctx.db.delete(conv._id);
        deleted++;
      }
    }

    return { deleted, filesDeleted };
  },
});

// Clean old inbox messages (tickets/email)
export const cleanOldInboxMessages = mutation({
  args: { olderThanDays: v.number() },
  handler: async (ctx, { olderThanDays }) => {
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    const messages = await ctx.db.query("inbox_messages").collect();
    let deleted = 0;

    for (const msg of messages) {
      if ((msg.updatedAt || msg.sentAt || msg.createdAt) < cutoff) {
        // Also delete related ticket messages if it's a ticket
        if (msg.channel === "ticket" && msg.threadId) {
          const ticket = await ctx.db
            .query("support_tickets")
            .filter((q) => q.eq(q.field("ticketNumber"), msg.threadId))
            .first();
          if (ticket) {
            const ticketMsgs = await ctx.db
              .query("ticket_messages")
              .withIndex("by_ticketId", (q) => q.eq("ticketId", ticket._id))
              .collect();
            for (const tm of ticketMsgs) {
              await ctx.db.delete(tm._id);
            }
            await ctx.db.delete(ticket._id);
          }
        }
        await ctx.db.delete(msg._id);
        deleted++;
      }
    }

    return { deleted };
  },
});

// Clean old email logs
export const cleanOldEmailLogs = mutation({
  args: { olderThanDays: v.number() },
  handler: async (ctx, { olderThanDays }) => {
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    const logs = await ctx.db.query("email_logs").collect();
    let deleted = 0;

    for (const log of logs) {
      if (log.createdAt < cutoff) {
        await ctx.db.delete(log._id);
        deleted++;
      }
    }

    return { deleted };
  },
});
