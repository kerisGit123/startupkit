"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Send, Calendar, Tag } from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function UserTicketDetailPage() {
  const params = useParams();
  const { user } = useUser();
  const ticketId = params.id as Id<"support_tickets">;
  
  const ticket = useQuery(api.tickets.getTicketById, { ticketId });
  const messages = useQuery(api.adminTickets.getTicketMessages, { ticketId });
  const addMessage = useMutation(api.tickets.addCustomerMessage);
  
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendReply = async () => {
    if (!reply.trim() || !user) return;
    
    setSending(true);
    try {
      await addMessage({
        ticketId,
        message: reply,
        senderName: user.fullName || "Customer",
        senderId: user.id,
      });
      setReply("");
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "waiting_customer": return "bg-purple-100 text-purple-800 border-purple-200";
      case "resolved": return "bg-green-100 text-green-800 border-green-200";
      case "closed": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (!ticket) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-600">Loading ticket...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f8f9fa]">
        <div className="p-4 md:p-6 lg:p-8 max-w-[900px] mx-auto space-y-6">
          <Link
            href="/support"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Tickets
          </Link>
          
          {/* Ticket Header */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1.5">
                  <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
                  <span className="text-xs text-gray-400 font-mono">#{ticket.ticketNumber}</span>
                </div>
                <p className="text-sm text-gray-500">{ticket.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2.5 text-sm">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Created</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <Tag className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Priority</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{ticket.priority}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                  {ticket.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Conversation */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Conversation</h2>
            </div>
            
            <div className="space-y-3 mb-6 max-h-112 overflow-y-auto">
              {messages && messages.length > 0 ? (
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={`p-4 rounded-xl ${
                      message.senderType === "admin"
                        ? "bg-blue-50 border border-blue-100 mr-12"
                        : "bg-gray-50 border border-gray-100 ml-12"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-medium text-sm text-gray-900">
                        {message.senderType === "admin" ? "Support Team" : "You"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(message.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{message.message}</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-3 bg-gray-100 rounded-xl inline-block mb-3">
                    <Send className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No messages yet</p>
                  <p className="text-xs text-gray-400 mt-1">Our support team will respond soon!</p>
                </div>
              )}
            </div>

            {ticket.status !== "closed" && ticket.status !== "resolved" && (
              <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Add a Reply
                </label>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your message here..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-300 focus:outline-none text-gray-900 bg-white resize-none text-sm"
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleSendReply}
                    disabled={sending || !reply.trim()}
                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-all text-[13px]"
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {(ticket.status === "closed" || ticket.status === "resolved") && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-center text-sm text-gray-500 py-4">
                  This ticket has been {ticket.status}. If you need further assistance, please create a new ticket.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
