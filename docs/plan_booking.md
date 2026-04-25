# Booking System — Migration & Improvement Plan

> **Status:** Paused — focus on core product (storyboard studio)
> **Last updated:** 2026-04-25
> **Decision:** Booking is not business-critical right now. The core product (storyboard studio, AI generation, credits, subscriptions) takes priority. Resume this plan only when booking becomes essential (e.g., enterprise demo calls, customer onboarding).

---

## What's Done

### Phase 1: n8n -> Claude Migration (COMPLETED)

Replaced the n8n AI Agent orchestration with Claude API tool-use. The chatbot now runs entirely on Anthropic — no n8n dependency.

**Files created/modified:**

| File | What it does |
|---|---|
| `lib/booking/agent-tools.ts` | 5 Claude tool definitions (lookup_client, create_lead, check_availability, book_appointment, search_knowledge) |
| `lib/booking/tool-executor.ts` | Executes tools against existing Convex queries/mutations |
| `lib/booking/system-prompt.ts` | Kylie persona system prompt with booking workflow |
| `app/api/chat/route.ts` | Rewritten: n8n webhook proxy -> Claude Haiku 4.5 tool-use loop |

**How it works now:**
```
User message -> ChatWidget -> /api/chat -> Claude API (Haiku 4.5)
  -> Claude calls tools as needed:
    - lookup_client -> convex bookingQueries.getClientByEmail
    - create_lead -> convex bookingMutations.createClient
    - check_availability -> convex bookingQueries (availability + slots)
    - book_appointment -> convex bookingMutations.createAppointment
    - search_knowledge -> convex knowledgeBase.searchArticlesUnified
  -> Claude returns text response
  -> /api/chat stores conversation in Convex -> returns { output } to widget
```

**Note:** Phase 1 is implemented but untested in production. The widget doesn't need changes — same `{ output }` response format. The `n8nWebhookUrl` field in chatbot_config is now ignored.

---

## What's Left (when resuming)

### Phase 2: Data Model Cleanup

**The `clients` vs `contacts` problem:**
- `contacts` = CRM table used by inbox, email, leads (the real customer table)
- `clients` = booking-only duplicate with stats fields (totalAppointments, noShowCount, etc.)
- `appointments.contactId` is `Id<"contacts">` in schema, but booking code creates `clients` records and casts the ID
- **Recommendation:** Remove `clients` table, add booking stats as optional fields on `contacts`

**Dead code to remove:**
- `booking_conversations` mutations (defined but never called)
- `chat_appointments` table (exists but no insert mutation)
- `convex/bookings.ts` legacy stubs
- Duplicate settings in `AvailabilitySettings` vs `BookingSettingsTab`
- n8n httpAction routes in `convex/bookingTools.ts`
- Duplicate Next.js API routes in `app/api/booking/`
- n8n booking route registrations in `convex/httpRoutes.ts`

### Phase 3: Public Self-Booking Page

`app/book/[slug]/page.tsx` currently shows "Coming Soon". Needs:
- Date picker based on availability + overrides
- Time slot selector (calls calculateAvailableSlots)
- Booking form with custom questions from event_types
- Confirmation + calendar add link

### Phase 4: Google Calendar Sync

Schema is ready (`google_calendar_sync` table, `googleEventId` on appointments). Needs:
- Google Cloud project + OAuth flow
- Sync on appointment create/update/delete
- Optional two-way sync

### Phase 5: Email Notifications

Wire existing Nodemailer/Brevo infra to bookings:
- Booking confirmation, reminders, cancellation, reschedule notifications

---

## Current Architecture Reference

### Database Tables

| Table | Purpose | Notes |
|---|---|---|
| `appointments` | Main booking records | FK to `contacts` via `contactId` |
| `clients` | Booking customer records | Should be merged into `contacts` (Phase 2) |
| `contacts` | CRM contacts | Source of truth for customers |
| `availability` | Weekly schedule (per day) | Mon-Fri 9-5 default |
| `availability_overrides` | Date-specific exceptions | Holidays, custom hours |
| `event_types` | Calendly-style meeting types | Has slug for public booking URL |
| `platform_config` (booking) | Global settings | Buffers, lunch, holidays, limits |
| `google_calendar_sync` | OAuth config | Schema only, not implemented |
| `booking_conversations` | Chatbot session state | Dead code |
| `chat_appointments` | Chatbot-booked appointments | Dead code |

### Key Files

**Backend:** `convex/bookingMutations.ts`, `convex/bookingQueries.ts`, `convex/bookingTools.ts` (n8n httpActions, can be removed)

**Admin UI:** `app/admin/booking/page.tsx` (5-tab admin page), `components/booking/*` (CalendarView, WeekView, AvailabilitySettings, EventTypesManager, etc.)

**Chat/Agent:** `lib/booking/agent-tools.ts`, `lib/booking/tool-executor.ts`, `lib/booking/system-prompt.ts`, `app/api/chat/route.ts`
