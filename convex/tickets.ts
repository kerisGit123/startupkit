import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createTicket = mutation({
  args: {
    subject: v.string(),
    description: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    category: v.union(
      v.literal("billing"),
      v.literal("plans"),
      v.literal("usage"),
      v.literal("general"),
      v.literal("credit"),
      v.literal("technical"),
      v.literal("invoice"),
      v.literal("service"),
      v.literal("other")
    ),
    userEmail: v.string(),
    userName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Generate ticket number
    const ticketCount = await ctx.db.query("support_tickets").collect();
    const ticketNumber = `TKT-${String(ticketCount.length + 1).padStart(6, "0")}`;

    const now = Date.now();

    // Create ticket in support_tickets table
    const ticketId = await ctx.db.insert("support_tickets", {
      ticketNumber,
      companyId: identity.subject,
      userId: identity.subject,
      userEmail: args.userEmail,
      subject: args.subject,
      description: args.description,
      category: args.category,
      priority: args.priority,
      status: "open",
      slaBreached: false,
      createdAt: now,
      updatedAt: now,
    });

    // Map priority to inbox priority
    let inboxPriority: "low" | "normal" | "high";
    if (args.priority === "urgent" || args.priority === "high") {
      inboxPriority = "high";
    } else if (args.priority === "low") {
      inboxPriority = "low";
    } else {
      inboxPriority = "normal";
    }

    // Automatically create inbox entry so it appears in admin inbox
    await ctx.db.insert("inbox_messages", {
      threadId: ticketNumber,
      channel: "ticket",
      direction: "inbound",
      subject: `[${ticketNumber}] ${args.subject}`,
      body: args.description,
      status: "unread",
      priority: inboxPriority,
      tags: [args.category, args.priority],
      sentAt: now,
      createdAt: now,
      updatedAt: now,
      metadata: {
        ticketId: ticketId,
        ticketNumber: ticketNumber,
        category: args.category,
        originalPriority: args.priority,
        userEmail: args.userEmail,
        userName: args.userName,
        slaBreached: false,
      },
    });

    return ticketId;
  },
});

export const getUserTickets = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const tickets = await ctx.db
      .query("support_tickets")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();

    return tickets;
  },
});

export const getTicketById = query({
  args: { ticketId: v.id("support_tickets") },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    return ticket;
  },
});

// Sync all tickets to inbox - creates inbox entries for tickets that don't have them
export const syncTicketsToInbox = mutation({
  args: {},
  handler: async (ctx) => {
    const allTickets = await ctx.db.query("support_tickets").collect();
    let synced = 0;

    for (const ticket of allTickets) {
      // Check if inbox entry already exists for this ticket
      const existing = await ctx.db
        .query("inbox_messages")
        .withIndex("by_thread", (q) => q.eq("threadId", ticket.ticketNumber))
        .first();

      if (!existing) {
        let inboxPriority: "low" | "normal" | "high" = "normal";
        if (ticket.priority === "urgent" || ticket.priority === "high") {
          inboxPriority = "high";
        } else if (ticket.priority === "low") {
          inboxPriority = "low";
        }

        await ctx.db.insert("inbox_messages", {
          threadId: ticket.ticketNumber,
          channel: "ticket",
          direction: "inbound",
          subject: `[${ticket.ticketNumber}] ${ticket.subject}`,
          body: ticket.description || "",
          status: "unread",
          priority: inboxPriority,
          tags: [ticket.category || "general", ticket.priority || "medium"],
          sentAt: ticket.createdAt,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt || ticket.createdAt,
          metadata: {
            ticketId: ticket._id,
            ticketNumber: ticket.ticketNumber,
            category: ticket.category || "general",
            originalPriority: ticket.priority,
            userEmail: ticket.userEmail || "",
            userName: ticket.userId || "Unknown",
            slaBreached: ticket.slaBreached || false,
          },
        });
        synced++;
      }
    }

    return { synced, total: allTickets.length };
  },
});

export const generateTicketUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getTicketFileUrl = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId as import("./_generated/dataModel").Id<"_storage">);
    return url;
  },
});

export const addCustomerMessage = mutation({
  args: {
    ticketId: v.id("support_tickets"),
    message: v.string(),
    senderName: v.string(),
    senderId: v.string(),
    attachments: v.optional(v.array(v.object({
      storageId: v.string(),
      fileName: v.string(),
      fileType: v.string(),
      fileSize: v.number(),
      fileUrl: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const now = Date.now();

    // Add to ticket_messages table
    const messageId = await ctx.db.insert("ticket_messages", {
      ticketId: args.ticketId,
      senderId: args.senderId,
      senderType: "customer",
      senderName: args.senderName,
      message: args.message,
      isInternal: false,
      attachments: args.attachments,
      createdAt: now,
    });

    // Update the original inbox message to mark as unreplied (customer replied)
    const inboxMessage = await ctx.db
      .query("inbox_messages")
      .withIndex("by_thread", (q) => q.eq("threadId", ticket.ticketNumber))
      .first();
    
    if (inboxMessage) {
      await ctx.db.patch(inboxMessage._id, {
        status: "unread", // Mark as unread since customer replied
        updatedAt: now,
      });
    }

    // Update ticket status
    await ctx.db.patch(args.ticketId, {
      status: "waiting_customer",
      updatedAt: now,
    });

    return messageId;
  },
});
