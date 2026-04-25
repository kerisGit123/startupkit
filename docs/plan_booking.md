# Booking System — Migration & Improvement Plan

> **Status:** Paused — focus on core product (storyboard studio)
> **Last updated:** 2026-04-25
> **Context:** Booking was originally orchestrated via n8n (Kylie AI receptionist). n8n has been fully removed. Phase 1 (Claude agent with booking tools) is implemented but untested in production. Remaining phases are on hold — booking is not a priority; the core product (storyboard studio, AI generation, credits, subscriptions) takes precedence. Resume this plan when booking becomes business-critical (e.g., enterprise demo calls).
>
> **Phase 1 completed files:**
> - `lib/booking/agent-tools.ts` — Claude tool definitions (5 tools)
> - `lib/booking/tool-executor.ts` — tool execution against Convex
> - `lib/booking/system-prompt.ts` — Kylie persona prompt
> - `app/api/chat/route.ts` — rewritten from n8n proxy to Claude API tool-use

---

## Current Architecture

### Database Tables (convex/schema.ts)

| Table | Purpose | Status |
|---|---|---|
| `appointments` | Main booking records, FK to `contacts` | Active |
| `clients` | Booking-specific customer records (separate from contacts) | Active but problematic — see issues |
| `availability` | Weekly schedule (per day-of-week) | Active |
| `availability_overrides` | Date-specific blocks/custom hours, holidays | Active |
| `event_types` | Calendly-style meeting types with slug, duration, custom questions | Active |
| `google_calendar_sync` | OAuth config for Google Calendar | Schema only — not implemented |
| `booking_conversations` | Chatbot booking session state | Dead code — mutations exist but never called |
| `chat_appointments` | Appointments booked via chatbot widget | No insert mutation exists |
| `leads` | Pre-client CRM entries | Active |
| `platform_config` (category="booking") | Global settings (buffers, lunch, holidays, limits) | Active |

### Key Files

**Convex backend:**
- `convex/bookingMutations.ts` — all write operations
- `convex/bookingQueries.ts` — all read operations
- `convex/bookingTools.ts` — httpActions (n8n API surface, 13 endpoints)
- `convex/bookings.ts` — legacy compatibility stubs
- `convex/initializeBookingSystem.ts` — seed script (Mon-Fri 9-5)
- `convex/httpRoutes.ts` — registers Convex HTTP routes

**Next.js API routes (secondary, some duplicate Convex httpActions):**
- `app/api/booking/book-appointment/route.ts` — uses legacy `bookings.createBooking`
- `app/api/booking/check-availability/route.ts`
- `app/api/booking/lookup-client/route.ts` — searches `contacts` table (not `clients`)
- `app/api/booking/create-lead/route.ts`
- `app/api/booking/search-knowledge-combined/route.ts`

**Admin UI:**
- `app/admin/booking/page.tsx` — 5-tab admin page (Calendar, Week, Availability, Event Types, Settings)
- `components/booking/CalendarView.tsx` — month view with drag-and-drop
- `components/booking/WeekView.tsx` — week view with time slots
- `components/booking/AvailabilitySettings.tsx` — per-day schedule config
- `components/booking/BookingSettingsTab.tsx` — global settings
- `components/booking/EventTypesManager.tsx` — CRUD for event types
- `components/booking/CreateAppointmentModal.tsx` — manual booking
- `components/booking/AppointmentDetailsModal.tsx` — view/edit/delete

**Public booking page (stub):**
- `app/book/[slug]/page.tsx` — shows "Booking Calendar Coming Soon"

### Current n8n Flow (Kylie AI Receptionist)

```
User message -> ChatWidget -> /api/chat -> n8n webhook
  -> n8n AI Agent with tools:
    - lookup_client (Convex HTTP: POST /api/booking/lookup-client)
    - create_lead (Convex HTTP: POST /api/booking/create-client)
    - check_availability (Convex HTTP: POST /api/booking/check-availability)
    - book_appointment (Convex HTTP: POST /api/booking/create-appointment)
    - search_knowledge (Convex HTTP: POST /api/booking/search-knowledge-combined)
  -> n8n returns { output, quickReplies }
  -> /api/chat stores conversation -> returns to widget
```

---

## Known Issues

### Critical
1. **`contacts` vs `clients` table split** — `appointments.contactId` is `Id<"contacts">`, but `bookingTools.bookAppointment` creates records in `clients` table and casts `Id<"clients">` as `Id<"contacts">`. Data model inconsistency — should consolidate to one table.

2. **Two competing API surfaces** — Convex httpActions use `clients` table, Next.js API routes use `contacts` table. Same operation, different data paths.

### Missing Features
3. **Public self-booking page** (`app/book/[slug]`) is a stub — no date picker, slot selection, or booking form.
4. **Google Calendar sync** — schema ready, no implementation (no OAuth, no API calls, no sync job).
5. **No email confirmation** on booking — email infra exists but not wired to bookings.
6. **`maxMeetingLimits` not enforced** — admin can set per-day/week limits but `bookAppointment` doesn't check them.

### Dead Code
7. **`booking_conversations`** — mutations exist (`createBookingConversation`, `updateBookingConversation`) but never called.
8. **`chat_appointments`** — table exists, queried in admin inbox, but no insert mutation.
9. **Duplicated settings** — `AvailabilitySettings` and `BookingSettingsTab` both save buffer/lunch/limit settings to same `platform_config` keys.

---

## Migration Plan: n8n -> Claude Agent (Anthropic Tool-Use)

### Phase 1: Claude Agent with Booking Tools

**Goal:** Replace n8n AI orchestration with Claude API tool-use. Keep all existing Convex mutations/queries — only change the orchestration layer.

#### 1.1 Create booking tool definitions for Claude

Create `lib/booking/agent-tools.ts` — define Claude tool-use schemas matching the current n8n tools:

```typescript
export const bookingTools = [
  {
    name: "lookup_client",
    description: "Search for existing client by email address",
    input_schema: {
      type: "object",
      properties: {
        email: { type: "string", description: "Client email address" }
      },
      required: ["email"]
    }
  },
  {
    name: "create_lead",
    description: "Create new contact/lead in CRM",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" }
      },
      required: ["name", "email"]
    }
  },
  {
    name: "check_availability",
    description: "Check available appointment slots for a specific date",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date in YYYY-MM-DD format" }
      },
      required: ["date"]
    }
  },
  {
    name: "book_appointment",
    description: "Book an appointment for a client",
    input_schema: {
      type: "object",
      properties: {
        email: { type: "string" },
        date: { type: "string", description: "YYYY-MM-DD" },
        startTime: { type: "string", description: "HH:MM 24h format" },
        endTime: { type: "string", description: "HH:MM 24h format" },
        appointmentType: { type: "string" },
        notes: { type: "string" }
      },
      required: ["email", "date", "startTime", "endTime", "appointmentType"]
    }
  },
  {
    name: "search_knowledge",
    description: "Search knowledge base for answers to general questions about services, policies, pricing",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string" }
      },
      required: ["query"]
    }
  }
];
```

#### 1.2 Create tool executor

Create `lib/booking/tool-executor.ts` — executes each tool by calling existing Convex mutations/queries:

```typescript
export async function executeBookingTool(
  toolName: string,
  input: Record<string, any>,
  convexClient: ConvexHttpClient
): Promise<any> {
  switch (toolName) {
    case "lookup_client":
      return await convexClient.query(api.bookingQueries.getClientByEmail, { email: input.email });
    case "create_lead":
      return await convexClient.mutation(api.leads.createLead, { ... });
    case "check_availability":
      return await convexClient.query(api.bookingQueries.calculateAvailableSlots, { date: input.date });
    case "book_appointment":
      return await convexClient.mutation(api.bookingMutations.createAppointment, { ... });
    case "search_knowledge":
      return await convexClient.query(api.knowledgeBase.searchArticles, { query: input.query });
  }
}
```

#### 1.3 Create Claude chat API route

Create or modify `app/api/chat/route.ts`:

```typescript
// 1. Receive user message from ChatWidget
// 2. Load conversation history from Convex
// 3. Call Claude API with:
//    - System prompt (Kylie persona — casual, friendly, upbeat)
//    - Conversation history
//    - Tool definitions (bookingTools)
// 4. If Claude returns tool_use:
//    a. Execute tool via executeBookingTool()
//    b. Send tool_result back to Claude
//    c. Repeat until Claude returns text (not tool_use)
// 5. Return Claude's final text response to ChatWidget
// 6. Store conversation in Convex
```

System prompt should preserve the Kylie persona workflow:
1. Greet and ask for email
2. Lookup/create customer in CRM
3. Ask intent: Booking? Question? Special request?
4. Route to booking flow or knowledge base
5. Confirm details and wrap up

#### 1.4 Update ChatWidget to use new route

Update the chat widget config to point to the Claude route instead of n8n webhook. The response format should match `{ output, quickReplies }` for backward compatibility.

---

### Phase 2: Data Model Cleanup

#### 2.1 Consolidate `clients` -> `contacts`

- The `contacts` table is the CRM source of truth
- Migrate `bookingTools.ts` to use `contacts` table directly instead of `clients`
- Update `appointments.contactId` references to always point to real `contacts` records
- Keep `clients` table temporarily with a deprecation notice, migrate existing data

#### 2.2 Remove dead code

- Remove `booking_conversations` mutations (unused)
- Remove or properly wire `chat_appointments` table
- Remove `convex/bookings.ts` legacy stubs
- Deduplicate settings between `AvailabilitySettings` and `BookingSettingsTab`

#### 2.3 Remove n8n booking routes (optional, after Phase 1 confirmed)

- Remove or deprecate httpActions in `convex/bookingTools.ts`
- Remove duplicate Next.js API routes in `app/api/booking/`
- Clean up `convex/httpRoutes.ts` booking route registrations

---

### Phase 3: Public Self-Booking Page

Build `app/book/[slug]/page.tsx` — Calendly-style public booking page:

1. **Event type header** — name, description, duration, location type
2. **Date picker** — show available dates based on `availability` + `availability_overrides`
3. **Time slot selector** — call `calculateAvailableSlots` for selected date
4. **Booking form** — name, email, phone + custom questions from `event_types.customQuestions`
5. **Confirmation** — create appointment via `bookingMutations.createAppointment`
6. **Success screen** — show confirmation with calendar add link

---

### Phase 4: Google Calendar Sync (Future)

Schema is already in place (`google_calendar_sync` table, `googleEventId` on appointments).

1. Set up Google Cloud project, enable Calendar API
2. Add Google OAuth flow (`/api/auth/google/callback`)
3. On appointment create/update/delete -> sync to Google Calendar via API
4. Optional two-way sync via webhook or polling
5. Store `googleEventId` on appointments for update/delete tracking
6. Add env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

---

### Phase 5: Email Notifications (Future)

Use existing Nodemailer/Brevo email infra:

1. Booking confirmation email to client
2. Reminder email (configurable: 1h, 24h before)
3. Cancellation notification
4. Reschedule notification
5. Admin notification for new bookings

---

## Implementation Priority

| Priority | Task | Effort | Dependencies |
|---|---|---|---|
| P0 | Phase 1.1-1.3: Claude agent with booking tools | 1-2 days | Anthropic API key |
| P0 | Phase 1.4: Switch ChatWidget to Claude | 30 min | Phase 1.3 |
| P1 | Phase 2.1: Consolidate clients -> contacts | 2-3 hours | Data migration |
| P1 | Phase 2.2: Remove dead code | 1 hour | — |
| P2 | Phase 3: Public booking page | 1-2 days | — |
| P2 | Phase 2.3: Remove n8n routes | 30 min | Phase 1 confirmed |
| P3 | Phase 4: Google Calendar | 2-3 days | Google Cloud project |
| P3 | Phase 5: Email notifications | 1 day | — |

---

## Files to Create/Modify

### New Files
- `lib/booking/agent-tools.ts` — Claude tool definitions
- `lib/booking/tool-executor.ts` — tool execution logic

### Modify
- `app/api/chat/route.ts` — switch from n8n webhook to Claude API
- `convex/bookingMutations.ts` — fix `contactId`/`clientId` inconsistency
- `app/book/[slug]/page.tsx` — build actual booking UI (Phase 3)
- `components/booking/AvailabilitySettings.tsx` — deduplicate settings

### Remove (Phase 2, after migration confirmed)
- `convex/bookings.ts` — legacy stubs
- `convex/booking_conversations` related dead code
- Duplicate Next.js API routes in `app/api/booking/`
- n8n httpAction routes in `convex/bookingTools.ts`
