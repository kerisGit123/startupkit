# N8N Chatbot Agent System

## Overview

A comprehensive AI-powered customer service system integrating chatbots, live agent handoff, conversation management, and unified inbox for tickets and messages. Built with n8n workflows, Convex backend, and Next.js frontend.

## Tech Stack

### Frontend
- **Next.js 14** - React framework
- **TailwindCSS** - Styling
- **Convex React** - Real-time data synchronization
- **TypeScript** - Type safety

### Backend
- **Convex** - Serverless backend and database
- **n8n** - Workflow automation and AI orchestration
- **OpenAI/Anthropic** - AI language models

### Integration
- **n8n Webhook** - Chat trigger and response handling
- **n8n AI Agent** - Intent routing and tool execution
- **n8n Simple Memory** - Conversation context storage

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interfaces                          │
├─────────────────────┬───────────────────────────────────────┤
│  Frontend Chatbot   │    User Panel Chatbot                 │
│  (Anonymous/Leads)  │    (Authenticated Users)              │
└──────────┬──────────┴───────────────┬───────────────────────┘
           │                          │
           └──────────┬───────────────┘
                      │
           ┌──────────▼──────────┐
           │   Next.js API       │
           │   /api/chat         │
           └──────────┬──────────┘
                      │
           ┌──────────▼──────────┐
           │   n8n Webhook       │
           │   Chat Trigger      │
           └──────────┬──────────┘
                      │
           ┌──────────▼──────────┐
           │   AI Agent          │
           │   + Tools           │
           │   + Memory          │
           └──────────┬──────────┘
                      │
           ┌──────────▼──────────┐
           │   Convex Backend    │
           │   - Conversations   │
           │   - Messages        │
           │   - Tickets         │
           │   - Agent Queue     │
           └─────────────────────┘
```

## Database Schema

### chatbot_conversations
Stores conversation metadata and lead/user information.

```typescript
{
  _id: Id<"chatbot_conversations">,
  sessionId: string,              // Unique session identifier
  type: "frontend" | "user_panel", // Chatbot type
  status: "active" | "waiting_agent" | "with_agent" | "resolved" | "closed",
  
  // Lead information (for frontend chatbot)
  leadName?: string,
  leadEmail?: string,
  leadPhone?: string,
  
  // User information (for user panel chatbot)
  userId?: Id<"users">,
  
  // Agent handoff
  agentId?: Id<"users">,          // Assigned agent
  requestedAgentAt?: number,      // When agent was requested
  agentJoinedAt?: number,         // When agent joined
  
  // Metadata
  createdAt: number,
  updatedAt: number,
  lastMessageAt: number,
  
  // Analytics
  messageCount: number,
  aiMessageCount: number,
  agentMessageCount: number,
  
  // Tags and categorization
  tags?: string[],
  category?: string,
  sentiment?: "positive" | "neutral" | "negative",
}
```

### chatbot_messages
Stores individual messages in conversations.

```typescript
{
  _id: Id<"chatbot_messages">,
  conversationId: Id<"chatbot_conversations">,
  
  role: "user" | "assistant" | "agent" | "system",
  content: string,
  
  // Sender information
  senderId?: Id<"users">,         // For agent messages
  senderName?: string,            // Display name
  
  // Metadata
  timestamp: number,
  
  // Attachments
  attachments?: Array<{
    type: "image" | "file",
    url: string,
    name: string,
    size: number,
  }>,
  
  // AI metadata
  aiModel?: string,
  toolCalls?: Array<{
    tool: string,
    input: any,
    output: any,
  }>,
}
```

### agent_queue
Manages agent handoff requests and assignments.

```typescript
{
  _id: Id<"agent_queue">,
  conversationId: Id<"chatbot_conversations">,
  
  status: "pending" | "assigned" | "completed" | "cancelled",
  priority: "low" | "medium" | "high" | "urgent",
  
  // Assignment
  assignedAgentId?: Id<"users">,
  assignedAt?: number,
  
  // Queue metadata
  requestedAt: number,
  waitTime?: number,              // Milliseconds
  
  // Context for agent
  summary?: string,               // AI-generated conversation summary
  customerIntent?: string,
  tags?: string[],
}
```

### tickets
Unified ticketing system for all customer interactions.

```typescript
{
  _id: Id<"tickets">,
  ticketNumber: string,           // e.g., "TKT-2024-0001"
  
  // Source
  source: "chatbot" | "email" | "form" | "manual",
  conversationId?: Id<"chatbot_conversations">,
  
  // Customer
  customerId?: Id<"users">,
  customerName: string,
  customerEmail: string,
  
  // Ticket details
  subject: string,
  description: string,
  status: "open" | "pending" | "in_progress" | "resolved" | "closed",
  priority: "low" | "medium" | "high" | "urgent",
  
  // Assignment
  assignedTo?: Id<"users">,
  assignedAt?: number,
  
  // Categorization
  category?: string,
  tags?: string[],
  
  // Timestamps
  createdAt: number,
  updatedAt: number,
  resolvedAt?: number,
  closedAt?: number,
  
  // SLA
  dueDate?: number,
  firstResponseAt?: number,
  firstResponseTime?: number,     // Milliseconds
}
```

## Features

### 1. Dual Chatbot System

#### Frontend Chatbot (Anonymous/Leads)
- **Purpose**: Capture leads and provide initial support
- **Lead Capture**: Collects name, email, phone after N messages
- **Conversation Storage**: All messages stored with lead information
- **Agent Handoff**: Can request human agent
- **Analytics**: Track engagement, conversion, sentiment

#### User Panel Chatbot (Authenticated Users)
- **Purpose**: Provide support to logged-in customers
- **User Context**: Full access to user profile, order history, bookings
- **Conversation History**: Persistent across sessions
- **Agent Handoff**: Priority routing based on user tier
- **Integration**: Access to booking tools, account management

### 2. Agent Handoff System

#### Request Flow
1. User clicks "Talk to Agent" button
2. System creates agent queue entry
3. AI generates conversation summary
4. Available agents notified
5. Agent accepts and joins conversation
6. AI steps back, agent takes over
7. Agent can close or return to AI

#### Agent Dashboard
- **Queue View**: See pending requests with priority
- **Conversation Context**: AI summary, user history, sentiment
- **Live Chat**: Real-time messaging with customer
- **Actions**: Assign, transfer, resolve, create ticket
- **Notes**: Internal notes visible to agents only

### 3. Unified Inbox

#### Inbox Features
- **All Conversations**: Chatbot, email, tickets in one view
- **Filters**: Status, priority, assigned agent, date range
- **Search**: Full-text search across messages
- **Bulk Actions**: Assign, tag, close multiple items
- **Notifications**: Real-time alerts for new messages

#### Ticket Management
- **Auto-Creation**: Convert conversations to tickets
- **Manual Creation**: Create tickets from any source
- **Ticket Linking**: Link related tickets and conversations
- **SLA Tracking**: Monitor response and resolution times
- **Escalation**: Auto-escalate based on rules

### 4. AI Capabilities

#### Intent Detection
- Booking inquiries → Route to booking tools
- Account questions → Route to account tools
- General support → Use knowledge base
- Complex issues → Suggest agent handoff

#### Context Management
- **Session Memory**: n8n Simple Memory for short-term context
- **Long-term Memory**: Convex database for conversation history
- **User Context**: Access to user profile, preferences, history
- **Knowledge Base**: Search and retrieve relevant articles

#### Tool Integration
- `check_availability` - Check booking slots
- `book_appointment` - Create bookings
- `search_knowledge` - Find help articles
- `lookup_client` - Get customer information
- `create_lead` - Capture lead information

## Implementation Plan

### Phase 1: Conversation Storage (Current)
- [x] Fix chatbot UI (Send button positioning)
- [ ] Create Convex schema for conversations and messages
- [ ] Implement conversation creation on chat start
- [ ] Store all messages in database
- [ ] Add lead capture flow for frontend chatbot
- [ ] Link user panel conversations to userId

### Phase 2: Agent Handoff
- [ ] Create agent queue system
- [ ] Build agent dashboard UI
- [ ] Implement real-time notifications
- [ ] Add agent assignment logic
- [ ] Create conversation handoff flow
- [ ] Build agent chat interface

### Phase 3: Unified Inbox
- [ ] Design inbox UI (Zendesk-inspired)
- [ ] Implement conversation list with filters
- [ ] Add search functionality
- [ ] Create ticket management system
- [ ] Build bulk actions
- [ ] Add SLA tracking

### Phase 4: Advanced Features
- [ ] AI conversation summaries
- [ ] Sentiment analysis
- [ ] Auto-categorization
- [ ] Smart routing
- [ ] Analytics dashboard
- [ ] Reporting system

## API Endpoints

### Chatbot
- `POST /api/chat` - Send message to chatbot
- `GET /api/conversations/:id` - Get conversation history
- `POST /api/conversations/:id/request-agent` - Request agent handoff
- `POST /api/conversations/:id/capture-lead` - Capture lead information

### Agent
- `GET /api/agent/queue` - Get agent queue
- `POST /api/agent/queue/:id/accept` - Accept conversation
- `POST /api/agent/conversations/:id/message` - Send agent message
- `POST /api/agent/conversations/:id/close` - Close conversation

### Inbox
- `GET /api/inbox` - Get all conversations and tickets
- `GET /api/inbox/conversations` - Get conversations only
- `GET /api/inbox/tickets` - Get tickets only
- `POST /api/inbox/bulk-action` - Perform bulk action

### Tickets
- `POST /api/tickets` - Create ticket
- `GET /api/tickets/:id` - Get ticket details
- `PATCH /api/tickets/:id` - Update ticket
- `POST /api/tickets/:id/assign` - Assign ticket to agent

## n8n Workflow Configuration

### Chat Trigger Webhook
```
POST https://n8n.srv1010007.hstgr.cloud/webhook/{id}/chat

Body:
{
  "chatId": "session_id",
  "message": "user message",
  "route": "frontend" | "user_panel",
  "userId": "user_id" (optional)
}

Response:
{
  "output": "AI response"
}
```

### Workflow Nodes
1. **Chat Trigger** - Receives webhook
2. **Edit Fields** - Extracts message and metadata
3. **Simple Memory** - Loads conversation context
4. **AI Agent** - Processes message with tools
5. **Respond to Webhook** - Returns response

### Tool Configuration
Each tool is an HTTP Request node calling Convex backend:
- URL: `https://your-convex-url.convex.cloud/api/tool-name`
- Method: POST
- Body: Tool-specific parameters

## Best Practices

### Conversation Management
- Create conversation on first message
- Update lastMessageAt on every message
- Store both user and AI messages
- Track message count for analytics
- Set status based on agent involvement

### Lead Capture
- Trigger after 3-5 messages
- Make it conversational, not form-like
- Validate email format
- Store in both conversation and leads table
- Send welcome email after capture

### Agent Handoff
- Generate AI summary before handoff
- Notify available agents immediately
- Show estimated wait time to user
- Allow agent to review context before accepting
- Track handoff metrics (wait time, resolution time)

### Performance
- Use Convex indexes for fast queries
- Paginate conversation lists
- Cache frequently accessed data
- Use real-time subscriptions for live updates
- Optimize n8n workflow execution

## Security Considerations

- **Authentication**: Verify user identity for user panel chatbot
- **Authorization**: Agents can only access assigned conversations
- **Data Privacy**: Encrypt sensitive information
- **Rate Limiting**: Prevent abuse of chatbot
- **Input Validation**: Sanitize all user inputs
- **CORS**: Configure properly for webhook calls

## Monitoring & Analytics

### Metrics to Track
- Total conversations
- Messages per conversation
- Agent handoff rate
- Average wait time
- Resolution time
- Customer satisfaction
- AI accuracy
- Tool usage

### Alerts
- Long wait times in agent queue
- High error rates in n8n workflow
- Unusual conversation patterns
- SLA breaches
- System downtime

## Future Enhancements

- Multi-language support
- Voice chat integration
- Video call capability
- Screen sharing for agents
- Chatbot training interface
- Custom AI models
- WhatsApp/SMS integration
- Mobile app
- Advanced analytics with ML
- Predictive routing
