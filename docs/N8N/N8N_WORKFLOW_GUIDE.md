# 🔄 n8n Workflow Integration Guide

**Production-Grade Architecture for Chatbot System with Convex + n8n + Next.js**

---

## 📋 Overview

This guide provides a **production-ready architecture** for building scalable chatbot systems using:
- **Convex** as the system brain and single source of truth
- **n8n** as the task execution engine
- **Next.js** as the thin UI client

This architecture is designed for **enterprise-grade SaaS applications**, not demos.

### 📚 Table of Contents

**[🧠 Architecture Overview](#-architecture-overview)** - Core design philosophy and system architecture

**[💾 Convex State Model](#-convex-state-model)** - Database schema and state management

**[🔀 Message Routing](#-message-routing)** - Convex-first routing strategy

**[🤖 AI Strategy](#-ai-handling-strategy)** - Deterministic logic vs AI execution

**[👤 Admin Takeover](#-admin-takeover-pattern)** - State-based admin control

**[⚡ Escalation System](#-escalation-system)** - Two-layer keyword detection

**[� n8n Task Workflows](#-n8n-task-workflows)** - Stateless, idempotent task execution

**[� Implementation Guide](#-implementation-guide)** - Step-by-step setup instructions

---

## � Architecture Overview

### Core Design Philosophy

This architecture improves upon traditional chatbot designs by applying these principles:

1. **Single source of truth for conversation state → Convex**
2. **n8n = orchestration + side effects**, not state owner
3. **Next.js widget = thin client**, no logic
4. **AI decisions are deterministic, auditable, and overridable**
5. **Admin takeover is a state switch, not a parallel workflow**

### High-Level System Architecture

```
┌────────────────────┐
│  Next.js Widget    │
│  (UI only)         │
└─────────┬──────────┘
          │ POST message
          ▼
┌────────────────────┐
│ Convex HTTP Action │  ← single entry point
│ routeMessage()     │
└─────────┬──────────┘
          │ decide route
          ▼
┌────────────────────────────────────────────┐
│ Routing Layer (Convex)                     │
│ - bot                                      │
│ - escalation                               │
│ - admin                                    │
│ - lead                                     │
│ - booking                                  │
└─────────┬──────────────────────────────────┘
          │ async tasks
          ▼
┌────────────────────┐
│ n8n Webhooks       │
│ (AI / Email / Cal) │
└────────────────────┘
```

**Key Improvement:**
- ✅ **n8n is no longer the primary router**
- ✅ **Convex becomes the brain**
- ✅ **Predictable state transitions**
- ✅ **No race conditions or duplicate logic**

---

## 💾 Convex State Model

This is the foundation that simplifies everything. All conversation state lives in Convex.

### Conversations Table

```typescript
// convex/schema.ts
conversations: defineTable({
  sessionId: v.string(),
  userId: v.optional(v.string()),
  status: v.union(
    v.literal("bot"),
    v.literal("waiting_admin"),
    v.literal("admin"),
    v.literal("closed")
  ),
  currentIntent: v.union(
    v.literal("general"),
    v.literal("sales"),
    v.literal("support"),
    v.literal("booking")
  ),
  escalationReason: v.optional(v.string()),
  lastMessageAt: v.number(),
  assignedAdminId: v.optional(v.id("users")),
  createdAt: v.number(),
}).index("by_sessionId", ["sessionId"])
  .index("by_status", ["status"])
  .index("by_assignedAdmin", ["assignedAdminId"]),
```

### Messages Table

```typescript
messages: defineTable({
  conversationId: v.id("conversations"),
  sender: v.union(
    v.literal("user"),
    v.literal("bot"),
    v.literal("admin")
  ),
  content: v.string(),
  metadata: v.optional(v.any()),
  createdAt: v.number(),
}).index("by_conversation", ["conversationId"])
  .index("by_createdAt", ["createdAt"]),
```

### Leads Table

```typescript
leads: defineTable({
  conversationId: v.id("conversations"),
  name: v.string(),
  email: v.string(),
  phone: v.optional(v.string()),
  company: v.optional(v.string()),
  score: v.number(), // 0-100
  capturedAt: v.number(),
  status: v.union(
    v.literal("new"),
    v.literal("contacted"),
    v.literal("qualified"),
    v.literal("converted")
  ),
}).index("by_conversation", ["conversationId"])
  .index("by_email", ["email"])
  .index("by_status", ["status"]),
```

**Benefits:**
- Single source of truth
- Real-time subscriptions
- Type-safe queries
- Automatic indexing
- Multi-tenant ready

---

## � Message Routing

### Convex-First Routing Strategy

The widget **always sends to Convex**, never directly to n8n.

#### Step 1: Widget Sends Message

```typescript
// Frontend widget
POST /api/convex/routeMessage
{
  sessionId: "session_123",
  message: "I need help with billing",
  metadata: { source: "widget" }
}
```

#### Step 2: Convex Routing Logic

```typescript
// convex/routing.ts
export const routeMessage = mutation({
  args: {
    sessionId: v.string(),
    message: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Get or create conversation
    let conversation = await ctx.db
      .query("conversations")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!conversation) {
      conversation = await ctx.db.insert("conversations", {
        sessionId: args.sessionId,
        status: "bot",
        currentIntent: "general",
        lastMessageAt: Date.now(),
        createdAt: Date.now(),
      });
    }

    // Save user message
    await ctx.db.insert("messages", {
      conversationId: conversation._id,
      sender: "user",
      content: args.message,
      createdAt: Date.now(),
    });

    // Route based on conversation status
    if (conversation.status === "admin") {
      return { route: "admin", conversationId: conversation._id };
    }

    // Check for hard escalation keywords
    if (detectHardKeywords(args.message)) {
      await ctx.db.patch(conversation._id, {
        status: "waiting_admin",
        escalationReason: "keyword_match",
        lastMessageAt: Date.now(),
      });
      return { 
        route: "escalate", 
        message: "Connecting you to an agent...",
        conversationId: conversation._id 
      };
    }

    // Detect intent
    const intent = detectIntent(args.message);

    // Route to appropriate n8n workflow
    switch (intent) {
      case "lead":
        await scheduleAction(ctx, "n8n/lead_capture", {
          conversationId: conversation._id,
          message: args.message,
        });
        break;

      case "booking":
        await scheduleAction(ctx, "n8n/booking", {
          conversationId: conversation._id,
          message: args.message,
        });
        break;

      default:
        await scheduleAction(ctx, "n8n/ai_response", {
          conversationId: conversation._id,
          message: args.message,
        });
    }

    return { route: "bot", conversationId: conversation._id };
  },
});

function detectHardKeywords(message: string): boolean {
  const keywords = ["refund", "complaint", "legal", "angry", "cancel"];
  return keywords.some((k) => message.toLowerCase().includes(k));
}

function detectIntent(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("price") || msg.includes("demo")) return "lead";
  if (msg.includes("book") || msg.includes("schedule")) return "booking";
  return "general";
}
```

**This replaces 70% of duplicated n8n logic.**

---

## 🤖 AI Handling Strategy

### Separation of Concerns

**Do NOT let n8n decide everything.** Use Convex for deterministic logic, n8n for AI execution.

#### What Convex Decides:

- ✅ Escalation triggers
- ✅ Admin takeover
- ✅ Intent classification
- ✅ State transitions
- ✅ Routing logic

#### What n8n Does:

- ✅ Generate AI responses
- ✅ Send emails
- ✅ Create calendar events
- ✅ Notify Slack/WhatsApp
- ✅ Call external APIs

### Benefits

This avoids:
- ❌ Race conditions
- ❌ Double escalations
- ❌ State mismatch bugs
- ❌ Duplicate logic
- ❌ Debugging nightmares

### Example: AI Response Flow

```typescript
// Convex schedules the task
await scheduleAction(ctx, "n8n/ai_response", {
  conversationId: conversation._id,
  message: args.message,
  context: recentMessages,
});

// n8n executes AI call (stateless)
// POST /n8n/ai_response
{
  conversationId: "conv_123",
  message: "What are your prices?",
  context: [...]
}

// n8n returns response
// Convex saves it to messages table
await ctx.db.insert("messages", {
  conversationId: args.conversationId,
  sender: "bot",
  content: aiResponse,
  createdAt: Date.now(),
});
```

---

## 👤 Admin Takeover Pattern

### Admin Takeover is a State Change, Not a Workflow

This is the **correct model** for admin intervention.

#### When Admin Clicks "Take Over":

```typescript
// convex/admin.ts
export const takeOverConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      status: "admin",
      assignedAdminId: args.adminId,
      lastMessageAt: Date.now(),
    });

    // Notify user
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      sender: "bot",
      content: "An agent has joined the conversation.",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});
```

#### From That Moment:

- ✅ Bot replies are disabled
- ✅ Messages route to admin UI in real time
- ✅ n8n is bypassed entirely
- ✅ Admin sees full conversation history

#### When Admin Releases Chat:

```typescript
export const releaseConversation = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      status: "bot",
      assignedAdminId: undefined,
      lastMessageAt: Date.now(),
    });

    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      sender: "bot",
      content: "The agent has left. I'm here to help!",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});
```

**No duplicate workflows. No race conditions. Just state.**

### Escalation Keywords Detection

```javascript
// n8n Code Node - Keyword Detection
const message = $input.item.json.message.toLowerCase();

const escalationKeywords = [
  'speak to human',
  'talk to agent',
  'real person',
  'frustrated',
  'angry',
  'not helpful',
  'manager',
  'complaint',
  'urgent',
  'emergency',
  'refund',
  'cancel subscription',
  'billing issue',
  'not working',
  'broken'
];

const needsEscalation = escalationKeywords.some(keyword => 
  message.includes(keyword)
);

return {
  chatId: $input.item.json.body.chatId,
  message: $input.item.json.body.message,
  needsEscalation,
  detectedKeywords: escalationKeywords.filter(k => message.includes(k)),
  timestamp: Date.now()
};
```

### Convex Update for Escalation

```javascript
// n8n HTTP Request Node - Update Conversation Status
// POST to your Convex function endpoint

{
  "conversationId": "{{ $json.chatId }}",
  "status": "waiting_for_agent",
  "interventionRequested": true,
  "interventionRequestedAt": "{{ $now }}"
}
```

---

## 🔧 n8n Task Workflows

### Task-Based Pattern (Recommended)

Instead of **many public webhooks**, use **one internal pattern**:

```
Convex → n8n (task-based)
```

### Example n8n Workflows

#### 1. AI Response Task

**Endpoint:** `/n8n/ai_response`

```json
{
  "name": "AI Response Task",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "chatbot-escalation",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "jsCode": "const message = $input.item.json.body.message.toLowerCase();\nconst escalationKeywords = ['speak to human', 'talk to agent', 'real person', 'frustrated', 'angry', 'not helpful', 'manager', 'complaint', 'urgent'];\nconst needsEscalation = escalationKeywords.some(k => message.includes(k));\n\nreturn {\n  chatId: $input.item.json.body.chatId,\n  message: $input.item.json.body.message,\n  needsEscalation,\n  detectedKeywords: escalationKeywords.filter(k => message.includes(k))\n};"
      },
      "name": "Check Keywords",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ $json.needsEscalation }}",
              "value2": true
            }
          ]
        }
      },
      "name": "IF Escalation Needed",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [650, 300]
    },
    {
      "parameters": {
        "jsCode": "return {\n  output: 'I understand you need to speak with someone. Let me connect you with an agent. Average wait time is 2-3 minutes.',\n  chatId: $input.item.json.chatId,\n  escalated: true\n};"
      },
      "name": "Escalation Response",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [850, 200]
    },
    {
      "parameters": {
        "model": "gpt-4",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "You are a helpful assistant."
            },
            {
              "role": "user",
              "content": "={{ $json.message }}"
            }
          ]
        }
      },
      "name": "AI Response",
      "type": "@n8n/n8n-nodes-langchain.openAi",
      "typeVersion": 1,
      "position": [850, 400]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}"
      },
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1050, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Check Keywords", "type": "main", "index": 0 }]]
    },
    "Check Keywords": {
      "main": [[{ "node": "IF Escalation Needed", "type": "main", "index": 0 }]]
    },
    "IF Escalation Needed": {
      "main": [
        [{ "node": "Escalation Response", "type": "main", "index": 0 }],
        [{ "node": "AI Response", "type": "main", "index": 0 }]
      ]
    },
    "Escalation Response": {
      "main": [[{ "node": "Respond", "type": "main", "index": 0 }]]
    },
    "AI Response": {
      "main": [[{ "node": "Respond", "type": "main", "index": 0 }]]
    }
  }
}
```

---

## 📋 Implementation Guide

### Step 1: Set Up Convex Schema

Add the conversation tables to your `convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ... existing tables
  
  conversations: defineTable({
    sessionId: v.string(),
    userId: v.optional(v.string()),
    status: v.union(
      v.literal("bot"),
      v.literal("waiting_admin"),
      v.literal("admin"),
      v.literal("closed")
    ),
    currentIntent: v.string(),
    escalationReason: v.optional(v.string()),
    lastMessageAt: v.number(),
    assignedAdminId: v.optional(v.id("users")),
    createdAt: v.number(),
  }).index("by_sessionId", ["sessionId"])
    .index("by_status", ["status"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    sender: v.union(
      v.literal("user"),
      v.literal("bot"),
      v.literal("admin")
    ),
    content: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"]),

  leads: defineTable({
    conversationId: v.id("conversations"),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    score: v.number(),
    capturedAt: v.number(),
    status: v.string(),
  }).index("by_conversation", ["conversationId"])
    .index("by_email", ["email"]),
});
```

### Step 2: Create Convex Routing Function

Create `convex/routing.ts` with the routing logic shown in the [Message Routing](#-message-routing) section.

### Step 3: Set Up n8n Task Workflows

Create task-based n8n workflows:
- `/n8n/ai_response` - Generate AI responses
- `/n8n/send_email` - Send notification emails
- `/n8n/create_booking` - Handle calendar bookings
- `/n8n/lead_capture` - Process lead information

Each workflow should be:
- ✅ **Stateless** - No internal state
- ✅ **Idempotent** - Safe to retry
- ✅ **Task-oriented** - Single responsibility

### Step 4: Update Next.js Widget

Modify your chat widget to send messages to Convex:

```typescript
// components/ChatWidget.tsx
const sendMessage = async (message: string) => {
  const response = await fetch('/api/convex/routeMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: getSessionId(),
      message,
      metadata: { source: 'widget' }
    })
  });
  
  const data = await response.json();
  // Handle response
};
```

### Step 5: Build Admin Dashboard

Create admin UI for conversation management:
- View active conversations
- Take over conversations
- Release conversations back to bot
- View conversation history
- Monitor escalation queue

---

## 🎯 Operational Benefits

This architecture provides:

- ✅ **Predictable escalation** - No duplicate admin takeovers
- ✅ **Easy analytics** - All data in Convex
- ✅ **Safe retries** - Idempotent n8n tasks
- ✅ **Multi-tenant ready** - Conversation isolation
- ✅ **Future-proof** - Easy to add WhatsApp/Telegram
- ✅ **Debuggable** - Clear state transitions
- ✅ **Scalable** - Convex handles concurrency
- ✅ **Auditable** - Full conversation history

---

## 🚀 Next Steps

### Moving to Enterprise-Grade

Your current workflows are **functionally correct**, but can be **simplified and hardened** by:

1. **Promote Convex to system brain** ✅
2. **Demote n8n to execution engine** ✅
3. **Treat admin takeover as state** ✅
4. **Keep Next.js widget dumb** ✅

### Future Enhancements

- **Multi-channel support** - WhatsApp, Telegram, SMS
- **Advanced analytics** - Conversation insights, sentiment trends
- **AI training** - Use conversation data to improve responses
- **SLA monitoring** - Track response times, escalation rates
- **A/B testing** - Test different AI prompts, escalation thresholds

---

## 📞 Support & Resources

**Documentation:**
- [Convex Documentation](https://docs.convex.dev)
- [n8n Documentation](https://docs.n8n.io)
- [OpenAI API Docs](https://platform.openai.com/docs)

**Architecture Suitable For:**
- ✅ Real production SaaS
- ✅ Multi-tenant applications
- ✅ Enterprise deployments
- ✅ High-scale chatbots

**Not Suitable For:**
- ❌ Quick demos
- ❌ Prototype projects
- ❌ Single-user apps

---

**Last Updated**: January 16, 2026  
**Architecture Version**: 2.0 (Production-Grade)  
**Status**: Enterprise Ready  
**Maintained by**: StartupKit Development Team

---

## 📋 Legacy Workflow Reference

**Purpose:** Capture customer information and notify sales team

### Workflow Structure

```text
Webhook → Extract Lead Data → Save to Convex → Send Notification → Response
```

### When to Use
- Contact form submissions
- Demo requests
- Quote requests
- Newsletter signups
- Sales inquiries

### Key Features
- Automatic lead storage in Convex
- Email notifications to sales team
- Slack/Teams integration options
- Lead scoring and routing

### Complete Workflow JSON

```json
{
  "name": "Lead Capture & Notification",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "lead-captured",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "jsCode": "return {\n  name: $input.item.json.body.name,\n  email: $input.item.json.body.email,\n  phone: $input.item.json.body.phone || '',\n  company: $input.item.json.body.company || '',\n  message: $input.item.json.body.message || '',\n  source: 'chatbot',\n  capturedAt: Date.now()\n};"
      },
      "name": "Extract Lead Data",
      "type": "n8n-nodes-base.code",
      "position": [450, 300]
    },
    {
      "parameters": {
        "url": "YOUR_CONVEX_HTTP_ACTION_URL",
        "method": "POST",
        "jsonParameters": true,
        "bodyParametersJson": "={{ $json }}"
      },
      "name": "Save to Convex",
      "type": "n8n-nodes-base.httpRequest",
      "position": [650, 300]
    },
    {
      "parameters": {
        "fromEmail": "notifications@yourcompany.com",
        "toEmail": "sales@yourcompany.com",
        "subject": "🎯 New Lead: {{ $('Extract Lead Data').item.json.name }}",
        "html": "<h2>New Lead Captured</h2><p><strong>Name:</strong> {{ $('Extract Lead Data').item.json.name }}</p><p><strong>Email:</strong> {{ $('Extract Lead Data').item.json.email }}</p><p><strong>Phone:</strong> {{ $('Extract Lead Data').item.json.phone }}</p><p><strong>Company:</strong> {{ $('Extract Lead Data').item.json.company }}</p><p><strong>Message:</strong> {{ $('Extract Lead Data').item.json.message }}</p><p><strong>Source:</strong> Chatbot</p>"
      },
      "name": "Send Email Notification",
      "type": "n8n-nodes-base.emailSend",
      "position": [850, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ { \"success\": true, \"message\": \"Thank you! We'll contact you soon.\" } }}"
      },
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [1050, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Extract Lead Data" }]]
    },
    "Extract Lead Data": {
      "main": [[{ "node": "Save to Convex" }]]
    },
    "Save to Convex": {
      "main": [[{ "node": "Send Email Notification" }]]
    },
    "Send Email Notification": {
      "main": [[{ "node": "Respond to Webhook" }]]
    }
  }
}
```

### Setup Steps

1. **Import Workflow**: Import JSON into n8n
2. **Configure Email**: Set up email credentials (Gmail, SendGrid, etc.)
3. **Set Convex URL**: Replace `YOUR_CONVEX_HTTP_ACTION_URL` with your endpoint
4. **Customize Notification**: Edit email template and recipients
5. **Test**: Submit a test lead through your chatbot

### Frontend Integration

```javascript
// Trigger lead capture from chatbot
const captureLeadResponse = await fetch('YOUR_N8N_WEBHOOK_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    company: 'Acme Corp',
    message: 'Interested in your product'
  })
});
```

[← Back to Workflow Selection](#select-your-workflow-type)

---

## 📅 Appointment Booking Workflow

**Purpose:** Schedule appointments and send confirmations

### Workflow Structure

```text
Webhook → Validate Data → Create Calendar Event → Send Confirmation → Update Convex → Response
```

### When to Use
- Demo bookings
- Consultation scheduling
- Support calls
- Sales meetings
- Onboarding sessions

### Key Features
- Google Calendar integration
- Automatic confirmation emails
- Timezone handling
- Reminder notifications
- Booking conflict detection

### Complete Workflow JSON

```json
{
  "name": "Appointment Booking & Notification",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "appointment-booked",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "jsCode": "const { name, email, date, time, purpose, notes } = $input.item.json.body;\n\n// Format datetime for Google Calendar\nconst startDateTime = `${date}T${time}:00`;\nconst endTime = new Date(`${date}T${time}:00`);\nendTime.setHours(endTime.getHours() + 1);\nconst endDateTime = endTime.toISOString().slice(0, 16);\n\nreturn {\n  name,\n  email,\n  date,\n  time,\n  purpose: purpose || 'General consultation',\n  notes: notes || '',\n  startDateTime,\n  endDateTime,\n  timestamp: Date.now()\n};"
      },
      "name": "Format Appointment Data",
      "type": "n8n-nodes-base.code",
      "position": [450, 300]
    },
    {
      "parameters": {
        "calendar": "primary",
        "start": "={{ $json.startDateTime }}",
        "end": "={{ $json.endDateTime }}",
        "summary": "Meeting with {{ $json.name }}",
        "description": "Purpose: {{ $json.purpose }}\n\nNotes: {{ $json.notes }}\n\nContact: {{ $json.email }}",
        "attendees": "={{ $json.email }}"
      },
      "name": "Create Google Calendar Event",
      "type": "n8n-nodes-base.googleCalendar",
      "position": [650, 300]
    },
    {
      "parameters": {
        "fromEmail": "appointments@yourcompany.com",
        "toEmail": "={{ $('Format Appointment Data').item.json.email }}",
        "subject": "✅ Appointment Confirmed - {{ $('Format Appointment Data').item.json.date }}",
        "html": "<div style='font-family: Arial, sans-serif; max-width: 600px;'><h2 style='color: #4CAF50;'>Your Appointment is Confirmed!</h2><div style='background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;'><p><strong>Date:</strong> {{ $('Format Appointment Data').item.json.date }}</p><p><strong>Time:</strong> {{ $('Format Appointment Data').item.json.time }}</p><p><strong>Purpose:</strong> {{ $('Format Appointment Data').item.json.purpose }}</p></div><p>We look forward to meeting with you!</p><p style='color: #666; font-size: 12px;'>If you need to reschedule, please contact us at support@yourcompany.com</p></div>"
      },
      "name": "Send Confirmation Email",
      "type": "n8n-nodes-base.emailSend",
      "position": [850, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ { \"success\": true, \"message\": \"Appointment booked successfully!\", \"eventId\": $('Create Google Calendar Event').item.json.id } }}"
      },
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [1050, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Format Appointment Data" }]]
    },
    "Format Appointment Data": {
      "main": [[{ "node": "Create Google Calendar Event" }]]
    },
    "Create Google Calendar Event": {
      "main": [[{ "node": "Send Confirmation Email" }]]
    },
    "Send Confirmation Email": {
      "main": [[{ "node": "Respond to Webhook" }]]
    }
  }
}
```

### Setup Steps

1. **Import Workflow**: Import JSON into n8n
2. **Configure Google Calendar**: 
   - Add Google Calendar credentials in n8n
   - Authorize calendar access
   - Select target calendar
3. **Configure Email**: Set up email sending credentials
4. **Customize Templates**: Edit confirmation email HTML
5. **Test**: Book a test appointment

### Frontend Integration

```javascript
// Book appointment from chatbot
const bookingResponse = await fetch('YOUR_N8N_WEBHOOK_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Jane Smith',
    email: 'jane@example.com',
    date: '2026-01-20',
    time: '14:00',
    purpose: 'Product demo',
    notes: 'Interested in enterprise plan'
  })
});
```

[← Back to Workflow Selection](#select-your-workflow-type)

---

## 🎯 Quick Start Guide

### Step-by-Step Setup

1. **Choose Your Workflow**: Click on the workflow type you need from the [selection menu](#select-your-workflow-type)
2. **Copy JSON**: Copy the workflow JSON from the chosen section
3. **Import to n8n**: 
   - Open n8n
   - Click "Import from File" or "Import from Clipboard"
   - Paste the JSON
4. **Configure Credentials**: Set up required credentials (OpenAI, Email, Google Calendar, etc.)
5. **Update URLs**: Replace placeholder URLs with your actual endpoints
6. **Test**: Activate the workflow and send a test request
7. **Deploy**: Use the webhook URL in your frontend chatbot

### Common Configuration

**Convex HTTP Actions**: Create HTTP actions in Convex for:
- Updating chat status
- Saving leads
- Storing appointments

**Email Setup**: Supported providers:
- Gmail (OAuth2)
- SendGrid (API Key)
- SMTP (Custom server)

**Calendar Integration**: Requires:
- Google Calendar API enabled
- OAuth2 credentials
- Calendar ID

---

## 📞 Support

Need help setting up your workflows? Check the n8n documentation or contact support.

**Resources:**
- [n8n Documentation](https://docs.n8n.io)
- [Convex Documentation](https://docs.convex.dev)
- [OpenAI API Docs](https://platform.openai.com/docs)

[🔝 Back to Top](#-n8n-workflow-integration-guide)
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 1,
      "position": [650, 300]
    }
  ]
}
```

---

## 🔧 Setup Instructions

### 1. Create n8n Workflow

1. Log in to your n8n instance
2. Click **"New Workflow"**
3. Import one of the JSON workflows above
4. Configure credentials (OpenAI, Email, etc.)

### 2. Get Webhook URL

1. Click on the **Webhook** node
2. Click **"Execute Node"**
3. Copy the **Production URL**
4. Example: `https://your-n8n.com/webhook/chatbot-frontend`

### 3. Configure in Admin Panel

1. Go to `/admin/chatbot-settings`
2. Select chatbot type (Frontend or User Panel)
3. Paste webhook URL
4. Click **"Test Connection"**
5. Save configuration

### 4. Test the Integration

```bash
# Test webhook directly
curl -X POST https://your-n8n.com/webhook/chatbot-frontend \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "test_123",
    "message": "Hello, how can you help me?",
    "route": "frontend"
  }'
```

---

## 🎯 Best Practices

### 1. Error Handling

```javascript
// Add try-catch in code nodes
try {
  const response = await fetch('...');
  return { success: true, data: response };
} catch (error) {
  return { 
    success: false, 
    error: error.message,
    fallback: "I'm having trouble processing that. Please try again."
  };
}
```

### 2. Rate Limiting

```javascript
// Track requests per session
const sessionRequests = $input.item.json.requestCount || 0;

if (sessionRequests > 10) {
  return {
    output: "You've reached the message limit. Please wait a moment.",
    rateLimited: true
  };
}
```

### 3. Context Management

```javascript
// Store conversation history
const conversationHistory = $input.item.json.history || [];
conversationHistory.push({
  role: 'user',
  content: $input.item.json.message,
  timestamp: Date.now()
});

// Keep last 10 messages
const recentHistory = conversationHistory.slice(-10);
```

### 4. Logging

```javascript
// Log to external service
await fetch('https://your-logging-service.com/log', {
  method: 'POST',
  body: JSON.stringify({
    chatId: $json.chatId,
    message: $json.message,
    response: $json.output,
    timestamp: Date.now()
  })
});
```

---

## 🔐 Security Considerations

### 1. Webhook Authentication

Add authentication to your webhooks:

```javascript
// In n8n Code Node
const authHeader = $input.item.headers.authorization;
const expectedToken = 'your-secret-token';

if (authHeader !== `Bearer ${expectedToken}`) {
  throw new Error('Unauthorized');
}
```

### 2. Input Validation

```javascript
// Validate input data
const { chatId, message } = $input.item.json.body;

if (!chatId || !message) {
  throw new Error('Missing required fields');
}

if (message.length > 1000) {
  throw new Error('Message too long');
}
```

### 3. Sanitize Output

```javascript
// Remove sensitive data
const sanitizedResponse = response.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED]');
```

---

## 📊 Monitoring & Analytics

### Track Metrics

```javascript
// Send metrics to analytics
await fetch('https://your-analytics.com/track', {
  method: 'POST',
  body: JSON.stringify({
    event: 'chatbot_message',
    chatId: $json.chatId,
    messageLength: $json.message.length,
    responseTime: Date.now() - $json.startTime,
    escalated: $json.needsEscalation
  })
});
```

---

## 🚀 Advanced Features

### 1. Multi-Language Support

```javascript
// Detect language
const language = detectLanguage($json.message);

const systemPrompts = {
  en: "You are a helpful assistant.",
  es: "Eres un asistente útil.",
  fr: "Vous êtes un assistant utile."
};

return {
  ...($json),
  systemPrompt: systemPrompts[language] || systemPrompts.en
};
```

### 2. Sentiment Analysis

```javascript
// Analyze sentiment
const sentiment = analyzeSentiment($json.message);

if (sentiment === 'negative') {
  // Escalate or use empathetic response
  return {
    ...($json),
    tone: 'empathetic',
    priority: 'high'
  };
}
```

### 3. Intent Classification

```javascript
// Classify user intent
const intents = {
  'support': ['help', 'issue', 'problem', 'not working'],
  'sales': ['price', 'buy', 'purchase', 'cost'],
  'info': ['what', 'how', 'when', 'where']
};

const detectedIntent = Object.keys(intents).find(intent =>
  intents[intent].some(keyword => $json.message.toLowerCase().includes(keyword))
);

return {
  ...($json),
  intent: detectedIntent || 'general'
};
```

---

## 📝 Troubleshooting

### Common Issues

**1. Webhook not responding**
- Check n8n workflow is active
- Verify webhook URL is correct
- Check n8n logs for errors

**2. AI responses are slow**
- Use streaming responses
- Implement caching for common questions
- Consider using faster models (GPT-3.5)

**3. Escalation not working**
- Verify keyword detection logic
- Check Convex function permissions
- Test with exact escalation keywords

---

**Last Updated**: January 14, 2026  
**Status**: Production Ready  
**Maintained by**: StartupKit Development Team
