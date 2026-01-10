"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Send, User, Mail, Calendar, Tag } from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function UserTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
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
      <div className="py-8 px-4">
        <div className="mb-6">
          <Link
            href="/support"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Tickets
          </Link>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
                  <span className="text-sm text-gray-500 font-mono">#{ticket.ticketNumber}</span>
                </div>
                <p className="text-gray-600">{ticket.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium text-gray-900">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Tag className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Priority</p>
                  <p className="font-medium text-gray-900 capitalize">{ticket.priority}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversation</h2>
          
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {messages && messages.length > 0 ? (
              messages.map((message) => (
                <div
                  key={message._id}
                  className={`p-4 rounded-lg ${
                    message.senderType === "admin"
                      ? "bg-blue-50 border border-blue-200 mr-8"
                      : "bg-gray-50 border border-gray-200 ml-8"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">
                      {message.senderType === "admin" ? "Support Team" : "You"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{message.message}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No messages yet. Our support team will respond soon!</p>
            )}
          </div>

          {ticket.status !== "closed" && ticket.status !== "resolved" && (
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add a Reply
              </label>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 bg-white resize-none"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleSendReply}
                  disabled={sending || !reply.trim()}
                  className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
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
            <div className="border-t border-gray-200 pt-4">
              <p className="text-center text-gray-500 py-4">
                This ticket has been {ticket.status}. If you need further assistance, please create a new ticket.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
