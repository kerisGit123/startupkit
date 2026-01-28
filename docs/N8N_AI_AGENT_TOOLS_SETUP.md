# n8n AI Agent Tools Setup Guide

**How to Add Booking Tools to Your n8n AI Agent**

---

## 🎯 Overview

I've created **4 API endpoints** that your n8n AI Agent can use as tools:

1. **Client Lookup** - `POST /api/booking/lookup-client`
2. **Create Lead** - `POST /api/booking/create-lead`
3. **Check Availability** - `POST /api/booking/check-availability`
4. **Book Appointment** - `POST /api/booking/book-appointment`

These endpoints connect to your Convex backend and allow the AI to perform booking actions.

---

## 🔧 Step-by-Step Setup in n8n

### **Step 1: Open Your n8n Workflow**

1. Go to your n8n chatbot workflow
2. Click on the **AI Agent** node
3. Scroll down to **Tools** section

### **Step 2: Add HTTP Request Tool**

For each tool you want to add:

1. Click **"Add Tool"**
2. Select **"HTTP Request"**
3. Configure as shown below

---

## 📋 Tool 1: Client Lookup

**Purpose:** Check if a client exists by email or phone

### **Tool Configuration:**

**Name:** `lookup_client`

**Description:**
```
Check if a client exists in the system. Use this when the user mentions their email or phone number. Returns client information and recent appointments if found.
```

**HTTP Request Settings:**
- **Method:** POST
- **URL:** `https://your-domain.vercel.app/api/booking/lookup-client`
- **Body Content Type:** JSON
- **Body:**
```json
{
  "email": "={{ $parameter.email }}",
  "phone": "={{ $parameter.phone }}"
}
```

**Parameters to Extract:**
- `email` (string, optional) - "Client's email address"
- `phone` (string, optional) - "Client's phone number"

**Example Prompt:**
```
User: "Do you have my info? My email is john@example.com"

AI will:
1. Extract email: john@example.com
2. Call lookup_client tool
3. Respond with client information
```

---

## 📋 Tool 2: Create Lead

**Purpose:** Create a new lead/contact in CRM

### **Tool Configuration:**

**Name:** `create_lead`

**Description:**
```
Create a new lead in the CRM system. Use this when a new user provides their contact information and wants to book or inquire about services.
```

**HTTP Request Settings:**
- **Method:** POST
- **URL:** `https://your-domain.vercel.app/api/booking/create-lead`
- **Body Content Type:** JSON
- **Body:**
```json
{
  "name": "={{ $parameter.name }}",
  "email": "={{ $parameter.email }}",
  "phone": "={{ $parameter.phone }}",
  "company": "={{ $parameter.company }}",
  "source": "chatbot",
  "notes": "={{ $parameter.notes }}"
}
```

**Parameters to Extract:**
- `name` (string, required) - "Client's full name"
- `email` (string, required) - "Client's email address"
- `phone` (string, optional) - "Client's phone number"
- `company` (string, optional) - "Client's company name"
- `notes` (string, optional) - "Additional notes about the lead"

**Example Prompt:**
```
User: "Hi, I'm John Doe from Acme Corp. My email is john@acme.com"

AI will:
1. Extract: name, email, company
2. Call create_lead tool
3. Respond: "Thanks John! I've saved your information."
```

---

## 📋 Tool 3: Check Availability

**Purpose:** Get available time slots for a specific date

### **Tool Configuration:**

**Name:** `check_availability`

**Description:**
```
Check available appointment slots for a specific date. Use this when the user asks about availability or wants to know what times are open.
```

**HTTP Request Settings:**
- **Method:** POST
- **URL:** `https://your-domain.vercel.app/api/booking/check-availability`
- **Body Content Type:** JSON
- **Body:**
```json
{
  "date": "={{ $parameter.date }}",
  "duration": "={{ $parameter.duration }}"
}
```

**Parameters to Extract:**
- `date` (string, required) - "Date in YYYY-MM-DD format (e.g., 2026-02-15)"
- `duration` (number, optional) - "Appointment duration in minutes (default: 60)"

**Example Prompt:**
```
User: "What times are available on February 15th?"

AI will:
1. Convert to date: 2026-02-15
2. Call check_availability tool
3. Respond: "Available times: 9:00 AM, 2:00 PM, 4:00 PM"
```

---

## 📋 Tool 4: Book Appointment

**Purpose:** Create a new appointment booking

### **Tool Configuration:**

**Name:** `book_appointment`

**Description:**
```
Book an appointment for a client. Use this after confirming the client exists and the time slot is available. Requires contactId from lookup_client tool.
```

**HTTP Request Settings:**
- **Method:** POST
- **URL:** `https://your-domain.vercel.app/api/booking/book-appointment`
- **Body Content Type:** JSON
- **Body:**
```json
{
  "contactId": "={{ $parameter.contactId }}",
  "date": "={{ $parameter.date }}",
  "startTime": "={{ $parameter.startTime }}",
  "endTime": "={{ $parameter.endTime }}",
  "appointmentType": "={{ $parameter.appointmentType }}",
  "notes": "={{ $parameter.notes }}"
}
```

**Parameters to Extract:**
- `contactId` (string, required) - "Client ID from lookup_client tool"
- `date` (string, required) - "Date in YYYY-MM-DD format"
- `startTime` (string, required) - "Start time in HH:MM format (e.g., 14:00)"
- `endTime` (string, required) - "End time in HH:MM format (e.g., 15:00)"
- `appointmentType` (string, optional) - "Type of appointment (default: consultation)"
- `notes` (string, optional) - "Additional notes"

**Example Prompt:**
```
User: "Book me for 2 PM on Feb 15th"

AI will:
1. Use contactId from previous lookup
2. Convert time: 14:00-15:00
3. Call book_appointment tool
4. Respond: "Appointment confirmed for Feb 15 at 2:00 PM!"
```

---

## 🔄 Complete Booking Flow Example

**User Conversation:**

```
User: "Hi, I'd like to book an appointment"
AI: "I'd be happy to help! May I have your email address?"

User: "It's john@example.com"
AI: [Calls lookup_client]
    "Hi John! I found your account. When would you like to book?"

User: "What's available next Tuesday?"
AI: [Calls check_availability with date: 2026-02-18]
    "Available times on Tuesday: 9:00 AM, 2:00 PM, 4:00 PM"

User: "2 PM works for me"
AI: [Calls book_appointment]
    "Perfect! Your appointment is confirmed for Tuesday, Feb 18 at 2:00 PM. 
     You'll receive a confirmation email shortly."
```

---

## ⚙️ AI Agent Prompt Configuration

Add this to your AI Agent system prompt:

```
You are a helpful booking assistant. You can:

1. Look up existing clients by email or phone
2. Create new leads for potential clients
3. Check appointment availability
4. Book appointments

IMPORTANT RULES:
- Always look up the client first before booking
- Confirm availability before booking
- Get client's contact info if they're new
- Be friendly and professional
- Confirm all booking details before finalizing

When booking:
1. First use lookup_client to find the client
2. If not found, use create_lead to create them
3. Use check_availability to show options
4. Use book_appointment to confirm the booking
5. Always confirm the booking details with the user
```

---

## 🧪 Testing Your Tools

### **Test 1: Client Lookup**

**User:** "My email is test@example.com"

**Expected:**
- AI calls `lookup_client` tool
- Returns client info or "not found"

### **Test 2: Create Lead**

**User:** "I'm Jane Smith, email jane@test.com"

**Expected:**
- AI calls `create_lead` tool
- Creates new contact
- Responds with confirmation

### **Test 3: Check Availability**

**User:** "What times are free tomorrow?"

**Expected:**
- AI converts "tomorrow" to date
- Calls `check_availability` tool
- Lists available slots

### **Test 4: Book Appointment**

**User:** "Book me for 2 PM"

**Expected:**
- AI uses contactId from lookup
- Calls `book_appointment` tool
- Confirms booking

---

## 🔑 Important Notes

### **Replace Domain:**
Change `https://your-domain.vercel.app` to your actual domain:
- Local: `http://localhost:3000`
- Production: `https://yourdomain.vercel.app`

### **Error Handling:**
The tools return proper error messages:
- Missing required fields → 400 error
- Client not found → `{ "found": false }`
- Booking conflicts → Error message

### **Tool Order:**
Add tools in this order for best results:
1. lookup_client (most used)
2. check_availability (second most)
3. book_appointment (after lookup)
4. create_lead (for new clients)

---

## 📊 Tool Response Formats

### **lookup_client Response:**
```json
{
  "found": true,
  "client": {
    "id": "abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "totalAppointments": 5
  },
  "recentAppointments": [...]
}
```

### **create_lead Response:**
```json
{
  "success": true,
  "contactId": "xyz789",
  "leadId": "lead123",
  "message": "Lead created successfully"
}
```

### **check_availability Response:**
```json
{
  "date": "2026-02-15",
  "availableSlots": [
    { "startTime": "09:00", "endTime": "10:00" },
    { "startTime": "14:00", "endTime": "15:00" }
  ],
  "totalSlots": 2
}
```

### **book_appointment Response:**
```json
{
  "success": true,
  "appointmentId": "apt456",
  "message": "Appointment booked successfully",
  "appointment": {
    "date": "2026-02-15",
    "startTime": "14:00",
    "status": "confirmed"
  }
}
```

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] All 4 tools added to AI Agent
- [ ] Tool names match exactly (lookup_client, create_lead, etc.)
- [ ] URLs point to correct domain
- [ ] Parameters are properly configured
- [ ] AI Agent prompt includes booking instructions
- [ ] Tested each tool individually
- [ ] Tested complete booking flow
- [ ] Error handling works correctly

---

## 🚀 Next Steps

1. **Add the 4 tools** to your n8n AI Agent
2. **Update the system prompt** with booking instructions
3. **Test each tool** individually
4. **Test the complete flow** end-to-end
5. **Deploy and monitor** real conversations

Your AI chatbot can now handle complete booking workflows! 🎉
