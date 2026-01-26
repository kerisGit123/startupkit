# 📅 Calendly-Like Booking System with Chatbot Integration - PRD

**Product Requirements Document**  
**Version:** 1.0  
**Last Updated:** January 26, 2026  
**Status:** Production-Ready Architecture

---

## 📋 Executive Summary

This PRD defines a **production-grade booking and scheduling system** that combines the functionality of Calendly with intelligent chatbot integration. The system enables users to book appointments through a conversational interface while providing administrators with a comprehensive dashboard for managing bookings, availability, and calendar synchronization.

### Key Capabilities
- ✅ **Chatbot-driven booking** - Natural language appointment scheduling
- ✅ **Admin dashboard** - Full CRUD operations on bookings
- ✅ **Google Calendar sync** - Bi-directional synchronization
- ✅ **Real-time availability** - Dynamic slot calculation
- ✅ **Multi-view calendar** - Calendar view and day/time grid view
- ✅ **Client management** - Store and lookup client information
- ✅ **N8N integration** - Tool-based architecture for scalability

---

## 🎯 Product Vision

Create a **seamless booking experience** where users can schedule appointments through natural conversation, while administrators maintain full control through an intuitive dashboard that syncs with their existing Google Calendar workflow.

### Target Users
1. **End Users (Clients)** - Book appointments via chatbot
2. **Administrators** - Manage bookings, availability, and client data
3. **System Integrators** - N8N workflow developers

---

## 🏗️ System Architecture

### Architecture Pattern: **Convex-First with N8N Tool Calling**

Based on the analyzed documentation, this system follows the **production-grade architecture** outlined in the N8N guides:

```
┌─────────────────────────────────────────────────┐
│  BOOKING SYSTEM ARCHITECTURE                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  User Interface Layer                          │
│  ├─ Chatbot Widget (Next.js)                   │
│  └─ Admin Dashboard (Next.js)                  │
│       ↓                                         │
│  API Layer (Next.js API Routes)                │
│       ↓                                         │
│  Orchestration Layer (N8N)                     │
│  ├─ AI Agent with Tools                        │
│  ├─ Tool: checkAvailability()                  │
│  ├─ Tool: bookAppointment()                    │
│  ├─ Tool: lookupClient()                       │
│  ├─ Tool: createClient()                       │
│  ├─ Tool: updateAppointment()                  │
│  ├─ Tool: deleteAppointment()                  │
│  └─ Tool: getAppointments()                    │
│       ↓                                         │
│  Data & Logic Layer (Convex)                   │
│  ├─ HTTP Actions (Tool Endpoints)              │
│  ├─ Queries (Real-time data)                   │
│  ├─ Mutations (State changes)                  │
│  └─ Actions (Google Calendar sync)             │
│       ↓                                         │
│  Database (Convex)                             │
│  ├─ appointments                               │
│  ├─ clients                                    │
│  ├─ availability                               │
│  ├─ googleCalendarSync                         │
│  └─ conversations                              │
│       ↓                                         │
│  External Integration                          │
│  └─ Google Calendar API                        │
└─────────────────────────────────────────────────┘
```

### Design Principles (From Documentation Analysis)

1. **Convex as Single Source of Truth** ✅
   - All booking state lives in Convex
   - Real-time subscriptions for live updates
   - Type-safe queries and mutations

2. **N8N as Task Execution Engine** ✅
   - Tool-based architecture (not JSON parsing)
   - Stateless, idempotent operations
   - AI-driven multi-step workflows

3. **Tool Calling Pattern** ✅
   - AI autonomously decides which tools to call
   - Multi-step workflows with context retention
   - Better than JSON parsing approach

4. **Hybrid Calendar Strategy** ✅
   - Own booking system in Convex for control
   - Google Calendar sync for convenience
   - Backup if Google API is down

---

## 💾 Database Schema (Convex)

### 1. Appointments Table

```typescript
appointments: defineTable({
  // Client Information
  clientId: v.id("clients"),
  clientName: v.string(),
  clientEmail: v.string(),
  clientPhone: v.optional(v.string()),
  
  // Appointment Details
  date: v.string(), // "2026-01-26"
  startTime: v.string(), // "14:00"
  endTime: v.string(), // "15:00"
  duration: v.number(), // minutes (60)
  
  // Status & Metadata
  status: v.union(
    v.literal("pending"),
    v.literal("confirmed"),
    v.literal("cancelled"),
    v.literal("completed"),
    v.literal("no_show")
  ),
  
  // Purpose & Notes
  appointmentType: v.string(), // "consultation", "demo", "support"
  notes: v.optional(v.string()),
  internalNotes: v.optional(v.string()), // Admin-only notes
  
  // Google Calendar Integration
  googleEventId: v.optional(v.string()),
  googleCalendarSynced: v.boolean(),
  lastSyncedAt: v.optional(v.number()),
  
  // Tracking
  bookedBy: v.union(
    v.literal("chatbot"),
    v.literal("admin"),
    v.literal("api")
  ),
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.optional(v.id("users")), // Admin user ID
  
}).index("by_date", ["date"])
  .index("by_client", ["clientId"])
  .index("by_status", ["status"])
  .index("by_email", ["clientEmail"])
  .index("by_googleEventId", ["googleEventId"]),
```

### 2. Clients Table

```typescript
clients: defineTable({
  // Basic Information
  name: v.string(),
  email: v.string(),
  phone: v.optional(v.string()),
  company: v.optional(v.string()),
  
  // Additional Details
  timezone: v.optional(v.string()), // "America/New_York"
  preferredContactMethod: v.optional(v.string()), // "email", "phone", "sms"
  
  // Metadata
  tags: v.array(v.string()), // ["vip", "enterprise", "trial"]
  notes: v.optional(v.string()),
  
  // Statistics
  totalAppointments: v.number(),
  completedAppointments: v.number(),
  cancelledAppointments: v.number(),
  noShowCount: v.number(),
  
  // Tracking
  firstBookedAt: v.number(),
  lastBookedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
  
}).index("by_email", ["email"])
  .index("by_phone", ["phone"])
  .index("by_company", ["company"]),
```

### 3. Availability Table

```typescript
availability: defineTable({
  // Day Configuration
  dayOfWeek: v.number(), // 0-6 (Sunday-Saturday)
  
  // Time Slots
  startTime: v.string(), // "09:00"
  endTime: v.string(), // "17:00"
  slotDuration: v.number(), // 30 or 60 minutes
  
  // Buffer & Breaks
  bufferBetweenSlots: v.number(), // 15 minutes
  breakTimes: v.optional(v.array(v.object({
    start: v.string(),
    end: v.string(),
  }))),
  
  // Status
  isActive: v.boolean(),
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
  
}).index("by_day", ["dayOfWeek"])
  .index("by_active", ["isActive"]),
```

### 4. Availability Overrides Table

```typescript
availabilityOverrides: defineTable({
  // Date-specific overrides
  date: v.string(), // "2026-01-26"
  
  // Override Type
  type: v.union(
    v.literal("blocked"), // Day off, holiday
    v.literal("custom")   // Custom hours for this day
  ),
  
  // Custom Hours (if type = "custom")
  customStartTime: v.optional(v.string()),
  customEndTime: v.optional(v.string()),
  
  // Metadata
  reason: v.optional(v.string()), // "Holiday", "Conference"
  createdAt: v.number(),
  
}).index("by_date", ["date"]),
```

### 5. Google Calendar Sync Table

```typescript
googleCalendarSync: defineTable({
  // Sync Configuration
  calendarId: v.string(), // Google Calendar ID
  isEnabled: v.boolean(),
  syncDirection: v.union(
    v.literal("one_way_to_google"),
    v.literal("two_way")
  ),
  
  // OAuth Credentials (encrypted)
  accessToken: v.optional(v.string()),
  refreshToken: v.optional(v.string()),
  tokenExpiresAt: v.optional(v.number()),
  
  // Sync Status
  lastSyncAt: v.optional(v.number()),
  lastSyncStatus: v.optional(v.string()),
  syncErrors: v.optional(v.array(v.object({
    timestamp: v.number(),
    error: v.string(),
  }))),
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
  
}).index("by_calendarId", ["calendarId"]),
```

### 6. Conversations Table (For Chatbot)

```typescript
conversations: defineTable({
  sessionId: v.string(),
  clientId: v.optional(v.id("clients")),
  
  // Status
  status: v.union(
    v.literal("active"),
    v.literal("booking_in_progress"),
    v.literal("completed"),
    v.literal("abandoned")
  ),
  
  // Context
  currentIntent: v.optional(v.string()), // "booking", "rescheduling", "cancellation"
  collectedData: v.optional(v.any()), // Temporary data during booking flow
  
  // Tracking
  lastMessageAt: v.number(),
  createdAt: v.number(),
  
}).index("by_sessionId", ["sessionId"])
  .index("by_status", ["status"]),
```

---

## 🔧 API Endpoints (Convex HTTP Actions for N8N Tools)

### 1. Check Availability

**Endpoint:** `POST /checkAvailability`

```typescript
// convex/bookingTools.ts
export const checkAvailability = httpAction(async (ctx, request) => {
  const { date, duration = 60 } = await request.json();
  
  // Get day of week
  const dayOfWeek = new Date(date).getDay();
  
  // Get availability configuration
  const availability = await ctx.runQuery(api.availability.getByDay, { 
    dayOfWeek 
  });
  
  // Check for date-specific overrides
  const override = await ctx.runQuery(api.availability.getOverride, { 
    date 
  });
  
  if (override?.type === "blocked") {
    return new Response(JSON.stringify({ 
      available: false,
      slots: [],
      reason: override.reason || "Not available on this date"
    }));
  }
  
  // Get existing appointments for this date
  const appointments = await ctx.runQuery(api.appointments.getByDate, { 
    date,
    status: ["confirmed", "pending"]
  });
  
  // Calculate available slots
  const slots = await ctx.runQuery(api.availability.calculateSlots, {
    date,
    duration,
    availability,
    override,
    existingAppointments: appointments
  });
  
  return new Response(JSON.stringify({ 
    available: slots.length > 0,
    slots,
    date
  }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

**Request:**
```json
{
  "date": "2026-01-27",
  "duration": 60
}
```

**Response:**
```json
{
  "available": true,
  "slots": [
    {
      "startTime": "09:00",
      "endTime": "10:00",
      "available": true
    },
    {
      "startTime": "10:00",
      "endTime": "11:00",
      "available": true
    },
    {
      "startTime": "14:00",
      "endTime": "15:00",
      "available": true
    }
  ],
  "date": "2026-01-27"
}
```

---

### 2. Book Appointment

**Endpoint:** `POST /bookAppointment`

```typescript
export const bookAppointment = httpAction(async (ctx, request) => {
  const { 
    clientEmail, 
    clientName, 
    clientPhone,
    date, 
    startTime,
    duration = 60,
    appointmentType = "consultation",
    notes,
    bookedBy = "chatbot"
  } = await request.json();
  
  // Validate slot is still available
  const isAvailable = await ctx.runQuery(api.availability.isSlotAvailable, {
    date,
    startTime,
    duration
  });
  
  if (!isAvailable) {
    return new Response(JSON.stringify({ 
      success: false,
      error: "This time slot is no longer available"
    }), { status: 409 });
  }
  
  // Get or create client
  let client = await ctx.runQuery(api.clients.getByEmail, { 
    email: clientEmail 
  });
  
  if (!client) {
    client = await ctx.runMutation(api.clients.create, {
      name: clientName,
      email: clientEmail,
      phone: clientPhone,
      totalAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      noShowCount: 0,
      firstBookedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
  
  // Calculate end time
  const endTime = calculateEndTime(startTime, duration);
  
  // Create appointment
  const appointmentId = await ctx.runMutation(api.appointments.create, {
    clientId: client._id,
    clientName,
    clientEmail,
    clientPhone,
    date,
    startTime,
    endTime,
    duration,
    status: "confirmed",
    appointmentType,
    notes,
    bookedBy,
    googleCalendarSynced: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  
  // Sync to Google Calendar (async)
  await ctx.runAction(api.googleCalendar.syncAppointment, {
    appointmentId
  });
  
  // Update client statistics
  await ctx.runMutation(api.clients.incrementAppointmentCount, {
    clientId: client._id
  });
  
  return new Response(JSON.stringify({ 
    success: true,
    appointmentId,
    message: "Appointment booked successfully",
    appointment: {
      date,
      startTime,
      endTime,
      clientName,
      clientEmail
    }
  }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

**Request:**
```json
{
  "clientEmail": "john@example.com",
  "clientName": "John Doe",
  "clientPhone": "+1234567890",
  "date": "2026-01-27",
  "startTime": "14:00",
  "duration": 60,
  "appointmentType": "consultation",
  "notes": "Interested in enterprise plan",
  "bookedBy": "chatbot"
}
```

**Response:**
```json
{
  "success": true,
  "appointmentId": "k17abc123",
  "message": "Appointment booked successfully",
  "appointment": {
    "date": "2026-01-27",
    "startTime": "14:00",
    "endTime": "15:00",
    "clientName": "John Doe",
    "clientEmail": "john@example.com"
  }
}
```

---

### 3. Lookup Client

**Endpoint:** `POST /lookupClient`

```typescript
export const lookupClient = httpAction(async (ctx, request) => {
  const { email, phone } = await request.json();
  
  let client = null;
  
  if (email) {
    client = await ctx.runQuery(api.clients.getByEmail, { email });
  } else if (phone) {
    client = await ctx.runQuery(api.clients.getByPhone, { phone });
  }
  
  if (!client) {
    return new Response(JSON.stringify({ 
      found: false,
      message: "Client not found"
    }));
  }
  
  // Get client's appointment history
  const appointments = await ctx.runQuery(api.appointments.getByClient, {
    clientId: client._id,
    limit: 5
  });
  
  return new Response(JSON.stringify({ 
    found: true,
    client: {
      id: client._id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      totalAppointments: client.totalAppointments,
      lastBookedAt: client.lastBookedAt
    },
    recentAppointments: appointments
  }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

---

### 4. Create Client

**Endpoint:** `POST /createClient`

```typescript
export const createClient = httpAction(async (ctx, request) => {
  const { name, email, phone, company, notes } = await request.json();
  
  // Check if client already exists
  const existing = await ctx.runQuery(api.clients.getByEmail, { email });
  
  if (existing) {
    return new Response(JSON.stringify({ 
      success: false,
      error: "Client with this email already exists",
      clientId: existing._id
    }), { status: 409 });
  }
  
  const clientId = await ctx.runMutation(api.clients.create, {
    name,
    email,
    phone,
    company,
    notes,
    tags: [],
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    noShowCount: 0,
    firstBookedAt: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  
  return new Response(JSON.stringify({ 
    success: true,
    clientId,
    message: "Client created successfully"
  }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

---

### 5. Get Appointments

**Endpoint:** `POST /getAppointments`

```typescript
export const getAppointments = httpAction(async (ctx, request) => {
  const { 
    date, 
    startDate, 
    endDate, 
    clientEmail,
    status,
    limit = 50 
  } = await request.json();
  
  let appointments;
  
  if (date) {
    // Get appointments for specific date
    appointments = await ctx.runQuery(api.appointments.getByDate, {
      date,
      status
    });
  } else if (startDate && endDate) {
    // Get appointments in date range
    appointments = await ctx.runQuery(api.appointments.getByDateRange, {
      startDate,
      endDate,
      status
    });
  } else if (clientEmail) {
    // Get appointments for specific client
    const client = await ctx.runQuery(api.clients.getByEmail, { 
      email: clientEmail 
    });
    
    if (client) {
      appointments = await ctx.runQuery(api.appointments.getByClient, {
        clientId: client._id,
        limit
      });
    } else {
      appointments = [];
    }
  } else {
    // Get recent appointments
    appointments = await ctx.runQuery(api.appointments.getRecent, {
      limit
    });
  }
  
  return new Response(JSON.stringify({ 
    appointments,
    count: appointments.length
  }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

---

### 6. Update Appointment

**Endpoint:** `POST /updateAppointment`

```typescript
export const updateAppointment = httpAction(async (ctx, request) => {
  const { 
    appointmentId, 
    date,
    startTime,
    duration,
    status,
    notes,
    internalNotes
  } = await request.json();
  
  const appointment = await ctx.runQuery(api.appointments.get, { 
    id: appointmentId 
  });
  
  if (!appointment) {
    return new Response(JSON.stringify({ 
      success: false,
      error: "Appointment not found"
    }), { status: 404 });
  }
  
  // If rescheduling, check new slot availability
  if (date && startTime && (date !== appointment.date || startTime !== appointment.startTime)) {
    const isAvailable = await ctx.runQuery(api.availability.isSlotAvailable, {
      date,
      startTime,
      duration: duration || appointment.duration,
      excludeAppointmentId: appointmentId
    });
    
    if (!isAvailable) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "New time slot is not available"
      }), { status: 409 });
    }
  }
  
  // Calculate new end time if needed
  const endTime = (startTime && duration) 
    ? calculateEndTime(startTime, duration)
    : appointment.endTime;
  
  // Update appointment
  await ctx.runMutation(api.appointments.update, {
    appointmentId,
    date: date || appointment.date,
    startTime: startTime || appointment.startTime,
    endTime,
    duration: duration || appointment.duration,
    status: status || appointment.status,
    notes: notes !== undefined ? notes : appointment.notes,
    internalNotes: internalNotes !== undefined ? internalNotes : appointment.internalNotes,
    updatedAt: Date.now(),
  });
  
  // Sync to Google Calendar
  await ctx.runAction(api.googleCalendar.updateAppointment, {
    appointmentId
  });
  
  return new Response(JSON.stringify({ 
    success: true,
    message: "Appointment updated successfully"
  }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

---

### 7. Delete Appointment

**Endpoint:** `POST /deleteAppointment`

```typescript
export const deleteAppointment = httpAction(async (ctx, request) => {
  const { appointmentId, reason } = await request.json();
  
  const appointment = await ctx.runQuery(api.appointments.get, { 
    id: appointmentId 
  });
  
  if (!appointment) {
    return new Response(JSON.stringify({ 
      success: false,
      error: "Appointment not found"
    }), { status: 404 });
  }
  
  // Update status to cancelled instead of hard delete
  await ctx.runMutation(api.appointments.update, {
    appointmentId,
    status: "cancelled",
    internalNotes: `Cancelled: ${reason || 'No reason provided'}`,
    updatedAt: Date.now(),
  });
  
  // Delete from Google Calendar
  if (appointment.googleEventId) {
    await ctx.runAction(api.googleCalendar.deleteEvent, {
      eventId: appointment.googleEventId
    });
  }
  
  // Update client statistics
  await ctx.runMutation(api.clients.incrementCancelledCount, {
    clientId: appointment.clientId
  });
  
  return new Response(JSON.stringify({ 
    success: true,
    message: "Appointment cancelled successfully"
  }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

---

## 🤖 N8N Workflow Configuration

### AI Agent with Booking Tools

Based on the **tool calling architecture** from the documentation:

```json
{
  "name": "Booking Chatbot with Tools",
  "nodes": [
    {
      "parameters": {
        "public": true,
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.chatTrigger",
      "name": "When chat message received",
      "position": [0, 0]
    },
    {
      "parameters": {
        "promptType": "define",
        "text": "={{ $json.chatInput }}",
        "options": {
          "systemMessage": "You are a helpful booking assistant. You help users schedule appointments.\n\nYou have access to these tools:\n- checkAvailability(date, duration) - Check available time slots\n- bookAppointment(clientEmail, clientName, clientPhone, date, startTime, duration, appointmentType, notes) - Book an appointment\n- lookupClient(email, phone) - Find existing client information\n- createClient(name, email, phone, company, notes) - Create new client\n- getAppointments(date, startDate, endDate, clientEmail, status) - View appointments\n- updateAppointment(appointmentId, date, startTime, duration, status, notes) - Modify appointment\n- deleteAppointment(appointmentId, reason) - Cancel appointment\n\nWORKFLOW:\n1. When user wants to book, ask for preferred date\n2. Use checkAvailability() to show available slots\n3. Collect: name, email, phone (optional)\n4. Use bookAppointment() to confirm\n5. Provide confirmation with details\n\nBe conversational and helpful. Always confirm details before booking."
        }
      },
      "type": "@n8n/n8n-nodes-langchain.agent",
      "name": "Booking AI Agent",
      "position": [200, 0]
    },
    {
      "parameters": {
        "model": "gpt-4o-mini",
        "options": {
          "temperature": 0.3
        }
      },
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "name": "OpenAI Chat Model",
      "position": [100, 200]
    },
    {
      "parameters": {
        "sessionIdType": "customKey",
        "sessionKey": "={{ $json.sessionId }}"
      },
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "name": "Conversation Memory",
      "position": [300, 200]
    },
    {
      "parameters": {
        "name": "checkAvailability",
        "description": "Check available time slots for a specific date. Returns list of available time slots.",
        "method": "POST",
        "url": "https://YOUR_CONVEX.convex.site/checkAvailability",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ { \"date\": $json.date, \"duration\": $json.duration || 60 } }}"
      },
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "name": "Check Availability Tool",
      "position": [400, 300]
    },
    {
      "parameters": {
        "name": "bookAppointment",
        "description": "Book an appointment. Required: clientEmail, clientName, date, startTime. Optional: clientPhone, duration (default 60), appointmentType, notes.",
        "method": "POST",
        "url": "https://YOUR_CONVEX.convex.site/bookAppointment",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ { \"clientEmail\": $json.clientEmail, \"clientName\": $json.clientName, \"clientPhone\": $json.clientPhone, \"date\": $json.date, \"startTime\": $json.startTime, \"duration\": $json.duration || 60, \"appointmentType\": $json.appointmentType || 'consultation', \"notes\": $json.notes, \"bookedBy\": 'chatbot' } }}"
      },
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "name": "Book Appointment Tool",
      "position": [400, 400]
    },
    {
      "parameters": {
        "name": "lookupClient",
        "description": "Find existing client by email or phone. Returns client information and recent appointments.",
        "method": "POST",
        "url": "https://YOUR_CONVEX.convex.site/lookupClient",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ { \"email\": $json.email, \"phone\": $json.phone } }}"
      },
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "name": "Lookup Client Tool",
      "position": [400, 500]
    },
    {
      "parameters": {
        "name": "getAppointments",
        "description": "Get appointments by date, date range, or client email. Can filter by status.",
        "method": "POST",
        "url": "https://YOUR_CONVEX.convex.site/getAppointments",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ { \"date\": $json.date, \"startDate\": $json.startDate, \"endDate\": $json.endDate, \"clientEmail\": $json.clientEmail, \"status\": $json.status } }}"
      },
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "name": "Get Appointments Tool",
      "position": [400, 600]
    },
    {
      "parameters": {
        "name": "updateAppointment",
        "description": "Update an existing appointment. Can change date, time, status, or notes.",
        "method": "POST",
        "url": "https://YOUR_CONVEX.convex.site/updateAppointment",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ { \"appointmentId\": $json.appointmentId, \"date\": $json.date, \"startTime\": $json.startTime, \"duration\": $json.duration, \"status\": $json.status, \"notes\": $json.notes } }}"
      },
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "name": "Update Appointment Tool",
      "position": [400, 700]
    },
    {
      "parameters": {
        "name": "deleteAppointment",
        "description": "Cancel an appointment. Requires appointmentId and optional cancellation reason.",
        "method": "POST",
        "url": "https://YOUR_CONVEX.convex.site/deleteAppointment",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ { \"appointmentId\": $json.appointmentId, \"reason\": $json.reason } }}"
      },
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "name": "Delete Appointment Tool",
      "position": [400, 800]
    }
  ],
  "connections": {
    "When chat message received": {
      "main": [[{ "node": "Booking AI Agent" }]]
    },
    "OpenAI Chat Model": {
      "ai_languageModel": [[{ "node": "Booking AI Agent" }]]
    },
    "Conversation Memory": {
      "ai_memory": [[{ "node": "Booking AI Agent" }]]
    },
    "Check Availability Tool": {
      "ai_tool": [[{ "node": "Booking AI Agent" }]]
    },
    "Book Appointment Tool": {
      "ai_tool": [[{ "node": "Booking AI Agent" }]]
    },
    "Lookup Client Tool": {
      "ai_tool": [[{ "node": "Booking AI Agent" }]]
    },
    "Get Appointments Tool": {
      "ai_tool": [[{ "node": "Booking AI Agent" }]]
    },
    "Update Appointment Tool": {
      "ai_tool": [[{ "node": "Booking AI Agent" }]]
    },
    "Delete Appointment Tool": {
      "ai_tool": [[{ "node": "Booking AI Agent" }]]
    }
  }
}
```

---

## 🎨 Admin Dashboard Features

### 1. Calendar View

**Features:**
- Monthly calendar grid
- Color-coded appointments by status
- Click to view/edit appointment details
- Drag-and-drop rescheduling
- Quick add appointment button

**Implementation (Next.js + Convex):**

```typescript
// components/CalendarView.tsx
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export function CalendarView() {
  const appointments = useQuery(api.appointments.getAll);
  
  const events = appointments?.map(apt => ({
    id: apt._id,
    title: `${apt.clientName} - ${apt.appointmentType}`,
    start: `${apt.date}T${apt.startTime}`,
    end: `${apt.date}T${apt.endTime}`,
    backgroundColor: getStatusColor(apt.status),
    extendedProps: apt
  }));
  
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      }}
      events={events}
      editable={true}
      eventClick={handleEventClick}
      eventDrop={handleEventDrop}
    />
  );
}
```

### 2. Day View with Time Slots

**Features:**
- Hourly time grid (e.g., 9 AM - 5 PM)
- Visual representation of booked vs. available slots
- Color coding for different appointment types
- Quick booking from available slots
- Buffer time visualization

**Implementation:**

```typescript
// components/DayView.tsx
export function DayView({ selectedDate }: { selectedDate: string }) {
  const appointments = useQuery(api.appointments.getByDate, { 
    date: selectedDate 
  });
  const availability = useQuery(api.availability.getForDate, { 
    date: selectedDate 
  });
  
  const timeSlots = generateTimeSlots(
    availability?.startTime || "09:00",
    availability?.endTime || "17:00",
    30 // 30-minute intervals
  );
  
  return (
    <div className="day-view">
      <h2>{formatDate(selectedDate)}</h2>
      <div className="time-grid">
        {timeSlots.map(slot => {
          const appointment = findAppointmentInSlot(appointments, slot);
          
          return (
            <div 
              key={slot.start}
              className={`time-slot ${appointment ? 'booked' : 'available'}`}
              onClick={() => appointment ? viewAppointment(appointment) : bookSlot(slot)}
            >
              <span className="time">{slot.start}</span>
              {appointment ? (
                <div className="appointment-card">
                  <strong>{appointment.clientName}</strong>
                  <span>{appointment.appointmentType}</span>
                </div>
              ) : (
                <span className="available-label">Available</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 3. Appointment Management (CRUD)

**Create:**
- Modal form with client selection/creation
- Date and time picker
- Appointment type dropdown
- Duration selector
- Notes field
- Real-time availability validation

**Read/View:**
- Appointment details modal
- Client information display
- Google Calendar sync status
- Edit and delete buttons

**Update:**
- Inline editing in calendar view
- Dedicated edit modal
- Reschedule with availability check
- Status change (confirmed, completed, no-show)

**Delete:**
- Soft delete (status = cancelled)
- Cancellation reason field
- Automatic Google Calendar sync
- Client notification option

### 4. Client Management

**Features:**
- Client list with search and filters
- Client detail view with appointment history
- Add/edit client information
- Client statistics (total appointments, no-shows, etc.)
- Tags and notes

**Implementation:**

```typescript
// components/ClientList.tsx
export function ClientList() {
  const clients = useQuery(api.clients.getAll);
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredClients = clients?.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="client-list">
      <input
        type="text"
        placeholder="Search clients..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Total Appointments</th>
            <th>Last Booked</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredClients?.map(client => (
            <tr key={client._id}>
              <td>{client.name}</td>
              <td>{client.email}</td>
              <td>{client.phone}</td>
              <td>{client.totalAppointments}</td>
              <td>{formatDate(client.lastBookedAt)}</td>
              <td>
                <button onClick={() => viewClient(client)}>View</button>
                <button onClick={() => editClient(client)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 5. Availability Settings

**Features:**
- Weekly schedule configuration
- Set working hours per day
- Slot duration (15, 30, 60 minutes)
- Buffer time between appointments
- Break times
- Date-specific overrides (holidays, special hours)

**Implementation:**

```typescript
// components/AvailabilitySettings.tsx
export function AvailabilitySettings() {
  const availability = useQuery(api.availability.getAll);
  const updateAvailability = useMutation(api.availability.update);
  
  const daysOfWeek = [
    "Sunday", "Monday", "Tuesday", "Wednesday", 
    "Thursday", "Friday", "Saturday"
  ];
  
  return (
    <div className="availability-settings">
      <h2>Weekly Availability</h2>
      {daysOfWeek.map((day, index) => {
        const dayConfig = availability?.find(a => a.dayOfWeek === index);
        
        return (
          <div key={day} className="day-config">
            <h3>{day}</h3>
            <label>
              <input
                type="checkbox"
                checked={dayConfig?.isActive}
                onChange={(e) => updateAvailability({
                  dayOfWeek: index,
                  isActive: e.target.checked
                })}
              />
              Available
            </label>
            {dayConfig?.isActive && (
              <>
                <input
                  type="time"
                  value={dayConfig.startTime}
                  onChange={(e) => updateAvailability({
                    dayOfWeek: index,
                    startTime: e.target.value
                  })}
                />
                <input
                  type="time"
                  value={dayConfig.endTime}
                  onChange={(e) => updateAvailability({
                    dayOfWeek: index,
                    endTime: e.target.value
                  })}
                />
                <select
                  value={dayConfig.slotDuration}
                  onChange={(e) => updateAvailability({
                    dayOfWeek: index,
                    slotDuration: parseInt(e.target.value)
                  })}
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

### 6. Google Calendar Sync

**Features:**
- OAuth connection to Google Calendar
- Sync status indicator
- Manual sync trigger
- Sync direction configuration (one-way or two-way)
- Error logs and retry mechanism

---

## 🔄 Google Calendar Integration

### Sync Strategy

**One-Way Sync (Recommended for MVP):**
- Appointments created in system → Synced to Google Calendar
- Updates in system → Updated in Google Calendar
- Deletions in system → Deleted from Google Calendar

**Two-Way Sync (Advanced):**
- Changes in Google Calendar → Reflected in system
- Requires webhook setup and conflict resolution

### Implementation

```typescript
// convex/actions.ts
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { google } from 'googleapis';

export const syncAppointmentToGoogle = action({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, { appointmentId }) => {
    // Get appointment
    const appointment = await ctx.runQuery(api.appointments.get, { 
      id: appointmentId 
    });
    
    // Get Google Calendar credentials
    const syncConfig = await ctx.runQuery(api.googleCalendarSync.getConfig);
    
    if (!syncConfig?.isEnabled) {
      return { success: false, error: "Google Calendar sync not enabled" };
    }
    
    // Initialize Google Calendar API
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: syncConfig.accessToken,
      refresh_token: syncConfig.refreshToken
    });
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    try {
      let eventId = appointment.googleEventId;
      
      const event = {
        summary: `${appointment.appointmentType}: ${appointment.clientName}`,
        description: appointment.notes || '',
        start: {
          dateTime: `${appointment.date}T${appointment.startTime}:00`,
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: `${appointment.date}T${appointment.endTime}:00`,
          timeZone: 'America/New_York',
        },
        attendees: [
          { email: appointment.clientEmail }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      };
      
      if (eventId) {
        // Update existing event
        await calendar.events.update({
          calendarId: syncConfig.calendarId,
          eventId: eventId,
          requestBody: event,
        });
      } else {
        // Create new event
        const response = await calendar.events.insert({
          calendarId: syncConfig.calendarId,
          requestBody: event,
        });
        
        eventId = response.data.id;
        
        // Save Google event ID
        await ctx.runMutation(api.appointments.update, {
          appointmentId,
          googleEventId: eventId,
          googleCalendarSynced: true,
          lastSyncedAt: Date.now(),
        });
      }
      
      return { success: true, eventId };
      
    } catch (error) {
      console.error("Google Calendar sync error:", error);
      
      // Log error
      await ctx.runMutation(api.googleCalendarSync.logError, {
        error: error.message,
        timestamp: Date.now(),
      });
      
      return { success: false, error: error.message };
    }
  },
});
```

---

## 💬 Chatbot Conversation Examples

### Example 1: Simple Booking

```
User: "I'd like to book an appointment"

AI: "I'd be happy to help you schedule an appointment! What date works best for you?"

User: "Tomorrow"

AI: [Calls checkAvailability(date="2026-01-27")]
AI: "I have the following times available tomorrow (January 27):
- 9:00 AM - 10:00 AM
- 10:00 AM - 11:00 AM
- 2:00 PM - 3:00 PM
- 3:00 PM - 4:00 PM

Which time works best for you?"

User: "2pm works"

AI: "Perfect! May I have your name and email address to confirm the booking?"

User: "John Doe, john@example.com"

AI: [Calls bookAppointment(clientName="John Doe", clientEmail="john@example.com", date="2026-01-27", startTime="14:00")]
AI: "✅ Your appointment is confirmed!

📅 Date: January 27, 2026
🕐 Time: 2:00 PM - 3:00 PM
👤 Name: John Doe
📧 Email: john@example.com

You'll receive a confirmation email shortly. Is there anything else I can help you with?"
```

### Example 2: Returning Client

```
User: "I need to reschedule my appointment"

AI: "I can help you with that. May I have your email address?"

User: "jane@example.com"

AI: [Calls lookupClient(email="jane@example.com")]
AI: [Calls getAppointments(clientEmail="jane@example.com", status="confirmed")]
AI: "Hi Jane! I found your upcoming appointment:

📅 January 28, 2026 at 10:00 AM

What date and time would you like to reschedule to?"

User: "Can we do January 30 at 3pm?"

AI: [Calls checkAvailability(date="2026-01-30")]
AI: "Yes, 3:00 PM on January 30 is available! Should I go ahead and reschedule your appointment?"

User: "Yes please"

AI: [Calls updateAppointment(appointmentId="...", date="2026-01-30", startTime="15:00")]
AI: "✅ Done! Your appointment has been rescheduled to:

📅 January 30, 2026
🕐 3:00 PM - 4:00 PM

You'll receive an updated confirmation email."
```

### Example 3: Check Availability

```
User: "What times are available next week?"

AI: "I'd be happy to check availability for next week. Which specific day are you interested in, or would you like me to show you all available slots for the week?"

User: "Show me Monday"

AI: [Calls checkAvailability(date="2026-02-02")]
AI: "Here are the available times for Monday, February 2:

Morning:
- 9:00 AM - 10:00 AM
- 11:00 AM - 12:00 PM

Afternoon:
- 1:00 PM - 2:00 PM
- 4:00 PM - 5:00 PM

Would you like to book one of these times?"
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Styling:** TailwindCSS + shadcn/ui
- **Calendar Component:** FullCalendar or React Big Calendar
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod validation
- **State Management:** Convex React hooks

### Backend
- **Database & Backend:** Convex
  - Real-time subscriptions
  - Type-safe queries
  - HTTP actions for N8N tools
  - Scheduled functions for reminders

### Orchestration
- **Workflow Engine:** N8N
  - AI Agent with tool calling
  - OpenAI GPT-4o-mini for chatbot
  - LangChain integration
  - Conversation memory

### External Services
- **AI Model:** OpenAI GPT-4o-mini
- **Calendar:** Google Calendar API
- **Email:** SendGrid or Resend
- **SMS (Optional):** Twilio

### Development Tools
- **Language:** TypeScript
- **Package Manager:** npm/pnpm
- **Linting:** ESLint
- **Formatting:** Prettier

---

## 📊 Best Practices Analysis

### ✅ Alignment with Documentation Patterns

Based on the three analyzed N8N documentation files:

#### 1. **Tool Calling Architecture** ✅
- **Implemented:** All N8N tools use HTTP Request nodes calling Convex endpoints
- **Benefit:** AI autonomously decides which tools to call based on conversation context
- **Superior to:** JSON parsing approach (as recommended in N8N_RECOMMENDATION.md)

#### 2. **Convex as Single Source of Truth** ✅
- **Implemented:** All state stored in Convex database
- **Benefit:** Real-time updates, type safety, no race conditions
- **Aligns with:** N8N_WORKFLOW_GUIDE.md architecture principles

#### 3. **Stateless N8N Workflows** ✅
- **Implemented:** N8N only executes tasks, doesn't store state
- **Benefit:** Idempotent operations, easy retry logic
- **Aligns with:** Task-based pattern from N8N_WORKFLOW_GUIDE.md

#### 4. **Hybrid Calendar Strategy** ✅
- **Implemented:** Own booking system + Google Calendar sync
- **Benefit:** Full control, backup if Google API fails, custom logic
- **Aligns with:** Recommendation from ultimate_N8N.md

#### 5. **Multi-Step Lead Capture** ✅
- **Implemented:** AI naturally asks for missing information
- **Benefit:** Conversational flow, no rigid forms
- **Aligns with:** Tool calling examples from ultimate_N8N.md

### ✅ Production-Grade Features

1. **Error Handling**
   - Slot availability validation before booking
   - Conflict detection for double bookings
   - Google Calendar sync error logging
   - Graceful degradation if external services fail

2. **Data Integrity**
   - Soft deletes (cancelled status vs hard delete)
   - Client statistics tracking
   - Audit trail (createdAt, updatedAt, bookedBy)
   - Transaction-like operations in Convex

3. **Scalability**
   - Indexed queries for performance
   - Real-time subscriptions instead of polling
   - Async Google Calendar sync
   - Stateless N8N workflows

4. **User Experience**
   - Natural conversation flow
   - Real-time availability
   - Instant confirmations
   - Multiple calendar views

5. **Admin Control**
   - Full CRUD on all entities
   - Flexible availability configuration
   - Client management
   - Sync status monitoring

---

## 🚀 Implementation Roadmap

### Phase 1: Core Booking System (Week 1-2)
- ✅ Set up Convex schema (appointments, clients, availability)
- ✅ Implement availability calculation logic
- ✅ Create Convex HTTP actions for N8N tools
- ✅ Build basic admin dashboard (calendar view, day view)
- ✅ Implement CRUD operations for appointments

### Phase 2: Chatbot Integration (Week 3)
- ✅ Set up N8N workflow with AI agent
- ✅ Configure tool calling for all endpoints
- ✅ Implement conversation memory
- ✅ Test multi-step booking flows
- ✅ Add chatbot widget to frontend

### Phase 3: Google Calendar Sync (Week 4)
- ✅ Implement OAuth flow for Google Calendar
- ✅ Create sync functions (create, update, delete)
- ✅ Add sync status monitoring
- ✅ Implement error handling and retry logic
- ✅ Build sync settings UI

### Phase 4: Client Management (Week 5)
- ✅ Build client list and detail views
- ✅ Implement client search and filters
- ✅ Add client statistics
- ✅ Create client lookup tool for chatbot
- ✅ Implement client tags and notes

### Phase 5: Polish & Testing (Week 6)
- ✅ End-to-end testing of all flows
- ✅ UI/UX improvements
- ✅ Email notifications
- ✅ SMS reminders (optional)
- ✅ Documentation and deployment

---

## 🎯 Success Metrics

### User Metrics
- **Booking Completion Rate:** >80% of users who start booking complete it
- **Average Booking Time:** <2 minutes from start to confirmation
- **User Satisfaction:** >4.5/5 rating for chatbot experience

### System Metrics
- **Availability Accuracy:** 99%+ (no double bookings)
- **Google Calendar Sync Success:** >95%
- **Chatbot Response Time:** <3 seconds average
- **System Uptime:** 99.9%

### Business Metrics
- **Booking Volume:** Track daily/weekly/monthly bookings
- **No-Show Rate:** <10%
- **Cancellation Rate:** <15%
- **Client Retention:** Track repeat bookings

---

## 🔒 Security & Privacy

### Data Protection
- **Email Encryption:** Client emails encrypted at rest
- **Phone Number Masking:** Display masked phone numbers in UI
- **Access Control:** Admin authentication required
- **API Security:** Convex HTTP actions with authentication

### Compliance
- **GDPR:** Right to deletion, data export
- **Data Retention:** Configurable retention policies
- **Audit Logs:** Track all data access and modifications

---

## 📝 Conclusion

This PRD defines a **production-ready booking system** that:

✅ **Follows best practices** from the analyzed N8N documentation  
✅ **Uses tool calling architecture** for scalable AI integration  
✅ **Leverages Convex** as single source of truth  
✅ **Provides comprehensive admin controls** with multiple calendar views  
✅ **Syncs with Google Calendar** for seamless workflow integration  
✅ **Enables natural chatbot booking** through N8N AI agent  
✅ **Supports full client lifecycle** (create, lookup, book, update, delete)

The system is designed to be **enterprise-grade**, **maintainable**, and **scalable** while providing an excellent user experience for both end users and administrators.

---

**Next Steps:**
1. Review and approve PRD
2. Set up development environment (Convex, N8N, Next.js)
3. Begin Phase 1 implementation
4. Schedule weekly progress reviews

**Questions or Feedback:** Please provide any comments or requested changes to this PRD.
