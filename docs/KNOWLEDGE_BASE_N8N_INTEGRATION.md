# 📚 Knowledge Base Integration with n8n

**Complete guide for integrating Knowledge Base with n8n workflows**

---

## 🎯 Overview

The Knowledge Base system stores articles that your AI chatbot can reference to answer user questions. The integration with n8n allows the AI to search and retrieve relevant articles before generating responses.

---

## 🔍 How It Works

### Flow Diagram

```
User Message → n8n Webhook → Search KB → AI with Context → Response
```

**Step-by-Step**:
1. User sends message to chat widget
2. Message sent to n8n webhook
3. n8n searches Knowledge Base via Convex API
4. Relevant articles retrieved
5. Articles added to AI context
6. AI generates response using KB content
7. Response sent back to user

---

## 📝 Step 1: Create Knowledge Base Articles

### Access Knowledge Base

1. Navigate to `/admin/knowledge-base`
2. Select chatbot type (Frontend or User Panel)
3. Click "New Article"

### Create Article Example

**Title**: "How to reset your password"

**Category**: "Account Management"

**Content**:
```
To reset your password:
1. Go to the login page
2. Click "Forgot Password"
3. Enter your email address
4. Check your email for reset link
5. Click the link and create new password
6. Password must be at least 8 characters

If you don't receive the email within 5 minutes, check your spam folder.
```

**Tags**: `password, reset, account, login`

**Keywords**: `forgot password, can't login, reset password, change password, password reset`

**Status**: Published ✅

### Best Practices for Articles

1. **Clear Titles**: Use questions users would ask
2. **Detailed Content**: Include step-by-step instructions
3. **Keywords**: Add common variations and misspellings
4. **Tags**: Use relevant categories
5. **Keep Updated**: Review and update regularly

---

## 🔧 Step 2: Set Up n8n Workflow with KB

### Create New Workflow

1. Open n8n
2. Create new workflow: "Chatbot with Knowledge Base"
3. Add the following nodes:

### Node 1: Webhook Trigger

**Configuration**:
- HTTP Method: POST
- Path: `chatbot-with-kb`
- Response Mode: "Respond to Webhook"

### Node 2: Extract Message (Code Node)

**JavaScript Code**:
```javascript
// Extract data from webhook
const chatId = $input.item.json.body.chatId;
const message = $input.item.json.body.message;
const route = $input.item.json.body.route;

return {
  chatId,
  message,
  route,
  timestamp: Date.now()
};
```

### Node 3: Search Knowledge Base (HTTP Request Node)

**Configuration**:
- Method: POST
- URL: `https://YOUR_CONVEX_URL/api/query`
- Authentication: None (or add if you set it up)

**Headers**:
```json
{
  "Content-Type": "application/json"
}
```

**Body (JSON)**:
```json
{
  "path": "knowledgeBase:searchArticles",
  "args": {
    "type": "{{ $('Extract Message').item.json.route }}",
    "query": "{{ $('Extract Message').item.json.message }}"
  }
}
```

**Alternative: Use Convex HTTP API**

If you have Convex HTTP API enabled:
```
POST https://YOUR_PROJECT.convex.cloud/api/query
```

### Node 4: Format KB Context (Code Node)

**JavaScript Code**:
```javascript
// Get search results
const kbResults = $input.item.json.results || [];
const userMessage = $('Extract Message').item.json.message;

// Format KB articles into context
let context = "";
if (kbResults.length > 0) {
  context = "Here are relevant articles from our knowledge base:\n\n";
  
  kbResults.forEach((article, index) => {
    context += `Article ${index + 1}: ${article.title}\n`;
    context += `${article.content}\n\n`;
  });
  
  context += "Use the above information to answer the user's question.\n";
}

return {
  userMessage,
  context,
  hasKB: kbResults.length > 0,
  articleCount: kbResults.length
};
```

### Node 5: OpenAI with KB Context

**Configuration**:
- Model: `gpt-4` or `gpt-3.5-turbo`

**Messages**:

**System Message**:
```
You are a helpful customer support assistant for StartupKit.

{{ $('Format KB Context').item.json.context }}

If the knowledge base articles contain the answer, use that information to provide an accurate response. If not, provide general helpful guidance and suggest contacting support for specific issues.

Be friendly, concise, and helpful.
```

**User Message**:
```
{{ $('Format KB Context').item.json.userMessage }}
```

### Node 6: Format Response (Code Node)

**JavaScript Code**:
```javascript
const aiResponse = $input.item.json.choices[0].message.content;
const chatId = $('Extract Message').item.json.chatId;
const usedKB = $('Format KB Context').item.json.hasKB;

return {
  output: aiResponse,
  chatId: chatId,
  usedKnowledgeBase: usedKB,
  timestamp: Date.now()
};
```

### Node 7: Respond to Webhook

**Configuration**:
- Respond With: JSON
- Response Body: `{{ $json }}`

---

## 🔄 Complete n8n Workflow JSON

**Import this into n8n**:

```json
{
  "name": "Chatbot with Knowledge Base",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "chatbot-with-kb",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "jsCode": "const chatId = $input.item.json.body.chatId;\nconst message = $input.item.json.body.message;\nconst route = $input.item.json.body.route;\n\nreturn { chatId, message, route, timestamp: Date.now() };"
      },
      "name": "Extract Message",
      "type": "n8n-nodes-base.code",
      "position": [450, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://YOUR_CONVEX_URL/api/query",
        "jsonParameters": true,
        "options": {},
        "bodyParametersJson": "={\n  \"path\": \"knowledgeBase:searchArticles\",\n  \"args\": {\n    \"type\": \"{{ $('Extract Message').item.json.route }}\",\n    \"query\": \"{{ $('Extract Message').item.json.message }}\"\n  }\n}"
      },
      "name": "Search Knowledge Base",
      "type": "n8n-nodes-base.httpRequest",
      "position": [650, 300]
    },
    {
      "parameters": {
        "jsCode": "const kbResults = $input.item.json.results || [];\nconst userMessage = $('Extract Message').item.json.message;\n\nlet context = \"\";\nif (kbResults.length > 0) {\n  context = \"Here are relevant articles:\\n\\n\";\n  kbResults.forEach((article, index) => {\n    context += `Article ${index + 1}: ${article.title}\\n${article.content}\\n\\n`;\n  });\n}\n\nreturn { userMessage, context, hasKB: kbResults.length > 0 };"
      },
      "name": "Format KB Context",
      "type": "n8n-nodes-base.code",
      "position": [850, 300]
    },
    {
      "parameters": {
        "model": "gpt-4",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "You are a helpful assistant.\\n\\n{{ $('Format KB Context').item.json.context }}\\n\\nUse the knowledge base to answer questions accurately."
            },
            {
              "role": "user",
              "content": "={{ $('Format KB Context').item.json.userMessage }}"
            }
          ]
        }
      },
      "name": "OpenAI",
      "type": "@n8n/n8n-nodes-langchain.openAi",
      "position": [1050, 300]
    },
    {
      "parameters": {
        "jsCode": "return {\n  output: $input.item.json.choices[0].message.content,\n  chatId: $('Extract Message').item.json.chatId,\n  timestamp: Date.now()\n};"
      },
      "name": "Format Response",
      "type": "n8n-nodes-base.code",
      "position": [1250, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}"
      },
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [1450, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Extract Message", "type": "main", "index": 0 }]]
    },
    "Extract Message": {
      "main": [[{ "node": "Search Knowledge Base", "type": "main", "index": 0 }]]
    },
    "Search Knowledge Base": {
      "main": [[{ "node": "Format KB Context", "type": "main", "index": 0 }]]
    },
    "Format KB Context": {
      "main": [[{ "node": "OpenAI", "type": "main", "index": 0 }]]
    },
    "OpenAI": {
      "main": [[{ "node": "Format Response", "type": "main", "index": 0 }]]
    },
    "Format Response": {
      "main": [[{ "node": "Respond to Webhook", "type": "main", "index": 0 }]]
    }
  }
}
```

---

## 🔑 Step 3: Get Convex API URL

### Find Your Convex URL

1. Open Convex Dashboard: https://dashboard.convex.dev
2. Select your project
3. Go to "Settings"
4. Copy "Deployment URL"
5. Format: `https://YOUR_PROJECT.convex.cloud`

### API Endpoint Format

**For Queries**:
```
POST https://YOUR_PROJECT.convex.cloud/api/query
```

**Body**:
```json
{
  "path": "knowledgeBase:searchArticles",
  "args": {
    "type": "frontend",
    "query": "how to reset password"
  }
}
```

---

## 🧪 Step 4: Test the Integration

### Test Knowledge Base Search

**Using curl**:
```bash
curl -X POST https://YOUR_PROJECT.convex.cloud/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "path": "knowledgeBase:searchArticles",
    "args": {
      "type": "frontend",
      "query": "password reset"
    }
  }'
```

**Expected Response**:
```json
{
  "results": [
    {
      "_id": "...",
      "title": "How to reset your password",
      "content": "To reset your password...",
      "category": "Account Management",
      "tags": ["password", "reset"],
      "keywords": ["forgot password", "reset password"]
    }
  ]
}
```

### Test Complete Workflow

1. **Activate n8n workflow**
2. **Get webhook URL** from n8n
3. **Update admin settings**:
   - Go to `/admin/chatbot-settings`
   - Paste new webhook URL
   - Save

4. **Test in chat widget**:
   - Open chat widget
   - Ask: "How do I reset my password?"
   - Bot should respond using KB article

---

## 📊 Step 5: Monitor & Improve

### Check What's Working

**In n8n**:
- View "Executions" tab
- Check if KB search returns results
- Verify AI receives context

**In Admin Panel**:
- Go to `/admin/chatbot-analytics`
- Check resolution rates
- Review top questions

### Improve KB Coverage

1. **Review Analytics**:
   - Check "Top Questions" in analytics
   - Identify questions without good answers

2. **Create Missing Articles**:
   - For each common question
   - Create detailed KB article
   - Use exact question as keyword

3. **Update Existing Articles**:
   - Add more keywords
   - Improve content clarity
   - Add examples

---

## 🎯 Advanced: Semantic Search

### Option 1: Use Vector Embeddings

**In n8n, add before OpenAI**:

1. **Generate Embedding** (OpenAI Embeddings Node)
2. **Search Vector DB** (Pinecone/Weaviate)
3. **Get Top Results**
4. **Pass to AI**

### Option 2: Use AI for KB Search

**Replace HTTP Request with OpenAI**:

```javascript
// In n8n Code Node
const userMessage = $input.item.json.message;
const allArticles = // fetch all KB articles

// Use AI to find most relevant
const prompt = `Given these articles: ${JSON.stringify(allArticles)}
Which articles are most relevant to: "${userMessage}"?
Return only the article IDs.`;

// Send to OpenAI
// Parse response
// Return relevant articles
```

---

## 🐛 Troubleshooting

### KB Search Returns No Results

**Check**:
1. Articles are published (not draft)
2. Keywords match user query
3. Correct chatbot type (frontend vs user_panel)
4. Convex URL is correct

**Fix**:
- Add more keywords to articles
- Use broader search terms
- Check article status

### AI Not Using KB Content

**Check**:
1. Context is being passed to AI
2. System prompt includes KB content
3. AI model has enough context window

**Fix**:
- Verify Format KB Context node output
- Check OpenAI system message
- Limit KB results to top 3 articles

### Slow Response Times

**Optimize**:
1. Limit KB search results (top 3-5)
2. Cache common queries
3. Use faster AI model (GPT-3.5)
4. Pre-process KB articles

---

## 📚 Example KB Articles to Create

### 1. Account Management
- How to reset password
- How to update profile
- How to change email
- How to delete account

### 2. Billing & Payments
- How to upgrade plan
- How to cancel subscription
- How to update payment method
- How to download invoice

### 3. Product Features
- How to create project
- How to invite team members
- How to export data
- How to integrate with API

### 4. Troubleshooting
- Login issues
- Payment failed
- Feature not working
- Error messages explained

---

## 🎉 Success Checklist

- [ ] Created 10+ KB articles
- [ ] n8n workflow with KB search
- [ ] Tested KB search API
- [ ] Webhook URL updated in admin
- [ ] Tested end-to-end in chat widget
- [ ] Bot responds using KB content
- [ ] Monitoring analytics
- [ ] Updating articles based on questions

---

**Last Updated**: January 14, 2026  
**Status**: Production Ready  
**Maintained by**: StartupKit Development Team
