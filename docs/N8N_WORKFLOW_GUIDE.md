# 🔄 n8n Workflow Integration Guide

**Complete guide for setting up n8n workflows with the chatbot system**

---

## 📋 Overview

This guide provides ready-to-use n8n workflow examples for:
- Basic chatbot with AI responses
- Admin takeover detection
- Auto-escalation based on keywords
- Lead capture triggers
- Appointment booking notifications

---

## 🚀 Basic Chatbot Workflow

### Workflow Structure

```
Webhook Trigger → Extract Data → AI Processing → Format Response → Return
```

### n8n Workflow JSON

```json
{
  "name": "Frontend Chatbot - Basic",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "chatbot-frontend",
        "responseMode": "responseNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "jsCode": "const chatId = $input.item.json.body.chatId;\nconst message = $input.item.json.body.message;\nconst route = $input.item.json.body.route;\n\nreturn {\n  chatId,\n  message,\n  route,\n  timestamp: Date.now()\n};"
      },
      "name": "Extract Data",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "model": "gpt-4",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "You are a helpful customer support assistant. Answer questions about our product and services. Be friendly and concise."
            },
            {
              "role": "user",
              "content": "={{ $json.message }}"
            }
          ]
        }
      },
      "name": "OpenAI Chat",
      "type": "@n8n/n8n-nodes-langchain.openAi",
      "typeVersion": 1,
      "position": [650, 300]
    },
    {
      "parameters": {
        "jsCode": "return {\n  output: $input.item.json.choices[0].message.content,\n  chatId: $('Extract Data').item.json.chatId,\n  timestamp: Date.now()\n};"
      },
      "name": "Format Response",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [850, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}"
      },
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1050, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Extract Data", "type": "main", "index": 0 }]]
    },
    "Extract Data": {
      "main": [[{ "node": "OpenAI Chat", "type": "main", "index": 0 }]]
    },
    "OpenAI Chat": {
      "main": [[{ "node": "Format Response", "type": "main", "index": 0 }]]
    },
    "Format Response": {
      "main": [[{ "node": "Respond to Webhook", "type": "main", "index": 0 }]]
    }
  }
}
```

---

## 🆘 Auto-Escalation Workflow

### Workflow Structure

```
Webhook → Extract → Check Keywords → Branch (Escalate/Normal) → AI/Alert → Response
```

### Escalation Keywords Detection

```javascript
// n8n Code Node - Keyword Detection
const message = $input.item.json.message.toLowerCase();

const escalationKeywords = [
  'speak to human',
  'talk to agent',
  'real person',
  'frustrated',
  'angry',
  'not helpful',
  'manager',
  'complaint',
  'urgent',
  'emergency'
];

const needsEscalation = escalationKeywords.some(keyword => 
  message.includes(keyword)
);

return {
  ...($input.item.json),
  needsEscalation,
  detectedKeywords: escalationKeywords.filter(k => message.includes(k))
};
```

### Convex Update for Escalation

```javascript
// n8n HTTP Request Node - Update Conversation Status
// POST to your Convex function endpoint

{
  "conversationId": "{{ $json.chatId }}",
  "status": "waiting_for_agent",
  "interventionRequested": true,
  "interventionRequestedAt": "{{ $now }}"
}
```

### Complete Workflow JSON

```json
{
  "name": "Chatbot with Auto-Escalation",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "chatbot-escalation",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "jsCode": "const message = $input.item.json.body.message.toLowerCase();\nconst escalationKeywords = ['speak to human', 'talk to agent', 'real person', 'frustrated', 'angry', 'not helpful', 'manager', 'complaint', 'urgent'];\nconst needsEscalation = escalationKeywords.some(k => message.includes(k));\n\nreturn {\n  chatId: $input.item.json.body.chatId,\n  message: $input.item.json.body.message,\n  needsEscalation,\n  detectedKeywords: escalationKeywords.filter(k => message.includes(k))\n};"
      },
      "name": "Check Keywords",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ $json.needsEscalation }}",
              "value2": true
            }
          ]
        }
      },
      "name": "IF Escalation Needed",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [650, 300]
    },
    {
      "parameters": {
        "jsCode": "return {\n  output: 'I understand you need to speak with someone. Let me connect you with an agent. Average wait time is 2-3 minutes.',\n  chatId: $input.item.json.chatId,\n  escalated: true\n};"
      },
      "name": "Escalation Response",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [850, 200]
    },
    {
      "parameters": {
        "model": "gpt-4",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "You are a helpful assistant."
            },
            {
              "role": "user",
              "content": "={{ $json.message }}"
            }
          ]
        }
      },
      "name": "AI Response",
      "type": "@n8n/n8n-nodes-langchain.openAi",
      "typeVersion": 1,
      "position": [850, 400]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}"
      },
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1050, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Check Keywords", "type": "main", "index": 0 }]]
    },
    "Check Keywords": {
      "main": [[{ "node": "IF Escalation Needed", "type": "main", "index": 0 }]]
    },
    "IF Escalation Needed": {
      "main": [
        [{ "node": "Escalation Response", "type": "main", "index": 0 }],
        [{ "node": "AI Response", "type": "main", "index": 0 }]
      ]
    },
    "Escalation Response": {
      "main": [[{ "node": "Respond", "type": "main", "index": 0 }]]
    },
    "AI Response": {
      "main": [[{ "node": "Respond", "type": "main", "index": 0 }]]
    }
  }
}
```

---

## 📚 Knowledge Base Integration

### Query Knowledge Base Before AI

```javascript
// n8n Code Node - Search Knowledge Base
const userMessage = $input.item.json.message.toLowerCase();

// Call your Convex searchArticles function
const knowledgeBase = [
  // This would come from your Convex database
  {
    title: "How to reset password",
    content: "To reset your password, go to Settings > Security > Reset Password",
    keywords: ["password", "reset", "forgot", "login"]
  }
];

const relevantArticles = knowledgeBase.filter(article =>
  article.keywords.some(keyword => userMessage.includes(keyword))
);

return {
  message: $input.item.json.message,
  hasKnowledgeBase: relevantArticles.length > 0,
  articles: relevantArticles,
  context: relevantArticles.map(a => a.content).join('\n\n')
};
```

### AI with Knowledge Base Context

```javascript
// OpenAI Node with Context
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "You are a support assistant. Use the following knowledge base articles to answer questions:\n\n{{ $json.context }}\n\nIf the knowledge base doesn't contain the answer, say so politely."
    },
    {
      "role": "user",
      "content": "{{ $json.message }}"
    }
  ]
}
```

---

## 📧 Lead Capture Notification

### Send Email When Lead Captured

```json
{
  "name": "Lead Capture Notification",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "lead-captured"
      },
      "name": "Webhook - Lead Captured",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "fromEmail": "notifications@yourcompany.com",
        "toEmail": "sales@yourcompany.com",
        "subject": "🎯 New Lead Captured: {{ $json.body.name }}",
        "text": "New lead from chatbot:\n\nName: {{ $json.body.name }}\nEmail: {{ $json.body.email }}\nPhone: {{ $json.body.phone }}\nCompany: {{ $json.body.company }}\n\nConversation ID: {{ $json.body.conversationId }}"
      },
      "name": "Send Email",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 1,
      "position": [450, 300]
    }
  ]
}
```

---

## 📅 Appointment Booking Workflow

### Create Calendar Event

```json
{
  "name": "Appointment Booking",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "appointment-booked"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "calendar": "primary",
        "start": "={{ $json.body.date }}T{{ $json.body.time }}",
        "end": "={{ $json.body.date }}T{{ $json.body.time + 1 hour }}",
        "summary": "Meeting with {{ $json.body.name }}",
        "description": "Purpose: {{ $json.body.purpose }}\n\nNotes: {{ $json.body.notes }}\n\nContact: {{ $json.body.email }}"
      },
      "name": "Google Calendar",
      "type": "n8n-nodes-base.googleCalendar",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "fromEmail": "appointments@yourcompany.com",
        "toEmail": "={{ $json.body.email }}",
        "subject": "✅ Appointment Confirmed",
        "html": "<h2>Your appointment is confirmed!</h2><p>Date: {{ $json.body.date }}</p><p>Time: {{ $json.body.time }}</p><p>We look forward to meeting with you!</p>"
      },
      "name": "Send Confirmation",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 1,
      "position": [650, 300]
    }
  ]
}
```

---

## 🔧 Setup Instructions

### 1. Create n8n Workflow

1. Log in to your n8n instance
2. Click **"New Workflow"**
3. Import one of the JSON workflows above
4. Configure credentials (OpenAI, Email, etc.)

### 2. Get Webhook URL

1. Click on the **Webhook** node
2. Click **"Execute Node"**
3. Copy the **Production URL**
4. Example: `https://your-n8n.com/webhook/chatbot-frontend`

### 3. Configure in Admin Panel

1. Go to `/admin/chatbot-settings`
2. Select chatbot type (Frontend or User Panel)
3. Paste webhook URL
4. Click **"Test Connection"**
5. Save configuration

### 4. Test the Integration

```bash
# Test webhook directly
curl -X POST https://your-n8n.com/webhook/chatbot-frontend \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "test_123",
    "message": "Hello, how can you help me?",
    "route": "frontend"
  }'
```

---

## 🎯 Best Practices

### 1. Error Handling

```javascript
// Add try-catch in code nodes
try {
  const response = await fetch('...');
  return { success: true, data: response };
} catch (error) {
  return { 
    success: false, 
    error: error.message,
    fallback: "I'm having trouble processing that. Please try again."
  };
}
```

### 2. Rate Limiting

```javascript
// Track requests per session
const sessionRequests = $input.item.json.requestCount || 0;

if (sessionRequests > 10) {
  return {
    output: "You've reached the message limit. Please wait a moment.",
    rateLimited: true
  };
}
```

### 3. Context Management

```javascript
// Store conversation history
const conversationHistory = $input.item.json.history || [];
conversationHistory.push({
  role: 'user',
  content: $input.item.json.message,
  timestamp: Date.now()
});

// Keep last 10 messages
const recentHistory = conversationHistory.slice(-10);
```

### 4. Logging

```javascript
// Log to external service
await fetch('https://your-logging-service.com/log', {
  method: 'POST',
  body: JSON.stringify({
    chatId: $json.chatId,
    message: $json.message,
    response: $json.output,
    timestamp: Date.now()
  })
});
```

---

## 🔐 Security Considerations

### 1. Webhook Authentication

Add authentication to your webhooks:

```javascript
// In n8n Code Node
const authHeader = $input.item.headers.authorization;
const expectedToken = 'your-secret-token';

if (authHeader !== `Bearer ${expectedToken}`) {
  throw new Error('Unauthorized');
}
```

### 2. Input Validation

```javascript
// Validate input data
const { chatId, message } = $input.item.json.body;

if (!chatId || !message) {
  throw new Error('Missing required fields');
}

if (message.length > 1000) {
  throw new Error('Message too long');
}
```

### 3. Sanitize Output

```javascript
// Remove sensitive data
const sanitizedResponse = response.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED]');
```

---

## 📊 Monitoring & Analytics

### Track Metrics

```javascript
// Send metrics to analytics
await fetch('https://your-analytics.com/track', {
  method: 'POST',
  body: JSON.stringify({
    event: 'chatbot_message',
    chatId: $json.chatId,
    messageLength: $json.message.length,
    responseTime: Date.now() - $json.startTime,
    escalated: $json.needsEscalation
  })
});
```

---

## 🚀 Advanced Features

### 1. Multi-Language Support

```javascript
// Detect language
const language = detectLanguage($json.message);

const systemPrompts = {
  en: "You are a helpful assistant.",
  es: "Eres un asistente útil.",
  fr: "Vous êtes un assistant utile."
};

return {
  ...($json),
  systemPrompt: systemPrompts[language] || systemPrompts.en
};
```

### 2. Sentiment Analysis

```javascript
// Analyze sentiment
const sentiment = analyzeSentiment($json.message);

if (sentiment === 'negative') {
  // Escalate or use empathetic response
  return {
    ...($json),
    tone: 'empathetic',
    priority: 'high'
  };
}
```

### 3. Intent Classification

```javascript
// Classify user intent
const intents = {
  'support': ['help', 'issue', 'problem', 'not working'],
  'sales': ['price', 'buy', 'purchase', 'cost'],
  'info': ['what', 'how', 'when', 'where']
};

const detectedIntent = Object.keys(intents).find(intent =>
  intents[intent].some(keyword => $json.message.toLowerCase().includes(keyword))
);

return {
  ...($json),
  intent: detectedIntent || 'general'
};
```

---

## 📝 Troubleshooting

### Common Issues

**1. Webhook not responding**
- Check n8n workflow is active
- Verify webhook URL is correct
- Check n8n logs for errors

**2. AI responses are slow**
- Use streaming responses
- Implement caching for common questions
- Consider using faster models (GPT-3.5)

**3. Escalation not working**
- Verify keyword detection logic
- Check Convex function permissions
- Test with exact escalation keywords

---

**Last Updated**: January 14, 2026  
**Status**: Production Ready  
**Maintained by**: StartupKit Development Team
