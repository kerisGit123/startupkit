"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  Mail,
  Inbox as InboxIcon,
  Search,
  Trash2,
  Star,
  MoreVertical,
  Reply,
  Forward,
  Ticket,
  MessageSquare,
  Bell,
  Send,
  Calendar,
  ExternalLink,
  Image as ImageIcon,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type MessageStatus = "unread" | "read" | "archived" | "replied";

export default function InboxPage() {
  // State declarations first
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "important">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [forwardEmail, setForwardEmail] = useState("");
  const [forwardNote, setForwardNote] = useState("");
  const [chatReply, setChatReply] = useState("");
  const [chatReplySending, setChatReplySending] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [labelFilter, setLabelFilter] = useState<string>("all");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [cleanupDays, setCleanupDays] = useState(90);
  const [cleanupRunning, setCleanupRunning] = useState(false);
  const [starredFilter, setStarredFilter] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  // Fetch real data from Convex (after state is declared)
  const groupedMessages = useQuery(api.inbox.getGroupedMessages, {});
  const unreadCountData = useQuery(api.inbox.getUnreadCount, {});
  const threadMessages = useQuery(
    api.inbox.getThread,
    selectedMessage && !selectedMessage._isChatbot && selectedMessage.threadId
      ? { threadId: selectedMessage.threadId }
      : "skip"
  );
  const ticketThread = useQuery(
    api.inbox.getTicketThread,
    selectedMessage && selectedMessage.channel === "ticket" && selectedMessage.threadId
      ? { ticketNumber: selectedMessage.threadId }
      : "skip"
  );
  const chatbotConversations = useQuery(api.chatbot.getChatbotConversations, {});
  const chatbotAppointments = useQuery(
    api.chatbot.getConversationAppointments,
    selectedMessage?._isChatbot && selectedMessage?._id
      ? { conversationId: selectedMessage._id }
      : "skip"
  );

  const cleanupPreview = useQuery(
    api.inboxCleanup.getCleanupPreview,
    cleanupDialogOpen ? { olderThanDays: cleanupDays } : "skip"
  );

  const replyToMessage = useMutation(api.inbox.replyToMessage);
  const forwardMessage = useMutation(api.inbox.forwardMessage);
  const toggleStar = useMutation(api.inbox.toggleStar);
  const updateWorkflowStatus = useMutation(api.inbox.updateWorkflowStatus);
  const deleteMessage = useMutation(api.inbox.deleteMessage);
  const adminReplyToConversation = useMutation(api.chatbot.adminReplyToConversation);
  const updateConversationLabel = useMutation(api.chatbot.updateConversationLabel);
  const requestRatingMutation = useMutation(api.chatbot.requestRating);
  const cleanOldChatbot = useMutation(api.inboxCleanup.cleanOldChatbot);
  const cleanOldInboxMessages = useMutation(api.inboxCleanup.cleanOldInboxMessages);
  const cleanOldEmailLogs = useMutation(api.inboxCleanup.cleanOldEmailLogs);
  const repairTicketInbox = useMutation(api.tickets.repairTicketInbox);

  // Live chatbot conversation data (reactive - updates when admin sends reply)
  const liveChatbotConversation = selectedMessage?._isChatbot
    ? (chatbotConversations || []).find((c: any) => c._id === selectedMessage._id)
    : null;

  // Date range filter helper
  const isWithinDateRange = (timestamp: number): boolean => {
    if (dateFilter === "all") return true;
    const now = Date.now();
    const ranges: Record<string, number> = {
      "1w": 7 * 86400000,
      "2w": 14 * 86400000,
      "1m": 30 * 86400000,
      "2m": 60 * 86400000,
      "3m": 90 * 86400000,
    };
    const range = ranges[dateFilter];
    return range ? (now - timestamp) <= range : true;
  };

  // Filter messages - use grouped messages (one entry per thread)
  const filteredMessages = (groupedMessages || []).filter((msg: any) => {
    if (msg.channel === "chatbot") return false; // chatbots appear only when escalated
    if (activeFilter === "unread" && !msg.hasUnread) return false;
    if (activeFilter === "important" && msg.workflowStatus !== "urgent" && msg.workflowStatus !== "follow-up") return false;
    if (searchQuery && !msg.subject?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !msg.body?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Only escalated chatbot convos surface in All Inbox
  const escalatedChatbotConversations = (chatbotConversations || []).filter((conv: any) =>
    conv.escalatedToSupport === true
  );

  const getMessageIcon = (channel: string) => {
    switch (channel) {
      case "ticket": return <Ticket className="w-4 h-4" />;
      case "chatbot": return <MessageSquare className="w-4 h-4" />;
      case "email": return <Mail className="w-4 h-4" />;
      case "sms": return <Bell className="w-4 h-4" />;
      default: return <InboxIcon className="w-4 h-4" />;
    }
  };

  const getTypeColor = (channel: string) => {
    switch (channel) {
      case "ticket": return "text-red-600 bg-red-50";
      case "chatbot": return "text-blue-600 bg-blue-50";
      case "email": return "text-purple-600 bg-purple-50";
      case "sms": return "text-orange-600 bg-orange-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const toggleMessageSelection = (id: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedMessages(newSelected);
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyBody.trim()) return;
    
    try {
      await replyToMessage({
        messageId: selectedMessage._id,
        body: replyBody.trim(),
      });
      toast.success("Reply sent successfully");
      setReplyDialogOpen(false);
      setReplyBody("");
    } catch (error) {
      toast.error("Failed to send reply");
    }
  };

  const handleForward = async () => {
    if (!selectedMessage || !forwardEmail.trim()) return;
    
    try {
      await forwardMessage({
        messageId: selectedMessage._id,
        toEmail: forwardEmail.trim(),
        note: forwardNote.trim() || undefined,
      });
      toast.success("Message forwarded successfully");
      setForwardDialogOpen(false);
      setForwardEmail("");
      setForwardNote("");
    } catch (error) {
      toast.error("Failed to forward message");
    }
  };

  const handleDelete = async () => {
    if (!selectedMessage) return;
    
    if (!confirm(`Delete ticket "${selectedMessage.subject}"? This cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteMessage({ id: selectedMessage._id });
      toast.success("Ticket deleted");
      setSelectedMessage(null);
    } catch {
      toast.error("Failed to delete ticket");
    }
  };

  const handleToggleStar = async (messageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleStar({ id: messageId as any });
    } catch (error) {
      toast.error("Failed to update star");
    }
  };

  const handleWorkflowStatus = async (status: "urgent" | "follow-up" | "resolved" | "pending") => {
    if (!selectedMessage) return;
    
    try {
      await updateWorkflowStatus({ 
        id: selectedMessage._id, 
        workflowStatus: status 
      });
      toast.success(`Marked as ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // Admin sends reply to chatbot conversation
  const handleChatReply = async () => {
    if (!selectedMessage?._isChatbot || !chatReply.trim()) return;
    setChatReplySending(true);
    try {
      await adminReplyToConversation({
        conversationId: selectedMessage._id,
        message: chatReply.trim(),
        adminName: "Support Admin",
      });
      setChatReply("");
      toast.success("Message sent to user");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setChatReplySending(false);
    }
  };

  // Update chatbot conversation label
  const handleChatbotLabel = async (label: "urgent" | "follow-up" | "resolved") => {
    if (!selectedMessage?._isChatbot) return;
    try {
      const newLabel = selectedMessage.label === label ? undefined : label;
      await updateConversationLabel({
        conversationId: selectedMessage._id,
        label: newLabel,
      });
      setSelectedMessage({ ...selectedMessage, label: newLabel });
      toast.success(newLabel ? `Labeled as ${label}` : "Label removed");
    } catch {
      toast.error("Failed to update label");
    }
  };

  // Send email to chatbot user
  const handleSendEmail = async () => {
    if (!selectedMessage?.userEmail || !emailSubject.trim() || !emailBody.trim()) return;
    setEmailSending(true);
    try {
      const res = await fetch("/api/chat/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedMessage.userEmail,
          subject: emailSubject.trim(),
          message: emailBody.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Email sent to ${selectedMessage.userEmail}`);
        setEmailDialogOpen(false);
        setEmailSubject("");
        setEmailBody("");
      } else {
        toast.error("Failed to send email");
      }
    } catch {
      toast.error("Failed to send email");
    } finally {
      setEmailSending(false);
    }
  };

  // Admin requests rating from chatbot user
  const handleRequestRating = async () => {
    if (!selectedMessage?._isChatbot) return;
    try {
      await requestRatingMutation({ conversationId: selectedMessage._id });
      toast.success("Rating request sent to user's chat widget");
    } catch (err: any) {
      toast.error(err?.message || "Failed to request rating");
    }
  };

  // Use grouped data directly - already has reply counts, apply date + label filter
  const ticketsWithReplyCounts = filteredMessages.filter((msg: any) => {
    if (!isWithinDateRange(msg.lastReplyAt || msg.sentAt)) return false;
    if (labelFilter !== "all" && msg.workflowStatus !== labelFilter) return false;
    if (starredFilter && !msg.starred) return false;
    return true;
  }).map((msg: any) => ({
    ...msg,
    hasNewReplies: msg.hasUnread || msg.hasNewCustomerReply,
  }));

  // Single unified list: tickets + escalated chatbot convos, sorted newest first
  const allInboxItems = [
    ...ticketsWithReplyCounts.map((msg: any) => ({
      ...msg,
      _source: "ticket" as const,
      _sortTime: msg.lastReplyAt || msg.updatedAt || msg.sentAt,
    })),
    ...escalatedChatbotConversations.map((conv: any) => ({
      ...conv,
      _source: "chatbot" as const,
      _isChatbot: true,
      _sortTime: conv.updatedAt || conv.createdAt,
    })),
  ].sort((a, b) => b._sortTime - a._sortTime);

  const unreadCount = unreadCountData?.total || 0;
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!groupedMessages) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ticket Inbox</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount} unread messages
          </p>
        </div>
        <Button size="sm" variant="outline" className="gap-2" asChild>
          <Link href="/admin/support-tickets">
            <Ticket className="w-4 h-4" />
            Ticket Queue
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
        {/* Left Sidebar - Navigation */}
        <Card className="col-span-2 p-2 overflow-y-auto">
          <div className="space-y-0.5">
            <div className="px-2 py-2 flex items-center justify-between">
              <span className="text-sm font-semibold">Support Tickets</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
                {allInboxItems.length}
              </Badge>
            </div>
            <div className="pt-2 mt-1 border-t">
              <Button
                variant={starredFilter ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start gap-2 h-9"
                onClick={() => setStarredFilter(!starredFilter)}
              >
                <Star className={cn("w-4 h-4 shrink-0", starredFilter && "fill-yellow-400 text-yellow-400")} />
                <span>Starred</span>
              </Button>
            </div>

            <div className="pt-3 mt-1 border-t">
              <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 px-2 uppercase tracking-wider">Labels</p>
              <Button
                variant={labelFilter === "urgent" ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start gap-2 h-8 text-xs"
                onClick={() => setLabelFilter(labelFilter === "urgent" ? "all" : "urgent")}
              >
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <span>Urgent</span>
              </Button>
              <Button
                variant={labelFilter === "follow-up" ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start gap-2 h-8 text-xs"
                onClick={() => setLabelFilter(labelFilter === "follow-up" ? "all" : "follow-up")}
              >
                <div className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
                <span>Follow-up</span>
              </Button>
              <Button
                variant={labelFilter === "resolved" ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start gap-2 h-8 text-xs"
                onClick={() => setLabelFilter(labelFilter === "resolved" ? "all" : "resolved")}
              >
                <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                <span>Resolved</span>
              </Button>
            </div>

            {/* Cleanup Section */}
            <div className="pt-3 mt-1 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setCleanupDialogOpen(true)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Cleanup Old Data</span>
              </Button>
            </div>

            {/* Queue Management Link */}
            <div className="pt-3 mt-1 border-t">
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-8 text-xs" asChild>
                <Link href="/admin/support-tickets">
                  <Ticket className="w-3.5 h-3.5 shrink-0" />
                  <span>Ticket Queue</span>
                  <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>

        {/* Middle - Message List */}
        <Card className="col-span-4 flex flex-col overflow-hidden border-l-0 border-r-0 rounded-none sm:rounded-lg sm:border">
          {/* Search and Filters */}
          <div className="p-3 border-b space-y-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                className="pl-10 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as "all" | "unread" | "important")}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
                <TabsTrigger value="important">Important</TabsTrigger>
              </TabsList>
            </Tabs>
            {/* Date Range + Label + User Type Filters */}
            <div className="flex gap-2 flex-wrap">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="flex-1 h-8 text-xs min-w-[100px]">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="1w">Last 1 Week</SelectItem>
                  <SelectItem value="2w">Last 2 Weeks</SelectItem>
                  <SelectItem value="1m">Last 1 Month</SelectItem>
                  <SelectItem value="2m">Last 2 Months</SelectItem>
                  <SelectItem value="3m">Last 3 Months</SelectItem>
                </SelectContent>
              </Select>
              <Select value={labelFilter} onValueChange={setLabelFilter}>
                <SelectTrigger className="flex-1 h-8 text-xs min-w-[100px]">
                  <SelectValue placeholder="All Labels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Labels</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Bar */}
          {selectedMessages.size > 0 && (
            <div className="px-4 py-2 border-b bg-muted/50 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                title="Delete selected"
                className="text-destructive hover:text-destructive"
                onClick={async () => {
                  if (!confirm(`Delete ${selectedMessages.size} message(s)? This cannot be undone.`)) return;
                  let failed = 0;
                  for (const id of selectedMessages) {
                    try { await deleteMessage({ id: id as any }); }
                    catch { failed++; }
                  }
                  setSelectedMessages(new Set());
                  if (failed > 0) toast.error(`${failed} deletion(s) failed`);
                  else toast.success(`${selectedMessages.size} message(s) deleted`);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground ml-auto">
                {selectedMessages.size} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => setSelectedMessages(new Set())}
              >
                Clear
              </Button>
            </div>
          )}

          {/* Message List */}
          <div className="flex-1 overflow-y-auto">
            {allInboxItems.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center p-8">
                  <InboxIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No tickets</p>
                  <p className="text-xs mt-1">Support tickets will appear here</p>
                </div>
              </div>
            ) : (
              <>
              {allInboxItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((item: any) =>
                  item._source === "chatbot" ? (
                    /* Chatbot item in All Inbox */
                    <div
                      key={`chat-${item._id}`}
                      onClick={() => setSelectedMessage({ ...item, _isChatbot: true })}
                      className={cn(
                        "p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors relative",
                        selectedMessage?._id === item._id && "bg-muted",
                        item.escalatedToSupport && "border-l-4 border-l-red-500"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">{item.userName}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-300 text-blue-700 bg-blue-50">
                              Chatbot
                            </Badge>
                            {item.escalatedToSupport && (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Escalated</Badge>
                            )}
                            {item.label && (
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                item.label === "urgent" && "bg-red-100 text-red-700",
                                item.label === "follow-up" && "bg-yellow-100 text-yellow-700",
                                item.label === "resolved" && "bg-green-100 text-green-700"
                              )}>
                                {item.label}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {formatDate(item._sortTime)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {item.lastMessageRole === "user" ? "Customer: " : "AI: "}
                            {item.lastMessageContent || "No messages"}
                          </p>
                          <div className="flex gap-1 mt-2 items-center flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                              {item.messageCount} messages
                            </span>
                            {item.hasAppointment && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">
                                📅 Booking
                              </span>
                            )}
                            {item.rating && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">
                                {"⭐".repeat(item.rating)}
                              </span>
                            )}
                            {item.userPhone && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-600">
                                📞 {item.userPhone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Ticket/Email item in All Inbox */
                    <div
                      key={`msg-${item._id}`}
                      onClick={() => setSelectedMessage(item)}
                      className={cn(
                        "p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors relative",
                        selectedMessage?._id === item._id && "bg-muted",
                        item.hasNewReplies && "bg-blue-50/30 border-l-4 border-l-blue-500"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                          item.channel === "ticket" ? "bg-red-100 text-red-700" : "bg-purple-100 text-purple-700"
                        )}>
                          {item.channel === "ticket" ? <Ticket className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">
                              {item.metadata?.userName || item.metadata?.senderName || "Unknown"}
                            </span>
                            <Badge variant="outline" className={cn(
                              "text-[10px] px-1.5 py-0",
                              item.channel === "ticket"
                                ? "border-red-300 text-red-700 bg-red-50"
                                : "border-purple-300 text-purple-700 bg-purple-50"
                            )}>
                              {item.channel === "ticket" ? "Ticket" : "Email"}
                            </Badge>
                            {item.hasNewReplies && (
                              <span className="flex items-center gap-1 text-xs font-medium text-blue-600">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                New reply
                              </span>
                            )}
                            {item.workflowStatus && (
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                item.workflowStatus === "urgent" && "bg-red-100 text-red-700",
                                item.workflowStatus === "follow-up" && "bg-yellow-100 text-yellow-700",
                                item.workflowStatus === "resolved" && "bg-green-100 text-green-700",
                              )}>
                                {item.workflowStatus}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {formatDate(item._sortTime)}
                            </span>
                          </div>
                          <p className="text-sm font-medium truncate mb-1">
                            {item.subject || "No subject"}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {item.body}
                          </p>
                          <div className="flex gap-1 mt-2 items-center">
                            {item.replyCount > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                                {item.replyCount} replies
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
                {allInboxItems.length > PAGE_SIZE && (
                  <div className="p-3 border-t flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, allInboxItems.length)} of {allInboxItems.length}
                    </span>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="h-7 px-2 text-xs">Prev</Button>
                      <Button variant="outline" size="sm" disabled={(page + 1) * PAGE_SIZE >= allInboxItems.length} onClick={() => setPage(p => p + 1)} className="h-7 px-2 text-xs">Next</Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Right - Message Detail */}
        <Card className="col-span-6 flex flex-col overflow-hidden">
          {selectedMessage ? (
            selectedMessage._isEmailLog ? (
              /* Email Log Detail View */
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      selectedMessage.status === "sent" && "border-green-300 text-green-700 bg-green-50",
                      selectedMessage.status === "failed" && "border-red-300 text-red-700 bg-red-50",
                      selectedMessage.status === "logged" && "border-gray-300 text-gray-600 bg-gray-50"
                    )}>
                      {selectedMessage.status === "sent" ? "✅ Sent" : selectedMessage.status === "failed" ? "❌ Failed" : "📝 Logged"}
                    </Badge>
                    {selectedMessage.templateType && (
                      <Badge variant="secondary" className="text-xs">{selectedMessage.templateType}</Badge>
                    )}
                    {selectedMessage.templateName && (
                      <Badge variant="secondary" className="text-xs">{selectedMessage.templateName}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(selectedMessage.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold">{selectedMessage.subject}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">To:</span> {selectedMessage.sentTo}
                  </p>
                  {selectedMessage.errorMessage && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <span className="font-medium">Error:</span> {selectedMessage.errorMessage}
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="prose max-w-none text-sm">
                    <div dangerouslySetInnerHTML={{ __html: selectedMessage.htmlContent || "<p>No content</p>" }} />
                  </div>
                </div>
              </div>
            ) : selectedMessage._isChatbot ? (
              /* Chatbot Conversation Detail View */
              <>
                <div className="p-4 border-b">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">{selectedMessage.userName}</h2>
                        <Badge variant="outline" className={cn(
                          "text-xs",
                          selectedMessage.type === "user_panel"
                            ? "border-blue-300 text-blue-700 bg-blue-50"
                            : "border-gray-300 text-gray-600 bg-gray-50"
                        )}>
                          {selectedMessage.type === "user_panel" ? "Logged-in User" : "Website Visitor"}
                        </Badge>
                        {selectedMessage.hasAppointment && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 hover:bg-purple-100">
                            📅 Booking
                          </Badge>
                        )}
                        {selectedMessage.label && (
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            selectedMessage.label === "urgent" && "bg-red-100 text-red-700",
                            selectedMessage.label === "follow-up" && "bg-yellow-100 text-yellow-700",
                            selectedMessage.label === "resolved" && "bg-green-100 text-green-700"
                          )}>
                            {selectedMessage.label}
                          </span>
                        )}
                      </div>
                      {/* Contact Info for anonymous visitors */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        {selectedMessage.userEmail && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {selectedMessage.userEmail}
                          </p>
                        )}
                        {selectedMessage.userPhone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            📞 {selectedMessage.userPhone}
                          </p>
                        )}
                        {selectedMessage.userCompany && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            🏢 {selectedMessage.userCompany}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{liveChatbotConversation?.messageCount || selectedMessage.messageCount} messages</span>
                        <span>Started {formatDate(selectedMessage.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(() => { const st = liveChatbotConversation?.status || selectedMessage.status; return (
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium",
                        st === "active" && "bg-green-100 text-green-700",
                        st === "escalated" && "bg-red-100 text-red-700",
                        st === "admin_takeover" && "bg-blue-100 text-blue-700",
                        st === "resolved" && "bg-gray-100 text-gray-500"
                      )}>
                        {st === "admin_takeover" ? "Agent Active" : st}
                      </span>); })()}
                    </div>
                  </div>
                  {/* Label + Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => handleChatbotLabel("urgent")}>
                      🔴 {selectedMessage.label === "urgent" ? "Remove Urgent" : "Urgent"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleChatbotLabel("follow-up")}>
                      🟡 {selectedMessage.label === "follow-up" ? "Remove Follow-up" : "Follow-up"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleChatbotLabel("resolved")}>
                      🟢 {selectedMessage.label === "resolved" ? "Remove Resolved" : "Resolved"}
                    </Button>
                    {selectedMessage.userEmail && (
                      <Button size="sm" variant="outline" onClick={() => setEmailDialogOpen(true)} className="ml-auto gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        Email User
                      </Button>
                    )}
                  </div>
                </div>

                {/* Rating Display */}
                {selectedMessage.rating && (
                  <div className="px-4 py-2 border-b bg-yellow-50 flex items-center gap-3">
                    <span className="text-sm font-medium text-yellow-800">Rating:</span>
                    <span>{"⭐".repeat(selectedMessage.rating)}{"☆".repeat(5 - selectedMessage.rating)}</span>
                    {selectedMessage.ratingComment && (
                      <span className="text-sm text-yellow-700 italic">&quot;{selectedMessage.ratingComment}&quot;</span>
                    )}
                  </div>
                )}

                {/* Appointment Info */}
                {chatbotAppointments && chatbotAppointments.length > 0 && (
                  <div className="px-4 py-2 border-b bg-blue-50">
                    {chatbotAppointments.map((apt: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Booking:</span>
                        <span className="text-blue-700">
                          {new Date(apt.appointmentDate).toLocaleDateString()} at {apt.appointmentTime}
                        </span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          apt.status === "confirmed" && "bg-green-100 text-green-700",
                          apt.status === "pending" && "bg-yellow-100 text-yellow-700",
                          apt.status === "cancelled" && "bg-red-100 text-red-700"
                        )}>
                          {apt.status}
                        </span>
                        {apt.purpose && <span className="text-blue-600 text-xs">({apt.purpose})</span>}
                        <a href={`/admin/appointments/${apt._id}`} className="ml-auto text-blue-600 hover:underline flex items-center gap-1 text-xs">
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* Chat Messages - use live data from Convex for real-time updates */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                  {(liveChatbotConversation?.messages || selectedMessage.messages || []).map((msg: { role: string; content: string; timestamp: number; messageType?: string; fileUrl?: string; fileName?: string; fileType?: string; imageUrl?: string; senderId?: string; quickReplies?: { label: string; value: string }[] }, idx: number) => (
                    <div key={idx} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[75%] p-3 rounded-lg text-sm",
                        msg.role === "user"
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : msg.role === "admin"
                            ? "bg-indigo-50 border border-indigo-200 rounded-bl-sm"
                            : "bg-white border border-gray-200 rounded-bl-sm"
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-semibold opacity-70">
                            {msg.role === "user" ? "Customer" : msg.role === "admin" ? `🧑‍💼 ${msg.senderId || "Support Agent"}` : "AI Agent"}
                          </span>
                          <span className="text-[10px] opacity-50">
                            {formatDate(msg.timestamp)}
                          </span>
                        </div>
                        {/* Image/file display */}
                        {msg.messageType === "file" && msg.fileType?.startsWith("image/") && msg.fileUrl ? (
                          <div>
                            <img src={msg.fileUrl} alt={msg.fileName || "Image"} className="rounded max-w-full max-h-48 cursor-pointer" onClick={() => window.open(msg.fileUrl, "_blank")} />
                            <p className="text-[10px] mt-1 opacity-60">{msg.fileName}</p>
                          </div>
                        ) : msg.messageType === "file" ? (
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            <span>{msg.fileName || "File"}</span>
                            {msg.fileUrl && <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline text-xs">Download</a>}
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        )}
                        {msg.quickReplies && msg.quickReplies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-100">
                            {msg.quickReplies.map((qr, qIdx) => (
                              <span key={qIdx} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                {qr.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Admin Reply Input */}
                <div className="p-3 border-t bg-white">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message to the user..."
                      value={chatReply}
                      onChange={(e) => setChatReply(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatReply(); } }}
                      disabled={chatReplySending}
                      className="flex-1"
                    />
                    <Button onClick={handleChatReply} disabled={chatReplySending || !chatReply.trim()} size="sm" className="gap-1">
                      <Send className="w-4 h-4" />
                      Send
                    </Button>
                    {(() => {
                      const liveConv = liveChatbotConversation || selectedMessage;
                      const hasRating = !!liveConv?.rating;
                      const isRequested = !!liveConv?.ratingRequested;
                      return (
                        <Button
                          onClick={handleRequestRating}
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          disabled={hasRating || isRequested}
                          title={hasRating ? "Already rated" : isRequested ? "Rating already requested" : "Ask user to rate this conversation"}
                        >
                          <Star className={cn("w-4 h-4", hasRating && "fill-yellow-400 text-yellow-400")} />
                          {hasRating ? `Rated ${liveConv.rating}⭐` : isRequested ? "Requested" : "Rate"}
                        </Button>
                      );
                    })()}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Messages will appear in the user&apos;s chat widget in real-time</p>
                </div>
              </>
            ) : (
              /* Regular Inbox Message Detail View */
              <>
                <div className="p-4 border-b">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold">
                        {selectedMessage.subject || "No subject"}
                      </h2>
                      <div className="flex items-center gap-2 mt-2">
                        <div className={cn("p-1.5 rounded", getTypeColor(selectedMessage.channel))}>
                          {getMessageIcon(selectedMessage.channel)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {selectedMessage.metadata?.userName || selectedMessage.metadata?.senderName || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedMessage.metadata?.userEmail && <span>{selectedMessage.metadata.userEmail} · </span>}
                            {formatDate(selectedMessage.sentAt)}
                          </p>
                        </div>
                      </div>
                      {ticketThread?.ticket && (
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>Priority: <strong className="capitalize">{ticketThread.ticket.priority}</strong></span>
                          <span>Status: <strong className="capitalize">{ticketThread.ticket.status.replace("_", " ")}</strong></span>
                          <span>Created: {formatDate(ticketThread.ticket.createdAt)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={(e) => handleToggleStar(selectedMessage._id, e)}>
                        <Star className={cn("w-4 h-4", selectedMessage.starred ? "fill-yellow-400 text-yellow-400" : "")} />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" className="gap-2" onClick={() => setReplyDialogOpen(true)}>
                      <Reply className="w-4 h-4" />
                      Reply
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2" onClick={handleDelete}>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                    <div className="flex gap-1 ml-auto">
                      <Button size="sm" variant="outline" onClick={() => handleWorkflowStatus("urgent")} title="Label: Urgent">
                        🔴 Urgent
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleWorkflowStatus("follow-up")} title="Label: Follow-up">
                        🟡 Follow-up
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleWorkflowStatus("resolved")} title="Label: Resolved">
                        🟢 Resolved
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {/* Ticket channel: use ticket_messages (has both customer + admin messages) */}
                  {selectedMessage.channel === "ticket" && ticketThread?.messages && ticketThread.messages.length > 0 ? (
                    <div className="space-y-4">
                      {/* Original ticket description */}
                      {ticketThread.ticket && (
                        <div className="p-4 rounded-lg border bg-white border-gray-200 mr-8">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-gray-600 text-white">
                                U
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {selectedMessage.metadata?.userName || "Customer"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {selectedMessage.metadata?.userEmail || ""}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(ticketThread.ticket.createdAt)}
                            </span>
                          </div>
                          <div className="whitespace-pre-wrap text-sm">{ticketThread.ticket.description}</div>
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-muted-foreground">Original ticket</p>
                          </div>
                        </div>
                      )}
                      {/* Thread messages (customer + admin) */}
                      {ticketThread.messages.map((msg: any) => (
                        <div
                          key={msg._id}
                          className={cn(
                            "p-4 rounded-lg border",
                            msg.senderType === "admin"
                              ? "bg-blue-50 border-blue-200 ml-8"
                              : "bg-white border-gray-200 mr-8"
                          )}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                                msg.senderType === "admin"
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-600 text-white"
                              )}>
                                {msg.senderType === "admin" ? "A" : "U"}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{msg.senderName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {msg.senderType === "admin" ? "Support Team" : "Customer"}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(msg.createdAt)}
                            </span>
                          </div>
                          <div className="whitespace-pre-wrap text-sm">{msg.message}</div>
                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {msg.attachments.map((att: any, attIdx: number) => (
                                att.fileType?.startsWith("image/") ? (
                                  <div key={attIdx} className="cursor-pointer" onClick={() => window.open(att.fileUrl, "_blank")}>
                                    <img src={att.fileUrl} alt={att.fileName} className="rounded-lg max-h-40 max-w-[200px] border" />
                                    <p className="text-[10px] mt-1 text-muted-foreground">{att.fileName}</p>
                                  </div>
                                ) : (
                                  <a key={attIdx} href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">
                                    <span>📎</span>
                                    <span>{att.fileName}</span>
                                    <span className="text-xs text-muted-foreground">({(att.fileSize / 1024).toFixed(0)} KB)</span>
                                  </a>
                                )
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : threadMessages && threadMessages.length > 0 ? (
                    /* Non-ticket channels: use inbox thread messages */
                    <div className="space-y-4">
                      {threadMessages.map((msg: any, index: number) => (
                        <div
                          key={msg._id}
                          className={cn(
                            "p-4 rounded-lg border",
                            msg.direction === "outbound"
                              ? "bg-blue-50 border-blue-200 ml-8"
                              : "bg-white border-gray-200 mr-8"
                          )}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                                msg.direction === "outbound"
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-600 text-white"
                              )}>
                                {msg.direction === "outbound" ? "A" : "U"}
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {msg.direction === "outbound"
                                    ? "Support Team"
                                    : msg.metadata?.senderName || msg.metadata?.userName || "Customer"}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(msg.sentAt)}
                            </span>
                          </div>
                          <div className="whitespace-pre-wrap text-sm">{msg.body}</div>
                          {index === 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-xs text-muted-foreground">Original message</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap">{selectedMessage.body || "No content"}</div>
                    </div>
                  )}
                </div>
              </>
            )
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Mail className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Select a message to view</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Reply to Message</DialogTitle>
            <DialogDescription>
              {selectedMessage?.subject || "No subject"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="reply-body">Your Reply</Label>
              <Textarea
                id="reply-body"
                placeholder="Type your reply here..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleReply} disabled={!replyBody.trim()}>
                <Reply className="w-4 h-4 mr-2" />
                Send Reply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forward Dialog */}
      <Dialog open={forwardDialogOpen} onOpenChange={setForwardDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Forward Message</DialogTitle>
            <DialogDescription>
              Forward this message to another email address
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="forward-email">To Email Address</Label>
              <Input
                id="forward-email"
                type="email"
                placeholder="recipient@example.com"
                value={forwardEmail}
                onChange={(e) => setForwardEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="forward-note">Add a Note (Optional)</Label>
              <Textarea
                id="forward-note"
                placeholder="Add a note to include with the forwarded message..."
                value={forwardNote}
                onChange={(e) => setForwardNote(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setForwardDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleForward} disabled={!forwardEmail.trim()}>
                <Forward className="w-4 h-4 mr-2" />
                Forward Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email to Chatbot User Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Send Email to User</DialogTitle>
            <DialogDescription>
              Send an email to {selectedMessage?.userName || "user"} ({selectedMessage?.userEmail || "no email"})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email-to">To</Label>
              <Input
                id="email-to"
                value={selectedMessage?.userEmail || ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                placeholder="Email subject..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-body">Message</Label>
              <Textarea
                id="email-body"
                placeholder="Type your email message..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={6}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={emailSending || !emailSubject.trim() || !emailBody.trim()}
              >
                <Mail className="w-4 h-4 mr-2" />
                {emailSending ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cleanup Dialog */}
      <Dialog open={cleanupDialogOpen} onOpenChange={setCleanupDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cleanup Old Data</DialogTitle>
            <DialogDescription>
              Remove old chatbot conversations, tickets, and email logs to reduce database size.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Delete data older than</Label>
              <Select value={String(cleanupDays)} onValueChange={(v) => setCleanupDays(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">6 months</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {cleanupPreview && (
              <div className="space-y-2 text-sm">
                <p className="font-medium">Preview of records to delete:</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="font-semibold text-blue-700">{cleanupPreview.chatbot.old}</p>
                    <p className="text-xs text-blue-600">Chatbot conversations</p>
                    <p className="text-[10px] text-muted-foreground">of {cleanupPreview.chatbot.total} total</p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                    <p className="font-semibold text-orange-700">{cleanupPreview.tickets.old}</p>
                    <p className="text-xs text-orange-600">Inbox messages</p>
                    <p className="text-[10px] text-muted-foreground">of {cleanupPreview.tickets.total} total</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                    <p className="font-semibold text-purple-700">{cleanupPreview.emailLogs.old}</p>
                    <p className="text-xs text-purple-600">Email logs</p>
                    <p className="text-[10px] text-muted-foreground">of {cleanupPreview.emailLogs.total} total</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800 font-medium">⚠️ This action cannot be undone</p>
              <p className="text-xs text-yellow-700 mt-1">
                Deleted data includes conversations, ticket messages, and email logs older than {cleanupDays} days.
              </p>
            </div>

            {/* Repair section */}
            <div className="border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Data Repair</p>
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                <div>
                  <p className="text-sm font-medium">Sync Ticket Inbox</p>
                  <p className="text-xs text-muted-foreground">Fixes mismatched ticket data between inbox and support tickets table.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={cleanupRunning}
                  onClick={async () => {
                    setCleanupRunning(true);
                    try {
                      const result = await repairTicketInbox();
                      toast.success(`Repaired: ${result.updated} updated, ${result.deleted} removed, ${result.created} created`);
                    } catch {
                      toast.error("Repair failed");
                    } finally {
                      setCleanupRunning(false);
                    }
                  }}
                >
                  Run Repair
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCleanupDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={cleanupRunning}
                onClick={async () => {
                  setCleanupRunning(true);
                  try {
                    const [chatResult, inboxResult, emailResult] = await Promise.all([
                      cleanOldChatbot({ olderThanDays: cleanupDays }),
                      cleanOldInboxMessages({ olderThanDays: cleanupDays }),
                      cleanOldEmailLogs({ olderThanDays: cleanupDays }),
                    ]);
                    toast.success(
                      `Cleaned up: ${chatResult.deleted} conversations, ${inboxResult.deleted} inbox messages, ${emailResult.deleted} email logs`
                    );
                    setCleanupDialogOpen(false);
                  } catch (error) {
                    toast.error("Cleanup failed. Please try again.");
                  } finally {
                    setCleanupRunning(false);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {cleanupRunning ? "Cleaning..." : "Delete Old Data"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
