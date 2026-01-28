# n8n Manual Tool Routing Solution

**Since AI Agent automatic tool calling isn't working, use manual routing with Code node**

---

## 🎯 Solution: Pre-Process Messages Before AI Agent

Instead of relying on AI Agent to call tools, we'll:
1. Detect what the user wants using a Code node
2. Call the appropriate API endpoint
3. Pass results to AI Agent for natural response

---

## 📊 New Workflow Structure

```
When chat message received
  ↓
Code Node: Detect Intent & Extract Data
  ↓
Switch Node: Route based on intent
  ↓
├─ Has Email? → HTTP Request: lookup-client
├─ Has Name? → HTTP Request: create-lead  
├─ Has Date? → HTTP Request: check-availability
└─ Has Time? → HTTP Request: book-appointment
  ↓
AI Agent: Generate natural response with context
  ↓
Return to chat
```

---

## 🔧 Implementation

### **Step 1: Create Code Node (After "When chat message received")**

**Node Name:** `Extract Intent and Data`

**Code:**

```javascript
// Get user message
const message = $input.first().json.chatInput || $input.first().json.message || '';
const messageLower = message.toLowerCase();

// Extract email
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const emailMatch = message.match(emailRegex);

// Extract date patterns
const dateRegex = /\d{4}-\d{2}-\d{2}/;
const dateMatch = message.match(dateRegex);

// Extract time patterns
const timeRegex = /(\d{1,2})\s*(am|pm)/i;
const timeMatch = message.match(timeRegex);

// Detect name pattern (after "my name is" or "i'm" or "i am")
const nameRegex = /(?:my name is|i'm|i am)\s+([a-z\s]+)/i;
const nameMatch = message.match(nameRegex);

// Determine intent
let intent = 'chat';
let extractedData = {};

if (emailMatch) {
  intent = 'lookup_client';
  extractedData.email = emailMatch[0].toLowerCase();
} else if (nameMatch) {
  intent = 'create_lead';
  extractedData.name = nameMatch[1].trim();
} else if (messageLower.includes('tomorrow') || dateMatch) {
  intent = 'check_availability';
  // Calculate tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  extractedData.date = dateMatch ? dateMatch[0] : tomorrow.toISOString().split('T')[0];
} else if (timeMatch) {
  intent = 'book_appointment';
  let hour = parseInt(timeMatch[1]);
  if (timeMatch[2].toLowerCase() === 'pm' && hour !== 12) hour += 12;
  if (timeMatch[2].toLowerCase() === 'am' && hour === 12) hour = 0;
  extractedData.startTime = `${hour.toString().padStart(2, '0')}:00`;
  extractedData.endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
}

return {
  json: {
    intent: intent,
    originalMessage: message,
    extractedData: extractedData,
    chatInput: message
  }
};
```

---

### **Step 2: Add Switch Node**

**Node Name:** `Route by Intent`

**Mode:** Rules

**Rules:**
1. `{{ $json.intent }}` equals `lookup_client` → Output 1
2. `{{ $json.intent }}` equals `create_lead` → Output 2
3. `{{ $json.intent }}` equals `check_availability` → Output 3
4. `{{ $json.intent }}` equals `book_appointment` → Output 4
5. Otherwise → Output 5 (direct to AI Agent)

---

### **Step 3: Add HTTP Request Nodes**

**Node 1: Lookup Client (Connect to Switch Output 1)**

**Name:** `Call Lookup Client API`

**Settings:**
- Method: `POST`
- URL: `https://healthy-mustang-liked.ngrok-free.app/api/booking/lookup-client`
- Send Body: `ON`
- Body Content Type: `JSON`
- JSON:
```json
{
  "email": "={{ $json.extractedData.email }}"
}
```

---

**Node 2: Create Lead (Connect to Switch Output 2)**

**Name:** `Call Create Lead API`

**Settings:**
- Method: `POST`
- URL: `https://healthy-mustang-liked.ngrok-free.app/api/booking/create-lead`
- Send Body: `ON`
- Body Content Type: `JSON`
- JSON:
```json
{
  "name": "={{ $json.extractedData.name }}",
  "email": "={{ $('Extract Intent and Data').item.json.extractedData.email }}",
  "source": "chatbot"
}
```

---

**Node 3: Check Availability (Connect to Switch Output 3)**

**Name:** `Call Check Availability API`

**Settings:**
- Method: `POST`
- URL: `https://healthy-mustang-liked.ngrok-free.app/api/booking/check-availability`
- Send Body: `ON`
- Body Content Type: `JSON`
- JSON:
```json
{
  "date": "={{ $json.extractedData.date }}",
  "duration": 60
}
```

---

**Node 4: Book Appointment (Connect to Switch Output 4)**

**Name:** `Call Book Appointment API`

**Settings:**
- Method: `POST`
- URL: `https://healthy-mustang-liked.ngrok-free.app/api/booking/book-appointment`
- Send Body: `ON`
- Body Content Type: `JSON`
- JSON:
```json
{
  "contactId": "={{ $('Call Lookup Client API').item.json.contactId }}",
  "date": "={{ $json.extractedData.date }}",
  "startTime": "={{ $json.extractedData.startTime }}",
  "endTime": "={{ $json.extractedData.endTime }}",
  "appointmentType": "consultation"
}
```

---

### **Step 4: Merge Results and Format for AI**

**Node Name:** `Format Context for AI`

**Code:**

```javascript
const intent = $input.first().json.intent;
const originalMessage = $input.first().json.originalMessage;

let context = '';
let apiResult = null;

// Check if we have API results
if ($input.first().json.found !== undefined) {
  // lookup_client result
  apiResult = $input.first().json;
  if (apiResult.found) {
    context = `Client found: ${apiResult.client.name} (${apiResult.client.email}). They have ${apiResult.recentAppointments?.length || 0} recent appointments.`;
  } else {
    context = `Client not found with email. Ask for their name to create a new profile.`;
  }
} else if ($input.first().json.success !== undefined) {
  // create_lead or book_appointment result
  apiResult = $input.first().json;
  context = `Operation successful: ${apiResult.message || 'Completed'}`;
} else if ($input.first().json.available !== undefined) {
  // check_availability result
  apiResult = $input.first().json;
  const slots = apiResult.slots || [];
  context = `Available time slots: ${slots.map(s => s.startTime).join(', ')}`;
}

return {
  json: {
    chatInput: originalMessage,
    systemContext: context,
    apiResult: apiResult
  }
};
```

---

### **Step 5: Update AI Agent**

**System Message:**

```
You are a booking assistant. You will receive context about API operations that have been performed.

Your job is to:
1. Read the systemContext provided
2. Generate a natural, friendly response based on that context
3. Guide the user to the next step

Examples:

Context: "Client found: John Smith (john@example.com)"
Response: "Hi John! Great to see you again. What date would you like to book?"

Context: "Client not found. Ask for their name."
Response: "I don't see you in our system yet. What's your name so I can create your profile?"

Context: "Available time slots: 09:00, 14:00, 16:00"
Response: "I have these times available: 9 AM, 2 PM, and 4 PM. Which works best for you?"

Context: "Operation successful: Appointment booked"
Response: "Perfect! Your appointment is confirmed. You'll receive a confirmation email shortly."

Be conversational and helpful. Use the context to inform your response.
```

**Prompt (User Message):**

```
Context: {{ $json.systemContext }}
User said: {{ $json.chatInput }}
```

---

## 🧪 Testing

**Test 1: Email Lookup**
- Input: `shangwey@yahoo.com`
- Expected: Code node detects email → Calls lookup-client → AI responds with result

**Test 2: Create Lead**
- Input: `my name is Shang Wey`
- Expected: Code node detects name → Calls create-lead → AI confirms creation

**Test 3: Check Availability**
- Input: `tomorrow at 10am`
- Expected: Code node detects date → Calls check-availability → AI shows times

---

## ✅ Why This Works

**Problem:** AI Agent not calling tools automatically

**Solution:** Manual routing with deterministic logic
- Code node uses regex to detect intent
- Switch node routes to correct API
- AI Agent only generates natural language response

**Benefits:**
- Reliable and predictable
- No dependency on AI tool calling
- Full control over when APIs are called
- Works with any AI model

---

## 📋 Summary

This approach bypasses the AI Agent's tool calling entirely and uses:
1. **Code node** for intent detection
2. **Switch node** for routing
3. **HTTP Request nodes** for API calls
4. **AI Agent** only for natural language generation

This is more reliable than relying on the AI to decide when to call tools.
