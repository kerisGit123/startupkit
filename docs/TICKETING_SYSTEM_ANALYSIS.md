# Ticketing System Architecture Analysis

**Date:** January 27, 2026  
**Status:** Analysis Complete

---

## 📊 **Current Architecture**

### **What You Have:**

#### **1. Separate Ticketing System**
- **Table:** `support_tickets`
- **Messages:** `ticket_messages`
- **Features:**
  - Ticket creation with auto-generated numbers (TKT-000001)
  - Priority levels (low, medium, high, urgent)
  - Categories (billing, technical, etc.)
  - Status tracking (open, in_progress, waiting_customer, resolved, closed)
  - SLA tracking
  - Customer and admin messages
  - Response time tracking

#### **2. Unified Inbox System**
- **Table:** `inbox_messages`
- **Purpose:** Consolidate all communication channels
- **Channels:** Email, Chatbot, Tickets, SMS
- **Current State:** You synced tickets into inbox

---

## 🤔 **The Problem: Dual System**

### **Current Flow:**
```
Customer creates ticket → support_tickets table
                       ↓
                  Migration sync
                       ↓
              inbox_messages table (copy)
```

### **Issues:**

1. **Data Duplication**
   - Same ticket exists in two places
   - Changes in `support_tickets` don't sync to `inbox_messages`
   - Updates in inbox don't sync back to tickets

2. **Inconsistent State**
   - Ticket status updated → Inbox shows old status
   - Message added to ticket → Inbox doesn't show it
   - Inbox message replied → Ticket doesn't know

3. **Maintenance Burden**
   - Need to sync regularly
   - Two sources of truth
   - Complex to keep in sync

---

## ✅ **Recommended Solution: Choose One Approach**

### **Option A: Unified Inbox as Single Source** ⭐ **RECOMMENDED**

**Concept:** Use `inbox_messages` as the ONLY place for tickets. Deprecate `support_tickets`.

**Pros:**
- ✅ Single source of truth
- ✅ All communication in one place
- ✅ No sync needed
- ✅ Simpler architecture
- ✅ Better for multi-channel support

**Cons:**
- ❌ Need to migrate existing ticket functionality
- ❌ Lose some ticket-specific features (unless added to inbox)

**Implementation:**
```typescript
// inbox_messages becomes the ticket system
{
  channel: "ticket",
  threadId: "TKT-000001",
  subject: "Billing Issue",
  body: "Description...",
  status: "unread" | "read" | "replied" | "archived",
  priority: "low" | "normal" | "high",
  metadata: {
    ticketNumber: "TKT-000001",
    category: "billing",
    slaBreached: false,
    assignedTo: "admin-user-id"
  }
}
```

---

### **Option B: Keep Separate + Real-time Sync**

**Concept:** Keep `support_tickets` as primary, sync changes to `inbox_messages` automatically.

**Pros:**
- ✅ Keep existing ticket features
- ✅ Tickets visible in inbox
- ✅ Specialized ticket management

**Cons:**
- ❌ Complex sync logic
- ❌ Two sources of truth
- ❌ Potential sync failures
- ❌ More maintenance

**Implementation:**
- Add triggers on ticket create/update
- Sync to inbox automatically
- Handle conflicts

---

### **Option C: Inbox as View Layer Only**

**Concept:** `support_tickets` is primary, `inbox_messages` is just a view/cache.

**Pros:**
- ✅ Keep ticket system intact
- ✅ Inbox shows all channels
- ✅ Clear separation

**Cons:**
- ❌ Still need sync
- ❌ Inbox can't be source of truth
- ❌ Complex architecture

---

## 🎯 **My Recommendation: Option A (Unified Inbox)**

### **Why This is Best:**

1. **Simplicity**
   - One table for all communication
   - No sync needed
   - Easier to maintain

2. **Scalability**
   - Easy to add new channels (WhatsApp, Telegram, etc.)
   - All channels treated equally
   - Consistent API

3. **Modern Approach**
   - How modern support systems work (Intercom, Zendesk)
   - Better user experience
   - Unified interface

4. **Your Use Case**
   - You want all communication in one place
   - You already have the inbox UI
   - Tickets are just another channel

---

## 🔧 **Implementation Plan: Migrate to Unified Inbox**

### **Phase 1: Enhance inbox_messages Schema** ✅ (Already Done)

Current schema supports:
- ✅ Channels (ticket, email, chatbot, sms)
- ✅ Status (unread, read, replied, archived)
- ✅ Priority (low, normal, high)
- ✅ Tags
- ✅ Assignment
- ✅ Metadata (for ticket-specific fields)

### **Phase 2: Create Ticket-Specific Functions**

Add to `convex/inbox.ts`:

```typescript
// Create ticket (wrapper around createMessage)
export const createTicket = mutation({
  args: {
    subject: v.string(),
    description: v.string(),
    priority: v.union(v.literal("low"), v.literal("normal"), v.literal("high")),
    category: v.string(),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // Generate ticket number
    const ticketCount = await ctx.db
      .query("inbox_messages")
      .filter((q) => q.eq(q.field("channel"), "ticket"))
      .collect();
    
    const ticketNumber = `TKT-${String(ticketCount.length + 1).padStart(6, "0")}`;
    
    // Create in inbox
    return await ctx.db.insert("inbox_messages", {
      channel: "ticket",
      direction: "inbound",
      threadId: ticketNumber,
      subject: `[${ticketNumber}] ${args.subject}`,
      body: args.description,
      status: "unread",
      priority: args.priority,
      tags: [args.category],
      sentAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {
        ticketNumber,
        category: args.category,
        userEmail: args.userEmail,
        slaBreached: false,
      },
    });
  },
});

// Get tickets (filter inbox by channel)
export const getTickets = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("inbox_messages")
      .withIndex("by_channel", (q) => q.eq("channel", "ticket"));
    
    let tickets = await query.collect();
    
    if (args.status) {
      tickets = tickets.filter(t => t.status === args.status);
    }
    
    return tickets.sort((a, b) => b.sentAt - a.sentAt);
  },
});

// Update ticket status
export const updateTicketStatus = mutation({
  args: {
    messageId: v.id("inbox_messages"),
    status: v.union(
      v.literal("unread"),
      v.literal("read"),
      v.literal("replied"),
      v.literal("archived")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});
```

### **Phase 3: Migrate Existing Tickets** ✅ (Already Done)

Your migration already copies tickets to inbox.

### **Phase 4: Update UI to Use Inbox**

- ✅ Inbox page already shows tickets
- ✅ Filter by channel works
- ✅ Status updates work

### **Phase 5: Deprecate Old Ticket System**

Once confident:
1. Stop using `convex/tickets.ts` and `convex/adminTickets.ts`
2. Update any ticket creation forms to use new `inbox.createTicket`
3. Keep `support_tickets` table for historical data (read-only)
4. All new tickets go to `inbox_messages`

---

## 📋 **What Needs to be Added to Inbox**

To fully replace tickets, add these to `inbox_messages`:

### **1. Ticket-Specific Metadata** ✅ (Already in metadata field)
- Ticket number
- Category
- SLA breach status
- Related subscription/payment IDs

### **2. Thread/Conversation Support**
```typescript
// Add to inbox.ts
export const getThreadMessages = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    return await ctx.db
      .query("inbox_messages")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .collect();
  },
});

export const addThreadReply = mutation({
  args: {
    threadId: v.string(),
    body: v.string(),
    direction: v.union(v.literal("inbound"), v.literal("outbound")),
  },
  handler: async (ctx, args) => {
    // Get original message
    const original = await ctx.db
      .query("inbox_messages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .first();
    
    if (!original) throw new Error("Thread not found");
    
    // Create reply
    return await ctx.db.insert("inbox_messages", {
      ...original,
      body: args.body,
      direction: args.direction,
      status: args.direction === "outbound" ? "replied" : "unread",
      sentAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
```

### **3. Ticket Statistics**
```typescript
export const getTicketStats = query({
  handler: async (ctx) => {
    const tickets = await ctx.db
      .query("inbox_messages")
      .withIndex("by_channel", (q) => q.eq("channel", "ticket"))
      .collect();
    
    return {
      total: tickets.length,
      unread: tickets.filter(t => t.status === "unread").length,
      replied: tickets.filter(t => t.status === "replied").length,
      archived: tickets.filter(t => t.status === "archived").length,
      highPriority: tickets.filter(t => t.priority === "high").length,
    };
  },
});
```

---

## 🚀 **Action Plan**

### **Immediate (Do Now):**
1. ✅ Fix React key warning (Done)
2. ✅ Keep using unified inbox for tickets
3. ✅ Migration synced existing tickets

### **Short Term (This Week):**
1. Add thread/conversation support to inbox
2. Add ticket statistics to inbox
3. Create ticket creation form that uses inbox
4. Test thoroughly

### **Medium Term (Next Week):**
1. Migrate all ticket functionality to inbox
2. Update admin UI to use inbox queries
3. Add SLA tracking to inbox
4. Add assignment features

### **Long Term (Future):**
1. Deprecate `support_tickets` table (keep for history)
2. Remove old ticket code
3. Add more channels (WhatsApp, etc.)
4. Build advanced inbox features

---

## 💡 **Best Practices**

### **DO:**
- ✅ Use `inbox_messages` as single source of truth
- ✅ Use `metadata` field for ticket-specific data
- ✅ Use `threadId` to group related messages
- ✅ Use `channel` to filter by type
- ✅ Use `tags` for categories

### **DON'T:**
- ❌ Duplicate data between tables
- ❌ Try to sync two sources of truth
- ❌ Create separate tables for each channel
- ❌ Hardcode ticket logic outside inbox

---

## 📊 **Comparison: Before vs After**

### **Before (Current):**
```
support_tickets (primary)
     ↓ (sync)
inbox_messages (view)
```
**Problems:** Duplication, sync issues, complexity

### **After (Recommended):**
```
inbox_messages (single source)
     ↓ (filter by channel)
Tickets | Emails | Chats | SMS
```
**Benefits:** Simple, scalable, maintainable

---

## ✅ **Conclusion**

**Your current approach of syncing tickets to inbox is a good START, but not the final solution.**

**The RIGHT way:**
1. Use `inbox_messages` as the ONLY place for tickets
2. Add ticket-specific functions that work with inbox
3. Deprecate the old `support_tickets` system
4. Keep everything in one unified system

**This gives you:**
- ✅ One source of truth
- ✅ All communication in one place
- ✅ Easier to maintain
- ✅ Better scalability
- ✅ Modern architecture

**Next step:** I can implement the ticket-specific functions for the inbox system if you want to proceed with this approach.
