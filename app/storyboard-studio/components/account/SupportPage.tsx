"use client";

import { useState, useMemo } from "react";
import {
  PanelLeftClose, PanelLeftOpen, ChevronDown, Ticket, Send,
  Clock, AlertCircle, CheckCircle2, MessageSquare, Plus,
  ArrowLeft, Loader2, Tag, Calendar, X,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { AppUserButton as UserButton } from "@/components/AppUserButton";
import { OrgSwitcher } from "@/components/OrganizationSwitcherWithLimits";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface SupportPageProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  in_progress: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  waiting_customer: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  resolved: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  closed: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  medium: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  high: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  urgent: "bg-red-500/20 text-red-400 border border-red-500/30",
};

const CATEGORIES = [
  { value: "", label: "All Types" },
  { value: "billing", label: "Billing" },
  { value: "plans", label: "Plans" },
  { value: "usage", label: "Usage" },
  { value: "credit", label: "Credit" },
  { value: "invoice", label: "Invoice" },
  { value: "technical", label: "Technical" },
  { value: "service", label: "Service" },
  { value: "general", label: "General" },
  { value: "other", label: "Other" },
];

const STATUSES = [
  { value: "", label: "All Status" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export default function SupportPage({ sidebarOpen, onToggleSidebar }: SupportPageProps) {
  const { user } = useUser();
  const tickets = useQuery(api.tickets.getUserTickets, user?.id ? {} : "skip");
  const createTicket = useMutation(api.tickets.createTicket);
  const addMessage = useMutation(api.tickets.addCustomerMessage);

  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const [view, setView] = useState<"list" | "create" | "detail">("list");
  const [selectedTicketId, setSelectedTicketId] = useState<Id<"support_tickets"> | null>(null);

  // Create ticket form state
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [category, setCategory] = useState<"billing" | "plans" | "usage" | "general" | "credit" | "technical" | "invoice" | "service" | "other">("general");
  const [submitting, setSubmitting] = useState(false);

  // Detail view
  const selectedTicket = useQuery(
    api.tickets.getTicketById,
    selectedTicketId ? { ticketId: selectedTicketId } : "skip"
  );
  const ticketMessages = useQuery(
    api.adminTickets.getTicketMessages,
    selectedTicketId ? { ticketId: selectedTicketId } : "skip"
  );
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter(ticket => {
      const matchesCategory = !categoryFilter || ticket.category === categoryFilter;
      const matchesStatus = !statusFilter || ticket.status === statusFilter;
      const ticketDate = new Date(ticket.createdAt);
      const matchesDateFrom = !dateFrom || ticketDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || ticketDate <= new Date(dateTo + "T23:59:59");
      return matchesCategory && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [tickets, categoryFilter, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const paginatedTickets = filteredTickets.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset to page 1 when filters change
  const resetPage = () => setCurrentPage(1);

  const openCount = useMemo(() => {
    if (!tickets) return 0;
    return tickets.filter(t => t.status === "open" || t.status === "in_progress").length;
  }, [tickets]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      await createTicket({
        subject: subject.trim(),
        description: description.trim(),
        priority,
        category,
        userEmail: user.emailAddresses[0]?.emailAddress || "",
        userName: user.fullName || user.username || "User",
      });
      setSubject("");
      setDescription("");
      setPriority("medium");
      setCategory("general");
      setView("list");
    } catch (error) {
      console.error("Error creating ticket:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!reply.trim() || !user || !selectedTicketId) return;

    setSending(true);
    try {
      await addMessage({
        ticketId: selectedTicketId,
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

  const openTicketDetail = (ticketId: Id<"support_tickets">) => {
    setSelectedTicketId(ticketId);
    setView("detail");
    setReply("");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-(--border-primary) bg-(--bg-secondary) shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="text-(--text-secondary) transition hover:text-(--text-primary) md:hidden"
          >
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-(--text-primary)">Support</h1>
            <ChevronDown className="w-4 h-4 text-(--text-tertiary)" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center self-end md:flex lg:self-auto">
            <OrgSwitcher
              appearance={{
                elements: {
                  rootBox: "flex items-center",
                  organizationSwitcherTrigger: "px-3 py-2 rounded-lg border border-(--border-primary) bg-(--bg-secondary) hover:bg-(--bg-tertiary) text-white hover:text-gray-200 flex items-center gap-2 text-sm mr-3",
                },
              }}
            />
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-(--bg-primary) to-(--bg-secondary)">
        <div className="max-w-5xl mx-auto p-6 lg:p-8">

          {/* ── LIST VIEW ─────────────────────────────────────────── */}
          {view === "list" && (
            <div className="space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-(--text-primary) mb-2">
                    Support Tickets
                  </h1>
                  <p className="text-lg text-(--text-secondary)">
                    Track and manage your support requests
                  </p>
                </div>
                <button
                  onClick={() => setView("create")}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-(--accent-purple) to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Ticket
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total", value: tickets?.length ?? 0, icon: Ticket, color: "from-blue-500/20 to-blue-600/20", iconColor: "text-blue-400", borderColor: "border-blue-500/30" },
                  { label: "Open", value: openCount, icon: AlertCircle, color: "from-amber-500/20 to-amber-600/20", iconColor: "text-amber-400", borderColor: "border-amber-500/30" },
                  { label: "Resolved", value: tickets?.filter(t => t.status === "resolved").length ?? 0, icon: CheckCircle2, color: "from-emerald-500/20 to-emerald-600/20", iconColor: "text-emerald-400", borderColor: "border-emerald-500/30" },
                  { label: "Closed", value: tickets?.filter(t => t.status === "closed").length ?? 0, icon: MessageSquare, color: "from-gray-500/20 to-gray-600/20", iconColor: "text-gray-400", borderColor: "border-gray-500/30" },
                ].map((stat) => (
                  <div key={stat.label} className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm rounded-2xl p-5 border ${stat.borderColor} transition-all duration-300 hover:scale-105`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-xs text-(--text-secondary) mb-0.5">{stat.label}</p>
                        <p className="text-xl font-bold text-white">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Filters */}
              {tickets && tickets.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); resetPage(); }}
                    className="px-4 py-2.5 rounded-xl text-sm bg-(--bg-tertiary) border border-(--border-primary) text-(--text-primary) focus:outline-none focus:border-(--accent-purple)"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); resetPage(); }}
                    className="px-4 py-2.5 rounded-xl text-sm bg-(--bg-tertiary) border border-(--border-primary) text-(--text-primary) focus:outline-none focus:border-(--accent-purple)"
                  >
                    {STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-(--text-tertiary)">From</span>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => { setDateFrom(e.target.value); resetPage(); }}
                      className="px-3 py-2.5 rounded-xl text-sm bg-(--bg-tertiary) border border-(--border-primary) text-(--text-primary) focus:outline-none focus:border-(--accent-purple) [color-scheme:dark]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-(--text-tertiary)">To</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => { setDateTo(e.target.value); resetPage(); }}
                      className="px-3 py-2.5 rounded-xl text-sm bg-(--bg-tertiary) border border-(--border-primary) text-(--text-primary) focus:outline-none focus:border-(--accent-purple) [color-scheme:dark]"
                    />
                  </div>
                  {(categoryFilter || statusFilter || dateFrom || dateTo) && (
                    <button
                      onClick={() => { setCategoryFilter(""); setStatusFilter(""); setDateFrom(""); setDateTo(""); resetPage(); }}
                      className="px-3 py-2.5 rounded-xl text-xs text-(--text-secondary) hover:text-white bg-(--bg-tertiary) border border-(--border-primary) hover:border-red-500/50 transition-all flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Clear
                    </button>
                  )}
                </div>
              )}

              {/* Loading */}
              {!tickets && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-(--text-secondary)" />
                </div>
              )}

              {/* Empty State */}
              {tickets && tickets.length === 0 && (
                <div className="bg-gradient-to-br from-(--bg-secondary) to-(--bg-tertiary) border border-(--border-primary) rounded-3xl p-16 text-center shadow-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-(--accent-purple)/20 flex items-center justify-center mx-auto mb-4">
                    <Ticket className="w-8 h-8 text-(--accent-purple)" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No tickets yet</h3>
                  <p className="text-(--text-secondary) mb-6">Create your first support ticket to get help</p>
                  <button
                    onClick={() => setView("create")}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-(--accent-purple) to-purple-600 text-white font-semibold shadow-lg"
                  >
                    Create Ticket
                  </button>
                </div>
              )}

              {/* Ticket List */}
              {filteredTickets.length > 0 && (
                <div className="space-y-3">
                  {paginatedTickets.map((ticket) => (
                    <button
                      key={ticket._id}
                      onClick={() => openTicketDetail(ticket._id)}
                      className="w-full text-left bg-gradient-to-br from-(--bg-secondary) to-(--bg-tertiary) border border-(--border-primary) rounded-2xl p-5 hover:border-(--accent-purple)/50 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1.5">
                            <h3 className="text-sm font-semibold text-white truncate">{ticket.subject}</h3>
                            <span className="text-xs text-(--text-tertiary) font-mono shrink-0">#{ticket.ticketNumber}</span>
                          </div>
                          <p className="text-xs text-(--text-secondary) mb-3 line-clamp-2">{ticket.description}</p>
                          <div className="flex items-center gap-3 text-xs">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${PRIORITY_COLORS[ticket.priority] || ""}`}>
                              {ticket.priority}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS["open"] || ""}`}>
                              {ticket.category}
                            </span>
                            <span className="flex items-center gap-1 text-(--text-tertiary)">
                              <Clock className="w-3 h-3" />
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${STATUS_COLORS[ticket.status] || ""}`}>
                          {ticket.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                    </button>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                      <p className="text-sm text-(--text-tertiary)">
                        Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredTickets.length)} of {filteredTickets.length} tickets
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-xl border border-(--border-primary) text-(--text-secondary) hover:text-white hover:bg-(--bg-tertiary) transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                          .reduce<(number | string)[]>((acc, page, idx, arr) => {
                            if (idx > 0 && page - (arr[idx - 1] as number) > 1) acc.push("...");
                            acc.push(page);
                            return acc;
                          }, [])
                          .map((page, idx) =>
                            typeof page === "string" ? (
                              <span key={`ellipsis-${idx}`} className="px-2 text-(--text-tertiary)">...</span>
                            ) : (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                                  currentPage === page
                                    ? "bg-(--accent-purple) text-white shadow-lg"
                                    : "border border-(--border-primary) text-(--text-secondary) hover:text-white hover:bg-(--bg-tertiary)"
                                }`}
                              >
                                {page}
                              </button>
                            )
                          )}
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-xl border border-(--border-primary) text-(--text-secondary) hover:text-white hover:bg-(--bg-tertiary) transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── CREATE VIEW ───────────────────────────────────────── */}
          {view === "create" && (
            <div className="space-y-8">
              <div>
                <button
                  onClick={() => setView("list")}
                  className="flex items-center gap-2 text-sm text-(--text-secondary) hover:text-white transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Tickets
                </button>
                <h1 className="text-3xl font-bold text-(--text-primary) mb-2">
                  Submit a Support Ticket
                </h1>
                <p className="text-lg text-(--text-secondary)">
                  Need help? Our support team is here to assist you.
                </p>
              </div>

              <form onSubmit={handleCreateTicket} className="bg-gradient-to-br from-(--bg-secondary) to-(--bg-tertiary) border border-(--border-primary) rounded-3xl p-8 shadow-2xl space-y-6">
                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-(--text-secondary) mb-2">
                    Subject <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    required
                    disabled={submitting}
                    className="w-full px-4 py-3 rounded-xl bg-(--bg-primary) border border-(--border-primary) text-white placeholder-gray-500 focus:outline-none focus:border-(--accent-purple) transition-colors"
                  />
                </div>

                {/* Category & Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-(--text-secondary) mb-2">
                      Ticket Type <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      disabled={submitting}
                      className="w-full px-4 py-3 rounded-xl bg-(--bg-primary) border border-(--border-primary) text-white focus:outline-none focus:border-(--accent-purple) transition-colors"
                    >
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
                  <div>
                    <label className="block text-sm font-medium text-(--text-secondary) mb-2">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      disabled={submitting}
                      className="w-full px-4 py-3 rounded-xl bg-(--bg-primary) border border-(--border-primary) text-white focus:outline-none focus:border-(--accent-purple) transition-colors"
                    >
                      <option value="low">Low - General inquiry</option>
                      <option value="medium">Medium - Issue affecting work</option>
                      <option value="high">High - Critical issue</option>
                      <option value="urgent">Urgent - System down</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-(--text-secondary) mb-2">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please provide detailed information about your issue..."
                    required
                    disabled={submitting}
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl bg-(--bg-primary) border border-(--border-primary) text-white placeholder-gray-500 focus:outline-none focus:border-(--accent-purple) transition-colors resize-none"
                  />
                  <p className="text-xs text-(--text-tertiary) mt-2">
                    Include any relevant details, error messages, or steps to reproduce the issue.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-(--border-primary)">
                  <p className="text-xs text-(--text-tertiary)">
                    Fields marked with <span className="text-red-400">*</span> are required
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setView("list")}
                      className="px-6 py-3 rounded-xl border border-(--border-primary) text-(--text-secondary) hover:text-white hover:bg-(--bg-tertiary) transition-all duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !subject.trim() || !description.trim()}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-(--accent-purple) to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Ticket
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ── DETAIL VIEW ───────────────────────────────────────── */}
          {view === "detail" && (
            <div className="space-y-6">
              <button
                onClick={() => { setView("list"); setSelectedTicketId(null); }}
                className="flex items-center gap-2 text-sm text-(--text-secondary) hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Tickets
              </button>

              {!selectedTicket ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-(--text-secondary)" />
                </div>
              ) : (
                <>
                  {/* Ticket Header */}
                  <div className="bg-gradient-to-br from-(--bg-secondary) to-(--bg-tertiary) border border-(--border-primary) rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h1 className="text-2xl font-bold text-white">{selectedTicket.subject}</h1>
                          <span className="text-xs text-(--text-tertiary) font-mono">#{selectedTicket.ticketNumber}</span>
                        </div>
                        <p className="text-sm text-(--text-secondary)">{selectedTicket.description}</p>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_COLORS[selectedTicket.status] || ""}`}>
                        {selectedTicket.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-6 border-t border-(--border-primary)">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-(--text-secondary)" />
                        </div>
                        <div>
                          <p className="text-xs text-(--text-tertiary)">Created</p>
                          <p className="text-sm font-medium text-white">
                            {new Date(selectedTicket.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                          <Tag className="w-4 h-4 text-(--text-secondary)" />
                        </div>
                        <div>
                          <p className="text-xs text-(--text-tertiary)">Priority</p>
                          <p className="text-sm font-medium text-white capitalize">{selectedTicket.priority}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                          <Ticket className="w-4 h-4 text-(--text-secondary)" />
                        </div>
                        <div>
                          <p className="text-xs text-(--text-tertiary)">Category</p>
                          <p className="text-sm font-medium text-white capitalize">{selectedTicket.category}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conversation */}
                  <div className="bg-gradient-to-br from-(--bg-secondary) to-(--bg-tertiary) border border-(--border-primary) rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-(--accent-purple)/20 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-(--accent-purple)" />
                      </div>
                      <h2 className="text-xl font-bold text-white">Conversation</h2>
                    </div>

                    <div className="space-y-3 mb-6 max-h-[28rem] overflow-y-auto pr-2">
                      {ticketMessages && ticketMessages.length > 0 ? (
                        ticketMessages.map((message) => (
                          <div
                            key={message._id}
                            className={`p-4 rounded-2xl ${
                              message.senderType === "admin"
                                ? "bg-(--accent-purple)/10 border border-(--accent-purple)/20 mr-12"
                                : "bg-white/5 border border-white/10 ml-12"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm text-white">
                                {message.senderType === "admin" ? "Support Team" : "You"}
                              </span>
                              <span className="text-xs text-(--text-tertiary)">
                                {new Date(message.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-(--text-secondary)">{message.message}</p>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                            <Send className="w-7 h-7 text-(--text-tertiary)" />
                          </div>
                          <p className="text-sm font-medium text-(--text-secondary)">No messages yet</p>
                          <p className="text-xs text-(--text-tertiary) mt-1">Our support team will respond soon!</p>
                        </div>
                      )}
                    </div>

                    {/* Reply Box */}
                    {selectedTicket.status !== "closed" && selectedTicket.status !== "resolved" ? (
                      <div className="border-t border-(--border-primary) pt-6">
                        <label className="block text-sm font-medium text-(--text-secondary) mb-2">
                          Add a Reply
                        </label>
                        <textarea
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          placeholder="Type your message here..."
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl bg-(--bg-primary) border border-(--border-primary) text-white placeholder-gray-500 focus:outline-none focus:border-(--accent-purple) transition-colors resize-none"
                        />
                        <div className="flex justify-end mt-3">
                          <button
                            onClick={handleSendReply}
                            disabled={sending || !reply.trim()}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-(--accent-purple) to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {sending ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
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
                    ) : (
                      <div className="border-t border-(--border-primary) pt-6">
                        <p className="text-center text-sm text-(--text-secondary) py-4">
                          This ticket has been {selectedTicket.status}. If you need further assistance, please create a new ticket.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
