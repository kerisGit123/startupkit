# Unified Ticketing & Communication System - Complete Redesign

**Date:** January 27, 2026  
**Status:** Design Document  
**Purpose:** Clean, structural implementation of customer support system

---

## 📋 Table of Contents

1. [Current Problems](#current-problems)
2. [System Overview](#system-overview)
3. [Channel Types Explained](#channel-types-explained)
4. [Comparison with Zendesk](#comparison-with-zendesk)
5. [Proposed Architecture](#proposed-architecture)
6. [Database Schema](#database-schema)
7. [Data Flow](#data-flow)
8. [Implementation Plan](#implementation-plan)
9. [Migration Strategy](#migration-strategy)

---

## 🔴 Current Problems

### **Structural Issues:**

1. **Dual Table System (Broken)**
   - `support_tickets` + `ticket_messages` (legacy system)
   - `inbox_messages` (new unified inbox)
   - **Problem:** Data doesn't sync properly between them
   - **Result:** Customer replies don't appear in admin inbox

2. **Inconsistent Metadata**
   - Some messages show "Unknown" sender
   - User information not consistently populated
   - No clear relationship between tables

3. **Confusing Channel Separation**
   - Why separate tables for tickets vs chatbot vs email?
   - All are just "customer messages" that need responses
   - Current implementation creates unnecessary complexity

4. **No Single Source of Truth**
   - Same conversation data duplicated across multiple tables
   - Updates in one place don't reflect in another
   - Impossible to get complete conversation history

### **Code Quality Issues:**

- Messy mutations trying to sync between tables
- Duplicate entries in inbox
- Complex cleanup logic needed
- Hard to maintain and debug

---

## 🎯 System Overview

### **What We're Building:**

A **Unified Communication Inbox** where ALL customer interactions flow through ONE system:
- Support tickets from users
- Chatbot conversations
- Email communications
- Future: SMS, social media, etc.

### **Core Principle:**

> **ONE CONVERSATION = ONE THREAD**  
> Regardless of channel (ticket, chat, email), it's all just messages between customer and support team.

---

## 📡 Channel Types Explained

### **1. Support Tickets** 🎫
**Purpose:** Formal customer support requests  
**Use Case:** 
- User has a problem/question
- Creates ticket with subject + description
- Admin responds via inbox
- Conversation continues until resolved

**Example:**
```
User: "My payment failed, need help"
Admin: "Let me check your account..."
User: "Thanks, it's working now"
Admin: "Great! Marking as resolved"
```

### **2. Chatbot Messages** 💬
**Purpose:** Real-time chat conversations  
**Use Case:**
- User chats with AI/bot on website
- Bot can't answer → escalates to human
- Conversation appears in admin inbox
- Admin takes over and responds

**Example:**
```
User: "What are your pricing plans?"
Bot: "We have Basic ($10) and Pro ($20)"
User: "Can I get a custom enterprise plan?"
Bot: "Let me connect you with our team..."
→ Escalated to admin inbox
```

### **3. Email** 📧
**Purpose:** Email-based support  
**Use Case:**
- Customer emails support@yourcompany.com
- Email appears in admin inbox
- Admin replies via inbox
- Conversation continues via email thread

**Example:**
```
Customer emails: support@company.com
Subject: "Question about refund policy"
→ Appears in inbox
Admin replies from inbox
→ Sent as email to customer
```

### **Should They Be Integrated?**

**YES - All in ONE unified inbox because:**

1. **Customer doesn't care about channel**
   - They just want help
   - Whether ticket, chat, or email = same to them

2. **Admin needs single view**
   - Don't want to check 3 different places
   - All conversations in one inbox
   - Easier to manage and prioritize

3. **Conversation continuity**
   - User starts in chat, continues via email
   - Should be same conversation thread
   - Not separate disconnected messages

---

## 🆚 Comparison with Zendesk

### **Zendesk (Complex Enterprise Solution):**

**Features:**
- Multi-channel support (email, chat, phone, social)
- Advanced automation & workflows
- AI-powered routing
- SLA management
- Knowledge base integration
- Customer portal
- Analytics & reporting
- Team collaboration tools
- Third-party integrations (100+)
- Custom apps & marketplace

**Complexity:**
- 50+ database tables
- Complex permission system
- Advanced routing engine
- Multi-brand support
- Custom fields & forms
- Macros & triggers
- Views & filters
- Satisfaction surveys

**Cost:** $49-$215/agent/month

---

### **Our System (Simple Startup Solution):**

**Features:**
- Multi-channel support (tickets, chat, email)
- Basic unified inbox
- Simple labeling (urgent, follow-up, resolved)
- Conversation threading
- User identification
- Reply & forward
- Search & filter

**Simplicity:**
- 2-3 core tables
- Simple permission (admin vs user)
- Manual routing
- Single brand
- Fixed fields
- No automation (yet)
- Basic views

**Cost:** Free (self-hosted)

---

### **Key Differences:**

| Feature | Zendesk | Our System |
|---------|---------|------------|
| **Target** | Enterprise teams | Startups/SMBs |
| **Channels** | 10+ channels | 3 channels (ticket, chat, email) |
| **Automation** | Advanced triggers & macros | Manual handling |
| **Routing** | AI-powered | Manual assignment |
| **Reporting** | Advanced analytics | Basic metrics |
| **Customization** | Highly customizable | Fixed structure |
| **Learning Curve** | Steep | Minimal |
| **Setup Time** | Days/weeks | Minutes |
| **Maintenance** | Complex | Simple |

---

## 🏗️ Proposed Architecture

### **Core Concept: Single Source of Truth**

```
┌─────────────────────────────────────────────────────┐
│                  UNIFIED INBOX                       │
│              (conversations table)                   │
│                                                      │
│  Every customer interaction = ONE conversation       │
│  All messages in that conversation = ONE thread      │
└─────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    ┌───▼───┐        ┌───▼───┐        ┌───▼───┐
    │Ticket │        │ Chat  │        │ Email │
    │Channel│        │Channel│        │Channel│
    └───────┘        └───────┘        └───────┘
```

### **Three-Table Architecture:**

#### **1. `conversations` (Main Table)**
The single source of truth for all customer interactions.

```typescript
{
  _id: Id<"conversations">
  conversationNumber: "CONV-000001"  // Unique identifier
  
  // Channel & Type
  channel: "ticket" | "chatbot" | "email"
  type: "support" | "sales" | "general"
  
  // Customer Info
  customerId: Id<"users"> | null
  customerName: string
  customerEmail: string
  
  // Content
  subject: string
  status: "open" | "pending" | "resolved" | "closed"
  priority: "low" | "normal" | "high" | "urgent"
  
  // Assignment & Organization
  assignedTo: Id<"users"> | null
  tags: string[]
  labels: ("urgent" | "follow-up" | "resolved")[]
  
  // Metadata
  firstMessageAt: number
  lastMessageAt: number
  lastReplyAt: number
  resolvedAt: number | null
  closedAt: number | null
  
  // Timestamps
  createdAt: number
  updatedAt: number
}
```

#### **2. `messages` (All Messages)**
Every message in every conversation.

```typescript
{
  _id: Id<"messages">
  conversationId: Id<"conversations">  // Links to conversation
  
  // Sender Info
  senderId: string
  senderType: "customer" | "admin" | "bot"
  senderName: string
  senderEmail: string | null
  
  // Content
  body: string
  htmlBody: string | null
  attachments: string[] | null
  
  // Metadata
  isInternal: boolean  // Internal note vs customer-facing
  sentAt: number
  readAt: number | null
  
  // Timestamps
  createdAt: number
}
```

#### **3. `conversation_events` (Audit Trail)**
Track all actions on conversations.

```typescript
{
  _id: Id<"conversation_events">
  conversationId: Id<"conversations">
  
  // Event Info
  eventType: "created" | "assigned" | "status_changed" | "labeled" | "resolved" | "reopened"
  performedBy: Id<"users">
  performedByName: string
  
  // Event Data
  oldValue: any | null
  newValue: any | null
  
  // Timestamp
  createdAt: number
}
```

---

## 📊 Database Schema

### **Complete Schema Definition:**

```typescript
// convex/schema.ts

conversations: defineTable({
  // Identification
  conversationNumber: v.string(),
  
  // Channel & Classification
  channel: v.union(
    v.literal("ticket"),
    v.literal("chatbot"),
    v.literal("email")
  ),
  type: v.union(
    v.literal("support"),
    v.literal("sales"),
    v.literal("general")
  ),
  
  // Customer Information
  customerId: v.optional(v.id("users")),
  customerName: v.string(),
  customerEmail: v.string(),
  
  // Content & Status
  subject: v.string(),
  status: v.union(
    v.literal("open"),
    v.literal("pending"),
    v.literal("resolved"),
    v.literal("closed")
  ),
  priority: v.union(
    v.literal("low"),
    v.literal("normal"),
    v.literal("high"),
    v.literal("urgent")
  ),
  
  // Organization
  assignedTo: v.optional(v.id("users")),
  tags: v.array(v.string()),
  labels: v.array(v.union(
    v.literal("urgent"),
    v.literal("follow-up"),
    v.literal("resolved")
  )),
  
  // Metrics
  messageCount: v.number(),
  firstMessageAt: v.number(),
  lastMessageAt: v.number(),
  lastReplyAt: v.optional(v.number()),
  resolvedAt: v.optional(v.number()),
  closedAt: v.optional(v.number()),
  
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_number", ["conversationNumber"])
  .index("by_customer", ["customerId"])
  .index("by_email", ["customerEmail"])
  .index("by_status", ["status"])
  .index("by_assigned", ["assignedTo"])
  .index("by_channel", ["channel"])
  .index("by_priority", ["priority"])
  .index("by_updated", ["updatedAt"]),

messages: defineTable({
  conversationId: v.id("conversations"),
  
  // Sender
  senderId: v.string(),
  senderType: v.union(
    v.literal("customer"),
    v.literal("admin"),
    v.literal("bot")
  ),
  senderName: v.string(),
  senderEmail: v.optional(v.string()),
  
  // Content
  body: v.string(),
  htmlBody: v.optional(v.string()),
  attachments: v.optional(v.array(v.string())),
  
  // Metadata
  isInternal: v.boolean(),
  sentAt: v.number(),
  readAt: v.optional(v.number()),
  
  createdAt: v.number(),
})
  .index("by_conversation", ["conversationId"])
  .index("by_sender", ["senderId"])
  .index("by_sent", ["sentAt"]),

conversation_events: defineTable({
  conversationId: v.id("conversations"),
  eventType: v.string(),
  performedBy: v.id("users"),
  performedByName: v.string(),
  oldValue: v.optional(v.any()),
  newValue: v.optional(v.any()),
  createdAt: v.number(),
})
  .index("by_conversation", ["conversationId"])
  .index("by_created", ["createdAt"]),
```

---

## 🔄 Data Flow

### **1. User Creates Ticket**

```
User Panel → createConversation mutation
     ↓
Insert into conversations table
  - channel: "ticket"
  - status: "open"
  - customerName, customerEmail
     ↓
Insert first message into messages table
  - senderType: "customer"
  - body: ticket description
     ↓
Insert event into conversation_events
  - eventType: "created"
     ↓
Admin sees in unified inbox
```

### **2. Admin Replies**

```
Admin Inbox → replyToConversation mutation
     ↓
Insert reply into messages table
  - senderType: "admin"
  - body: admin response
     ↓
Update conversation
  - lastReplyAt: now
  - status: "pending" (waiting for customer)
     ↓
Insert event into conversation_events
  - eventType: "replied"
     ↓
Notify customer (email/notification)
```

### **3. Customer Replies**

```
User Panel → addMessage mutation
     ↓
Insert message into messages table
  - senderType: "customer"
     ↓
Update conversation
  - lastMessageAt: now
  - status: "open" (needs admin attention)
  - messageCount++
     ↓
Admin sees updated conversation in inbox
  - Shows "New reply" indicator
  - Sorted to top (by lastMessageAt)
```

### **4. Chatbot Escalation**

```
Chatbot Widget → createConversation mutation
     ↓
Insert into conversations table
  - channel: "chatbot"
  - status: "open"
     ↓
Insert chat messages into messages table
  - Previous bot messages (context)
  - Latest user message
     ↓
Admin sees in inbox
  - Can view full chat history
  - Takes over conversation
```

### **5. Email Integration**

```
Incoming Email → createConversation mutation
     ↓
Insert into conversations table
  - channel: "email"
  - subject: email subject
  - customerEmail: from address
     ↓
Insert email body into messages table
     ↓
Admin replies via inbox
     ↓
Send email via email service
  - Reply-to: conversation email address
  - Thread-ID: conversationNumber
```

---

## 🛠️ Implementation Plan

### **Phase 1: Core Infrastructure (Week 1)**

**Tasks:**
1. Create new schema (conversations, messages, conversation_events)
2. Build core mutations:
   - `createConversation`
   - `addMessage`
   - `updateConversationStatus`
   - `assignConversation`
   - `labelConversation`
3. Build core queries:
   - `getConversations` (with filters)
   - `getConversation` (single with all messages)
   - `getConversationMessages`
   - `searchConversations`

**Deliverables:**
- ✅ Schema deployed
- ✅ All mutations working
- ✅ All queries tested

---

### **Phase 2: Admin Inbox UI (Week 2)**

**Tasks:**
1. Build new inbox page from scratch
2. Conversation list view:
   - Show all conversations
   - Filter by status, channel, assigned
   - Search by customer, subject
   - Sort by last activity
3. Conversation detail view:
   - Show full message thread
   - Reply interface
   - Status management
   - Labeling
   - Assignment
4. Actions:
   - Reply
   - Internal note
   - Change status
   - Assign to team member
   - Add labels
   - Delete conversation

**Deliverables:**
- ✅ Clean, functional inbox UI
- ✅ All actions working
- ✅ Real-time updates

---

### **Phase 3: User-Facing Interfaces (Week 3)**

**Tasks:**
1. User ticket creation:
   - Form to create new conversation
   - File attachments support
2. User ticket view:
   - View conversation history
   - Reply to conversation
   - See status updates
3. Chatbot integration:
   - Widget on website
   - Escalation to admin
   - Conversation handoff
4. Email integration:
   - Receive emails → create conversations
   - Send replies as emails
   - Thread management

**Deliverables:**
- ✅ User can create & view tickets
- ✅ Chatbot creates conversations
- ✅ Email integration working

---

### **Phase 4: Advanced Features (Week 4)**

**Tasks:**
1. Notifications:
   - Email notifications for new messages
   - In-app notifications
   - Desktop notifications
2. Analytics:
   - Response time metrics
   - Resolution time
   - Conversation volume
   - Customer satisfaction
3. Team features:
   - Assignment rules
   - Team views
   - Collaboration notes
4. Customer portal:
   - View all their conversations
   - Create new tickets
   - Knowledge base

**Deliverables:**
- ✅ Notifications working
- ✅ Basic analytics dashboard
- ✅ Team collaboration features

---

## 🔄 Migration Strategy

### **Option 1: Clean Start (Recommended)**

**Approach:** Start fresh with new system, archive old data

**Steps:**
1. Deploy new schema alongside old tables
2. Build new inbox UI (separate route: `/admin/inbox-v2`)
3. Test thoroughly with new conversations
4. Switch default route to new inbox
5. Mark old system as "Legacy - Read Only"
6. Keep old data accessible but frozen

**Pros:**
- Clean implementation
- No data corruption risk
- Can test thoroughly before switch
- Old data still accessible

**Cons:**
- Old conversations not in new system
- Users need to check both places temporarily

---

### **Option 2: Data Migration**

**Approach:** Migrate existing tickets to new system

**Steps:**
1. Deploy new schema
2. Write migration script:
   ```typescript
   // For each support_ticket:
   //   - Create conversation
   //   - Migrate all ticket_messages to messages
   //   - Set proper status, labels
   ```
3. Run migration (one-time)
4. Verify data integrity
5. Switch to new system
6. Delete old tables

**Pros:**
- All data in one place
- Complete history preserved
- Clean cutover

**Cons:**
- Migration complexity
- Risk of data loss
- Need thorough testing

---

### **Recommended Approach:**

**Hybrid: Clean Start + Manual Migration**

1. **Week 1-3:** Build new system completely
2. **Week 4:** Run migration for ACTIVE conversations only
   - Open tickets → new conversations
   - Pending tickets → new conversations
   - Closed tickets → leave in old system
3. **Go Live:** Switch to new inbox
4. **Archive:** Keep old system read-only for history

**Benefits:**
- Best of both worlds
- Minimal migration risk
- Active work in new system
- Historical data preserved

---

## 📝 Summary

### **Why Redesign?**

Current system has fundamental structural problems:
- Dual table system doesn't sync
- Complex, messy code
- Data inconsistencies
- Hard to maintain

### **What We're Building:**

A **simple, clean unified inbox** where:
- ONE table for conversations
- ONE table for messages
- Clear, simple data flow
- Easy to understand and maintain

### **How It's Different from Zendesk:**

- **Simpler:** 3 tables vs 50+
- **Focused:** Core features only
- **Startup-friendly:** Quick to implement
- **Maintainable:** Clean code structure

### **Next Steps:**

1. **Review this document**
2. **Approve architecture**
3. **Start Phase 1 implementation**
4. **Build clean, working system**

---

## 🎯 Success Criteria

**The new system is successful when:**

✅ Customer creates ticket → appears in admin inbox immediately  
✅ Customer replies → admin sees update in same conversation  
✅ Admin replies → customer sees in their ticket view  
✅ Chatbot escalates → appears as conversation in inbox  
✅ Email arrives → creates conversation automatically  
✅ All messages in ONE place, properly threaded  
✅ No duplicate entries  
✅ No "Unknown" senders  
✅ Clean, maintainable code  
✅ Easy to add new features  

---

**Ready to build this properly?** 🚀
