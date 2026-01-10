"use client";

export const dynamic = 'force-dynamic';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Ticket, Clock, CheckCircle, AlertCircle, Search, ChevronLeft, ChevronRight, Inbox, Archive } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function TicketsPage() {
  const tickets = useQuery(api.adminTickets.getAllTickets);
  const stats = useQuery(api.adminTickets.getTicketStats);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter(ticket => {
      const matchesSearch = 
        ticket.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || ticket.status === statusFilter;
      const matchesCategory = !categoryFilter || ticket.category === categoryFilter;
      
      let matchesDate = true;
      if (startDate || endDate) {
        const ticketDate = new Date(ticket.createdAt);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          matchesDate = matchesDate && ticketDate >= start;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          matchesDate = matchesDate && ticketDate <= end;
        }
      }
      
      return matchesSearch && matchesStatus && matchesCategory && matchesDate;
    });
  }, [tickets, searchTerm, statusFilter, categoryFilter, startDate, endDate]);

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTickets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTickets, currentPage]);

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "open": return "default";
      case "in_progress": return "secondary";
      case "resolved": return "outline";
      case "closed": return "secondary";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <AlertCircle className="w-4 h-4" />;
      case "in_progress": return <Clock className="w-4 h-4" />;
      case "resolved": return <CheckCircle className="w-4 h-4" />;
      case "closed": return <CheckCircle className="w-4 h-4" />;
      default: return <Ticket className="w-4 h-4" />;
    }
  };

  const sidebarItems = [
    { id: "all", label: "All mail", icon: Inbox, count: stats?.totalTickets || 0, filter: "" },
    { id: "open", label: "Open", icon: AlertCircle, count: stats?.openTickets || 0, filter: "open" },
    { id: "in_progress", label: "In Progress", icon: Clock, count: stats?.inProgressTickets || 0, filter: "in_progress" },
    { id: "resolved", label: "Resolved", icon: CheckCircle, count: stats?.resolvedTickets || 0, filter: "resolved" },
    { id: "closed", label: "Closed", icon: Archive, count: 0, filter: "closed" },
  ];

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Left Sidebar */}
      <div className="w-48 border-r bg-primary/10 flex flex-col">
        <div className="p-4 border-b bg-background">
          <h2 className="text-sm font-semibold">Support Tickets</h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setSelectedCategory(item.id);
                setStatusFilter(item.filter);
                setCurrentPage(1);
              }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm mb-1 transition-colors",
                selectedCategory === item.id
                  ? "bg-primary text-primary-foreground font-medium"
                  : "hover:bg-primary/20"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                selectedCategory === item.id
                  ? "bg-primary-foreground/20"
                  : "bg-muted"
              )}>
                {item.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Middle Panel - Ticket List */}
      <div className="w-96 border-r flex flex-col bg-white">
        {/* Search Bar */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="text-xs h-8 border rounded px-2 flex-1"
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
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="text-xs h-8"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="text-xs h-8"
            />
          </div>
        </div>

        {/* Tickets List */}
        <div className="flex-1 overflow-y-auto">
          {!paginatedTickets ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              Loading tickets...
            </div>
          ) : paginatedTickets.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No tickets found
            </div>
          ) : (
            paginatedTickets.map((ticket) => (
              <div
                key={ticket._id}
                onClick={() => setSelectedTicket(ticket)}
                className={cn(
                  "border-b p-3 cursor-pointer transition-colors hover:bg-gray-50",
                  selectedTicket?._id === ticket._id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">{ticket.userName || "Unknown"}</h3>
                      <span className="text-xs text-gray-500 shrink-0">{new Date(ticket._creationTime).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-medium text-sm text-gray-800 mb-1 truncate">{ticket.subject || "No subject"}</h4>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">{ticket.description || "No description"}</p>
                    <div className="flex gap-1.5">
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        {ticket.status.replace("_", " ")}
                      </Badge>
                      {ticket.category && (
                        <Badge variant="default" className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 border-purple-200">
                          {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
                        </Badge>
                      )}
                      {ticket.priority && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                          {ticket.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredTickets.length > 0 && (
          <div className="flex items-center justify-between p-2 border-t bg-white">
            <div className="text-xs text-gray-600">
              {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredTickets.length)} of {filteredTickets.length}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 text-xs"
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="h-7 w-7 text-xs p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 text-xs"
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Ticket Detail */}
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        {!selectedTicket ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Ticket className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">Select a ticket to view details</p>
            </div>
          </div>
        ) : (
          <div className="p-6 max-w-2xl mx-auto">
            {/* Ticket Header */}
            <div className="bg-white rounded-lg border p-6 mb-4">
              <h1 className="text-2xl font-bold mb-2">{selectedTicket.subject}</h1>
              <p className="text-sm text-gray-600 mb-1">#{selectedTicket.ticketNumber}</p>
              <p className="text-sm text-gray-700 mb-4">{selectedTicket.description}</p>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Customer</span>
                  </div>
                  <p className="font-medium">{selectedTicket.userName || "Unknown"}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Email</span>
                  </div>
                  <p className="font-medium">{selectedTicket.userEmail || "No email"}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Created</span>
                  </div>
                  <p className="font-medium">{new Date(selectedTicket._creationTime).toLocaleDateString()}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Priority</span>
                  </div>
                  <p className="font-medium capitalize">{selectedTicket.priority || "Medium"}</p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select 
                  className="w-full px-3 py-2 border rounded-md"
                  value={selectedTicket.status}
                  onChange={(e) => {
                    setSelectedTicket({...selectedTicket, status: e.target.value});
                  }}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_customer">Waiting Customer</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Conversation Section */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Conversation</h2>
              <div className="text-center py-8 text-gray-500 text-sm">
                No messages yet. Be the first to reply!
              </div>

              {/* Reply Form */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Reply to Customer</h3>
                <textarea
                  placeholder="Type your response here..."
                  className="w-full px-3 py-2 border rounded-md min-h-32 text-sm"
                />
                <div className="flex justify-end mt-3">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Send Reply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
