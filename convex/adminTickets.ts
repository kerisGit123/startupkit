import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getAllTickets = query({
  handler: async (ctx) => {
    const tickets = await ctx.db
      .query("support_tickets")
      .order("desc")
      .collect();

    // Enrich with user data
    const enrichedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", ticket.userId))
          .first();

        return {
          ...ticket,
          userName: user?.fullName || "Unknown",
          userEmail: user?.email || "No email",
        };
      })
    );

    return enrichedTickets;
  },
});

export const getTicketStats = query({
  handler: async (ctx) => {
    const tickets = await ctx.db.query("support_tickets").collect();

    const totalTickets = tickets.length;
    const openTickets = tickets.filter((t) => t.status === "open").length;
    const inProgressTickets = tickets.filter((t) => t.status === "in_progress").length;
    const resolvedTickets = tickets.filter((t) => t.status === "resolved").length;
    const closedTickets = tickets.filter((t) => t.status === "closed").length;

    // Calculate average response time (in hours)
    const ticketsWithResponse = tickets.filter((t) => t.firstResponseAt);
    const avgResponseTime = ticketsWithResponse.length > 0
      ? ticketsWithResponse.reduce((sum, t) => {
          const responseTime = (t.firstResponseAt! - t._creationTime) / (1000 * 60 * 60);
          return sum + responseTime;
        }, 0) / ticketsWithResponse.length
      : 0;

    return {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      avgResponseTime: avgResponseTime.toFixed(1),
    };
  },
});

export const getTicketById = query({
  args: { ticketId: v.id("support_tickets") },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", ticket.userId))
      .first();

    return {
      ...ticket,
      userName: user?.fullName || "Unknown",
      userEmail: user?.email || "No email",
    };
  },
});

export const updateTicketStatus = mutation({
  args: {
    ticketId: v.id("support_tickets"),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("waiting_customer"),
      v.literal("resolved"),
      v.literal("closed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ticketId, {
      status: args.status,
      updatedAt: Date.now(),
      ...(args.status === "resolved" && { resolvedAt: Date.now() }),
    });
    return args.ticketId;
  },
});

export const addTicketMessage = mutation({
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
      senderType: "admin",
      senderName: args.senderName,
      message: args.message,
      isInternal: false,
      createdAt: Date.now(),
    });

    // Update ticket's first response time if this is the first admin response
    if (!ticket.firstResponseAt) {
      await ctx.db.patch(args.ticketId, {
        firstResponseAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(args.ticketId, {
        updatedAt: Date.now(),
      });
    }

    return messageId;
  },
});

export const getTicketMessages = query({
  args: { ticketId: v.id("support_tickets") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("ticket_messages")
      .withIndex("by_ticketId", (q) => q.eq("ticketId", args.ticketId))
      .order("asc")
      .collect();

    return messages;
  },
});
