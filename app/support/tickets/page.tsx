"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Ticket, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SupportTicketDialog } from "@/components/SupportTicketDialog";

export default function UserTicketsPage() {
  const { user } = useUser();
  const tickets = useQuery(api.tickets.getUserTickets, user?.id ? {} : "skip");

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please sign in to view your tickets</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Support Tickets</h1>
            <SupportTicketDialog />
          </div>

          {!tickets && <div className="text-center py-20">Loading...</div>}

          {tickets && tickets.length === 0 && (
            <div className="bg-white rounded-lg border p-12 text-center">
              <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tickets yet</h3>
              <p className="text-gray-600 mb-6">Create your first support ticket</p>
              <SupportTicketDialog />
            </div>
          )}

          {tickets && tickets.length > 0 && (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Link 
                  key={ticket._id} 
                  href={`/support/tickets/${ticket._id}`}
                  className="block bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{ticket.subject}</h3>
                        <span className="text-sm text-gray-500">#{ticket.ticketNumber}</span>
                      </div>
                      <p className="text-gray-600 mb-4">{ticket.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="capitalize">{ticket.priority}</span>
                        <Clock className="w-4 h-4" />
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {ticket.status.toUpperCase()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}