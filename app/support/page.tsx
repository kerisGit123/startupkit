"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Ticket, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SupportTicketDialog } from "@/components/SupportTicketDialog";
import { useState, useMemo } from "react";

export default function SupportPage() {
  const { user } = useUser();
  const tickets = useQuery(api.tickets.getUserTickets, user?.id ? {} : "skip");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter(ticket => {
      const matchesCategory = !categoryFilter || ticket.category === categoryFilter;
      const matchesStatus = !statusFilter || ticket.status === statusFilter;
      return matchesCategory && matchesStatus;
    });
  }, [tickets, categoryFilter, statusFilter]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please sign in to view your tickets</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f8f9fa]">
        <div className="p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Support Tickets</h1>
              <p className="text-[13px] text-gray-500 mt-0.5">Track and manage your support requests</p>
            </div>
            <SupportTicketDialog />
          </div>

          {/* Filters */}
          {tickets && tickets.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex gap-3">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-700"
                >
                  <option value="">All Types</option>
                  <option value="billing">Billing</option>
                  <option value="plans">Plans</option>
                  <option value="usage">Usage</option>
                  <option value="credit">Credit</option>
                  <option value="invoice">Invoice</option>
                  <option value="technical">Technical</option>
                  <option value="service">Service</option>
                  <option value="general">General</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-700"
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          )}

          {/* Loading */}
          {!tickets && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
            </div>
          )}

          {/* Empty State */}
          {tickets && tickets.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <div className="p-3 bg-gray-100 rounded-xl inline-block mb-3">
                <Ticket className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-1 text-gray-900">No tickets yet</h3>
              <p className="text-sm text-gray-500 mb-6">Create your first support ticket</p>
              <SupportTicketDialog />
            </div>
          )}

          {/* Ticket List */}
          {filteredTickets && filteredTickets.length > 0 && (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <Link 
                  key={ticket._id} 
                  href={`/support/tickets/${ticket._id}`}
                  className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h3 className="text-sm font-semibold text-gray-900">{ticket.subject}</h3>
                        <span className="text-xs text-gray-400 font-mono">#{ticket.ticketNumber}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{ticket.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="capitalize px-2 py-0.5 bg-gray-50 rounded-md">{ticket.priority}</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                      ticket.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                      ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
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
