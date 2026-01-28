"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  Mail, 
  Inbox as InboxIcon, 
  Search, 
  Archive, 
  Trash2, 
  Tag, 
  Clock,
  Star,
  MoreVertical,
  Reply,
  Forward,
  Ticket,
  MessageSquare,
  Bell
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type MessageType = "all" | "ticket" | "chatbot" | "email" | "notification";
type MessageStatus = "unread" | "read" | "archived" | "replied";

export default function InboxPage() {
  // State declarations first
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "important">("all");
  const [activeType, setActiveType] = useState<MessageType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [forwardEmail, setForwardEmail] = useState("");
  const [forwardNote, setForwardNote] = useState("");

  // Fetch real data from Convex (after state is declared)
  const allMessages = useQuery(api.inbox.getAllMessages, {});
  const unreadCountData = useQuery(api.inbox.getUnreadCount, {});
  const threadMessages = useQuery(
    api.inbox.getThread,
    selectedMessage ? { threadId: selectedMessage.threadId } : "skip"
  );

  const replyToMessage = useMutation(api.inbox.replyToMessage);
  const forwardMessage = useMutation(api.inbox.forwardMessage);
  const toggleStar = useMutation(api.inbox.toggleStar);
  const updateWorkflowStatus = useMutation(api.inbox.updateWorkflowStatus);
  const deleteMessage = useMutation(api.inbox.deleteMessage);

  // Filter messages
  const filteredMessages = (allMessages || []).filter((msg) => {
    if (activeType !== "all" && msg.channel !== activeType) return false;
    // Unread = tickets that haven't been replied to by admin
    if (activeFilter === "unread" && msg.status !== "unread") return false;
    // Important = tickets marked as urgent or follow-up
    if (activeFilter === "important" && msg.workflowStatus !== "urgent" && msg.workflowStatus !== "follow-up") return false;
    if (searchQuery && !msg.subject?.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !msg.body?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => b.updatedAt - a.updatedAt);

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

  // Get reply count for each ticket from ticket_messages
  const ticketsWithReplyCounts = filteredMessages.map(msg => {
    // Count replies in thread (from threadMessages when available)
    const replyCount = threadMessages?.length || 0;
    const hasNewReplies = msg.status === "unread";
    
    return {
      ...msg,
      replyCount,
      hasNewReplies,
    };
  });

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

  if (!allMessages) {
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
    <div className="flex flex-col h-[calc(100vh-4rem)] gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inbox</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount} unread messages
          </p>
        </div>
        <Button className="gap-2">
          <Mail className="w-4 h-4" />
          Compose
        </Button>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Left Sidebar - Navigation */}
        <Card className="col-span-2 p-4 overflow-y-auto">
          <div className="space-y-2">
            <Button
              variant={activeType === "all" ? "default" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setActiveType("all")}
            >
              <InboxIcon className="w-4 h-4" />
              <span>All Inbox</span>
              <Badge variant="secondary" className="ml-auto">
                {allMessages?.length || 0}
              </Badge>
            </Button>
            <Button
              variant={activeType === "ticket" ? "default" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setActiveType("ticket")}
            >
              <Ticket className="w-4 h-4" />
              <span>Tickets</span>
              <Badge variant="secondary" className="ml-auto">
                {allMessages?.filter(m => m.channel === "ticket").length || 0}
              </Badge>
            </Button>
            <Button
              variant={activeType === "chatbot" ? "default" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setActiveType("chatbot")}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chatbot</span>
              <Badge variant="secondary" className="ml-auto">
                {allMessages?.filter(m => m.channel === "chatbot").length || 0}
              </Badge>
            </Button>
            <Button
              variant={activeType === "email" ? "default" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setActiveType("email")}
            >
              <Mail className="w-4 h-4" />
              <span>Email</span>
              <Badge variant="secondary" className="ml-auto">
                {allMessages?.filter(m => m.channel === "email").length || 0}
              </Badge>
            </Button>

            <div className="pt-4 border-t">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Star className="w-4 h-4" />
                <span>Starred</span>
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">LABELS</p>
              <Button variant="ghost" className="w-full justify-start gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Urgent</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>Follow-up</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Resolved</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Middle - Message List */}
        <Card className="col-span-4 flex flex-col overflow-hidden">
          {/* Search and Filters */}
          <div className="p-4 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                className="pl-10"
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
          </div>

          {/* Action Bar */}
          {selectedMessages.size > 0 && (
            <div className="px-4 py-2 border-b bg-muted/50 flex items-center gap-2">
              <Button variant="ghost" size="sm" title="Delete selected">
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" title="Add label">
                <Tag className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground ml-auto">
                {selectedMessages.size} selected
              </span>
            </div>
          )}

          {/* Message List - One Row Per Ticket */}
          <div className="flex-1 overflow-y-auto">
            {ticketsWithReplyCounts.map((ticket) => (
              <div
                key={ticket._id}
                onClick={() => setSelectedMessage(ticket)}
                className={cn(
                  "p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors relative",
                  selectedMessage?._id === ticket._id && "bg-muted",
                  ticket.hasNewReplies && "bg-blue-50/30 border-l-4 border-l-blue-500"
                )}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedMessages.has(ticket._id)}
                    onChange={() => toggleMessageSelection(ticket._id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1"
                  />
                  <button
                    onClick={(e) => handleToggleStar(ticket._id, e)}
                    className="mt-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={cn(
                        "w-4 h-4",
                        ticket.starred ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
                      )}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">
                        {ticket.metadata?.userName || ticket.metadata?.senderName || "Unknown"}
                      </span>
                      {ticket.hasNewReplies && (
                        <span className="flex items-center gap-1 text-xs font-medium text-blue-600">
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          New reply
                        </span>
                      )}
                      {ticket.workflowStatus && (
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          ticket.workflowStatus === "urgent" && "bg-red-100 text-red-700",
                          ticket.workflowStatus === "follow-up" && "bg-yellow-100 text-yellow-700",
                          ticket.workflowStatus === "resolved" && "bg-green-100 text-green-700",
                          ticket.workflowStatus === "pending" && "bg-gray-100 text-gray-700"
                        )}>
                          {ticket.workflowStatus}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDate(ticket.updatedAt)}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate mb-1">
                      {ticket.subject || "No subject"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {ticket.body}
                    </p>
                    <div className="flex gap-1 mt-2 items-center">
                      {ticket.replyCount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                          {ticket.replyCount} replies
                        </span>
                      )}
                      {ticket.tags?.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right - Message Detail */}
        <Card className="col-span-6 flex flex-col overflow-hidden">
          {selectedMessage ? (
            <>
              {/* Message Header */}
              <div className="p-4 border-b">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold">{selectedMessage.subject}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <div className={cn("p-1.5 rounded", getTypeColor(selectedMessage.channel))}>
                        {getMessageIcon(selectedMessage.channel)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{selectedMessage.contactId || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(selectedMessage.sentAt)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Star className="w-4 h-4" />
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

              {/* Message Thread/Conversation */}
              <div className="flex-1 overflow-y-auto p-6">
                {threadMessages && threadMessages.length > 0 ? (
                  <div className="space-y-4">
                    {threadMessages.map((msg, index) => (
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
                              <p className="text-xs text-muted-foreground">
                                {msg.metadata?.userEmail || ""}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(msg.sentAt)}
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap text-sm">
                          {msg.body}
                        </div>
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
    </div>
  );
}
