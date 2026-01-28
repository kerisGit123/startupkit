# n8n Chatbot Workflow Setup Guide

**Problem:** n8n webhook returning 500 error - "Error in workflow"

This means your n8n workflow has a configuration issue. Follow this guide to fix it.

---

## 🔍 Common Causes of 500 Error

1. **AI Agent node not configured properly**
2. **Missing required fields in webhook data**
3. **AI model credentials not set**
4. **Incorrect prompt template**
5. **Response format mismatch**

---

## ✅ Step-by-Step Fix

### **Step 1: Check n8n Workflow Execution**

1. Go to your n8n instance
2. Open the chatbot workflow
3. Click **"Executions"** tab (left sidebar)
4. Find the failed execution (red X)
5. Click on it to see the error details

**Look for:**
- Which node failed (red highlight)
- Error message in the node
- Missing credentials warning

---

### **Step 2: Fix Webhook Trigger Node**

**Your webhook should accept:**
```json
{
  "chatId": "session_id_here",
  "message": "user message here",
  "route": "general"
}
```

**Configuration:**
1. **Webhook Trigger Node:**
   - Method: `POST`
   - Path: `/chat` (or your custom path)
   - Response Mode: `Respond to Webhook`
   - Response Data: `First Entry JSON`

2. **Test the webhook receives data:**
   - Add a **Set** node after webhook
   - Map the fields:
     ```
     chatInput = {{ $json.message }}
     sessionId = {{ $json.chatId }}
     route = {{ $json.route }}
     ```

---

### **Step 3: Fix AI Agent Node**

This is the most common issue. Your AI Agent must be configured correctly.

**Required Configuration:**

1. **AI Agent Node Settings:**
   - **Model:** Select your AI model (OpenAI, Anthropic, etc.)
   - **Credentials:** Must be set and valid
   - **Prompt:** Must reference the input correctly

2. **Correct Prompt Template:**
   ```
   You are a helpful customer support assistant.
   
   User message: {{ $json.chatInput }}
   
   Respond helpfully and professionally.
   ```

   **IMPORTANT:** Use `{{ $json.chatInput }}` NOT `{{ $json.message }}`
   (Because we mapped it in the Set node)

3. **Response Format:**
   - Enable **"Return Structured Output"** if available
   - Or use **OpenAI Chat Model** node with proper settings

---

### **Step 4: Fix Response Format**

Your workflow must return JSON in this format:

```json
{
  "output": {
    "reply": "The AI response here"
  }
}
```

**How to achieve this:**

**Option A: Use Code Node (Recommended)**

Add a **Code** node after AI Agent:

```javascript
// Get the AI response
const aiResponse = $input.first().json;

// Extract the actual message
let reply = aiResponse.output || 
            aiResponse.response || 
            aiResponse.text || 
            aiResponse.message ||
            "I received your message.";

// If reply is an object, get the text field
if (typeof reply === 'object') {
  reply = reply.text || reply.content || JSON.stringify(reply);
}

// Return in the format our chat API expects
return {
  json: {
    output: {
      reply: reply
    }
  }
};
```

**Option B: Use Set Node**

Add a **Set** node after AI Agent:

- **Field:** `output.reply`
- **Value:** `{{ $json.output }}` or `{{ $json.text }}`

---

### **Step 5: Complete Working Workflow**

Here's a complete working setup:

```
1. Webhook Trigger (POST /chat)
   ↓
2. Set Node (prepare data)
   - chatInput = {{ $json.message }}
   - sessionId = {{ $json.chatId }}
   ↓
3. AI Agent / OpenAI Chat Model
   - Prompt: "You are helpful. User: {{ $json.chatInput }}"
   - Model: gpt-3.5-turbo or gpt-4
   ↓
4. Code Node (format response)
   - Extract reply from AI output
   - Return { output: { reply: "..." } }
   ↓
5. Respond to Webhook
   - Automatically sends response back
```

---

## 🐛 Debugging Steps

### **1. Test Each Node Individually**

1. Click on **Webhook Trigger** node
2. Click **"Listen for Test Event"**
3. Send a test message from your chat widget
4. Check if webhook receives the data correctly

### **2. Check AI Agent Credentials**

1. Click on **AI Agent** node
2. Check **Credentials** dropdown
3. Make sure credentials are:
   - ✅ Selected
   - ✅ Valid (not expired)
   - ✅ Have API quota remaining

### **3. Test AI Agent Manually**

1. Click on **AI Agent** node
2. Click **"Execute Node"**
3. Manually input test data:
   ```json
   {
     "chatInput": "Hello"
   }
   ```
4. Check if it returns a response

### **4. Check Response Format**

1. After AI Agent executes
2. Check the **Output** tab
3. Verify the structure matches what chat API expects

---

## 🔧 Quick Fix Template

If you want to start fresh, here's a minimal working workflow:

### **Node 1: Webhook Trigger**
- Method: POST
- Path: /chat
- Response Mode: Respond to Webhook

### **Node 2: Code Node**
```javascript
// Extract input
const userMessage = $input.first().json.message;
const sessionId = $input.first().json.chatId;

// Simple response (for testing)
return {
  json: {
    output: {
      reply: `You said: ${userMessage}`
    }
  }
};
```

**Test this first** - if this works, your webhook and response format are correct. Then add AI Agent.

---

## 🚨 Common Errors & Solutions

### **Error: "Missing credentials"**
**Solution:** 
1. Go to **Credentials** menu (left sidebar)
2. Add your OpenAI/Anthropic API key
3. Select it in AI Agent node

### **Error: "Cannot read property 'message'"**
**Solution:**
- Webhook is not receiving data correctly
- Check your chat widget is sending: `{ message: "...", chatId: "..." }`
- Add a Set node to map the fields

### **Error: "Response timeout"**
**Solution:**
- AI model taking too long
- Use faster model (gpt-3.5-turbo instead of gpt-4)
- Or increase timeout in webhook settings

### **Error: "Invalid JSON response"**
**Solution:**
- Response format is wrong
- Add Code node to format response correctly
- Make sure you return `{ output: { reply: "..." } }`

---

## ✅ Verification Checklist

Before testing again, verify:

- [ ] Webhook trigger is active (green dot)
- [ ] Webhook URL matches what's in chatbot settings
- [ ] AI credentials are set and valid
- [ ] Prompt uses correct variable: `{{ $json.chatInput }}`
- [ ] Response format includes `output.reply` field
- [ ] Workflow is saved and activated
- [ ] No red error indicators on any nodes

---

## 🧪 Test Your Workflow

### **Test 1: Direct Webhook Test**

Use curl or Postman:

```bash
curl -X POST https://your-n8n-url/webhook/your-path/chat \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "test123",
    "message": "Hello",
    "route": "general"
  }'
```

**Expected response:**
```json
{
  "output": {
    "reply": "Hello! How can I help you?"
  }
}
```

### **Test 2: From Chat Widget**

1. Open your website with chat widget
2. Type: "test"
3. Check browser console for errors
4. Check n8n execution log

---

## 📝 Working Example Configuration

### **Minimal Working Setup:**

**1. Webhook Trigger:**
```
HTTP Method: POST
Path: chat
Response Mode: Respond to Webhook
Response Data: First Entry JSON
```

**2. Set Node:**
```
chatInput: {{ $json.message }}
sessionId: {{ $json.chatId }}
```

**3. OpenAI Chat Model:**
```
Model: gpt-3.5-turbo
Messages:
  - Role: system
    Content: "You are a helpful assistant"
  - Role: user
    Content: {{ $json.chatInput }}
```

**4. Code Node:**
```javascript
const response = $input.first().json;
return {
  json: {
    output: {
      reply: response.message?.content || response.output || "I'm here to help!"
    }
  }
};
```

---

## 🎯 Next Steps

1. **Go to n8n** and check the failed execution
2. **Identify which node** is causing the 500 error
3. **Follow the fix** for that specific node above
4. **Test the workflow** manually in n8n first
5. **Then test** from your chat widget

The error is definitely in your n8n workflow configuration, not in the chat widget code. Fix the workflow and it will work! 🚀
