# n8n Tool Schema Configuration Fix

**Critical: The AI Agent needs the tool schema to know what parameters to extract**

---

## 🔴 Problem

Your AI Agent is not calling the `lookup_client` tool even when it receives an email address. This is because the tool doesn't have a proper **schema** that tells the AI what parameters to extract.

---

## ✅ Solution: Add Schema to Your Tool

### **Step 1: Open lookup_client Tool Settings**

1. Click on **AI Agent** node
2. Find the **Tools** section
3. Click on **lookup_client** tool to edit it

### **Step 2: Add Schema**

Look for a field called:
- **"Schema"** or
- **"Parameters"** or
- **"Input Schema"** or
- **"Tool Schema"**

**Paste this JSON schema:**

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "description": "The user's email address"
    }
  },
  "required": ["email"]
}
```

### **Step 3: Update Tool Description**

Make sure the description is clear:

```
Use this tool when the user provides an email address. Extract the email from the user's message and call this tool with the email parameter.
```

---

## 🎯 Alternative: Use @n8n/n8n-nodes-langchain Format

If your n8n version uses the LangChain format, configure it like this:

**Tool Configuration:**

**Name:** `lookup_client`

**Description:**
```
Check if a client exists by email. Call this when user provides email address like "my email is test@example.com" or just "test@example.com". Extract the email and use it as the email parameter.
```

**Schema:**
```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "description": "Email address extracted from user message"
    }
  },
  "required": ["email"]
}
```

---

## 🧪 Ultra-Simple Test Prompt

Replace your system message with this minimal version:

```
You have a tool called lookup_client. 

When the user gives you an email address, call the lookup_client tool with that email.

Example:
User: "shangwey@yahoo.com"
You: [Call lookup_client with email: "shangwey@yahoo.com"]
```

---

## 🔍 How to Verify Schema is Set

After adding the schema:

1. **Save the AI Agent**
2. **Click "Execute node"** to test
3. **In the execution log**, look for the AI's response
4. **You should see:** `tool_calls: [{name: "lookup_client", arguments: {email: "..."}}]`

If you still see `tool_calls: []`, the schema is not properly configured.

---

## 📸 What the Schema Section Looks Like

Depending on your n8n version, you might see:

**Option A: JSON Schema Field**
```
Schema (JSON)
┌─────────────────────────────────┐
│ {                               │
│   "type": "object",             │
│   "properties": {               │
│     "email": {...}              │
│   }                             │
│ }                               │
└─────────────────────────────────┘
```

**Option B: Parameters Builder**
```
Parameters
├─ Add Parameter
   ├─ Name: email
   ├─ Type: string
   └─ Description: User's email address
```

---

## ⚠️ Common Issues

**Issue 1: No Schema Field Visible**
- Your n8n version might be older
- Try using "Call n8n Workflow Tool" instead of "HTTP Request Tool"
- Or update n8n to latest version

**Issue 2: Schema Not Working**
- Make sure it's valid JSON
- Check for typos in property names
- Ensure "required" array matches property names

**Issue 3: AI Still Not Calling Tool**
- The system prompt might be overriding tool usage
- Try the ultra-simple test prompt above
- Check AI model supports function calling (GPT-3.5+, GPT-4, Claude 3+)

---

## 🚀 Next Steps

1. Add the schema to your lookup_client tool
2. Use the ultra-simple test prompt
3. Test with: "shangwey@yahoo.com"
4. Check execution log for tool_calls
5. If it works, gradually add back the full prompt

The schema is critical - without it, the AI doesn't know what parameters to extract from the user's message.
