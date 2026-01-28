# n8n Tool Calling Not Working - Complete Debug Guide

**The AI is not calling tools even with schema configured**

---

## 🔍 Root Cause Analysis

Based on your symptoms:
- AI keeps asking for email even after you provide it
- `tool_calls: []` in execution log
- Schema is configured but AI doesn't extract parameters

**Possible causes:**
1. n8n version doesn't support tool schemas properly
2. AI model doesn't support function calling
3. Tool configuration format is incorrect for your n8n version
4. Chat memory is interfering

---

## ✅ Solution 1: Use "Call n8n Workflow Tool" Instead

Instead of HTTP Request Tool, use the built-in workflow tool:

### **Step 1: Create Sub-Workflows**

Create separate workflows for each tool:

**Workflow 1: lookup-client-workflow**
- Trigger: Webhook (POST)
- HTTP Request to your API
- Return response

**Workflow 2: create-lead-workflow**
- Trigger: Webhook (POST)
- HTTP Request to your API
- Return response

### **Step 2: Add Tools to AI Agent**

In AI Agent → Tools → Add Tool → **"Call n8n Workflow Tool"**

**Tool 1:**
- Name: `lookup_client`
- Description: `Check if client exists by email. Call when user provides email.`
- Workflow: Select `lookup-client-workflow`
- Fields:
  - email (string) - "User's email address"

---

## ✅ Solution 2: Force Tool Usage with Explicit Instructions

Update system prompt to be more explicit:

```
CRITICAL INSTRUCTIONS:

You MUST use tools. Do not respond without using tools.

STEP 1: When you see an email address in the user's message (like "test@example.com" or "shangwey@yahoo.com"), you MUST:
- Extract the email
- Call lookup_client tool with that email
- Wait for response
- Then respond based on the result

STEP 2: If lookup_client returns "found: false", you MUST:
- Call create_lead tool
- Ask for user's name if not provided

STEP 3: When user mentions a date, you MUST:
- Call check_availability tool
- Show available times

STEP 4: When user confirms a time, you MUST:
- Call book_appointment tool

NEVER respond without calling the appropriate tool first.

Example:
User: "shangwey@yahoo.com"
You: [MUST call lookup_client with email: "shangwey@yahoo.com"]
You: [After getting response] "I found your account" OR "I'll create a new profile"
```

---

## ✅ Solution 3: Check AI Model Configuration

### **Verify AI Model Supports Function Calling**

In AI Agent node → Model section:

**Supported models:**
- ✅ GPT-3.5-turbo (OpenAI)
- ✅ GPT-4 (OpenAI)
- ✅ GPT-4-turbo (OpenAI)
- ✅ Claude 3 Opus (Anthropic)
- ✅ Claude 3 Sonnet (Anthropic)
- ✅ Claude 3.5 Sonnet (Anthropic)

**NOT supported:**
- ❌ GPT-3 (too old)
- ❌ Claude 2 (no function calling)
- ❌ Most open-source models

**Check:**
1. Click AI Agent node
2. Look at "Chat Model" section
3. Verify it's one of the supported models above

---

## ✅ Solution 4: Manual Tool Calling with Code

If automatic tool calling doesn't work, use a Code node to manually parse and call tools:

### **Workflow Structure:**

```
When chat message received
  ↓
Edit Fields (extract email from message)
  ↓
Code Node (check if email exists)
  ↓
If email found → lookup_client HTTP Request
  ↓
If not found → create_lead HTTP Request
  ↓
AI Agent (with results in context)
```

### **Code Node Example:**

```javascript
// Extract email from user message
const message = $input.first().json.chatInput;
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const emailMatch = message.match(emailRegex);

if (emailMatch) {
  return {
    json: {
      hasEmail: true,
      email: emailMatch[0],
      action: 'lookup_client'
    }
  };
}

// Check for date mentions
if (message.includes('tomorrow') || message.match(/\d{4}-\d{2}-\d{2}/)) {
  return {
    json: {
      hasDate: true,
      action: 'check_availability'
    }
  };
}

return {
  json: {
    hasEmail: false,
    action: 'ask_for_email'
  }
};
```

---

## ✅ Solution 5: Use OpenAI Assistant API Directly

If n8n's AI Agent doesn't support tools properly, use OpenAI's API directly:

### **Workflow:**

```
When chat message received
  ↓
HTTP Request to OpenAI API
  - Use Assistant with function calling
  - Define tools in OpenAI format
  ↓
Parse function calls from response
  ↓
Execute corresponding HTTP requests
  ↓
Return results to chat
```

### **OpenAI API Format:**

```json
{
  "model": "gpt-4-turbo",
  "messages": [...],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "lookup_client",
        "description": "Check if client exists",
        "parameters": {
          "type": "object",
          "properties": {
            "email": {
              "type": "string",
              "description": "Email address"
            }
          },
          "required": ["email"]
        }
      }
    }
  ]
}
```

---

## 🔧 Immediate Action Steps

**Try these in order:**

1. **Check AI Model**
   - Open AI Agent node
   - Verify using GPT-3.5-turbo or GPT-4
   - If using older model, upgrade

2. **Clear Chat History**
   - Start completely new chat session
   - Or restart n8n workflow

3. **Simplify System Prompt**
   - Use the explicit instruction version above
   - Remove all other text

4. **Test with Direct Tool Call**
   - In n8n, manually execute the lookup_client node
   - Verify it returns correct response
   - This confirms the API endpoint works

5. **Check n8n Version**
   - Go to Settings → About
   - If version < 1.0, tool calling might not be supported
   - Update to latest version

---

## 📊 Diagnostic Checklist

Run through this checklist:

- [ ] AI Model is GPT-3.5-turbo or better
- [ ] Schema is valid JSON (no syntax errors)
- [ ] Tools are listed in AI Agent Tools section
- [ ] Started new chat session after changes
- [ ] HTTP Request nodes work when executed manually
- [ ] n8n version is 1.0 or higher
- [ ] OpenAI API key is valid and has credits

---

## 🚨 If Nothing Works

**Alternative: Skip AI Agent, Use Simple Logic**

Create a workflow with simple IF conditions:

```
When chat message received
  ↓
IF message contains "@" (email)
  → Call lookup_client
  → Store result
  ↓
ELSE IF message contains "tomorrow" or date
  → Call check_availability
  → Show times
  ↓
ELSE IF message contains time (10am, 2pm, etc)
  → Call book_appointment
  → Confirm booking
  ↓
ELSE
  → Ask clarifying question
```

This bypasses AI Agent entirely and uses deterministic logic.

---

## 📞 Next Steps

1. **Check your n8n version** - Settings → About
2. **Verify AI model** - Must be GPT-3.5-turbo or GPT-4
3. **Try Solution 2** - Use explicit instruction prompt
4. **If still failing** - Use Solution 4 (manual parsing with Code node)

The tools and API endpoints are working correctly. The issue is the AI Agent not recognizing when to call them.
