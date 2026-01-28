import { mutation, query } from "../_generated/server";

/**
 * Migration: Sync Support Tickets to Unified Inbox
 * 
 * This migration copies existing support_tickets data into the inbox_messages table
 * so they appear in the unified inbox interface.
 */

// Get all support tickets
export const getAllTickets = query({
  handler: async (ctx) => {
    return await ctx.db.query("support_tickets").collect();
  },
});

// Sync tickets to inbox
export const syncTicketsToInbox = mutation({
  handler: async (ctx) => {
    const tickets = await ctx.db.query("support_tickets").collect();
    
    let synced = 0;
    let skipped = 0;

    for (const ticket of tickets) {
      // Check if ticket already exists in inbox
      const existing = await ctx.db
        .query("inbox_messages")
        .filter((q) => q.eq(q.field("threadId"), `ticket-${ticket.ticketNumber}`))
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      // Map ticket status to inbox status
      let inboxStatus: "unread" | "read" | "replied" | "archived";
      if (ticket.status === "closed" || ticket.status === "resolved") {
        inboxStatus = "archived";
      } else if (ticket.status === "in_progress" || ticket.status === "waiting_customer") {
        inboxStatus = "replied";
      } else {
        inboxStatus = "unread";
      }

      // Map ticket priority
      let priority: "low" | "normal" | "high";
      if (ticket.priority === "urgent" || ticket.priority === "high") {
        priority = "high";
      } else if (ticket.priority === "low") {
        priority = "low";
      } else {
        priority = "normal";
      }

      // Create inbox message from ticket
      await ctx.db.insert("inbox_messages", {
        threadId: `ticket-${ticket.ticketNumber}`,
        channel: "ticket",
        direction: "inbound",
        subject: `[${ticket.ticketNumber}] ${ticket.subject}`,
        body: ticket.description,
        status: inboxStatus,
        priority: priority,
        tags: [ticket.category, ticket.priority],
        sentAt: ticket.createdAt,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        metadata: {
          ticketId: ticket._id,
          ticketNumber: ticket.ticketNumber,
          category: ticket.category,
          originalStatus: ticket.status,
          assignedTo: ticket.assignedTo,
        },
      });

      synced++;
    }

    return {
      success: true,
      synced,
      skipped,
      total: tickets.length,
    };
  },
});

// Get sync status
export const getSyncStatus = query({
  handler: async (ctx) => {
    const ticketCount = await ctx.db.query("support_tickets").collect();
    const inboxTicketCount = await ctx.db
      .query("inbox_messages")
      .filter((q) => q.eq(q.field("channel"), "ticket"))
      .collect();

    return {
      totalTickets: ticketCount.length,
      ticketsInInbox: inboxTicketCount.length,
      needsSync: ticketCount.length > inboxTicketCount.length,
    };
  },
});
