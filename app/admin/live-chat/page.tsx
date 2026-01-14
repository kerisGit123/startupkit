"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, User, Phone, Mail, Building } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export default function LiveChatPage() {
  const [selectedType, setSelectedType] = useState<"frontend" | "user_panel">("frontend");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedConversation, setSelectedConversation] = useState<Id<"chatbot_conversations"> | null>(null);

  const conversations = useQuery(api.chatbot.getActiveConversations, {
    type: selectedType,
    status: selectedStatus,
  });

  const conversation = selectedConversation
    ? conversations?.find((c) => c._id === selectedConversation)
    : null;

  const statusCounts = {
    all: conversations?.length || 0,
    active: conversations?.filter((c) => c.status === "active").length || 0,
    waiting_for_agent: conversations?.filter((c) => c.status === "waiting_for_agent").length || 0,
    admin_takeover: conversations?.filter((c) => c.status === "admin_takeover").length || 0,
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <h1 className="text-2xl font-bold">Live Chat Dashboard</h1>
        <p className="text-sm text-gray-500">Manage customer conversations in real-time</p>
      </div>

      {/* Chatbot Type Selector */}
      <div className="bg-white border-b px-4 py-2">
        <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
          <TabsList>
            <TabsTrigger value="frontend">Frontend Chatbot</TabsTrigger>
            <TabsTrigger value="user_panel">User Panel Chatbot</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Conversation List */}
        <div className="w-80 bg-white border-r flex flex-col">
          {/* Status Filters */}
          <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <h2 className="font-semibold mb-3">Conversations</h2>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedStatus("all")}
                className={`w-full flex justify-between items-center px-3 py-2 rounded-lg transition-colors ${
                  selectedStatus === "all" ? "bg-white/20" : "hover:bg-white/10"
                }`}
              >
                <span>All</span>
                <Badge variant="secondary" className="bg-white/30">
                  {statusCounts.all}
                </Badge>
              </button>
              <button
                onClick={() => setSelectedStatus("active")}
                className={`w-full flex justify-between items-center px-3 py-2 rounded-lg transition-colors ${
                  selectedStatus === "active" ? "bg-white/20" : "hover:bg-white/10"
                }`}
              >
                <span>Active</span>
                <Badge variant="secondary" className="bg-white/30">
                  {statusCounts.active}
                </Badge>
              </button>
              <button
                onClick={() => setSelectedStatus("waiting_for_agent")}
                className={`w-full flex justify-between items-center px-3 py-2 rounded-lg transition-colors ${
                  selectedStatus === "waiting_for_agent" ? "bg-white/20" : "hover:bg-white/10"
                }`}
              >
                <span>Waiting</span>
                <Badge variant="secondary" className="bg-white/30">
                  {statusCounts.waiting_for_agent}
                </Badge>
              </button>
              <button
                onClick={() => setSelectedStatus("admin_takeover")}
                className={`w-full flex justify-between items-center px-3 py-2 rounded-lg transition-colors ${
                  selectedStatus === "admin_takeover" ? "bg-white/20" : "hover:bg-white/10"
                }`}
              >
                <span>In Progress</span>
                <Badge variant="secondary" className="bg-white/30">
                  {statusCounts.admin_takeover}
                </Badge>
              </button>
            </div>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {conversations?.map((conv) => (
                <ConversationCard
                  key={conv._id}
                  conversation={conv}
                  isSelected={selectedConversation === conv._id}
                  onClick={() => setSelectedConversation(conv._id)}
                />
              ))}
              {conversations?.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No conversations yet</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Center Panel - Chat Interface */}
        <div className="flex-1 flex flex-col">
          {conversation ? (
            <ChatInterface conversation={conversation} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - User Attributes */}
        {conversation && (
          <div className="w-80 bg-white border-l">
            <UserAttributesPanel conversation={conversation} />
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationCard({ conversation, isSelected, onClick }: any) {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const timeSince = getTimeSince(conversation.updatedAt);

  const statusColors = {
    active: "bg-blue-100 text-blue-800",
    waiting_for_agent: "bg-yellow-100 text-yellow-800",
    admin_takeover: "bg-green-100 text-green-800",
    resolved: "bg-gray-100 text-gray-800",
    escalated: "bg-red-100 text-red-800",
  };

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-lg text-left transition-colors ${
        isSelected ? "bg-blue-50 border-2 border-blue-500" : "bg-white border hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold shrink-0">
          {conversation.userName?.[0]?.toUpperCase() || "U"}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <span className="font-semibold text-sm truncate">
              {conversation.userName || "Anonymous User"}
            </span>
            <span className="text-xs text-gray-500 shrink-0 ml-2">{timeSince}</span>
          </div>

          <p className="text-xs text-gray-600 truncate mb-2">
            {lastMessage?.content || "No messages yet"}
          </p>

          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${statusColors[conversation.status as keyof typeof statusColors]}`}>
              {conversation.status.replace("_", " ")}
            </Badge>
            {conversation.leadCaptured && (
              <Badge variant="outline" className="text-xs">
                Lead
              </Badge>
            )}
            {conversation.interventionRequested && (
              <Badge variant="destructive" className="text-xs">
                Urgent
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function ChatInterface({ conversation }: any) {
  const [message, setMessage] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const takeoverMutation = useMutation(api.chatbot.takeoverConversation);
  const sendMessageMutation = useMutation(api.chatbot.sendAdminMessage);
  const resolveMutation = useMutation(api.chatbot.resolveConversation);

  const quickReplies = [
    "Thanks for reaching out! How can I help you today?",
    "I understand your concern. Let me look into this for you.",
    "Could you provide more details about the issue?",
    "I'll escalate this to our technical team right away.",
    "Is there anything else I can help you with?",
    "Thank you for your patience!",
  ];

  const handleTakeover = async () => {
    await takeoverMutation({ conversationId: conversation._id });
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    await sendMessageMutation({
      conversationId: conversation._id,
      message: message.trim(),
    });
    setMessage("");
  };

  const handleResolve = async () => {
    await resolveMutation({ conversationId: conversation._id });
  };

  const isAdminInControl = conversation.status === "admin_takeover";

  return (
    <>
      {/* Chat Header */}
      <div className="bg-white border-b p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
            {conversation.userName?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h3 className="font-semibold">{conversation.userName || "Anonymous User"}</h3>
            <p className="text-sm text-gray-500">
              {conversation.userEmail || "No email provided"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {!isAdminInControl ? (
            <Button onClick={handleTakeover} variant="default">
              Take Over
            </Button>
          ) : (
            <>
              <Badge variant="default" className="px-3 py-1">
                You are in control
              </Badge>
              <Button onClick={handleResolve} variant="outline">
                Resolve
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 bg-gray-50">
        {conversation.messages.map((msg: any, idx: number) => (
          <div
            key={idx}
            className={`mb-4 flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
          >
            <div className={`max-w-[70%] ${msg.role === "user" ? "" : ""}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-600">
                  {msg.role === "admin"
                    ? "You"
                    : msg.role === "assistant"
                    ? "Bot"
                    : conversation.userName || "User"}
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
                  className={`p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-white border"
                      : msg.role === "admin"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {msg.content}
                </div>
              )}
            </div>
          </div>
        ))}
      </ScrollArea>

      {/* Input Area */}
      {isAdminInControl && (
        <div className="bg-white border-t p-4">
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
              ⚡
            </Button>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button onClick={handleSendMessage}>Send</Button>
          </div>
        </div>
      )}
    </>
  );
}

function UserAttributesPanel({ conversation }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [attributes, setAttributes] = useState({
    name: conversation.userName || "",
    email: conversation.userEmail || "",
    phone: conversation.userPhone || "",
    company: conversation.userCompany || "",
  });

  const updateAttributesMutation = useMutation(api.chatbot.updateUserAttributes);

  const handleSave = async () => {
    await updateAttributesMutation({
      conversationId: conversation._id,
      attributes,
    });
    setIsEditing(false);
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">User Attributes</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          >
            {isEditing ? "Save" : "Edit"}
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

          {/* Name */}
          <div>
            <Label className="text-xs text-gray-500 flex items-center gap-1">
              <User className="w-3 h-3" />
              Name
            </Label>
            {isEditing ? (
              <Input
                value={attributes.name}
                onChange={(e) => setAttributes({ ...attributes, name: e.target.value })}
                className="mt-1"
              />
            ) : (
              <p className="text-sm mt-1">{conversation.userName || "Not provided"}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <Label className="text-xs text-gray-500 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              Email
            </Label>
            {isEditing ? (
              <Input
                value={attributes.email}
                onChange={(e) => setAttributes({ ...attributes, email: e.target.value })}
                className="mt-1"
              />
            ) : (
              <p className="text-sm mt-1">{conversation.userEmail || "Not provided"}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <Label className="text-xs text-gray-500 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              Phone
            </Label>
            {isEditing ? (
              <Input
                value={attributes.phone}
                onChange={(e) => setAttributes({ ...attributes, phone: e.target.value })}
                className="mt-1"
              />
            ) : (
              <p className="text-sm mt-1">{conversation.userPhone || "Not provided"}</p>
            )}
          </div>

          {/* Company */}
          <div>
            <Label className="text-xs text-gray-500 flex items-center gap-1">
              <Building className="w-3 h-3" />
              Company
            </Label>
            {isEditing ? (
              <Input
                value={attributes.company}
                onChange={(e) => setAttributes({ ...attributes, company: e.target.value })}
                className="mt-1"
              />
            ) : (
              <p className="text-sm mt-1">{conversation.userCompany || "Not provided"}</p>
            )}
          </div>

          {/* Conversation Stats */}
          <div className="pt-3 border-t">
            <Label className="text-xs text-gray-500 mb-2 block">Conversation Stats</Label>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Messages:</span>
                <span className="font-medium">{conversation.messages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge variant="outline" className="text-xs">
                  {conversation.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="text-xs">
                  {new Date(conversation.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getTimeSince(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
