import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

// Get all contacts with filtering
export const getAllContacts = query({
  args: {
    type: v.optional(v.union(v.literal("lead"), v.literal("customer"), v.literal("partner"))),
    lifecycleStage: v.optional(v.union(
      v.literal("prospect"),
      v.literal("qualified"),
      v.literal("customer"),
      v.literal("at_risk"),
      v.literal("churned")
    )),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("blocked"))),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let contacts = await ctx.db.query("contacts").collect();

    // Apply filters
    if (args.type) {
      contacts = contacts.filter(c => c.type === args.type);
    }
    if (args.lifecycleStage) {
      contacts = contacts.filter(c => c.lifecycleStage === args.lifecycleStage);
    }
    if (args.status) {
      contacts = contacts.filter(c => c.status === args.status);
    }
    if (args.assignedTo) {
      contacts = contacts.filter(c => c.assignedTo === args.assignedTo);
    }

    return contacts.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get contact by ID
export const getContactById = query({
  args: { id: v.id("contacts") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// Get contact by email
export const getContactByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("contacts")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
  },
});

// Get contacts by lifecycle stage (for Kanban)
export const getContactsByLifecycle = query({
  handler: async (ctx) => {
    const contacts = await ctx.db.query("contacts").collect();
    
    return {
      prospect: contacts.filter(c => c.lifecycleStage === "prospect"),
      qualified: contacts.filter(c => c.lifecycleStage === "qualified"),
      customer: contacts.filter(c => c.lifecycleStage === "customer"),
      at_risk: contacts.filter(c => c.lifecycleStage === "at_risk"),
      churned: contacts.filter(c => c.lifecycleStage === "churned"),
    };
  },
});

// Get contact statistics
export const getContactStats = query({
  handler: async (ctx) => {
    const contacts = await ctx.db.query("contacts").collect();
    
    return {
      total: contacts.length,
      leads: contacts.filter(c => c.type === "lead").length,
      customers: contacts.filter(c => c.type === "customer").length,
      partners: contacts.filter(c => c.type === "partner").length,
      active: contacts.filter(c => c.status === "active").length,
      byLifecycle: {
        prospect: contacts.filter(c => c.lifecycleStage === "prospect").length,
        qualified: contacts.filter(c => c.lifecycleStage === "qualified").length,
        customer: contacts.filter(c => c.lifecycleStage === "customer").length,
        at_risk: contacts.filter(c => c.lifecycleStage === "at_risk").length,
        churned: contacts.filter(c => c.lifecycleStage === "churned").length,
      },
    };
  },
});

// Search contacts
export const searchContacts = query({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    const contacts = await ctx.db.query("contacts").collect();
    const searchLower = query.toLowerCase();
    
    return contacts.filter(c => 
      c.name.toLowerCase().includes(searchLower) ||
      c.email.toLowerCase().includes(searchLower) ||
      (c.contactPersonEmail && c.contactPersonEmail.toLowerCase().includes(searchLower)) ||
      (c.company && c.company.toLowerCase().includes(searchLower)) ||
      (c.phone && c.phone.includes(query))
    );
  },
});

// ============================================
// MUTATIONS
// ============================================

// Create new contact
export const createContact = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    type: v.union(v.literal("lead"), v.literal("customer"), v.literal("partner")),
    lifecycleStage: v.union(
      v.literal("prospect"),
      v.literal("qualified"),
      v.literal("customer"),
      v.literal("at_risk"),
      v.literal("churned")
    ),
    leadSource: v.optional(v.string()),
    leadScore: v.optional(v.number()),
    industry: v.optional(v.string()),
    website: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Check if contact with email already exists
    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existing) {
      throw new Error("Contact with this email already exists");
    }

    const now = Date.now();
    
    return await ctx.db.insert("contacts", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      company: args.company,
      type: args.type,
      lifecycleStage: args.lifecycleStage,
      status: "active",
      leadSource: args.leadSource,
      leadScore: args.leadScore,
      industry: args.industry,
      website: args.website,
      address: args.address,
      notes: args.notes,
      tags: args.tags || [],
      labels: [],
      assignedTo: args.assignedTo,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update contact
export const updateContact = mutation({
  args: {
    id: v.id("contacts"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    type: v.optional(v.union(v.literal("lead"), v.literal("customer"), v.literal("partner"))),
    lifecycleStage: v.optional(v.union(
      v.literal("prospect"),
      v.literal("qualified"),
      v.literal("customer"),
      v.literal("at_risk"),
      v.literal("churned")
    )),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("blocked"))),
    leadSource: v.optional(v.string()),
    leadScore: v.optional(v.number()),
    customerSince: v.optional(v.number()),
    totalRevenue: v.optional(v.number()),
    industry: v.optional(v.string()),
    website: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    labels: v.optional(v.array(v.string())),
    assignedTo: v.optional(v.id("users")),
    lastContactedAt: v.optional(v.number()),
    nextFollowUpAt: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const contact = await ctx.db.get(id);
    if (!contact) {
      throw new Error("Contact not found");
    }

    // If email is being updated, check for duplicates
    if (updates.email && updates.email !== contact.email) {
      const existing = await ctx.db
        .query("contacts")
        .withIndex("by_email", (q) => q.eq("email", updates.email!))
        .first();
      
      if (existing && existing._id !== id) {
        throw new Error("Another contact with this email already exists");
      }
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

// Update contact lifecycle stage (for Kanban drag & drop)
export const updateContactLifecycle = mutation({
  args: {
    id: v.id("contacts"),
    lifecycleStage: v.union(
      v.literal("prospect"),
      v.literal("qualified"),
      v.literal("customer"),
      v.literal("at_risk"),
      v.literal("churned")
    ),
  },
  handler: async (ctx, { id, lifecycleStage }) => {
    await ctx.db.patch(id, {
      lifecycleStage,
      updatedAt: Date.now(),
    });
    return id;
  },
});

// Delete contact
export const deleteContact = mutation({
  args: { id: v.id("contacts") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
    return id;
  },
});

// Convert lead to customer
export const convertLeadToCustomer = mutation({
  args: {
    id: v.id("contacts"),
    subscriptionId: v.optional(v.id("org_subscriptions")),
  },
  handler: async (ctx, { id, subscriptionId }) => {
    const contact = await ctx.db.get(id);
    if (!contact) {
      throw new Error("Contact not found");
    }

    if (contact.type !== "lead") {
      throw new Error("Contact is not a lead");
    }

    await ctx.db.patch(id, {
      type: "customer",
      lifecycleStage: "customer",
      customerSince: Date.now(),
      subscriptionId,
      updatedAt: Date.now(),
    });

    return id;
  },
});

// Bulk update contacts
export const bulkUpdateContacts = mutation({
  args: {
    ids: v.array(v.id("contacts")),
    updates: v.object({
      status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("blocked"))),
      assignedTo: v.optional(v.id("users")),
      tags: v.optional(v.array(v.string())),
      labels: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, { ids, updates }) => {
    const now = Date.now();
    
    for (const id of ids) {
      await ctx.db.patch(id, {
        ...updates,
        updatedAt: now,
      });
    }

    return ids;
  },
});
