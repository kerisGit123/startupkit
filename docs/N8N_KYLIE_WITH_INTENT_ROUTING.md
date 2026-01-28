# Kylie AI with Intent-Based Tool Routing

**Hybrid approach: Combines Kylie's personality with manual intent detection**

---

## 🎯 Architecture

```
When chat message received
  ↓
Code Node: Extract Intent & Data
  ↓
Edit Fields: Add intent context to message
  ↓
AI Agent (Kylie): Responds based on intent context
  ↓
Switch: Route based on Kylie's response or intent
  ↓
HTTP Request: Call appropriate booking API
  ↓
Return result to chat
```

---

## 📋 Implementation

### **Step 1: Code Node - Extract Intent**

**Node Name:** `Extract Intent and Context`

**Position:** Right after "When chat message received"

**Code:**

```javascript
// Get user message
const message = $input.first().json.chatInput || $input.first().json.message || '';
const messageLower = message.toLowerCase();

// Extract email
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const emailMatch = message.match(emailRegex);

// Extract name pattern
const nameRegex = /(?:my name is|i'm|i am)\s+([a-z\s]+)/i;
const nameMatch = message.match(nameRegex);

// Extract date/time patterns
const tomorrowMatch = messageLower.includes('tomorrow');
const todayMatch = messageLower.includes('today');
const dateRegex = /\d{4}-\d{2}-\d{2}/;
const dateMatch = message.match(dateRegex);
const timeRegex = /(\d{1,2})\s*(am|pm)/i;
const timeMatch = message.match(timeRegex);

// Determine intent and build context
let intent = 'general_chat';
let contextMessage = '';
let extractedData = {};

if (emailMatch) {
  intent = 'has_email';
  extractedData.email = emailMatch[0].toLowerCase();
  contextMessage = `[INTENT: User provided email: ${extractedData.email}. You should say "Let me check on that real quick" then use lookup_client tool]`;
} else if (nameMatch && $('Extract Intent and Context').item?.json?.extractedData?.email) {
  intent = 'has_name_for_new_client';
  extractedData.name = nameMatch[1].trim().toLowerCase();
  extractedData.email = $('Extract Intent and Context').item.json.extractedData.email;
  contextMessage = `[INTENT: User provided name: ${extractedData.name}. You should say "Give me a second to send that in" then use create_lead tool with name and email]`;
} else if (tomorrowMatch || todayMatch || dateMatch) {
  intent = 'checking_availability';
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  extractedData.date = dateMatch ? dateMatch[0] : tomorrow.toISOString().split('T')[0];
  contextMessage = `[INTENT: User wants to check availability for ${tomorrowMatch ? 'tomorrow' : 'a date'}. You should say "Let me check on that real quick" then use check_availability tool]`;
} else if (timeMatch) {
  intent = 'booking_time_confirmed';
  let hour = parseInt(timeMatch[1]);
  if (timeMatch[2].toLowerCase() === 'pm' && hour !== 12) hour += 12;
  if (timeMatch[2].toLowerCase() === 'am' && hour === 12) hour = 0;
  extractedData.startTime = `${hour.toString().padStart(2, '0')}:00`;
  extractedData.endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
  contextMessage = `[INTENT: User confirmed time ${timeMatch[0]}. You should say "Let me process that for you" then use book_appointment tool]`;
}

return {
  json: {
    intent: intent,
    originalMessage: message,
    contextMessage: contextMessage,
    extractedData: extractedData,
    chatInput: message
  }
};
```

---

### **Step 2: Edit Fields Node**

**Node Name:** `Add Context to Message`

**Position:** After Code Node, before AI Agent

**Operation:** Set

**Fields:**
- **Name:** `chatInput`
- **Value:** `{{ $json.contextMessage }}\n\nUser: {{ $json.originalMessage }}`

This prepends the intent context to the user's message so Kylie knows what to do.

---

### **Step 3: AI Agent - Kylie System Prompt**

**Updated System Message:**

```
[Identity]
You are Kylie, the upbeat and friendly AI receptionist for Hercules Detailing, who communicates casually and keeps the interaction lighthearted and engaging.

[Style]
- Use a casual, friendly, and upbeat tone throughout the conversation.
- Maintain warmth and friendliness, making interactions feel open and engaging.
- Talk to clients as if you are having a friendly chat, avoiding overly professional language.
- Speak in a fast-paced manner, minimizing pauses between words to keep the interaction lively. Never let there be silence in the conversation.

[Response Guidelines]
- Start conversations with a cheerful greeting and ask for the email address for CRM lookup.
- Confirm details and intentions clearly before proceeding, infusing a casual and friendly touch into interactions.
- Ensure emails and names sent to the CRM are converted to lowercase.
- **BEFORE CALLING ANY TOOL, YOU MUST SAY SOMETHING LIKE "JUST GIVE ME A SEC" OR "I'M CHECKING ON THAT" TO PREVENT SILENCES AND KEEP THE CONVERSATION LIVELY.**

[CRITICAL: Intent-Based Actions]
You will receive messages with [INTENT: ...] markers that tell you what action to take. Follow these instructions exactly:

1. **[INTENT: User provided email]**
   - Say: "Let me check on that real quick"
   - Then respond with: USE_TOOL:lookup_client
   - The system will automatically call the tool

2. **[INTENT: User provided name]**
   - Say: "Give me a second to send that in"
   - Then respond with: USE_TOOL:create_lead
   - The system will automatically call the tool

3. **[INTENT: User wants to check availability]**
   - Say: "Let me check on that real quick"
   - Then respond with: USE_TOOL:check_availability
   - The system will automatically call the tool

4. **[INTENT: User confirmed time]**
   - Say: "Let me process that for you"
   - Then respond with: USE_TOOL:book_appointment
   - The system will automatically call the tool

5. **[INTENT: User has a question]**
   - Say: "Let me look that up for you"
   - Then respond with: USE_TOOL:search_knowledge
   - The system will search the knowledge base and return relevant articles
   - When you receive [RESULT: Knowledge base content...], answer the user's question based on the content in a friendly, conversational way
   - If no content found, say: "Hmm, I don't have specific info on that, but let me connect you with someone who can help!"

[Task & Goals]
1. **Initial Greeting & Email Collection**
   - Greet the caller warmly and ask for their email to look up their profile.
   - Example: "Hey there! Thanks for calling Hercules Detailing. This is Kylie. How can I help you today? Could I please have the email address associated with your account?"
   - When you see [INTENT: User provided email], follow the intent action above.

2. **CRM Lookup Logic**
   - When lookup_client returns results, acknowledge using their name if found.
   - If client is new, collect name and phone number.
   - When you see [INTENT: User provided name], follow the intent action above.

3. **Appointment Management**
   - For booking, when you see [INTENT: User wants to check availability], follow the intent action.
   - After availability is confirmed and user picks a time, when you see [INTENT: User confirmed time], follow the intent action.
   - Appointments last one hour. Extract whether it's interior or exterior detailing.

4. **Knowledge Base Queries**
   - When users ask questions about policies, procedures, or general information, use the knowledge base.
   - Provide answers in a friendly, conversational manner based on the article content.
   - Don't just read the article verbatim - make it sound natural and helpful.

5. **End Goal Fulfillment**
   - Aim to fulfill requests efficiently while maintaining a cheerful tone.

[Error Handling/Fallback]
- If a client's input is unclear, ask clarifying questions with a reassuring tone.
- For technical issues, inform the client politely and suggest alternatives.

[Important Information]
- Today's date and time is: {{ "now" | date: "dd/MM/yyyy HH:mm:ss", "Asia/Kuala_Lumpur" }}.
```

---

### **Step 4: Code Node - Detect Tool Calls**

**Node Name:** `Check for Tool Call`

**Position:** After AI Agent

**Code:**

```javascript
const aiResponse = $input.first().json.output || $input.first().json.response || '';
const intent = $('Extract Intent and Context').item.json.intent;
const extractedData = $('Extract Intent and Context').item.json.extractedData;

// Check if AI wants to use a tool
if (aiResponse.includes('USE_TOOL:')) {
  const toolMatch = aiResponse.match(/USE_TOOL:(\w+)/);
  const toolName = toolMatch ? toolMatch[1] : null;
  
  return {
    json: {
      shouldCallTool: true,
      toolName: toolName,
      extractedData: extractedData,
      aiResponse: aiResponse.replace(/USE_TOOL:\w+/g, '').trim(),
      intent: intent
    }
  };
}

return {
  json: {
    shouldCallTool: false,
    aiResponse: aiResponse,
    intent: intent
  }
};
```

---

### **Step 5: Switch Node**

**Node Name:** `Route to Tool or Response`

**Mode:** Rules

**Rules:**
1. `{{ $json.shouldCallTool }}` equals `true` AND `{{ $json.toolName }}` equals `lookup_client` → Output 1
2. `{{ $json.shouldCallTool }}` equals `true` AND `{{ $json.toolName }}` equals `create_lead` → Output 2
3. `{{ $json.shouldCallTool }}` equals `true` AND `{{ $json.toolName }}` equals `check_availability` → Output 3
4. `{{ $json.shouldCallTool }}` equals `true` AND `{{ $json.toolName }}` equals `book_appointment` → Output 4
5. Otherwise → Output 5 (Return AI response directly)

---

### **Step 6: HTTP Request Nodes**

**Node 1: Lookup Client (Output 1)**

```json
{
  "method": "POST",
  "url": "https://healthy-mustang-liked.ngrok-free.app/api/booking/lookup-client",
  "body": {
    "email": "={{ $json.extractedData.email }}"
  }
}
```

**Node 2: Create Lead (Output 2)**

```json
{
  "method": "POST",
  "url": "https://healthy-mustang-liked.ngrok-free.app/api/booking/create-lead",
  "body": {
    "name": "={{ $json.extractedData.name }}",
    "email": "={{ $json.extractedData.email }}",
    "source": "chatbot"
  }
}
```

**Node 3: Check Availability (Output 3)**

```json
{
  "method": "POST",
  "url": "https://healthy-mustang-liked.ngrok-free.app/api/booking/check-availability",
  "body": {
    "date": "={{ $json.extractedData.date }}",
    "duration": 60
  }
}
```

**Node 4: Book Appointment (Output 4)**

```json
{
  "method": "POST",
  "url": "https://healthy-mustang-liked.ngrok-free.app/api/booking/book-appointment",
  "body": {
    "contactId": "={{ $('Lookup Client').item.json.client.id }}",
    "date": "={{ $json.extractedData.date }}",
    "startTime": "={{ $json.extractedData.startTime }}",
    "endTime": "={{ $json.extractedData.endTime }}",
    "appointmentType": "consultation"
  }
}
```

---

### **Step 7: Merge Results**

**Node Name:** `Format Final Response`

**Code:**

```javascript
const aiResponse = $input.first().json.aiResponse || $input.first().json.output || '';
const toolResult = $input.first().json;

// If we have tool results, format them for the next AI response
if (toolResult.found !== undefined) {
  // lookup_client result
  if (toolResult.found) {
    return {
      json: {
        output: `${aiResponse}\n\n[RESULT: Client found - ${toolResult.client.name}]`
      }
    };
  } else {
    return {
      json: {
        output: `${aiResponse}\n\n[RESULT: New client - please collect name and phone]`
      }
    };
  }
} else if (toolResult.success !== undefined) {
  // create_lead or book_appointment result
  return {
    json: {
      output: `${aiResponse}\n\n[RESULT: ${toolResult.message}]`
    }
  };
} else if (toolResult.available !== undefined) {
  // check_availability result
  const slots = toolResult.slots || [];
  return {
    json: {
      output: `${aiResponse}\n\n[RESULT: Available times - ${slots.map(s => s.startTime).join(', ')}]`
    }
  };
}

// No tool result, just return AI response
return {
  json: {
    output: aiResponse
  }
};
```

---

## 🧪 Test Flow

**Test 1: Email Lookup**
```
User: "shangwey@yahoo.com"
Code Node: Detects email, adds [INTENT: User provided email]
AI Agent (Kylie): "Let me check on that real quick" + USE_TOOL:lookup_client
Check Tool Call: Detects USE_TOOL:lookup_client
Switch: Routes to lookup-client API
API: Returns client data
Format Response: Adds result to context
Return: "Let me check on that real quick. [Found client John Smith]"
```

**Test 2: New Client**
```
User: "my name is John Smith"
Code Node: Detects name, adds [INTENT: User provided name]
AI Agent (Kylie): "Give me a second to send that in" + USE_TOOL:create_lead
Check Tool Call: Detects USE_TOOL:create_lead
Switch: Routes to create-lead API
API: Creates client
Return: "Give me a second to send that in. All set! What date works for you?"
```

---

## ✅ Benefits

1. **Maintains Kylie's Personality** - All responses go through AI Agent
2. **Reliable Tool Calling** - Code node detects intent, not AI
3. **Pre-Tool Acknowledgments** - Kylie always says something before tools are called
4. **Lowercase Enforcement** - Code node converts emails/names to lowercase
5. **No Silent Pauses** - Kylie responds immediately, tools called in background

---

## 📋 Summary

This hybrid approach:
- Uses **Code node** for reliable intent detection
- Uses **AI Agent (Kylie)** for personality and conversation flow
- Uses **USE_TOOL markers** to trigger API calls
- Maintains all of Kylie's conversational style and pre-tool acknowledgments
- Works reliably without depending on AI Agent's broken tool calling

The key: Intent detection happens in code, but Kylie still controls the conversation flow and maintains her personality.

---

## 📚 Knowledge Base Integration

### **Overview**

Two separate knowledge base endpoints are available for n8n:

1. **Frontend Knowledge Base Only** - For public-facing chatbot (frontend users)
2. **Combined Knowledge Base** - For authenticated users (frontend + user panel articles)

---

### **Endpoint 1: Frontend Knowledge Base Only**

**Use Case:** Public chatbot on the website (unauthenticated users)

**Endpoint:**
```
POST https://healthy-mustang-liked.ngrok-free.app/api/booking/search-knowledge-frontend
```

**Request Schema:**
```json
{
  "query": "string (required)"
}
```

**Request Example:**
```json
{
  "query": "refund policy"
}
```

**Response Schema:**
```json
{
  "success": boolean,
  "content": "string (concatenated articles)",
  "count": number,
  "source": "frontend"
}
```

**Response Example:**
```json
{
  "success": true,
  "content": "Article 1: Refund Credit\npay me back wait for 3 days transfer\nCategory: Refund Credit\nTags: Refund Credit, #Refund Credit",
  "count": 1,
  "source": "frontend"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Query parameter is required",
  "results": [],
  "count": 0
}
```

---

### **Endpoint 2: Combined Knowledge Base (Frontend + User Panel)**

**Use Case:** Authenticated chatbot in user panel (logged-in users)

**Endpoint:**
```
POST https://healthy-mustang-liked.ngrok-free.app/api/booking/search-knowledge-combined
```

**Request Schema:**
```json
{
  "query": "string (required)"
}
```

**Request Example:**
```json
{
  "query": "appointment booking"
}
```

**Response Schema:**
```json
{
  "success": boolean,
  "content": "string (concatenated articles)",
  "count": number,
  "source": "combined",
  "breakdown": {
    "frontend": number,
    "user_panel": number
  }
}
```

**Response Example:**
```json
{
  "success": true,
  "content": "Article 1: How to Book an Appointment\nSource: frontend\nTo book an appointment, provide your email and preferred date...\nCategory: Booking\nTags: appointment, booking\n\n---\n\nArticle 2: Managing Your Appointments\nSource: user_panel\nIn your user panel, you can view and manage all appointments...\nCategory: User Panel\nTags: appointments, dashboard",
  "count": 2,
  "source": "combined",
  "breakdown": {
    "frontend": 1,
    "user_panel": 1
  }
}
```

---

### **N8N Integration Steps**

#### **Step 1: Add Knowledge Base Intent Detection**

Update the **Extract Intent and Context** code node to detect knowledge base queries:

```javascript
// Add this to the intent detection logic
const knowledgeKeywords = ['how', 'what', 'when', 'where', 'why', 'refund', 'policy', 'help', 'question'];
const hasKnowledgeKeyword = knowledgeKeywords.some(keyword => messageLower.includes(keyword));

if (hasKnowledgeKeyword && intent === 'general_chat') {
  intent = 'knowledge_base_query';
  extractedData.query = message;
  contextMessage = `[INTENT: User has a question. Search knowledge base and provide answer based on results]`;
}
```

#### **Step 2: Update Kylie's System Prompt**

Add knowledge base handling to the system message:

```
5. **[INTENT: User has a question]**
   - Say: "Let me look that up for you"
   - Then respond with: USE_TOOL:search_knowledge
   - The system will search the knowledge base and return relevant articles
   - After receiving results, provide a friendly answer based on the article content
```

#### **Step 3: Add Switch Route for Knowledge Base**

Add to the **Route to Tool or Response** switch node:

```
Rule 6: {{ $json.shouldCallTool }} equals true AND {{ $json.toolName }} equals search_knowledge → Output 6
```

#### **Step 4: HTTP Request Node for Knowledge Base**

**Node Name:** `Search Knowledge Base`

**For Frontend Chatbot:**
```json
{
  "method": "POST",
  "url": "https://healthy-mustang-liked.ngrok-free.app/api/booking/search-knowledge-frontend",
  "body": {
    "query": "={{ $json.extractedData.query }}"
  },
  "options": {
    "response": {
      "response": {
        "fullResponse": false,
        "neverError": false
      }
    }
  }
}
```

**For User Panel Chatbot:**
```json
{
  "method": "POST",
  "url": "https://healthy-mustang-liked.ngrok-free.app/api/booking/search-knowledge-combined",
  "body": {
    "query": "={{ $json.extractedData.query }}"
  },
  "options": {
    "response": {
      "response": {
        "fullResponse": false,
        "neverError": false
      }
    }
  }
}
```

#### **Step 5: Format Knowledge Base Results**

Update the **Format Final Response** code node to handle KB results:

```javascript
// Add this condition
if (toolResult.content !== undefined) {
  // Knowledge base search result
  if (toolResult.count > 0) {
    return {
      json: {
        output: `${aiResponse}\n\n[RESULT: Knowledge base content:\n${toolResult.content}]`
      }
    };
  } else {
    return {
      json: {
        output: `${aiResponse}\n\n[RESULT: No articles found for this query]`
      }
    };
  }
}
```

---

### **N8N AI Agent Tool Configuration**

To enable the AI Agent to automatically detect and use the knowledge base tool, you need to configure it in the AI Agent node.

#### **Tool Name:** `search_knowledge`

#### **Tool Description:**
```
Search the knowledge base for information about policies, procedures, FAQs, and general questions. Use this when the user asks "how", "what", "when", "where", "why" questions, or asks about refunds, policies, or needs help with something.
```

#### **Tool Schema (JSON):**
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "The user's question or search query to look up in the knowledge base"
    }
  },
  "required": ["query"]
}
```

#### **Complete Tool Configuration in N8N:**

**In your AI Agent node, add a new tool:**

1. **Tool Type:** HTTP Request
2. **Tool Name:** `search_knowledge`
3. **Description:** 
   ```
   Search the knowledge base for information about policies, procedures, FAQs, and general questions. Use this when the user asks "how", "what", "when", "where", "why" questions, or asks about refunds, policies, or needs help with something.
   ```

4. **Schema:**
   ```json
   {
     "type": "object",
     "properties": {
       "query": {
         "type": "string",
         "description": "The user's question or search query to look up in the knowledge base"
       }
     },
     "required": ["query"]
   }
   ```

5. **HTTP Request Configuration:**
   - **Method:** POST
   - **URL (Frontend):** `https://healthy-mustang-liked.ngrok-free.app/api/booking/search-knowledge-frontend`
   - **URL (Combined):** `https://healthy-mustang-liked.ngrok-free.app/api/booking/search-knowledge-combined`
   - **Body Type:** JSON
   - **Body:**
     ```json
     {
       "query": "={{ $json.query }}"
     }
     ```

6. **Response Handling:**
   - The tool will return a `content` field with concatenated article data
   - The AI Agent will automatically receive this content and use it to answer the user's question

#### **Alternative: Manual Tool Detection (Hybrid Approach)**

If you prefer the manual intent-based approach (more reliable), follow the steps in the previous sections where:
- Code node detects knowledge keywords
- Adds `[INTENT: User has a question]` marker
- AI responds with `USE_TOOL:search_knowledge`
- Switch node routes to HTTP Request
- Format response includes the knowledge base content

---

### **Updated System Prompt for Kylie (with Knowledge Base)**

```
[Identity]
You are Kylie, the upbeat and friendly AI receptionist for Hercules Detailing, who communicates casually and keeps the interaction lighthearted and engaging.

[Style]
- Use a casual, friendly, and upbeat tone throughout the conversation.
- Maintain warmth and friendliness, making interactions feel open and engaging.
- Talk to clients as if you are having a friendly chat, avoiding overly professional language.
- Speak in a fast-paced manner, minimizing pauses between words to keep the interaction lively. Never let there be silence in the conversation.

[Response Guidelines]
- Start conversations with a cheerful greeting and ask for the email address for CRM lookup.
- Confirm details and intentions clearly before proceeding, infusing a casual and friendly touch into interactions.
- Ensure emails and names sent to the CRM are converted to lowercase.
- **BEFORE CALLING ANY TOOL, YOU MUST SAY SOMETHING LIKE "JUST GIVE ME A SEC" OR "I'M CHECKING ON THAT" TO PREVENT SILENCES AND KEEP THE CONVERSATION LIVELY.**

[CRITICAL: Intent-Based Actions]
You will receive messages with [INTENT: ...] markers that tell you what action to take. Follow these instructions exactly:

1. **[INTENT: User provided email]**
   - Say: "Let me check on that real quick"
   - Then respond with: USE_TOOL:lookup_client
   - The system will automatically call the tool

2. **[INTENT: User provided name]**
   - Say: "Give me a second to send that in"
   - Then respond with: USE_TOOL:create_lead
   - The system will automatically call the tool

3. **[INTENT: User wants to check availability]**
   - Say: "Let me check on that real quick"
   - Then respond with: USE_TOOL:check_availability
   - The system will automatically call the tool

4. **[INTENT: User confirmed time]**
   - Say: "Let me process that for you"
   - Then respond with: USE_TOOL:book_appointment
   - The system will automatically call the tool

5. **[INTENT: User has a question]**
   - Say: "Let me look that up for you"
   - Then respond with: USE_TOOL:search_knowledge
   - The system will search the knowledge base and return relevant articles
   - When you receive [RESULT: Found X articles...], answer the user's question based on the article content in a friendly, conversational way
   - If no articles found, say: "Hmm, I don't have specific info on that, but let me connect you with someone who can help!"

[Task & Goals]
1. **Initial Greeting & Email Collection**
   - Greet the caller warmly and ask for their email to look up their profile.
   - Example: "Hey there! Thanks for calling Hercules Detailing. This is Kylie. How can I help you today? Could I please have the email address associated with your account?"
   - When you see [INTENT: User provided email], follow the intent action above.

2. **CRM Lookup Logic**
   - When lookup_client returns results, acknowledge using their name if found.
   - If client is new, collect name and phone number.
   - When you see [INTENT: User provided name], follow the intent action above.

3. **Appointment Management**
   - For booking, when you see [INTENT: User wants to check availability], follow the intent action.
   - After availability is confirmed and user picks a time, when you see [INTENT: User confirmed time], follow the intent action.
   - Appointments last one hour. Extract whether it's interior or exterior detailing.

4. **Knowledge Base Queries**
   - When users ask questions about policies, procedures, or general information, use the knowledge base.
   - Provide answers in a friendly, conversational manner based on the article content.
   - Don't just read the article verbatim - make it sound natural and helpful.

5. **End Goal Fulfillment**
   - Aim to fulfill requests efficiently while maintaining a cheerful tone.

[Error Handling/Fallback]
- If a client's input is unclear, ask clarifying questions with a reassuring tone.
- For technical issues, inform the client politely and suggest alternatives.

[Important Information]
- Today's date and time is: {{ "now" | date: "dd/MM/yyyy HH:mm:ss", "Asia/Kuala_Lumpur" }}.
```

---

### **Testing Knowledge Base Integration**

**Test 1: Frontend KB Query**
```
User: "What's your refund policy?"
Code Node: Detects knowledge keywords, adds [INTENT: User has a question]
AI Agent (Kylie): "Let me look that up for you" + USE_TOOL:search_knowledge
HTTP Request: Calls /api/booking/search-knowledge-frontend
API Response: Returns refund policy article
Kylie: "Let me look that up for you. So our refund policy is pretty straightforward - we'll pay you back, just give it about 3 days for the transfer to go through. Does that help?"
```

**Test 2: Combined KB Query (User Panel)**
```
User: "How do I manage my appointments?"
Code Node: Detects knowledge keywords, adds [INTENT: User has a question]
AI Agent (Kylie): "Let me look that up for you" + USE_TOOL:search_knowledge
HTTP Request: Calls /api/booking/search-knowledge-combined
API Response: Returns articles from both frontend and user_panel
Kylie: "Let me look that up for you. In your user panel, you can view and manage all your appointments - reschedule, cancel, or book new ones. It's all right there in your dashboard. Want me to walk you through it?"
```

---

### **Key Differences Between Endpoints**

| Feature | Frontend Only | Combined |
|---------|--------------|----------|
| **Endpoint** | `/search-knowledge-frontend` | `/search-knowledge-combined` |
| **Use Case** | Public website chatbot | User panel chatbot |
| **Sources** | Frontend KB only | Frontend + User Panel KB |
| **Max Results** | 3 articles | 5 articles |
| **Response Includes** | Basic article data | Article data + source type |
| **Breakdown** | No | Yes (shows count per source) |

---

## 🔧 Troubleshooting

### **Error: 404 - Resource Not Found**

**Problem:** Getting 404 error when calling knowledge base endpoint from n8n.

**Cause:** The JSON schema is being appended to the URL as query parameters.

**Wrong Configuration:**
```
URL: https://healthy-mustang-liked.ngrok-free.app/api/booking/search-knowledge-combined?type=object&properties[query][type]=string...
```

**Correct Configuration:**

1. **In n8n HTTP Request Node:**
   - **Method:** POST
   - **URL:** `https://healthy-mustang-liked.ngrok-free.app/api/booking/search-knowledge-combined`
   - **Body Content Type:** JSON
   - **Specify Body:** Using Fields Below
   - **Body Parameters:**
     - Name: `query`
     - Value: `={{ $json.extractedData.query }}` (for manual approach) or `={{ $json.query }}` (for AI Agent tool)

2. **Do NOT include the schema in the URL** - The schema is only for the AI Agent tool configuration, not the HTTP request URL.

### **Error: Empty or No Response**

**Problem:** Request succeeds but returns empty content.

**Solution:** Check that:
1. You have published articles in the knowledge base (status = "published")
2. The article type matches the endpoint (frontend vs user_panel)
3. The query string is not empty

### **Error: Cannot Read Property 'content'**

**Problem:** Format response node fails to read content.

**Solution:** Update your Format Final Response code to check for the `content` field:

```javascript
if (toolResult.content !== undefined) {
  // Knowledge base search result
  if (toolResult.count > 0) {
    return {
      json: {
        output: `${aiResponse}\n\n[RESULT: Knowledge base content:\n${toolResult.content}]`
      }
    };
  }
}
```

### **Testing the Endpoint Directly**

You can test the endpoint using curl or Postman:

```bash
curl -X POST https://healthy-mustang-liked.ngrok-free.app/api/booking/search-knowledge-frontend \
  -H "Content-Type: application/json" \
  -d '{"query": "refund policy"}'
```

Expected response:
```json
{
  "success": true,
  "content": "Article 1: Refund Credit\npay me back wait for 3 days transfer\nCategory: Refund Credit\nTags: Refund Credit, #Refund Credit",
  "count": 1,
  "source": "frontend"
}
```

---
