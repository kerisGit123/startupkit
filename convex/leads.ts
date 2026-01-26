import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// LEAD QUERIES
// ============================================

export const getLeadByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("leads")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
  },
});

export const getLeadById = query({
  args: { leadId: v.id("leads") },
  handler: async (ctx, { leadId }) => {
    return await ctx.db.get(leadId);
  },
});

export const getAllLeads = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { status, limit = 50 }) => {
    if (status) {
      const leads = await ctx.db
        .query("leads")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(limit);
      return leads;
    }
    
    const leads = await ctx.db
      .query("leads")
      .order("desc")
      .take(limit);
    
    return leads;
  },
});

export const searchLeads = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, { searchTerm }) => {
    const allLeads = await ctx.db.query("leads").collect();
    
    const searchLower = searchTerm.toLowerCase();
    return allLeads.filter(lead => 
      lead.name.toLowerCase().includes(searchLower) ||
      lead.email.toLowerCase().includes(searchLower) ||
      (lead.phone && lead.phone.toLowerCase().includes(searchLower))
    );
  },
});

// ============================================
// LEAD MUTATIONS
// ============================================

export const createLead = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    source: v.optional(v.string()),
    message: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const leadId = await ctx.db.insert("leads", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      source: args.source || "chatbot",
      message: args.message,
      status: args.status || "new",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return leadId;
  },
});

export const updateLead = mutation({
  args: {
    leadId: v.id("leads"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    message: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { leadId, ...updates }) => {
    await ctx.db.patch(leadId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const convertLeadToClient = mutation({
  args: {
    leadId: v.id("leads"),
  },
  handler: async (ctx, { leadId }) => {
    const lead = await ctx.db.get(leadId);
    if (!lead) throw new Error("Lead not found");
    
    // Create client from lead
    const clientId = await ctx.db.insert("clients", {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      notes: lead.message,
      tags: ["converted-from-lead"],
      totalAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      noShowCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      firstBookedAt: Date.now(),
    });
    
    // Update lead status
    await ctx.db.patch(leadId, {
      status: "converted",
      convertedToClientId: clientId,
      updatedAt: Date.now(),
    });
    
    return clientId;
  },
});

export const deleteLead = mutation({
  args: { leadId: v.id("leads") },
  handler: async (ctx, { leadId }) => {
    await ctx.db.delete(leadId);
  },
});
