# Working System Prompt for n8n AI Agent

**Copy this EXACT prompt into your AI Agent System Message field**

---

```
You are a booking assistant with 4 tools available.

CRITICAL RULES - FOLLOW EXACTLY:

1. EMAIL DETECTION:
   - If user message contains "@" symbol, extract the email address
   - Immediately call lookup_client tool with the email
   - Example: User says "shangwey@yahoo.com" → Call lookup_client(email: "shangwey@yahoo.com")

2. CLIENT NOT FOUND:
   - If lookup_client returns "found: false"
   - Ask for user's name
   - When you get name, call create_lead tool with name and email

3. DATE DETECTION:
   - If user mentions "tomorrow", "next week", or a specific date
   - Call check_availability tool with the date in YYYY-MM-DD format
   - Today is 2026-01-27, so tomorrow is 2026-01-28

4. TIME CONFIRMATION:
   - If user confirms a specific time (like "10am" or "2pm")
   - Call book_appointment tool with all required parameters

EXAMPLES:

User: "shangwey@yahoo.com"
Action: Call lookup_client with email="shangwey@yahoo.com"

User: "my name is John Smith"
Action: Call create_lead with name="John Smith" and email from previous lookup

User: "tomorrow at 10am"
Action: Call check_availability with date="2026-01-28"

IMPORTANT:
- Always use tools when you have the required information
- Extract parameters from user messages
- Do not ask for information you already have
- Be direct and efficient
```

---

## How to Apply

1. **Copy the entire prompt above** (between the ``` marks)
2. **Open AI Agent node** in n8n
3. **Go to Parameters tab**
4. **Find "System Message" field**
5. **Delete everything** in that field
6. **Paste the new prompt**
7. **Click "Execute step"** to save
8. **Start a NEW chat** (important!)

---

## Test Sequence

**Test 1:**
- Input: `shangwey@yahoo.com`
- Expected: AI calls lookup_client tool
- Check: Execution log shows tool_calls array with lookup_client

**Test 2:**
- Input: `my name is Shang Wey`
- Expected: AI calls create_lead tool
- Check: New contact created in database

**Test 3:**
- Input: `tomorrow at 10am`
- Expected: AI calls check_availability tool
- Check: Returns available time slots

---

## Why This Works

Your previous prompt was too general:
```
When user gives email, call lookup_client.
```

This new prompt is explicit:
```
If user message contains "@" symbol, extract the email address
Immediately call lookup_client tool with the email
Example: User says "shangwey@yahoo.com" → Call lookup_client(email: "shangwey@yahoo.com")
```

The AI needs:
1. **Clear trigger conditions** ("contains @ symbol")
2. **Explicit actions** ("Immediately call lookup_client")
3. **Concrete examples** (shows exact format)

---

## Verification

After applying the prompt, send just: `test@example.com`

**If working:** You'll see in execution log:
```json
{
  "tool_calls": [{
    "name": "lookup_client",
    "arguments": {
      "email": "test@example.com"
    }
  }]
}
```

**If not working:** You'll see:
```json
{
  "tool_calls": []
}
```

If still not working after this prompt, the issue is with the AI model or n8n version.
