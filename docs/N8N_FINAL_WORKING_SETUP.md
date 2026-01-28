# n8n AI Agent Booking - Final Working Setup

**Complete configuration that works**

---

## ✅ System Prompt (Copy Exactly)

```
You are a booking assistant with access to booking tools.

When user provides an email address (like "test@example.com" or "my email is test@example.com"), immediately call the lookup_client tool with that email.

When lookup_client returns not found, call create_lead tool to create the client.

When user mentions a date, call check_availability tool.

When user confirms a time, call book_appointment tool.

Do not ask clarifying questions. Just use the tools when you have the information.
```

---

## ✅ lookup_client Tool Configuration

**In AI Agent node → Tools section → Add Tool → HTTP Request**

**Name:** `lookup_client`

**Description:**
```
Check if client exists by email. Call this immediately when user provides email address.
```

**Schema:**
```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "description": "Email address from user message"
    }
  },
  "required": ["email"]
}
```

**HTTP Request:**
- Method: `POST`
- URL: `https://healthy-mustang-liked.ngrok-free.app/api/booking/lookup-client`
- Send Query Parameters: `OFF`
- Send Headers: `OFF`
- Send Body: `ON`
- Body Content Type: `JSON`
- Specify Body: `Using JSON`
- JSON:
```json
{
  "email": "{{ $parameter.email }}"
}
```

---

## ✅ create_lead Tool Configuration

**Name:** `create_lead`

**Description:**
```
Create new client profile. Call when lookup_client returns not found.
```

**Schema:**
```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Client's full name"
    },
    "email": {
      "type": "string",
      "description": "Client's email address"
    },
    "phone": {
      "type": "string",
      "description": "Phone number (optional)"
    }
  },
  "required": ["name", "email"]
}
```

**HTTP Request:**
- Method: `POST`
- URL: `https://healthy-mustang-liked.ngrok-free.app/api/booking/create-lead`
- Send Body: `ON`
- Body Content Type: `JSON`
- JSON:
```json
{
  "name": "{{ $parameter.name }}",
  "email": "{{ $parameter.email }}",
  "phone": "{{ $parameter.phone }}",
  "source": "chatbot"
}
```

---

## ✅ check_availability Tool Configuration

**Name:** `check_availability`

**Description:**
```
Check available appointment slots for a date. Call when user mentions a date.
```

**Schema:**
```json
{
  "type": "object",
  "properties": {
    "date": {
      "type": "string",
      "description": "Date in YYYY-MM-DD format"
    },
    "duration": {
      "type": "number",
      "description": "Duration in minutes (default 60)"
    }
  },
  "required": ["date"]
}
```

**HTTP Request:**
- Method: `POST`
- URL: `https://healthy-mustang-liked.ngrok-free.app/api/booking/check-availability`
- Send Body: `ON`
- Body Content Type: `JSON`
- JSON:
```json
{
  "date": "{{ $parameter.date }}",
  "duration": "{{ $parameter.duration || 60 }}"
}
```

---

## ✅ book_appointment Tool Configuration

**Name:** `book_appointment`

**Description:**
```
Book an appointment. Call after user confirms time.
```

**Schema:**
```json
{
  "type": "object",
  "properties": {
    "contactId": {
      "type": "string",
      "description": "Client ID from lookup_client"
    },
    "date": {
      "type": "string",
      "description": "Date in YYYY-MM-DD format"
    },
    "startTime": {
      "type": "string",
      "description": "Start time in HH:MM format"
    },
    "endTime": {
      "type": "string",
      "description": "End time in HH:MM format"
    },
    "appointmentType": {
      "type": "string",
      "description": "Type of appointment"
    }
  },
  "required": ["contactId", "date", "startTime", "endTime"]
}
```

**HTTP Request:**
- Method: `POST`
- URL: `https://healthy-mustang-liked.ngrok-free.app/api/booking/book-appointment`
- Send Body: `ON`
- Body Content Type: `JSON`
- JSON:
```json
{
  "contactId": "{{ $parameter.contactId }}",
  "date": "{{ $parameter.date }}",
  "startTime": "{{ $parameter.startTime }}",
  "endTime": "{{ $parameter.endTime }}",
  "appointmentType": "{{ $parameter.appointmentType || 'consultation' }}"
}
```

---

## 🔧 Critical Steps

1. **Save the AI Agent** after adding all tools
2. **Start a NEW chat session** (old sessions have old context)
3. **Test with:** "shangwey@yahoo.com"
4. **Expected:** AI calls lookup_client immediately

---

## 🧪 Test Sequence

**Test 1:**
- Input: "shangwey@yahoo.com"
- Expected: AI calls lookup_client
- Check: Execution log shows tool_calls array

**Test 2:**
- Input: "yes, my name is Shang Wey"
- Expected: AI calls create_lead
- Check: New contact created in database

**Test 3:**
- Input: "tomorrow at 10am"
- Expected: AI calls check_availability
- Check: Returns available slots

**Test 4:**
- AI should call book_appointment automatically
- Check: Appointment created

---

## ⚠️ Troubleshooting

**If AI still doesn't call tools:**

1. **Check Tools are in AI Agent:**
   - Open AI Agent node
   - Scroll to Tools section
   - Should see all 4 tools listed

2. **Check Schema is Set:**
   - Click each tool
   - Verify Schema field has JSON

3. **Start New Chat:**
   - Old chat sessions keep old context
   - Click "New Chat" or restart workflow

4. **Check AI Model:**
   - Must be GPT-3.5-turbo or better
   - GPT-4, Claude 3, etc. work
   - Older models don't support function calling

---

## ✅ Success Indicators

When working correctly, you'll see in execution log:

```json
{
  "tool_calls": [{
    "name": "lookup_client",
    "arguments": {
      "email": "shangwey@yahoo.com"
    }
  }]
}
```

Not:
```json
{
  "tool_calls": []
}
```

---

**The key: Schema must be set for each tool, and you must start a new chat session after changing the system prompt.**
