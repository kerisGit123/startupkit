# 🤖 Dual AI Chatbot System with n8n Integration

**Complete implementation guide for frontend and user panel chatbots with admin takeover capability**

---

## 📋 System Overview

### Architecture
This system implements **two independent AI chatbots** powered by n8n workflows:

1. **Frontend Chatbot** - Public-facing chatbot on landing page
   - Answers general questions about the product/service
   - Marketing and sales information
   - Pricing, features, and getting started guides
   - Lead capture and qualification

2. **User Panel Chatbot** - Authenticated user support chatbot
   - Technical support and how-to guides
   - Account-specific queries
   - Feature usage instructions
   - Troubleshooting assistance

### Key Features
- ✅ **Dual n8n Integration** - Separate workflows for frontend and user panel
- ✅ **Admin Takeover** - Admins can take control of any conversation
- ✅ **Real-time Chat** - Live messaging with conversation history
- ✅ **Session Management** - Persistent chat sessions with memory
- ✅ **Knowledge Base** - Separate knowledge bases for each chatbot
- ✅ **Analytics** - Track conversations, resolution rates, and user satisfaction
- ✅ **Activation Controls** - Enable/disable each chatbot independently
- ✅ **Lead Capture** - Collect visitor information with custom attributes
- ✅ **User Attributes** - Add/edit custom fields for lead qualification
- ✅ **Agent Intervention** - Users can request human agent or auto-escalate
- ✅ **Image Sharing** - Upload and send images in chat
- ✅ **Appointment Booking** - Schedule meetings directly from chat
- ✅ **Visual Widget Designer** - Customize widget appearance with live preview
- ✅ **Mobile Optimized** - Responsive design for all screen sizes

---

## 🗄️ Database Schema

### 1. Knowledge Base Tables

```typescript
// Separate knowledge bases for frontend and user panel
knowledge_base: defineTable({
  title: v.string(),
  content: v.string(),
  category: v.string(),
  type: v.union(v.literal("frontend"), v.literal("user_panel")), // NEW: Distinguish chatbot type
  tags: v.array(v.string()),
  keywords: v.array(v.string()),
  status: v.union(v.literal("draft"), v.literal("published")),
  version: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.string(),
}).index("by_type", ["type", "status"]),

// Chatbot configuration with visual designer settings
chatbot_config: defineTable({
  type: v.union(v.literal("frontend"), v.literal("user_panel")),
  isActive: v.boolean(), // Enable/disable chatbot
  n8nWebhookUrl: v.string(), // n8n webhook URL
  
  // Widget Designer Settings
  theme: v.union(v.literal("light"), v.literal("dark"), v.literal("auto")),
  position: v.union(v.literal("left"), v.literal("right")),
  roundness: v.number(), // 0-24px border radius
  
  // Branding
  companyName: v.string(),
  companyLogoUrl: v.optional(v.string()),
  logoStorageId: v.optional(v.string()),
  
  // Colors
  primaryColor: v.string(), // Main brand color
  secondaryColor: v.string(), // Accent color
  backgroundColor: v.string(), // Widget background
  textColor: v.string(), // Main text color
  userMessageBgColor: v.string(), // User message bubble
  aiMessageBgColor: v.string(), // AI message bubble
  userMessageTextColor: v.string(),
  aiMessageTextColor: v.string(),
  aiBorderColor: v.string(),
  aiTextColor: v.string(),
  
  // Dark Theme Colors
  darkPrimaryColor: v.optional(v.string()),
  darkSecondaryColor: v.optional(v.string()),
  darkBackgroundColor: v.optional(v.string()),
  darkTextColor: v.optional(v.string()),
  
  // Messages
  welcomeMessage: v.string(),
  responseTimeText: v.string(), // "We typically respond right away"
  firstBotMessage: v.string(),
  placeholderText: v.string(),
  
  // Features
  showThemeToggle: v.boolean(),
  showCompanyLogo: v.boolean(),
  showResponseTime: v.boolean(),
  enableSoundNotifications: v.boolean(),
  enableTypingIndicator: v.boolean(),
  
  // Mobile Settings
  mobileFullScreen: v.boolean(), // Full screen on mobile
  mobilePosition: v.union(v.literal("bottom"), v.literal("top")),
  
  updatedAt: v.number(),
  updatedBy: v.string(),
}).index("by_type", ["type"]),

// Chatbot conversations with admin takeover support
chatbot_conversations: defineTable({
  sessionId: v.string(), // Unique session ID
  userId: v.optional(v.id("users")), // Authenticated user (null for frontend)
  type: v.union(v.literal("frontend"), v.literal("user_panel")),
  messages: v.array(v.object({
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("admin")), // NEW: admin role
    content: v.string(),
    timestamp: v.number(),
    senderId: v.optional(v.string()), // Admin ID if admin sent message
    imageUrl: v.optional(v.string()), // NEW: Image attachment URL
    imageStorageId: v.optional(v.string()), // NEW: Convex storage ID for image
    messageType: v.optional(v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("system"),
      v.literal("intervention_request") // NEW: User requested human agent
    )),
  })),
  status: v.union(
    v.literal("active"),
    v.literal("waiting_for_agent"), // NEW: User requested intervention
    v.literal("admin_takeover"), // Admin is handling conversation
    v.literal("resolved"),
    v.literal("escalated")
  ),
  takenOverBy: v.optional(v.id("users")), // Admin who took over
  takenOverAt: v.optional(v.number()),
  resolved: v.boolean(),
  escalatedToSupport: v.boolean(),
  interventionRequested: v.boolean(), // NEW: User manually requested agent
  interventionRequestedAt: v.optional(v.number()),
  // Lead capture fields
  userEmail: v.optional(v.string()),
  userName: v.optional(v.string()),
  userPhone: v.optional(v.string()),
  userCompany: v.optional(v.string()),
  leadCaptured: v.boolean(), // NEW: Whether lead info was collected
  leadCapturedAt: v.optional(v.number()),
  customAttributes: v.optional(v.object({})), // NEW: Dynamic custom fields
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_session", ["sessionId"])
  .index("by_type_status", ["type", "status"])
  .index("by_admin", ["takenOverBy"])
  .index("by_lead_captured", ["leadCaptured"]),

// Lead capture form configuration
lead_capture_config: defineTable({
  type: v.union(v.literal("frontend"), v.literal("user_panel")),
  isEnabled: v.boolean(),
  triggerAfterMessages: v.number(), // Show form after N messages
  requiredFields: v.array(v.string()), // ["email", "name", "phone"]
  customFields: v.array(v.object({
    fieldName: v.string(),
    fieldLabel: v.string(),
    fieldType: v.union(v.literal("text"), v.literal("email"), v.literal("phone"), v.literal("select"), v.literal("textarea")),
    isRequired: v.boolean(),
    options: v.optional(v.array(v.string())), // For select fields
    placeholder: v.optional(v.string()),
  })),
  formTitle: v.string(),
  formDescription: v.string(),
  updatedAt: v.number(),
}).index("by_type", ["type"]),

// Appointment bookings from chat
chat_appointments: defineTable({
  conversationId: v.id("chatbot_conversations"),
  sessionId: v.string(),
  type: v.union(v.literal("frontend"), v.literal("user_panel")),
  appointmentDate: v.number(),
  appointmentTime: v.string(), // "14:00"
  duration: v.number(), // Minutes
  timezone: v.string(),
  customerName: v.string(),
  customerEmail: v.string(),
  customerPhone: v.optional(v.string()),
  purpose: v.optional(v.string()),
  notes: v.optional(v.string()),
  status: v.union(
    v.literal("pending"),
    v.literal("confirmed"),
    v.literal("cancelled"),
    v.literal("completed")
  ),
  assignedTo: v.optional(v.id("users")), // Admin/agent assigned
  meetingLink: v.optional(v.string()), // Zoom/Google Meet link
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_conversation", ["conversationId"])
  .index("by_status", ["status"])
  .index("by_date", ["appointmentDate"]),

// User attributes for lead enrichment
user_attributes: defineTable({
  sessionId: v.string(),
  conversationId: v.id("chatbot_conversations"),
  attributes: v.object({}), // Dynamic key-value pairs
  source: v.union(v.literal("form"), v.literal("chat"), v.literal("admin")),
  collectedAt: v.number(),
  updatedAt: v.number(),
}).index("by_session", ["sessionId"])
  .index("by_conversation", ["conversationId"]),

// Chatbot analytics
chatbot_analytics: defineTable({
  sessionId: v.string(),
  type: v.union(v.literal("frontend"), v.literal("user_panel")),
  totalMessages: v.number(),
  resolvedByBot: v.boolean(),
  resolvedByAdmin: v.boolean(),
  adminTakeoverTime: v.optional(v.number()), // Time until admin took over
  resolutionTime: v.optional(v.number()), // Total time to resolve
  satisfactionRating: v.optional(v.number()), // 1-5 rating
  commonQuestions: v.array(v.string()),
  createdAt: v.number(),
}).index("by_type", ["type"]),

// Admin live chat queue
admin_chat_queue: defineTable({
  conversationId: v.id("chatbot_conversations"),
  type: v.union(v.literal("frontend"), v.literal("user_panel")),
  priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  status: v.union(v.literal("waiting"), v.literal("assigned"), v.literal("resolved")),
  assignedTo: v.optional(v.id("users")), // Admin assigned to chat
  assignedAt: v.optional(v.number()),
  waitTime: v.number(),
  createdAt: v.number(),
}).index("by_status", ["status"])
  .index("by_assigned", ["assignedTo"]),
```

---

## 🔧 Implementation Steps

### Phase 1: Admin Panel Configuration

#### 1.1 Create Chatbot Settings Page (`/admin/chatbot-settings`)

**Features**:
- Configure both chatbots (frontend + user panel)
- Enable/disable each chatbot independently
- Set n8n webhook URLs
- Customize widget appearance
- Test chatbot connections

**UI Components**:
```typescript
// app/admin/chatbot-settings/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ChatbotSettingsPage() {
  const frontendConfig = useQuery(api.chatbot.getConfig, { type: "frontend" });
  const userPanelConfig = useQuery(api.chatbot.getConfig, { type: "user_panel" });
  const updateConfig = useMutation(api.chatbot.updateConfig);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Chatbot Configuration</h1>
      
      <Tabs defaultValue="frontend">
        <TabsList>
          <TabsTrigger value="frontend">Frontend Chatbot</TabsTrigger>
          <TabsTrigger value="user_panel">User Panel Chatbot</TabsTrigger>
        </TabsList>

        <TabsContent value="frontend">
          <ChatbotConfigCard 
            config={frontendConfig}
            type="frontend"
            onUpdate={updateConfig}
          />
        </TabsContent>

        <TabsContent value="user_panel">
          <ChatbotConfigCard 
            config={userPanelConfig}
            type="user_panel"
            onUpdate={updateConfig}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChatbotConfigCard({ config, type, onUpdate }) {
  const [isActive, setIsActive] = useState(config?.isActive || false);
  const [webhookUrl, setWebhookUrl] = useState(config?.n8nWebhookUrl || "");
  const [widgetColor, setWidgetColor] = useState(config?.widgetColor || "#854fff");

  const handleSave = async () => {
    await onUpdate({
      type,
      isActive,
      n8nWebhookUrl: webhookUrl,
      widgetColor,
      welcomeMessage: config?.welcomeMessage || "Hi 👋, how can we help?",
      placeholderText: "Type your message here...",
      position: "right",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {type === "frontend" ? "Frontend" : "User Panel"} Chatbot Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Activation Switch */}
        <div className="flex items-center justify-between">
          <Label>Enable Chatbot</Label>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>

        {/* n8n Webhook URL */}
        <div>
          <Label>n8n Webhook URL</Label>
          <Input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-n8n-instance.com/webhook/..."
          />
          <p className="text-sm text-gray-500 mt-1">
            Create a webhook trigger in n8n and paste the URL here
          </p>
        </div>

        {/* Widget Color */}
        <div>
          <Label>Widget Primary Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={widgetColor}
              onChange={(e) => setWidgetColor(e.target.value)}
              className="w-20"
            />
            <Input
              value={widgetColor}
              onChange={(e) => setWidgetColor(e.target.value)}
              placeholder="#854fff"
            />
          </div>
        </div>

        {/* Test Connection */}
        <Button variant="outline" onClick={() => testWebhook(webhookUrl)}>
          Test Connection
        </Button>

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full">
          Save Configuration
        </Button>
      </CardContent>
    </Card>
  );
}

async function testWebhook(url: string) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: "test_" + Date.now(),
        message: "Test connection",
        route: "test"
      })
    });
    const data = await response.json();
    alert("Connection successful! Response: " + JSON.stringify(data));
  } catch (error) {
    alert("Connection failed: " + error.message);
  }
}
```

#### 1.2 Create Admin Live Chat Dashboard (`/admin/live-chat`)

**Features**:
- View all active conversations
- See waiting queue
- Take over conversations
- Chat directly with users
- View conversation history
- Mark conversations as resolved

**UI Components**:
```typescript
// app/admin/live-chat/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LiveChatDashboard() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [chatType, setChatType] = useState<"frontend" | "user_panel">("frontend");

  const activeChats = useQuery(api.chatbot.getActiveConversations, { type: chatType });
  const takeoverChat = useMutation(api.chatbot.takeoverConversation);
  const sendMessage = useMutation(api.chatbot.sendAdminMessage);

  return (
    <div className="h-screen flex">
      {/* Left Sidebar - Conversation List */}
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Live Chats</h2>
          <Tabs value={chatType} onValueChange={(v) => setChatType(v as any)}>
            <TabsList className="w-full mt-2">
              <TabsTrigger value="frontend" className="flex-1">
                Frontend
              </TabsTrigger>
              <TabsTrigger value="user_panel" className="flex-1">
                User Panel
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="h-[calc(100vh-120px)]">
          {activeChats?.map((chat) => (
            <ConversationItem
              key={chat._id}
              conversation={chat}
              isSelected={selectedConversation?._id === chat._id}
              onClick={() => setSelectedConversation(chat)}
            />
          ))}
        </ScrollArea>
      </div>

      {/* Right Panel - Chat Interface */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ChatInterface
            conversation={selectedConversation}
            onTakeover={() => takeoverChat({ conversationId: selectedConversation._id })}
            onSendMessage={(message) => sendMessage({
              conversationId: selectedConversation._id,
              message
            })}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationItem({ conversation, isSelected, onClick }) {
  return (
    <div
      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
        isSelected ? "bg-blue-50" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-semibold">
            {conversation.userName || "Anonymous User"}
          </p>
          <p className="text-sm text-gray-500">{conversation.userEmail}</p>
        </div>
        <Badge variant={conversation.status === "admin_takeover" ? "default" : "secondary"}>
          {conversation.status}
        </Badge>
      </div>
      <p className="text-sm text-gray-600 truncate">
        {conversation.messages[conversation.messages.length - 1]?.content}
      </p>
      <p className="text-xs text-gray-400 mt-1">
        {new Date(conversation.updatedAt).toLocaleTimeString()}
      </p>
    </div>
  );
}

function ChatInterface({ conversation, onTakeover, onSendMessage }) {
  const [message, setMessage] = useState("");
  const isAdminControlled = conversation.status === "admin_takeover";

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h3 className="font-bold">{conversation.userName || "Anonymous"}</h3>
          <p className="text-sm text-gray-500">{conversation.userEmail}</p>
        </div>
        {!isAdminControlled && (
          <Button onClick={onTakeover}>Take Over Conversation</Button>
        )}
        {isAdminControlled && (
          <Badge variant="default">You are in control</Badge>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {conversation.messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-4 ${
              msg.role === "user" ? "text-left" : "text-right"
            }`}
          >
            <div
              className={`inline-block p-3 rounded-lg ${
                msg.role === "user"
                  ? "bg-gray-100"
                  : msg.role === "admin"
                  ? "bg-green-100"
                  : "bg-blue-100"
              }`}
            >
              <p className="text-sm font-semibold mb-1">
                {msg.role === "admin" ? "Admin" : msg.role === "assistant" ? "Bot" : "User"}
              </p>
              <p>{msg.content}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </ScrollArea>

      {/* Input */}
      {isAdminControlled && (
        <div className="p-4 border-t flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
          />
          <Button onClick={handleSend}>Send</Button>
        </div>
      )}
    </>
  );
}
```

---

## 🎯 Advanced Features Implementation

### Feature 1: Lead Capture Form

**Purpose**: Automatically collect visitor information during chat conversations to qualify leads.

**Trigger Logic**:
- Show form after N messages (configurable, default: 3)
- Only for frontend chatbot (not user panel)
- Skip if lead already captured
- Can be triggered manually by bot

**Lead Capture Form Component**:
```typescript
// components/LeadCaptureForm.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface LeadCaptureFormProps {
  onSubmit: (data: any) => void;
  customFields?: any[];
}

export function LeadCaptureForm({ onSubmit, customFields }: LeadCaptureFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm">
      <h3 className="font-bold text-lg mb-2">Let's get to know you better</h3>
      <p className="text-sm text-gray-600 mb-4">
        Please share your details so we can assist you better
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Your full name"
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your@email.com"
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <div>
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="Your company name"
          />
        </div>

        {/* Render custom fields dynamically */}
        {customFields?.map((field) => (
          <div key={field.fieldName}>
            <Label htmlFor={field.fieldName}>
              {field.fieldLabel} {field.isRequired && "*"}
            </Label>
            {field.fieldType === "textarea" ? (
              <Textarea
                id={field.fieldName}
                placeholder={field.placeholder}
                required={field.isRequired}
              />
            ) : field.fieldType === "select" ? (
              <select className="w-full border rounded p-2" required={field.isRequired}>
                <option value="">Select...</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <Input
                id={field.fieldName}
                type={field.fieldType}
                placeholder={field.placeholder}
                required={field.isRequired}
              />
            )}
          </div>
        ))}

        <Button type="submit" className="w-full">
          Continue Chat
        </Button>
      </form>
    </div>
  );
}
```

---

### Feature 2: User Attributes Management (Admin Panel)

**Purpose**: View and edit captured lead information and custom attributes.

**Admin UI Component** (`/admin/live-chat` - Right Sidebar):
```typescript
// components/UserAttributesPanel.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserAttributesPanelProps {
  conversation: any;
  onUpdateAttributes: (attributes: any) => void;
}

export function UserAttributesPanel({ conversation, onUpdateAttributes }: UserAttributesPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [attributes, setAttributes] = useState(conversation.customAttributes || {});

  const handleSave = () => {
    onUpdateAttributes(attributes);
    setIsEditing(false);
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">User Attributes</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Lead Status */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Lead Captured:</span>
          <Badge variant={conversation.leadCaptured ? "default" : "secondary"}>
            {conversation.leadCaptured ? "Yes" : "No"}
          </Badge>
        </div>

        {/* Core Fields */}
        <div>
          <Label className="text-xs text-gray-500">Name</Label>
          {isEditing ? (
            <Input
              value={attributes.name || conversation.userName || ""}
              onChange={(e) => setAttributes({ ...attributes, name: e.target.value })}
            />
          ) : (
            <p className="text-sm">{conversation.userName || "Not provided"}</p>
          )}
        </div>

        <div>
          <Label className="text-xs text-gray-500">Email</Label>
          {isEditing ? (
            <Input
              type="email"
              value={attributes.email || conversation.userEmail || ""}
              onChange={(e) => setAttributes({ ...attributes, email: e.target.value })}
            />
          ) : (
            <p className="text-sm">{conversation.userEmail || "Not provided"}</p>
          )}
        </div>

        <div>
          <Label className="text-xs text-gray-500">Phone</Label>
          {isEditing ? (
            <Input
              value={attributes.phone || conversation.userPhone || ""}
              onChange={(e) => setAttributes({ ...attributes, phone: e.target.value })}
            />
          ) : (
            <p className="text-sm">{conversation.userPhone || "Not provided"}</p>
          )}
        </div>

        <div>
          <Label className="text-xs text-gray-500">Company</Label>
          {isEditing ? (
            <Input
              value={attributes.company || conversation.userCompany || ""}
              onChange={(e) => setAttributes({ ...attributes, company: e.target.value })}
            />
          ) : (
            <p className="text-sm">{conversation.userCompany || "Not provided"}</p>
          )}
        </div>

        {/* Custom Attributes */}
        {Object.keys(conversation.customAttributes || {}).map((key) => (
          <div key={key}>
            <Label className="text-xs text-gray-500">{key}</Label>
            {isEditing ? (
              <Input
                value={attributes[key] || ""}
                onChange={(e) => setAttributes({ ...attributes, [key]: e.target.value })}
              />
            ) : (
              <p className="text-sm">{conversation.customAttributes[key]}</p>
            )}
          </div>
        ))}

        {isEditing && (
          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

---

### Feature 3: Agent Intervention (Manual Request)

**Purpose**: Allow users to request human agent assistance at any time.

**Implementation**:

**1. Add "Talk to Agent" Button in Chat Widget**:
```typescript
// Inside ChatWidget component, add action buttons
<div className="flex gap-2 p-3 border-t bg-gray-50">
  <Button
    variant="outline"
    size="sm"
    onClick={requestAgentIntervention}
    className="flex items-center gap-1"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
    Talk to Agent
  </Button>
  
  <Button
    variant="outline"
    size="sm"
    onClick={openAppointmentBooking}
    className="flex items-center gap-1"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    Book Meeting
  </Button>
</div>

const requestAgentIntervention = async () => {
  const systemMessage = {
    role: "system",
    content: "User requested to speak with an agent. Connecting...",
    timestamp: Date.now(),
    messageType: "intervention_request",
  };
  
  setMessages((prev) => [...prev, systemMessage]);
  
  // Update conversation status in database
  await fetch("/api/chatbot/request-intervention", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  
  // Show waiting message
  const waitingMessage = {
    role: "assistant",
    content: "An agent will be with you shortly. Average wait time: 2-3 minutes.",
    timestamp: Date.now(),
  };
  
  setMessages((prev) => [...prev, waitingMessage]);
};
```

**2. Auto-Escalation Logic (in n8n workflow)**:
```json
{
  "name": "Check for Escalation Keywords",
  "type": "n8n-nodes-base.function",
  "parameters": {
    "functionCode": "const message = $input.item.json.message.toLowerCase();\nconst escalationKeywords = ['speak to human', 'talk to agent', 'real person', 'human help', 'not helpful', 'frustrated'];\nconst shouldEscalate = escalationKeywords.some(keyword => message.includes(keyword));\nreturn { shouldEscalate, message: $input.item.json.message };"
  }
}
```

---

### Feature 4: Image Sharing in Chat

**Purpose**: Allow users and admins to send images in conversations.

**Implementation**:

**1. Add Image Upload to Chat Widget**:
```typescript
// components/ChatWidget.tsx - Add image upload
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const [uploadingImage, setUploadingImage] = useState(false);
const generateUploadUrl = useMutation(api.chatbot.generateUploadUrl);
const sendImageMessage = useMutation(api.chatbot.sendImageMessage);

const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  // Validate file type and size
  if (!file.type.startsWith("image/")) {
    alert("Please upload an image file");
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    alert("Image must be less than 5MB");
    return;
  }
  
  setUploadingImage(true);
  
  try {
    // Get upload URL from Convex
    const uploadUrl = await generateUploadUrl();
    
    // Upload file to Convex storage
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    
    const { storageId } = await result.json();
    
    // Send image message
    await sendImageMessage({
      sessionId,
      storageId,
      fileName: file.name,
    });
    
    // Add to local messages
    const imageMessage = {
      role: "user",
      content: "Sent an image",
      imageStorageId: storageId,
      messageType: "image",
      timestamp: Date.now(),
    };
    
    setMessages((prev) => [...prev, imageMessage]);
  } catch (error) {
    console.error("Image upload failed:", error);
    alert("Failed to upload image");
  } finally {
    setUploadingImage(false);
  }
};

// Add image upload button to input area
<div className="p-3 border-t flex gap-2">
  <label htmlFor="image-upload" className="cursor-pointer">
    <input
      id="image-upload"
      type="file"
      accept="image/*"
      onChange={handleImageUpload}
      className="hidden"
    />
    <Button variant="outline" size="icon" disabled={uploadingImage} asChild>
      <span>
        {uploadingImage ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </span>
    </Button>
  </label>
  
  <input
    type="text"
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
    placeholder={config?.placeholderText || "Type your message..."}
    className="flex-1 px-3 py-2 border rounded-lg outline-none"
  />
  
  <button
    onClick={sendMessage}
    className="px-4 py-2 text-white rounded-lg"
    style={{ backgroundColor: config?.widgetColor || "#854fff" }}
  >
    Send
  </button>
</div>
```

**2. Display Images in Chat**:
```typescript
// Render image messages
{messages.map((msg, idx) => (
  <div key={idx} className={`mb-3 ${msg.role === "user" ? "text-left" : "text-right"}`}>
    {msg.messageType === "image" ? (
      <div className="inline-block">
        <img
          src={msg.imageUrl}
          alt="Uploaded image"
          className="max-w-[200px] rounded-lg shadow"
        />
      </div>
    ) : (
      <div
        className={`inline-block p-3 rounded-lg ${
          msg.role === "user" ? "bg-gray-100 text-gray-900" : "text-white"
        }`}
        style={msg.role !== "user" ? { backgroundColor: config?.widgetColor || "#854fff" } : {}}
      >
        {msg.content}
      </div>
    )}
  </div>
))}
```

---

### Feature 5: Appointment Booking

**Purpose**: Allow users to schedule meetings directly from chat.

**Appointment Booking Modal Component**:
```typescript
// components/AppointmentBookingModal.tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBook: (appointment: any) => void;
  sessionId: string;
}

export function AppointmentBookingModal({ isOpen, onClose, onBook, sessionId }: AppointmentBookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    purpose: "",
    notes: "",
  });

  const availableTimeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      alert("Please select date and time");
      return;
    }
    
    onBook({
      sessionId,
      appointmentDate: selectedDate.getTime(),
      appointmentTime: selectedTime,
      duration: 30, // 30 minutes default
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...formData,
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book an Appointment</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column - Calendar */}
            <div>
              <Label>Select Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                className="rounded-md border"
              />
            </div>
            
            {/* Right Column - Time Slots */}
            <div>
              <Label>Select Time</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {availableTimeSlots.map((time) => (
                  <Button
                    key={time}
                    type="button"
                    variant={selectedTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Contact Information */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="purpose">Purpose of Meeting</Label>
              <Input
                id="purpose"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="e.g., Product demo, Consultation"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any specific topics or questions?"
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Book Appointment
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Feature 6: Enhanced Admin UI (Ticket-Style Interface)

**Purpose**: Match the reference design with a modern ticket management interface.

**Updated Admin Live Chat Dashboard**:
```typescript
// app/admin/live-chat/page.tsx - Enhanced version
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAttributesPanel } from "@/components/UserAttributesPanel";

export default function LiveChatDashboard() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [chatType, setChatType] = useState<"frontend" | "user_panel">("frontend");
  const [statusFilter, setStatusFilter] = useState("all");

  const activeChats = useQuery(api.chatbot.getActiveConversations, { 
    type: chatType,
    status: statusFilter === "all" ? undefined : statusFilter
  });
  
  const takeoverChat = useMutation(api.chatbot.takeoverConversation);
  const sendMessage = useMutation(api.chatbot.sendAdminMessage);
  const updateAttributes = useMutation(api.chatbot.updateUserAttributes);
  const resolveConversation = useMutation(api.chatbot.resolveConversation);

  // Count conversations by status
  const statusCounts = {
    all: activeChats?.length || 0,
    active: activeChats?.filter(c => c.status === "active").length || 0,
    waiting: activeChats?.filter(c => c.status === "waiting_for_agent").length || 0,
    inProgress: activeChats?.filter(c => c.status === "admin_takeover").length || 0,
    resolved: activeChats?.filter(c => c.status === "resolved").length || 0,
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Sidebar - Conversation List */}
      <div className="w-80 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600">
          <h2 className="text-xl font-bold text-white mb-3">Live Chats</h2>
          
          {/* Chatbot Type Tabs */}
          <Tabs value={chatType} onValueChange={(v) => setChatType(v as any)} className="w-full">
            <TabsList className="w-full bg-white/20">
              <TabsTrigger value="frontend" className="flex-1 text-white data-[state=active]:bg-white data-[state=active]:text-blue-600">
                Frontend
              </TabsTrigger>
              <TabsTrigger value="user_panel" className="flex-1 text-white data-[state=active]:bg-white data-[state=active]:text-purple-600">
                User Panel
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Status Filter */}
        <div className="p-3 border-b bg-gray-50">
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={statusFilter === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setStatusFilter("all")}
            >
              All ({statusCounts.all})
            </Badge>
            <Badge
              variant={statusFilter === "active" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setStatusFilter("active")}
            >
              Active ({statusCounts.active})
            </Badge>
            <Badge
              variant={statusFilter === "waiting_for_agent" ? "default" : "outline"}
              className="cursor-pointer bg-yellow-100 text-yellow-800"
              onClick={() => setStatusFilter("waiting_for_agent")}
            >
              Waiting ({statusCounts.waiting})
            </Badge>
            <Badge
              variant={statusFilter === "admin_takeover" ? "default" : "outline"}
              className="cursor-pointer bg-green-100 text-green-800"
              onClick={() => setStatusFilter("admin_takeover")}
            >
              In Progress ({statusCounts.inProgress})
            </Badge>
          </div>
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1">
          {activeChats?.map((chat) => (
            <ConversationTicket
              key={chat._id}
              conversation={chat}
              isSelected={selectedConversation?._id === chat._id}
              onClick={() => setSelectedConversation(chat)}
            />
          ))}
          
          {activeChats?.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p>No conversations found</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Center Panel - Chat Interface */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <EnhancedChatInterface
            conversation={selectedConversation}
            onTakeover={() => takeoverChat({ conversationId: selectedConversation._id })}
            onSendMessage={(message) => sendMessage({
              conversationId: selectedConversation._id,
              message
            })}
            onResolve={() => resolveConversation({ conversationId: selectedConversation._id })}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg">Select a conversation to start chatting</p>
          </div>
        )}
      </div>

      {/* Right Sidebar - User Attributes */}
      {selectedConversation && (
        <div className="w-80 bg-white border-l p-4 overflow-y-auto">
          <UserAttributesPanel
            conversation={selectedConversation}
            onUpdateAttributes={(attrs) => updateAttributes({
              conversationId: selectedConversation._id,
              attributes: attrs
            })}
          />
          
          {/* Conversation Stats */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Messages:</span>
                <span className="font-semibold">{selectedConversation.messages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-semibold">
                  {Math.round((Date.now() - selectedConversation.createdAt) / 60000)} min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Source:</span>
                <Badge variant="outline">{selectedConversation.type}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function ConversationTicket({ conversation, isSelected, onClick }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-blue-100 text-blue-800";
      case "waiting_for_agent": return "bg-yellow-100 text-yellow-800";
      case "admin_takeover": return "bg-green-100 text-green-800";
      case "resolved": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const timeSince = Math.round((Date.now() - conversation.updatedAt) / 60000);

  return (
    <div
      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
        isSelected ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
      }`}
      onClick={onClick}
    >
      {/* Header Row */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <p className="font-semibold text-gray-900">
            {conversation.userName || "Anonymous User"}
          </p>
          <p className="text-xs text-gray-500">{conversation.userEmail || "No email"}</p>
        </div>
        <Badge className={`text-xs ${getStatusColor(conversation.status)}`}>
          {conversation.status.replace("_", " ")}
        </Badge>
      </div>

      {/* Last Message Preview */}
      <p className="text-sm text-gray-600 truncate mb-2">
        {lastMessage?.messageType === "image" ? "📷 Image" : lastMessage?.content}
      </p>

      {/* Footer Row */}
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>{timeSince < 1 ? "Just now" : `${timeSince}m ago`}</span>
        <div className="flex gap-2">
          {conversation.interventionRequested && (
            <Badge variant="outline" className="text-xs bg-red-50 text-red-600">
              🚨 Urgent
            </Badge>
          )}
          {conversation.leadCaptured && (
            <Badge variant="outline" className="text-xs">
              ✓ Lead
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function EnhancedChatInterface({ conversation, onTakeover, onSendMessage, onResolve }) {
  const [message, setMessage] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const isAdminControlled = conversation.status === "admin_takeover";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages]);

  const quickReplies = [
    "Thanks for reaching out! How can I help you today?",
    "Let me look into that for you.",
    "I'll need a few more details. Can you provide...",
    "Great question! Here's what I can tell you...",
    "Is there anything else I can help you with?",
  ];

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
            {conversation.userName?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{conversation.userName || "Anonymous User"}</h3>
            <p className="text-sm text-gray-500">{conversation.userEmail || "No email provided"}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {!isAdminControlled && conversation.status !== "resolved" && (
            <Button onClick={onTakeover} size="sm">
              Take Over
            </Button>
          )}
          {isAdminControlled && (
            <>
              <Badge variant="default" className="bg-green-600">
                You are in control
              </Badge>
              <Button onClick={onResolve} variant="outline" size="sm">
                Resolve
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 bg-gray-50">
        {conversation.messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-4 flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
          >
            <div className={`max-w-[70%] ${msg.role === "user" ? "" : ""}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-600">
                  {msg.role === "admin" ? "You" : msg.role === "assistant" ? "Bot" : conversation.userName || "User"}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              {msg.messageType === "image" ? (
                <img
                  src={msg.imageUrl}
                  alt="Uploaded"
                  className="max-w-full rounded-lg shadow"
                />
              ) : (
                <div
                  className={`p-3 rounded-lg shadow-sm ${
                    msg.role === "user"
                      ? "bg-white text-gray-900"
                      : msg.role === "admin"
                      ? "bg-green-600 text-white"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {msg.content}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input Area */}
      {isAdminControlled && (
        <div className="p-4 border-t bg-white">
          {/* Quick Replies */}
          {showQuickReplies && (
            <div className="mb-3 flex flex-wrap gap-2">
              {quickReplies.map((reply, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMessage(reply);
                    setShowQuickReplies(false);
                  }}
                  className="text-xs"
                >
                  {reply}
                </Button>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowQuickReplies(!showQuickReplies)}
              title="Quick Replies"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </Button>
            
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Type your message..."
              className="flex-1"
            />
            
            <Button onClick={handleSend}>
              Send
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
```

---

### Phase 2: Frontend Chatbot Widget

#### 2.1 Create Reusable Chat Widget Component

```typescript
// components/ChatWidget.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface ChatWidgetProps {
  type: "frontend" | "user_panel";
  userId?: string;
}

export function ChatWidget({ type, userId }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const config = useQuery(api.chatbot.getConfig, { type });

  useEffect(() => {
    // Generate or retrieve session ID
    const storedSessionId = sessionStorage.getItem(`chatbot_session_${type}`);
    if (storedSessionId) {
      setSessionId(storedSessionId);
      // Load conversation history
      loadConversationHistory(storedSessionId);
    } else {
      const newSessionId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      sessionStorage.setItem(`chatbot_session_${type}`, newSessionId);
    }
  }, [type]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!config?.isActive) return null;

  const sendMessage = async () => {
    if (!input.trim() || !config?.n8nWebhookUrl) return;

    const userMessage = {
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await fetch(config.n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: sessionId,
          message: input,
          route: type,
          userId: userId || null,
        }),
      });

      const data = await response.json();

      const botMessage = {
        role: "assistant",
        content: data.output || "Sorry, I couldn't understand that.",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMessage]);

      // Save to database
      await saveMessage(sessionId, userMessage);
      await saveMessage(sessionId, botMessage);
    } catch (error) {
      console.error("Chat error:", error);
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-50"
          style={{ backgroundColor: config?.widgetColor || "#854fff" }}
        >
          <span className="text-2xl">💬</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 w-[350px] h-[500px] bg-white rounded-xl shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div
            className="p-5 text-white font-bold flex justify-between items-center rounded-t-xl"
            style={{ backgroundColor: config?.widgetColor || "#854fff" }}
          >
            <span>Chat</span>
            <button onClick={() => setIsOpen(false)} className="text-xl">
              ✖
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="mb-4 p-3 bg-gray-100 rounded-lg">
              <strong>{config?.welcomeMessage || "Hi 👋, how can we help?"}</strong>
            </div>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-3 p-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-gray-100 text-gray-900"
                    : "text-white"
                }`}
                style={
                  msg.role !== "user"
                    ? { backgroundColor: config?.widgetColor || "#854fff" }
                    : {}
                }
              >
                {msg.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder={config?.placeholderText || "Type your message..."}
              className="flex-1 px-3 py-2 border rounded-lg outline-none"
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2 text-white rounded-lg"
              style={{ backgroundColor: config?.widgetColor || "#854fff" }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

async function loadConversationHistory(sessionId: string) {
  // Implement loading from Convex
}

async function saveMessage(sessionId: string, message: any) {
  // Implement saving to Convex
}
```

#### 2.2 Add Widget to Landing Page

```typescript
// app/page.tsx
import { ChatWidget } from "@/components/ChatWidget";

export default function LandingPage() {
  return (
    <div>
      {/* Your landing page content */}
      
      {/* Frontend Chatbot Widget */}
      <ChatWidget type="frontend" />
    </div>
  );
}
```

#### 2.3 Add Widget to User Panel

```typescript
// app/dashboard/layout.tsx
import { ChatWidget } from "@/components/ChatWidget";
import { useUser } from "@clerk/nextjs";

export default function DashboardLayout({ children }) {
  const { user } = useUser();

  return (
    <div>
      {children}
      
      {/* User Panel Chatbot Widget */}
      <ChatWidget type="user_panel" userId={user?.id} />
    </div>
  );
}
```

---

### Phase 3: n8n Workflow Configuration

#### 3.1 Frontend Chatbot Workflow

**Workflow Structure**:
1. **Webhook Trigger** - Receives messages from frontend widget
2. **Extract Data** - Parse chatId, message, route
3. **Load Conversation History** - Get previous messages from Convex
4. **Query Knowledge Base** - Search frontend knowledge base
5. **AI Processing** - OpenAI/Claude with context
6. **Check for Escalation** - Determine if human needed
7. **Save to Database** - Store conversation in Convex
8. **Return Response** - Send AI response back

**n8n Nodes**:
```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "frontend-chatbot",
        "responseMode": "responseNode",
        "options": {}
      }
    },
    {
      "name": "HTTP Request - Load History",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://your-convex-url.convex.cloud/api/query",
        "method": "POST",
        "body": {
          "path": "chatbot:getConversation",
          "args": { "sessionId": "={{$json.chatId}}" }
        }
      }
    },
    {
      "name": "HTTP Request - Search Knowledge Base",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://your-convex-url.convex.cloud/api/query",
        "method": "POST",
        "body": {
          "path": "chatbot:searchKnowledgeBase",
          "args": {
            "query": "={{$json.message}}",
            "type": "frontend"
          }
        }
      }
    },
    {
      "name": "OpenAI Chat",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "resource": "chat",
        "model": "gpt-4",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "You are a helpful assistant for [Company Name]. Answer questions about our product, pricing, and features. Use the knowledge base context provided."
            },
            {
              "role": "user",
              "content": "={{$json.message}}"
            }
          ]
        },
        "options": {
          "temperature": 0.7,
          "maxTokens": 500
        }
      }
    },
    {
      "name": "HTTP Request - Save Message",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://your-convex-url.convex.cloud/api/mutation",
        "method": "POST",
        "body": {
          "path": "chatbot:saveMessage",
          "args": {
            "sessionId": "={{$json.chatId}}",
            "message": "={{$json.message}}",
            "response": "={{$json.output}}",
            "type": "frontend"
          }
        }
      }
    },
    {
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "respondWith": "json",
        "responseBody": {
          "output": "={{$json.output}}",
          "sessionId": "={{$json.chatId}}"
        }
      }
    }
  ]
}
```

#### 3.2 User Panel Chatbot Workflow

**Similar structure but with**:
- Access to user-specific data
- Technical support knowledge base
- Account information context
- Feature usage tracking

#### 3.3 Admin Takeover Detection

**Add to both workflows**:
```json
{
  "name": "Check Admin Takeover",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "https://your-convex-url.convex.cloud/api/query",
    "method": "POST",
    "body": {
      "path": "chatbot:checkAdminTakeover",
      "args": { "sessionId": "={{$json.chatId}}" }
    }
  }
}
```

**If admin has taken over**:
- Stop AI processing
- Route message directly to admin
- Notify admin of new user message
- Return "An admin will respond shortly" message

---

### Phase 4: Convex Backend Functions

#### 4.1 Chatbot Configuration Functions

```typescript
// convex/chatbot.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getConfig = query({
  args: { type: v.union(v.literal("frontend"), v.literal("user_panel")) },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("chatbot_config")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();
    return config;
  },
});

export const updateConfig = mutation({
  args: {
    type: v.union(v.literal("frontend"), v.literal("user_panel")),
    isActive: v.boolean(),
    n8nWebhookUrl: v.string(),
    widgetColor: v.string(),
    welcomeMessage: v.string(),
    placeholderText: v.string(),
    position: v.union(v.literal("left"), v.literal("right")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("chatbot_config")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("chatbot_config", {
        ...args,
        updatedAt: Date.now(),
        updatedBy: "admin",
      });
    }
  },
});
```

#### 4.2 Conversation Management Functions

```typescript
export const getActiveConversations = query({
  args: { type: v.union(v.literal("frontend"), v.literal("user_panel")) },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("chatbot_conversations")
      .withIndex("by_type_status", (q) =>
        q.eq("type", args.type).eq("status", "active")
      )
      .collect();
    return conversations;
  },
});

export const takeoverConversation = mutation({
  args: {
    conversationId: v.id("chatbot_conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.conversationId, {
      status: "admin_takeover",
      takenOverBy: identity.subject,
      takenOverAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Add to admin queue
    await ctx.db.insert("admin_chat_queue", {
      conversationId: args.conversationId,
      type: "frontend", // Get from conversation
      priority: "medium",
      status: "assigned",
      assignedTo: identity.subject,
      assignedAt: Date.now(),
      waitTime: 0,
      createdAt: Date.now(),
    });
  },
});

export const sendAdminMessage = mutation({
  args: {
    conversationId: v.id("chatbot_conversations"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const newMessage = {
      role: "admin" as const,
      content: args.message,
      timestamp: Date.now(),
      senderId: identity.subject,
    };

    await ctx.db.patch(args.conversationId, {
      messages: [...conversation.messages, newMessage],
      updatedAt: Date.now(),
    });
  },
});

export const checkAdminTakeover = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const conversation = await ctx.db
      .query("chatbot_conversations")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    return {
      isTakenOver: conversation?.status === "admin_takeover",
      adminId: conversation?.takenOverBy,
    };
  },
});
```

---

## 🎯 Implementation Checklist

### Database Setup
- [ ] Add all chatbot tables to `convex/schema.ts`
- [ ] Run `npx convex dev` to deploy schema
- [ ] Seed initial chatbot configurations

### Admin Panel
- [ ] Create `/admin/chatbot-settings` page
- [ ] Create `/admin/live-chat` dashboard
- [ ] Add navigation links to admin sidebar
- [ ] Test activation switches
- [ ] Test n8n webhook configuration

### Frontend Chatbot
- [ ] Create `ChatWidget` component
- [ ] Add widget to landing page
- [ ] Test widget appearance and functionality
- [ ] Configure n8n workflow
- [ ] Test end-to-end conversation

### User Panel Chatbot
- [ ] Add widget to dashboard layout
- [ ] Pass user authentication context
- [ ] Configure separate n8n workflow
- [ ] Test authenticated conversations

### n8n Workflows
- [ ] Create frontend chatbot workflow
- [ ] Create user panel chatbot workflow
- [ ] Configure OpenAI/Claude integration
- [ ] Set up knowledge base queries
- [ ] Test admin takeover detection
- [ ] Deploy and test webhooks

### Admin Takeover
- [ ] Test conversation takeover
- [ ] Test admin messaging
- [ ] Test notification system
- [ ] Test conversation resolution

### Knowledge Base
- [ ] Create frontend knowledge base articles
- [ ] Create user panel knowledge base articles
- [ ] Implement search functionality
- [ ] Test AI retrieval accuracy

---

## 📊 Analytics & Monitoring

### Key Metrics to Track
- **Response Time**: Average time for bot to respond
- **Resolution Rate**: % of conversations resolved by bot
- **Escalation Rate**: % requiring admin intervention
- **User Satisfaction**: Post-chat ratings
- **Common Questions**: Most frequent queries
- **Admin Takeover Time**: Average time until admin responds

### Analytics Dashboard
Create `/admin/chatbot-analytics` to display:
- Total conversations (frontend vs user panel)
- Resolution rates
- Average response times
- Top questions
- User satisfaction scores
- Admin performance metrics

---

## 🔒 Security Considerations

1. **Webhook Security**
   - Use HTTPS only
   - Implement webhook signature verification
   - Rate limit requests

2. **Data Privacy**
   - Don't log sensitive user information
   - Encrypt conversation data at rest
   - GDPR compliance for EU users

3. **Admin Access**
   - Role-based access control
   - Audit logs for admin takeovers
   - Session timeout for inactive admins

4. **API Keys**
   - Store n8n webhooks securely
   - Rotate keys regularly
   - Use environment variables

---

## 🚀 Future Enhancements

1. **Multi-language Support** - Detect user language and respond accordingly
2. **Voice Messages** - Allow voice input/output
3. **File Uploads** - Support document sharing
4. **Canned Responses** - Quick replies for admins
5. **Chatbot Training** - Learn from admin conversations
6. **Sentiment Analysis** - Detect frustrated users
7. **Proactive Chat** - Trigger chat based on user behavior
8. **Integration with Support Tickets** - Auto-create tickets from escalations

---

**Last Updated**: January 14, 2026  
**Status**: Ready for implementation  
**Maintained by**: StartupKit Development Team
