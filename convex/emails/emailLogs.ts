import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Email Logs - For testing and debugging email sends
 * Logs emails to database instead of/in addition to sending via SMTP
 */

// List all email logs
export const listEmailLogs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("email_logs")
      .order("desc")
      .take(100); // Limit to last 100 logs
  },
});

// Get single email log by ID
export const getEmailLog = query({
  args: { logId: v.id("email_logs") },
  handler: async (ctx, { logId }) => {
    return await ctx.db.get(logId);
  },
});

// Log an email (for testing mode)
export const logEmail = mutation({
  args: {
    sentTo: v.string(),
    subject: v.string(),
    htmlContent: v.string(),
    textContent: v.optional(v.string()),
    templateType: v.optional(v.string()),
    templateName: v.optional(v.string()),
    campaignId: v.optional(v.id("email_campaigns")),
    variables: v.optional(v.any()),
    status: v.union(v.literal("logged"), v.literal("sent"), v.literal("failed")),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("email_logs", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Delete a single email log
export const deleteEmailLog = mutation({
  args: { logId: v.id("email_logs") },
  handler: async (ctx, { logId }) => {
    await ctx.db.delete(logId);
    return { success: true };
  },
});

// Clear all email logs
export const clearAllEmailLogs = mutation({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db.query("email_logs").collect();
    let deletedCount = 0;
    
    for (const log of logs) {
      await ctx.db.delete(log._id);
      deletedCount++;
    }
    
    return { 
      success: true, 
      deletedCount,
      message: `Deleted ${deletedCount} email logs`
    };
  },
});

// Get email logs statistics
export const getEmailLogsStats = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db.query("email_logs").collect();
    
    const stats = {
      total: logs.length,
      logged: logs.filter(l => l.status === "logged").length,
      sent: logs.filter(l => l.status === "sent").length,
      failed: logs.filter(l => l.status === "failed").length,
      byTemplate: {} as Record<string, number>,
    };
    
    // Count by template type
    for (const log of logs) {
      const templateType = log.templateType || "unknown";
      stats.byTemplate[templateType] = (stats.byTemplate[templateType] || 0) + 1;
    }
    
    return stats;
  },
});

// Search email logs
export const searchEmailLogs = query({
  args: {
    sentTo: v.optional(v.string()),
    templateType: v.optional(v.string()),
    status: v.optional(v.union(v.literal("logged"), v.literal("sent"), v.literal("failed"))),
  },
  handler: async (ctx, { sentTo, templateType, status }) => {
    let logs = await ctx.db.query("email_logs").order("desc").collect();
    
    if (sentTo) {
      logs = logs.filter(log => log.sentTo.includes(sentTo));
    }
    
    if (templateType) {
      logs = logs.filter(log => log.templateType === templateType);
    }
    
    if (status) {
      logs = logs.filter(log => log.status === status);
    }
    
    return logs.slice(0, 100); // Limit results
  },
});
