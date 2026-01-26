# N8N Tool Integration Guide

**Complete API Reference for N8N Chatbot Tools**

This document describes all API endpoints, request formats, and response formats for integrating your N8N chatbot with the Convex backend.

---

## 📋 Overview

Your N8N AI Agent has access to **8 tools** that call your Convex backend:

1. **Client Lookup** - Check if user exists
2. **Create Lead** - Create CRM lead for new users
3. **Check Availability** - Get available time slots
4. **Book Appointment** - Create new appointment
5. **Update Appointment** - Modify existing appointment
6. **Delete Appointment** - Cancel appointment
7. **Lookup Appointments** - Get client's appointments
8. **Knowledge Base Search** - Answer questions from documentation

**Base URL:** `https://your-domain.convex.site`

Replace `your-domain` with your actual Convex deployment URL.

---

## 🔧 Tool 1: Client Lookup

**Purpose:** Check if a client exists in the system by email or phone.

### Endpoint
```
POST /api/booking/lookup-client
```

### Request Format
```json
{
  "email": "john@example.com",
  "phone": "555-1234"
}
```

**Parameters:**
- `email` (string, optional) - Client's email address
- `phone` (string, optional) - Client's phone number
- **Note:** Provide at least one (email or phone)

### Response Format

**When client is found:**
```json
{
  "found": true,
  "client": {
    "id": "jn78dtmspwy0xg044j080rwks17yvksk",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "company": "Acme Corp",
    "totalAppointments": 5,
    "lastBookedAt": 1706227200000
  },
  "recentAppointments": [
    {
      "_id": "xyz789",
      "date": "2026-02-15",
      "startTime": "14:00",
      "endTime": "15:00",
      "status": "confirmed",
      "appointmentType": "consultation"
    }
  ]
}
```

**When client is not found:**
```json
{
  "found": false,
  "message": "Client not found"
}
```

### N8N Usage Example
```
User: "Do you have my information? My email is john@example.com"

N8N AI Agent:
1. Extracts email: "john@example.com"
2. Calls: POST /api/booking/lookup-client
3. Receives: { "found": true, "client": {...} }
4. Responds: "Yes John, I found your account! You have 5 appointments with us."
```

---

## 🔧 Tool 2: Create Lead

**Purpose:** Create a new lead in the CRM system for users who don't have an account yet.

### Endpoint
```
POST /api/booking/create-lead
```

### Request Format
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "555-5678",
  "message": "Interested in consultation services"
}
```

**Parameters:**
- `name` (string, required) - Lead's full name
- `email` (string, required) - Lead's email address
- `phone` (string, optional) - Lead's phone number
- `message` (string, optional) - Any message or notes from the lead

### Response Format

**When new lead is created:**
```json
{
  "success": true,
  "leadId": "abc123def456",
  "message": "Lead created successfully",
  "isNew": true
}
```

**When lead already exists:**
```json
{
  "success": true,
  "leadId": "abc123def456",
  "message": "Lead already exists",
  "isNew": false
}
```

### N8N Usage Example
```
User: "Hi, I'm Jane Smith, email jane@example.com. I'd like to learn about your services."

N8N AI Agent:
1. Checks if client exists (Tool 1) → Not found
2. Calls: POST /api/booking/create-lead
3. Receives: { "success": true, "isNew": true }
4. Responds: "Thanks Jane! I've saved your information. Let me tell you about our services..."
```

---

## 🔧 Tool 3: Check Availability

**Purpose:** Get available time slots for a specific date.

### Endpoint
```
POST /api/booking/check-availability
```

### Request Format
```json
{
  "date": "2026-02-20",
  "duration": 60
}
```

**Parameters:**
- `date` (string, required) - Date in YYYY-MM-DD format
- `duration` (number, optional) - Appointment duration in minutes (default: 60)

### Response Format

**When slots are available:**
```json
{
  "available": true,
  "date": "2026-02-20",
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
  "totalSlots": 3
}
```

**When no slots available:**
```json
{
  "available": false,
  "slots": [],
  "reason": "This day is not available for bookings"
}
```

### N8N Usage Example
```
User: "What times are available on February 20th?"

N8N AI Agent:
1. Parses date: "2026-02-20"
2. Calls: POST /api/booking/check-availability
3. Receives: { "available": true, "slots": [...] }
4. Responds: "I have these times available on Feb 20:
   - 9:00 AM
   - 10:00 AM
   - 2:00 PM
   Which works best for you?"
```

---

## 🔧 Tool 4: Book Appointment

**Purpose:** Create a new appointment for a client.

### Endpoint
```
POST /api/booking/create-appointment
```

### Request Format
```json
{
  "clientName": "John Doe",
  "clientEmail": "john@example.com",
  "clientPhone": "555-1234",
  "date": "2026-02-20",
  "startTime": "10:00",
  "duration": 60,
  "appointmentType": "consultation",
  "notes": "First time client, interested in premium package"
}
```

**Parameters:**
- `clientName` (string, required) - Client's full name
- `clientEmail` (string, required) - Client's email address
- `clientPhone` (string, optional) - Client's phone number
- `date` (string, required) - Appointment date in YYYY-MM-DD format
- `startTime` (string, required) - Start time in HH:MM format (24-hour)
- `duration` (number, optional) - Duration in minutes (default: 60)
- `appointmentType` (string, optional) - Type of appointment
- `notes` (string, optional) - Additional notes

### Response Format

**Success:**
```json
{
  "success": true,
  "appointmentId": "xyz789abc123",
  "message": "Appointment booked successfully",
  "appointment": {
    "id": "xyz789abc123",
    "clientId": "client123",
    "date": "2026-02-20",
    "startTime": "10:00",
    "endTime": "11:00",
    "duration": 60,
    "status": "confirmed",
    "confirmationSent": true
  }
}
```

**Conflict Error:**
```json
{
  "success": false,
  "error": "Time slot conflict",
  "message": "This time slot is already booked",
  "conflictingAppointment": {
    "date": "2026-02-20",
    "startTime": "10:00",
    "endTime": "11:00"
  }
}
```

### N8N Usage Example
```
User: "Book me for 10am on February 20th"

N8N AI Agent:
1. Checks availability first (Tool 3)
2. Confirms with user
3. Calls: POST /api/booking/create-appointment
4. Receives: { "success": true, "appointmentId": "..." }
5. Responds: "Perfect! Your appointment is confirmed for Feb 20 at 10:00 AM. 
   You'll receive a confirmation email shortly."
```

---

## 🔧 Tool 5: Update Appointment

**Purpose:** Modify an existing appointment (reschedule or update details).

### Endpoint
```
POST /api/booking/update-appointment
```

### Request Format
```json
{
  "appointmentId": "xyz789abc123",
  "date": "2026-02-22",
  "startTime": "14:00",
  "duration": 90,
  "notes": "Rescheduled by client request"
}
```

**Parameters:**
- `appointmentId` (string, required) - ID of the appointment to update
- `date` (string, optional) - New date in YYYY-MM-DD format
- `startTime` (string, optional) - New start time in HH:MM format
- `duration` (number, optional) - New duration in minutes
- `notes` (string, optional) - Updated notes

### Response Format

**Success:**
```json
{
  "success": true,
  "message": "Appointment updated successfully",
  "appointment": {
    "id": "xyz789abc123",
    "date": "2026-02-22",
    "startTime": "14:00",
    "endTime": "15:30",
    "duration": 90,
    "status": "confirmed"
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Appointment not found"
}
```

### N8N Usage Example
```
User: "I need to reschedule my appointment to February 22nd at 2pm"

N8N AI Agent:
1. Looks up user's appointments (Tool 7)
2. Identifies appointment to reschedule
3. Checks new time availability (Tool 3)
4. Calls: POST /api/booking/update-appointment
5. Receives: { "success": true }
6. Responds: "Done! Your appointment has been rescheduled to Feb 22 at 2:00 PM."
```

---

## 🔧 Tool 6: Delete Appointment

**Purpose:** Cancel an appointment.

### Endpoint
```
POST /api/booking/delete-appointment
```

### Request Format
```json
{
  "appointmentId": "xyz789abc123",
  "reason": "Client requested cancellation"
}
```

**Parameters:**
- `appointmentId` (string, required) - ID of the appointment to cancel
- `reason` (string, optional) - Reason for cancellation

### Response Format

**Success:**
```json
{
  "success": true,
  "message": "Appointment cancelled successfully",
  "appointmentId": "xyz789abc123"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Appointment not found"
}
```

### N8N Usage Example
```
User: "I need to cancel my appointment"

N8N AI Agent:
1. Looks up user's appointments (Tool 7)
2. Confirms which appointment to cancel
3. Calls: POST /api/booking/delete-appointment
4. Receives: { "success": true }
5. Responds: "Your appointment on Feb 20 at 10:00 AM has been cancelled. 
   You'll receive a confirmation email."
```

---

## 🔧 Tool 7: Lookup Appointments

**Purpose:** Get all appointments for a specific client.

### Endpoint
```
POST /api/booking/lookup-appointments
```

### Request Format
```json
{
  "clientEmail": "john@example.com"
}
```

**Parameters:**
- `clientEmail` (string, required) - Client's email address

### Response Format

**Success:**
```json
{
  "success": true,
  "appointments": [
    {
      "id": "xyz789",
      "date": "2026-02-20",
      "startTime": "10:00",
      "endTime": "11:00",
      "duration": 60,
      "status": "confirmed",
      "type": "consultation",
      "notes": "First time client"
    },
    {
      "id": "abc456",
      "date": "2026-03-05",
      "startTime": "14:00",
      "endTime": "15:00",
      "duration": 60,
      "status": "pending",
      "type": "follow-up",
      "notes": ""
    }
  ]
}
```

**Client Not Found:**
```json
{
  "success": false,
  "message": "Client not found",
  "appointments": []
}
```

### N8N Usage Example
```
User: "What appointments do I have?"

N8N AI Agent:
1. Gets user's email from conversation
2. Calls: POST /api/booking/lookup-appointments
3. Receives: { "success": true, "appointments": [...] }
4. Responds: "You have 2 upcoming appointments:
   1. Feb 20 at 10:00 AM - Consultation
   2. Mar 5 at 2:00 PM - Follow-up"
```

---

## 🔧 Tool 8: Knowledge Base Search

**Purpose:** Search the knowledge base to answer user questions.

### Endpoint
```
POST /api/booking/search-knowledge
```

### Request Format
```json
{
  "query": "business hours",
  "type": "frontend",
  "isAuthenticated": false
}
```

**Parameters:**
- `query` (string, required) - The user's question or search term
- `type` (string, optional) - Knowledge base type: "frontend" or "backend" (default: "frontend")
- `isAuthenticated` (boolean, optional) - Whether user is logged in (default: false)

### Response Format

**Success:**
```json
{
  "success": true,
  "results": [
    {
      "title": "Business Hours",
      "content": "# Business Hours\n\nWe are open:\n- Monday-Friday: 9:00 AM - 5:00 PM\n- Saturday: 10:00 AM - 2:00 PM\n- Sunday: Closed",
      "category": "general",
      "tags": ["hours", "schedule", "availability"]
    },
    {
      "title": "How to Book an Appointment",
      "content": "# Booking Process\n\n1. Choose your service\n2. Select date and time...",
      "category": "booking",
      "tags": ["booking", "how-to"]
    }
  ],
  "count": 2
}
```

**No Results:**
```json
{
  "success": true,
  "results": [],
  "count": 0
}
```

### Knowledge Base Type Logic

**Frontend (Public Users):**
- `type: "frontend"`
- `isAuthenticated: false`
- Returns: Only frontend knowledge base articles

**Backend (Authenticated Users):**
- `type: "backend"`
- `isAuthenticated: true`
- Returns: Both frontend AND backend knowledge base articles

### N8N Usage Example

**Public User:**
```
User: "What are your business hours?"

N8N AI Agent:
1. Calls: POST /api/booking/search-knowledge
   { "query": "business hours", "type": "frontend", "isAuthenticated": false }
2. Receives: { "results": [{ "title": "Business Hours", "content": "..." }] }
3. Responds: "We are open Monday-Friday from 9:00 AM to 5:00 PM, 
   Saturday from 10:00 AM to 2:00 PM, and closed on Sundays."
```

**Authenticated User:**
```
User (logged in): "How do I manage appointments in the admin panel?"

N8N AI Agent:
1. Calls: POST /api/booking/search-knowledge
   { "query": "manage appointments", "type": "backend", "isAuthenticated": true }
2. Receives: { "results": [{ "title": "Admin Dashboard Guide", "content": "..." }] }
3. Responds: "To manage appointments, go to the Booking Management section. 
   You can view, edit, and cancel appointments from the calendar view..."
```

---

## 📊 Complete Conversation Flow Example

### Scenario: New User Booking an Appointment

```
1. User: "Hi, I'd like to book an appointment"
   
   N8N: "I'd be happy to help! May I have your name and email?"

2. User: "I'm Sarah Johnson, sarah@example.com"
   
   N8N → Calls Tool 1 (Client Lookup)
   POST /api/booking/lookup-client
   { "email": "sarah@example.com" }
   
   Response: { "found": false }
   
   N8N → Calls Tool 2 (Create Lead)
   POST /api/booking/create-lead
   { "name": "Sarah Johnson", "email": "sarah@example.com" }
   
   Response: { "success": true, "isNew": true }
   
   N8N: "Welcome Sarah! What date would you like to book for?"

3. User: "Next Monday"
   
   N8N → Calculates date: "2026-02-24"
   
   N8N → Calls Tool 3 (Check Availability)
   POST /api/booking/check-availability
   { "date": "2026-02-24", "duration": 60 }
   
   Response: { "available": true, "slots": [...] }
   
   N8N: "I have these times available on Monday, Feb 24:
   - 9:00 AM
   - 10:00 AM
   - 2:00 PM
   - 3:00 PM
   Which works best for you?"

4. User: "2:00 PM please"
   
   N8N → Calls Tool 4 (Book Appointment)
   POST /api/booking/create-appointment
   {
     "clientName": "Sarah Johnson",
     "clientEmail": "sarah@example.com",
     "date": "2026-02-24",
     "startTime": "14:00",
     "duration": 60,
     "appointmentType": "consultation"
   }
   
   Response: { "success": true, "appointmentId": "xyz789" }
   
   N8N: "Perfect! Your appointment is confirmed for Monday, Feb 24 at 2:00 PM.
   You'll receive a confirmation email at sarah@example.com shortly.
   Is there anything else I can help you with?"

5. User: "What should I bring?"
   
   N8N → Calls Tool 8 (Knowledge Base Search)
   POST /api/booking/search-knowledge
   { "query": "what to bring appointment", "type": "frontend" }
   
   Response: { "results": [{ "content": "Just bring yourself! We provide everything..." }] }
   
   N8N: "Just bring yourself! We provide everything you need for the appointment.
   Looking forward to seeing you on Feb 24!"
```

---

## 🔑 Key Points for N8N Configuration

### 1. **Tool Selection Logic**

N8N AI Agent automatically decides which tool to use based on user intent:

- User asks about hours/policies → **Tool 8** (Knowledge Base)
- User provides contact info → **Tool 1** (Client Lookup) or **Tool 2** (Create Lead)
- User asks about availability → **Tool 3** (Check Availability)
- User wants to book → **Tool 4** (Book Appointment)
- User wants to reschedule → **Tool 5** (Update Appointment)
- User wants to cancel → **Tool 6** (Delete Appointment)
- User asks about their bookings → **Tool 7** (Lookup Appointments)

### 2. **Data Extraction**

N8N AI extracts data from natural conversation:

```
User: "I'm John, email john@example.com, I want to book for next Friday at 3pm"

N8N extracts:
- name: "John"
- email: "john@example.com"
- date: "2026-02-28" (calculates next Friday)
- time: "15:00" (converts 3pm to 24-hour format)
```

### 3. **Error Handling**

When API returns errors, N8N should:

```json
// API Error Response
{
  "success": false,
  "error": "Time slot conflict"
}

// N8N Response to User
"I'm sorry, that time slot is no longer available. 
Let me check other available times for you."
```

### 4. **Authentication Context**

Pass user authentication status to Knowledge Base Search:

```javascript
// For public users
{ "isAuthenticated": false, "type": "frontend" }

// For logged-in users
{ "isAuthenticated": true, "type": "backend" }
```

---

## 📝 Testing Your Integration

### Test Each Tool Individually

**1. Test Client Lookup:**
```bash
curl -X POST https://your-domain.convex.site/api/booking/lookup-client \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**2. Test Create Lead:**
```bash
curl -X POST https://your-domain.convex.site/api/booking/create-lead \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}'
```

**3. Test Check Availability:**
```bash
curl -X POST https://your-domain.convex.site/api/booking/check-availability \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-02-20","duration":60}'
```

**4. Test Knowledge Base Search:**
```bash
curl -X POST https://your-domain.convex.site/api/booking/search-knowledge \
  -H "Content-Type: application/json" \
  -d '{"query":"business hours","type":"frontend","isAuthenticated":false}'
```

---

## ✅ Summary

**8 Tools Available:**
1. ✅ Client Lookup - Check existing users
2. ✅ Create Lead - New user CRM
3. ✅ Check Availability - Available time slots
4. ✅ Book Appointment - Create booking
5. ✅ Update Appointment - Reschedule
6. ✅ Delete Appointment - Cancel
7. ✅ Lookup Appointments - View bookings
8. ✅ Knowledge Base Search - Answer questions

**All endpoints return JSON** with consistent structure:
- `success` - Boolean indicating success/failure
- `data` - Response data (varies by endpoint)
- `message` - Human-readable message (optional)
- `error` - Error description (if failed)

**N8N handles:**
- Conversation context
- Data extraction
- Tool selection
- Natural language formatting

**Your API handles:**
- Data validation
- Database operations
- Business logic
- Structured responses

---

**Ready to integrate!** 🚀

For more details, see:
- `N8N_AI_CHATBOT_IMPLEMENTATION.md` - Complete implementation guide
- `TESTING_GUIDE.md` - Testing procedures
- `TROUBLESHOOTING.md` - Common issues
