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

// ============================================
// ADMIN: Support Ticket Management
// ============================================
// Super-admin gate reused from the fraud-check / support-chat-reports pattern:
// accept Clerk JWT public_metadata.role === "super_admin", else fall back to
// admin_users table row with role=super_admin AND isActive=true.
async function assertSuperAdminTickets(ctx: {
  auth: { getUserIdentity: () => Promise<unknown> };
  db: {
    query: (table: string) => {
      withIndex: (...a: unknown[]) => { first: () => Promise<unknown> };
    };
  };
}) {
  const identity = (await ctx.auth.getUserIdentity()) as
    | ({ subject: string; public_metadata?: { role?: string } } & Record<
        string,
        unknown
      >)
    | null;
  if (!identity) throw new Error("Unauthenticated");

  const roleFromJwt = identity.public_metadata?.role;
  if (roleFromJwt === "super_admin") return;

  const adminRow = (await (ctx.db as any)
    .query("admin_users")
    .withIndex("by_clerkUserId", (q: any) =>
      q.eq("clerkUserId", identity.subject)
    )
    .first()) as { role?: string; isActive?: boolean } | null;

  if (adminRow && adminRow.role === "super_admin" && adminRow.isActive) return;

  throw new Error("Forbidden — super_admin role required");
}

export const adminListTickets = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("open"),
        v.literal("in_progress"),
        v.literal("waiting_customer"),
        v.literal("resolved"),
        v.literal("closed")
      )
    ),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("urgent")
      )
    ),
    category: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertSuperAdminTickets(ctx as any);

    const limit = Math.min(Math.max(args.limit ?? 100, 1), 500);

    let q = ctx.db.query("support_tickets").order("desc");
    // Use indexes when possible for cheaper scans
    if (args.status) {
      q = ctx.db
        .query("support_tickets")
        .withIndex("by_status", (i) => i.eq("status", args.status!))
        .order("desc");
    } else if (args.priority) {
      q = ctx.db
        .query("support_tickets")
        .withIndex("by_priority", (i) => i.eq("priority", args.priority!))
        .order("desc");
    }

    const raw = await q.take(limit * 2);

    const searchLower = args.search?.toLowerCase().trim();
    const filtered = raw.filter((t) => {
      if (args.priority && t.priority !== args.priority) return false;
      if (args.status && t.status !== args.status) return false;
      if (args.category && t.category !== args.category) return false;
      if (searchLower) {
        const hay = (
          t.ticketNumber +
          " " +
          t.subject +
          " " +
          t.description +
          " " +
          (t.userEmail ?? "")
        ).toLowerCase();
        if (!hay.includes(searchLower)) return false;
      }
      return true;
    });

    const trimmed = filtered.slice(0, limit);

    // Message count per ticket (small batch — fine at 100 tickets)
    const enriched = await Promise.all(
      trimmed.map(async (t) => {
        const messages = await ctx.db
          .query("ticket_messages")
          .withIndex("by_ticketId", (q) => q.eq("ticketId", t._id))
          .collect();
        return {
          _id: t._id,
          ticketNumber: t.ticketNumber,
          userId: t.userId,
          userEmail: t.userEmail,
          subject: t.subject,
          category: t.category,
          priority: t.priority,
          status: t.status,
          slaBreached: t.slaBreached,
          assignedTo: t.assignedTo ?? null,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          resolvedAt: t.resolvedAt ?? null,
          messageCount: messages.length,
        };
      })
    );

    return enriched;
  },
});

export const adminGetTicketDetail = query({
  args: { ticketId: v.id("support_tickets") },
  handler: async (ctx, args) => {
    await assertSuperAdminTickets(ctx as any);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) return null;

    const messages = await ctx.db
      .query("ticket_messages")
      .withIndex("by_ticketId", (q) => q.eq("ticketId", args.ticketId))
      .collect();

    messages.sort((a, b) => a.createdAt - b.createdAt);

    return {
      ticket: {
        _id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        companyId: ticket.companyId,
        userId: ticket.userId,
        userEmail: ticket.userEmail,
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        slaBreached: ticket.slaBreached,
        assignedTo: ticket.assignedTo ?? null,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        resolvedAt: ticket.resolvedAt ?? null,
      },
      messages: messages.map((m) => ({
        _id: m._id,
        senderId: m.senderId,
        senderType: m.senderType,
        senderName: m.senderName,
        message: m.message,
        isInternal: m.isInternal,
        createdAt: m.createdAt,
      })),
    };
  },
});

export const adminReplyToTicket = mutation({
  args: {
    ticketId: v.id("support_tickets"),
    message: v.string(),
    isInternal: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await assertSuperAdminTickets(ctx as any);

    const identity = (await ctx.auth.getUserIdentity()) as
      | { subject: string; name?: string; email?: string }
      | null;
    if (!identity) throw new Error("Unauthenticated");

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const now = Date.now();

    const messageId = await ctx.db.insert("ticket_messages", {
      ticketId: args.ticketId,
      senderId: identity.subject,
      senderType: "admin",
      senderName: identity.name ?? identity.email ?? "Support",
      message: args.message,
      isInternal: args.isInternal ?? false,
      createdAt: now,
    });

    // Internal notes don't change ticket state
    if (!args.isInternal) {
      await ctx.db.patch(args.ticketId, {
        status: "in_progress",
        firstResponseAt: ticket.firstResponseAt ?? now,
        updatedAt: now,
      });

      // Mirror to the inbox thread so the admin inbox sees the outbound reply
      const inboxMessage = await ctx.db
        .query("inbox_messages")
        .withIndex("by_thread", (q) => q.eq("threadId", ticket.ticketNumber))
        .first();
      if (inboxMessage) {
        await ctx.db.patch(inboxMessage._id, {
          status: "replied",
          repliedAt: now,
          updatedAt: now,
        });
      }
    }

    return messageId;
  },
});

export const adminUpdateTicket = mutation({
  args: {
    ticketId: v.id("support_tickets"),
    status: v.optional(
      v.union(
        v.literal("open"),
        v.literal("in_progress"),
        v.literal("waiting_customer"),
        v.literal("resolved"),
        v.literal("closed")
      )
    ),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("urgent")
      )
    ),
    assignedTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertSuperAdminTickets(ctx as any);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const now = Date.now();
    const patch: Record<string, unknown> = { updatedAt: now };
    if (args.status !== undefined) {
      patch.status = args.status;
      if (args.status === "resolved" || args.status === "closed") {
        patch.resolvedAt = now;
      }
    }
    if (args.priority !== undefined) patch.priority = args.priority;
    if (args.assignedTo !== undefined) patch.assignedTo = args.assignedTo;

    await ctx.db.patch(args.ticketId, patch);
    return { ok: true };
  },
});

export const adminGetTicketStats = query({
  args: {},
  handler: async (ctx) => {
    await assertSuperAdminTickets(ctx as any);

    const all = await ctx.db.query("support_tickets").collect();
    const byStatus: Record<string, number> = {
      open: 0,
      in_progress: 0,
      waiting_customer: 0,
      resolved: 0,
      closed: 0,
    };
    const byPriority: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };
    let slaBreached = 0;
    for (const t of all) {
      byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1;
      if (t.slaBreached) slaBreached += 1;
    }
    return {
      total: all.length,
      byStatus,
      byPriority,
      slaBreached,
      openAndWaiting:
        (byStatus.open ?? 0) +
        (byStatus.in_progress ?? 0) +
        (byStatus.waiting_customer ?? 0),
    };
  },
});

// ============================================
// ADMIN CLEANUP
// ============================================
// Only resolved/closed tickets are eligible — active tickets are preserved
// regardless of age. Timestamp used: resolvedAt when set, otherwise updatedAt.
const TICKET_CLEANUP_BATCH_CAP = 500;

function isTicketEligibleForCleanup(ticket: {
  status: string;
  resolvedAt?: number;
  updatedAt: number;
}): { eligible: boolean; timestamp: number } {
  const isClosed = ticket.status === "resolved" || ticket.status === "closed";
  const ts = ticket.resolvedAt ?? ticket.updatedAt;
  return { eligible: isClosed, timestamp: ts };
}

export const adminCountStaleTickets = query({
  args: { olderThanMs: v.number() },
  handler: async (ctx, args) => {
    await assertSuperAdminTickets(ctx as any);

    const cutoff = Date.now() - args.olderThanMs;

    // Pull resolved + closed via index for efficiency
    const [resolved, closed] = await Promise.all([
      ctx.db
        .query("support_tickets")
        .withIndex("by_status", (q) => q.eq("status", "resolved"))
        .collect(),
      ctx.db
        .query("support_tickets")
        .withIndex("by_status", (q) => q.eq("status", "closed"))
        .collect(),
    ]);

    let ticketCount = 0;
    let messageCount = 0;
    const eligibleIds: Array<{ _id: any; ticketNumber: string }> = [];

    for (const t of [...resolved, ...closed]) {
      const { eligible, timestamp } = isTicketEligibleForCleanup(t);
      if (!eligible) continue;
      if (timestamp >= cutoff) continue;
      ticketCount += 1;
      eligibleIds.push({ _id: t._id, ticketNumber: t.ticketNumber });
    }

    // Count messages (small batch — fine at hundreds)
    for (const { _id } of eligibleIds) {
      const msgs = await ctx.db
        .query("ticket_messages")
        .withIndex("by_ticketId", (q) => q.eq("ticketId", _id))
        .collect();
      messageCount += msgs.length;
    }

    return {
      ticketCount,
      messageCount,
      cutoffDate: new Date(cutoff).toISOString(),
    };
  },
});

export const adminCleanupStaleTickets = mutation({
  args: { olderThanMs: v.number() },
  handler: async (ctx, args) => {
    await assertSuperAdminTickets(ctx as any);

    const cutoff = Date.now() - args.olderThanMs;

    const [resolved, closed] = await Promise.all([
      ctx.db
        .query("support_tickets")
        .withIndex("by_status", (q) => q.eq("status", "resolved"))
        .collect(),
      ctx.db
        .query("support_tickets")
        .withIndex("by_status", (q) => q.eq("status", "closed"))
        .collect(),
    ]);

    const eligible = [...resolved, ...closed].filter((t) => {
      const { eligible, timestamp } = isTicketEligibleForCleanup(t);
      return eligible && timestamp < cutoff;
    });

    const toDelete = eligible.slice(0, TICKET_CLEANUP_BATCH_CAP);

    let deletedTickets = 0;
    let deletedMessages = 0;
    let deletedInboxEntries = 0;

    for (const ticket of toDelete) {
      // ticket_messages
      const msgs = await ctx.db
        .query("ticket_messages")
        .withIndex("by_ticketId", (q) => q.eq("ticketId", ticket._id))
        .collect();
      for (const m of msgs) {
        await ctx.db.delete(m._id);
        deletedMessages += 1;
      }

      // inbox_messages with matching threadId == ticketNumber
      const inboxEntries = await ctx.db
        .query("inbox_messages")
        .withIndex("by_thread", (q) => q.eq("threadId", ticket.ticketNumber))
        .collect();
      for (const entry of inboxEntries) {
        await ctx.db.delete(entry._id);
        deletedInboxEntries += 1;
      }

      await ctx.db.delete(ticket._id);
      deletedTickets += 1;
    }

    return {
      deletedTickets,
      deletedMessages,
      deletedInboxEntries,
      hasMore: eligible.length > TICKET_CLEANUP_BATCH_CAP,
    };
  },
});
