# 🔄 n8n Workflow Integration Guide

**Complete guide for setting up n8n workflows with the chatbot system**

---

## 📋 Overview

This guide provides ready-to-use n8n workflow examples for your chatbot system. Click on any workflow type below to jump to its configuration:

### 🎯 Select Your Workflow Type

Choose the workflow you want to set up:

<div style="display: flex; flex-wrap: wrap; gap: 12px; margin: 20px 0;">

**[🤖 Basic Chatbot](#basic-chatbot-workflow)** - AI-powered responses for general queries

**[👤 Admin Takeover](#admin-takeover-workflow)** - Detect and escalate to human agents

**[⚡ Auto-Escalation](#auto-escalation-workflow)** - Keyword-based automatic escalation

**[📋 Lead Capture](#lead-capture-workflow)** - Capture and store customer information

**[📅 Appointment Booking](#appointment-booking-workflow)** - Schedule and notify appointments

</div>

---

## 🤖 Basic Chatbot Workflow

**Purpose:** Handle general customer queries with AI-powered responses

### Workflow Structure

```
Webhook Trigger → Extract Data → AI Processing → Format Response → Return
```

### When to Use
- General customer support
- FAQ responses
- Product information queries
- 24/7 automated assistance

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

### Setup Steps

1. **Import Workflow**: Copy the JSON above and import into n8n
2. **Configure OpenAI**: Add your OpenAI API key in credentials
3. **Set Webhook URL**: Copy the webhook URL and add to your frontend
4. **Test**: Send a test message to verify the workflow

### Frontend Integration

```javascript
const response = await fetch('YOUR_N8N_WEBHOOK_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chatId: 'chat-123',
    message: 'What are your business hours?',
    route: 'general'
  })
});
```

[← Back to Workflow Selection](#select-your-workflow-type)

---

## 👤 Admin Takeover Workflow

**Purpose:** Detect when customers need human assistance and escalate to admin

### Workflow Structure

```text
Webhook → Extract → Detect Takeover Request → Notify Admin → Update Chat Status → Response
```

### When to Use
- Customer explicitly requests human agent
- Complex issues requiring human judgment
- Escalation from automated responses
- VIP customer handling

### Key Features
- Real-time admin notifications
- Chat status updates in Convex
- Seamless handoff from bot to human
- Admin dashboard alerts

### n8n Workflow JSON

```json
{
  "name": "Admin Takeover Detection",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "admin-takeover",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "jsCode": "const message = $input.item.json.body.message.toLowerCase();\nconst chatId = $input.item.json.body.chatId;\n\nconst takeoverPhrases = [\n  'speak to human',\n  'talk to agent',\n  'human support',\n  'real person',\n  'customer service'\n];\n\nconst needsTakeover = takeoverPhrases.some(phrase => message.includes(phrase));\n\nreturn {\n  chatId,\n  message: $input.item.json.body.message,\n  needsTakeover,\n  timestamp: Date.now()\n};"
      },
      "name": "Detect Takeover",
      "type": "n8n-nodes-base.code",
      "position": [450, 300]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ $json.needsTakeover }}",
              "value2": true
            }
          ]
        }
      },
      "name": "IF Takeover Needed",
      "type": "n8n-nodes-base.if",
      "position": [650, 300]
    },
    {
      "parameters": {
        "url": "YOUR_CONVEX_HTTP_ACTION_URL",
        "method": "POST",
        "jsonParameters": true,
        "bodyParametersJson": "={{ { \"chatId\": $json.chatId, \"status\": \"admin_takeover\", \"timestamp\": $json.timestamp } }}"
      },
      "name": "Update Chat Status",
      "type": "n8n-nodes-base.httpRequest",
      "position": [850, 200]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ { \"message\": \"Connecting you with a human agent. Please wait...\", \"status\": \"admin_takeover\" } }}"
      },
      "name": "Respond - Takeover",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [1050, 200]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ { \"message\": \"How can I help you today?\", \"status\": \"bot\" } }}"
      },
      "name": "Respond - Normal",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [1050, 400]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Detect Takeover" }]]
    },
    "Detect Takeover": {
      "main": [[{ "node": "IF Takeover Needed" }]]
    },
    "IF Takeover Needed": {
      "main": [
        [{ "node": "Update Chat Status" }],
        [{ "node": "Respond - Normal" }]
      ]
    },
    "Update Chat Status": {
      "main": [[{ "node": "Respond - Takeover" }]]
    }
  }
}
```

### Setup Steps

1. **Import Workflow**: Import JSON into n8n
2. **Configure Convex URL**: Replace `YOUR_CONVEX_HTTP_ACTION_URL` with your Convex HTTP action endpoint
3. **Customize Phrases**: Edit takeover detection phrases in "Detect Takeover" node
4. **Test**: Try phrases like "I want to speak to a human"

[← Back to Workflow Selection](#select-your-workflow-type)

---

## ⚡ Auto-Escalation Workflow

**Purpose:** Automatically escalate conversations based on specific keywords or conditions

### Workflow Structure

```text
Webhook → Extract → Check Keywords → Branch (Escalate/Normal) → AI/Alert → Response
```

### When to Use
- Urgent issues (billing, refunds, complaints)
- Technical problems requiring immediate attention
- Security or privacy concerns
- High-priority customer segments

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
  'emergency',
  'refund',
  'cancel subscription',
  'billing issue',
  'not working',
  'broken'
];

const needsEscalation = escalationKeywords.some(keyword => 
  message.includes(keyword)
);

return {
  chatId: $input.item.json.body.chatId,
  message: $input.item.json.body.message,
  needsEscalation,
  detectedKeywords: escalationKeywords.filter(k => message.includes(k)),
  timestamp: Date.now()
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

### Setup Steps

1. **Import Workflow**: Import JSON into n8n
2. **Configure Webhook**: Copy webhook URL
3. **Customize Keywords**: Adjust escalation keywords for your use case
4. **Test**: Send messages with keywords like "urgent" or "refund"

[← Back to Workflow Selection](#select-your-workflow-type)

---

## 📋 Lead Capture Workflow

**Purpose:** Capture customer information and notify sales team

### Workflow Structure

```text
Webhook → Extract Lead Data → Save to Convex → Send Notification → Response
```

### When to Use
- Contact form submissions
- Demo requests
- Quote requests
- Newsletter signups
- Sales inquiries

### Key Features
- Automatic lead storage in Convex
- Email notifications to sales team
- Slack/Teams integration options
- Lead scoring and routing

### Complete Workflow JSON

```json
{
  "name": "Lead Capture & Notification",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "lead-captured",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "jsCode": "return {\n  name: $input.item.json.body.name,\n  email: $input.item.json.body.email,\n  phone: $input.item.json.body.phone || '',\n  company: $input.item.json.body.company || '',\n  message: $input.item.json.body.message || '',\n  source: 'chatbot',\n  capturedAt: Date.now()\n};"
      },
      "name": "Extract Lead Data",
      "type": "n8n-nodes-base.code",
      "position": [450, 300]
    },
    {
      "parameters": {
        "url": "YOUR_CONVEX_HTTP_ACTION_URL",
        "method": "POST",
        "jsonParameters": true,
        "bodyParametersJson": "={{ $json }}"
      },
      "name": "Save to Convex",
      "type": "n8n-nodes-base.httpRequest",
      "position": [650, 300]
    },
    {
      "parameters": {
        "fromEmail": "notifications@yourcompany.com",
        "toEmail": "sales@yourcompany.com",
        "subject": "🎯 New Lead: {{ $('Extract Lead Data').item.json.name }}",
        "html": "<h2>New Lead Captured</h2><p><strong>Name:</strong> {{ $('Extract Lead Data').item.json.name }}</p><p><strong>Email:</strong> {{ $('Extract Lead Data').item.json.email }}</p><p><strong>Phone:</strong> {{ $('Extract Lead Data').item.json.phone }}</p><p><strong>Company:</strong> {{ $('Extract Lead Data').item.json.company }}</p><p><strong>Message:</strong> {{ $('Extract Lead Data').item.json.message }}</p><p><strong>Source:</strong> Chatbot</p>"
      },
      "name": "Send Email Notification",
      "type": "n8n-nodes-base.emailSend",
      "position": [850, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ { \"success\": true, \"message\": \"Thank you! We'll contact you soon.\" } }}"
      },
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [1050, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Extract Lead Data" }]]
    },
    "Extract Lead Data": {
      "main": [[{ "node": "Save to Convex" }]]
    },
    "Save to Convex": {
      "main": [[{ "node": "Send Email Notification" }]]
    },
    "Send Email Notification": {
      "main": [[{ "node": "Respond to Webhook" }]]
    }
  }
}
```

### Setup Steps

1. **Import Workflow**: Import JSON into n8n
2. **Configure Email**: Set up email credentials (Gmail, SendGrid, etc.)
3. **Set Convex URL**: Replace `YOUR_CONVEX_HTTP_ACTION_URL` with your endpoint
4. **Customize Notification**: Edit email template and recipients
5. **Test**: Submit a test lead through your chatbot

### Frontend Integration

```javascript
// Trigger lead capture from chatbot
const captureLeadResponse = await fetch('YOUR_N8N_WEBHOOK_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    company: 'Acme Corp',
    message: 'Interested in your product'
  })
});
```

[← Back to Workflow Selection](#select-your-workflow-type)

---

## 📅 Appointment Booking Workflow

**Purpose:** Schedule appointments and send confirmations

### Workflow Structure

```text
Webhook → Validate Data → Create Calendar Event → Send Confirmation → Update Convex → Response
```

### When to Use
- Demo bookings
- Consultation scheduling
- Support calls
- Sales meetings
- Onboarding sessions

### Key Features
- Google Calendar integration
- Automatic confirmation emails
- Timezone handling
- Reminder notifications
- Booking conflict detection

### Complete Workflow JSON

```json
{
  "name": "Appointment Booking & Notification",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "appointment-booked",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "jsCode": "const { name, email, date, time, purpose, notes } = $input.item.json.body;\n\n// Format datetime for Google Calendar\nconst startDateTime = `${date}T${time}:00`;\nconst endTime = new Date(`${date}T${time}:00`);\nendTime.setHours(endTime.getHours() + 1);\nconst endDateTime = endTime.toISOString().slice(0, 16);\n\nreturn {\n  name,\n  email,\n  date,\n  time,\n  purpose: purpose || 'General consultation',\n  notes: notes || '',\n  startDateTime,\n  endDateTime,\n  timestamp: Date.now()\n};"
      },
      "name": "Format Appointment Data",
      "type": "n8n-nodes-base.code",
      "position": [450, 300]
    },
    {
      "parameters": {
        "calendar": "primary",
        "start": "={{ $json.startDateTime }}",
        "end": "={{ $json.endDateTime }}",
        "summary": "Meeting with {{ $json.name }}",
        "description": "Purpose: {{ $json.purpose }}\n\nNotes: {{ $json.notes }}\n\nContact: {{ $json.email }}",
        "attendees": "={{ $json.email }}"
      },
      "name": "Create Google Calendar Event",
      "type": "n8n-nodes-base.googleCalendar",
      "position": [650, 300]
    },
    {
      "parameters": {
        "fromEmail": "appointments@yourcompany.com",
        "toEmail": "={{ $('Format Appointment Data').item.json.email }}",
        "subject": "✅ Appointment Confirmed - {{ $('Format Appointment Data').item.json.date }}",
        "html": "<div style='font-family: Arial, sans-serif; max-width: 600px;'><h2 style='color: #4CAF50;'>Your Appointment is Confirmed!</h2><div style='background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;'><p><strong>Date:</strong> {{ $('Format Appointment Data').item.json.date }}</p><p><strong>Time:</strong> {{ $('Format Appointment Data').item.json.time }}</p><p><strong>Purpose:</strong> {{ $('Format Appointment Data').item.json.purpose }}</p></div><p>We look forward to meeting with you!</p><p style='color: #666; font-size: 12px;'>If you need to reschedule, please contact us at support@yourcompany.com</p></div>"
      },
      "name": "Send Confirmation Email",
      "type": "n8n-nodes-base.emailSend",
      "position": [850, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ { \"success\": true, \"message\": \"Appointment booked successfully!\", \"eventId\": $('Create Google Calendar Event').item.json.id } }}"
      },
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [1050, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Format Appointment Data" }]]
    },
    "Format Appointment Data": {
      "main": [[{ "node": "Create Google Calendar Event" }]]
    },
    "Create Google Calendar Event": {
      "main": [[{ "node": "Send Confirmation Email" }]]
    },
    "Send Confirmation Email": {
      "main": [[{ "node": "Respond to Webhook" }]]
    }
  }
}
```

### Setup Steps

1. **Import Workflow**: Import JSON into n8n
2. **Configure Google Calendar**: 
   - Add Google Calendar credentials in n8n
   - Authorize calendar access
   - Select target calendar
3. **Configure Email**: Set up email sending credentials
4. **Customize Templates**: Edit confirmation email HTML
5. **Test**: Book a test appointment

### Frontend Integration

```javascript
// Book appointment from chatbot
const bookingResponse = await fetch('YOUR_N8N_WEBHOOK_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Jane Smith',
    email: 'jane@example.com',
    date: '2026-01-20',
    time: '14:00',
    purpose: 'Product demo',
    notes: 'Interested in enterprise plan'
  })
});
```

[← Back to Workflow Selection](#select-your-workflow-type)

---

## 🎯 Quick Start Guide

### Step-by-Step Setup

1. **Choose Your Workflow**: Click on the workflow type you need from the [selection menu](#select-your-workflow-type)
2. **Copy JSON**: Copy the workflow JSON from the chosen section
3. **Import to n8n**: 
   - Open n8n
   - Click "Import from File" or "Import from Clipboard"
   - Paste the JSON
4. **Configure Credentials**: Set up required credentials (OpenAI, Email, Google Calendar, etc.)
5. **Update URLs**: Replace placeholder URLs with your actual endpoints
6. **Test**: Activate the workflow and send a test request
7. **Deploy**: Use the webhook URL in your frontend chatbot

### Common Configuration

**Convex HTTP Actions**: Create HTTP actions in Convex for:
- Updating chat status
- Saving leads
- Storing appointments

**Email Setup**: Supported providers:
- Gmail (OAuth2)
- SendGrid (API Key)
- SMTP (Custom server)

**Calendar Integration**: Requires:
- Google Calendar API enabled
- OAuth2 credentials
- Calendar ID

---

## 📞 Support

Need help setting up your workflows? Check the n8n documentation or contact support.

**Resources:**
- [n8n Documentation](https://docs.n8n.io)
- [Convex Documentation](https://docs.convex.dev)
- [OpenAI API Docs](https://platform.openai.com/docs)

[🔝 Back to Top](#-n8n-workflow-integration-guide)
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
