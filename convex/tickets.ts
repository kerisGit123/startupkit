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
      createdAt: Date.now(),
      updatedAt: Date.now(),
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

export const addCustomerMessage = mutation({
  args: {
    ticketId: v.id("support_tickets"),
    message: v.string(),
    senderName: v.string(),
    senderId: v.string(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const messageId = await ctx.db.insert("ticket_messages", {
      ticketId: args.ticketId,
      senderId: args.senderId,
      senderType: "customer",
      senderName: args.senderName,
      message: args.message,
      isInternal: false,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.ticketId, {
      updatedAt: Date.now(),
    });

    return messageId;
  },
});
