"use client";

import { useMemo, useState } from "react";
import { useConvex, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CleanupButton } from "@/components/admin/CleanupButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Ticket,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  User as UserIcon,
  Bot,
  Shield,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

type Status =
  | "open"
  | "in_progress"
  | "waiting_customer"
  | "resolved"
  | "closed";
type Priority = "low" | "medium" | "high" | "urgent";
type Category =
  | "billing"
  | "plans"
  | "usage"
  | "general"
  | "credit"
  | "technical"
  | "invoice"
  | "service"
  | "other";

const STATUSES: Status[] = [
  "open",
  "in_progress",
  "waiting_customer",
  "resolved",
  "closed",
];
const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];
const CATEGORIES: Category[] = [
  "billing",
  "plans",
  "usage",
  "general",
  "credit",
  "technical",
  "invoice",
  "service",
  "other",
];

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function priorityClass(p: Priority): string {
  switch (p) {
    case "urgent":
      return "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30";
    case "high":
      return "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30";
    case "medium":
      return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
    case "low":
      return "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30";
  }
}

function statusClass(s: Status): string {
  switch (s) {
    case "open":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "in_progress":
      return "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30";
    case "waiting_customer":
      return "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30";
    case "resolved":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "closed":
      return "bg-slate-500/15 text-slate-500 dark:text-slate-400 border-slate-500/30";
  }
}

export default function SupportTicketsPage() {
  const convex = useConvex();
  const [status, setStatus] = useState<"all" | Status>("all");
  const [priority, setPriority] = useState<"all" | Priority>("all");
  const [category, setCategory] = useState<"all" | Category>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] =
    useState<Id<"support_tickets"> | null>(null);

  const stats = useQuery(api.tickets.adminGetTicketStats, {});
  const tickets = useQuery(api.tickets.adminListTickets, {
    status: status === "all" ? undefined : status,
    priority: priority === "all" ? undefined : priority,
    category: category === "all" ? undefined : category,
    search: search.trim() || undefined,
    limit: 100,
  });

  const loading = tickets === undefined;
  const forbidden = tickets === null;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Support Tickets</h1>
          <p className="mt-1 text-muted-foreground">
            Manage customer support requests created by users and the AI chatbot.
          </p>
        </div>
        <CleanupButton
          triggerLabel="Clean up tickets"
          itemNoun="ticket"
          eligibilityHint="Only resolved or closed tickets qualify. Active tickets (open, in progress, waiting customer) are never deleted. Deletes associated ticket messages and inbox entries."
          preview={async (olderThanMs) => {
            const res = await convex.query(
              api.tickets.adminCountStaleTickets,
              { olderThanMs }
            );
            return {
              count: res.ticketCount,
              secondaryCount: res.messageCount,
              secondaryLabel: "thread messages",
              cutoffDate: res.cutoffDate,
            };
          }}
          run={async (olderThanMs) => {
            const res = await convex.mutation(
              api.tickets.adminCleanupStaleTickets,
              { olderThanMs }
            );
            return {
              deleted: res.deletedTickets,
              hasMore: res.hasMore,
              extraLines: [
                `Removed ${res.deletedMessages} thread messages and ${res.deletedInboxEntries} inbox entries.`,
              ],
            };
          }}
        />
      </div>

      {forbidden && (
        <Card className="mb-6 border-destructive">
          <CardContent className="py-4 text-sm text-destructive">
            You need super_admin role to view this page.
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      {stats && (
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Queue"
            value={stats.openAndWaiting}
            hint={`${stats.byStatus.open ?? 0} open · ${stats.byStatus.in_progress ?? 0} in progress · ${stats.byStatus.waiting_customer ?? 0} waiting`}
            icon={<Clock className="h-5 w-5" />}
            tone="blue"
          />
          <StatCard
            title="Urgent + High"
            value={
              (stats.byPriority.urgent ?? 0) + (stats.byPriority.high ?? 0)
            }
            hint={`${stats.byPriority.urgent ?? 0} urgent · ${stats.byPriority.high ?? 0} high`}
            icon={<AlertCircle className="h-5 w-5" />}
            tone="red"
          />
          <StatCard
            title="Resolved"
            value={stats.byStatus.resolved ?? 0}
            hint={`${stats.byStatus.closed ?? 0} closed`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            tone="green"
          />
          <StatCard
            title="SLA Breached"
            value={stats.slaBreached}
            hint={`${stats.total} tickets total`}
            icon={<AlertCircle className="h-5 w-5" />}
            tone="orange"
          />
        </div>
      )}

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by ticket #, subject, email, or content"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <FilterSelect
            value={status}
            onChange={(v) => setStatus(v as "all" | Status)}
            label="Status"
            options={[["all", "All statuses"], ...STATUSES.map((s) => [s, s.replace("_", " ")] as [string, string])]}
          />
          <FilterSelect
            value={priority}
            onChange={(v) => setPriority(v as "all" | Priority)}
            label="Priority"
            options={[["all", "All priorities"], ...PRIORITIES.map((p) => [p, p] as [string, string])]}
          />
          <FilterSelect
            value={category}
            onChange={(v) => setCategory(v as "all" | Category)}
            label="Category"
            options={[["all", "All categories"], ...CATEGORIES.map((c) => [c, c] as [string, string])]}
          />
        </CardContent>
      </Card>

      {/* Tickets table */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading…</span>
            </div>
          )}

          {!loading && tickets && tickets.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Ticket className="mx-auto mb-3 h-8 w-8 opacity-40" />
              <p>No tickets match these filters.</p>
            </div>
          )}

          {!loading && tickets && tickets.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Ticket</th>
                    <th className="py-2 pr-3 font-medium">Subject</th>
                    <th className="py-2 pr-3 font-medium">User</th>
                    <th className="py-2 pr-3 font-medium">Category</th>
                    <th className="py-2 pr-3 font-medium">Priority</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 pr-3 text-right font-medium">Msgs</th>
                    <th className="py-2 pr-3 font-medium">Updated</th>
                    <th className="py-2 pr-3" />
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr
                      key={t._id}
                      onClick={() => setSelected(t._id)}
                      className="cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/50"
                    >
                      <td className="py-2 pr-3 font-mono text-xs">
                        {t.ticketNumber}
                      </td>
                      <td className="py-2 pr-3 max-w-[280px] truncate">
                        {t.subject}
                      </td>
                      <td className="py-2 pr-3 text-xs">
                        {t.userEmail ?? "—"}
                      </td>
                      <td className="py-2 pr-3 capitalize">{t.category}</td>
                      <td className="py-2 pr-3">
                        <Badge
                          variant="outline"
                          className={priorityClass(t.priority as Priority)}
                        >
                          {t.priority}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3">
                        <Badge
                          variant="outline"
                          className={statusClass(t.status as Status)}
                        >
                          {t.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {t.messageCount}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(t.updatedAt)}
                      </td>
                      <td className="py-2 pr-3">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <TicketDetailDialog
        ticketId={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

// ============================================
// Detail dialog: view thread, reply, update status/priority
// ============================================
function TicketDetailDialog({
  ticketId,
  onClose,
}: {
  ticketId: Id<"support_tickets"> | null;
  onClose: () => void;
}) {
  const detail = useQuery(
    api.tickets.adminGetTicketDetail,
    ticketId ? { ticketId } : "skip"
  );

  const replyMutation = useMutation(api.tickets.adminReplyToTicket);
  const updateMutation = useMutation(api.tickets.adminUpdateTicket);

  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!ticketId || !reply.trim()) return;
    setSending(true);
    try {
      await replyMutation({
        ticketId,
        message: reply.trim(),
        isInternal: internalNote,
      });
      setReply("");
      toast.success(internalNote ? "Internal note added" : "Reply sent");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Failed: ${msg}`);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: Status) => {
    if (!ticketId) return;
    try {
      await updateMutation({ ticketId, status });
      toast.success(`Status → ${status.replace("_", " ")}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Failed: ${msg}`);
    }
  };

  const handlePriorityChange = async (priority: Priority) => {
    if (!ticketId) return;
    try {
      await updateMutation({ ticketId, priority });
      toast.success(`Priority → ${priority}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Failed: ${msg}`);
    }
  };

  const ticket = detail?.ticket;
  const messages = detail?.messages ?? [];

  return (
    <Dialog open={ticketId !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="font-mono text-sm text-muted-foreground">
              {ticket?.ticketNumber ?? "—"}
            </span>
            <span>{ticket?.subject ?? "Loading…"}</span>
          </DialogTitle>
        </DialogHeader>

        {!detail && ticketId && (
          <div className="flex items-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}

        {ticket && (
          <>
            <div className="mb-4 grid gap-3 rounded-md border bg-muted/30 p-3 text-sm md:grid-cols-4">
              <div>
                <div className="text-xs text-muted-foreground">Customer</div>
                <div className="truncate">{ticket.userEmail}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Category</div>
                <div className="capitalize">{ticket.category}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Priority</div>
                <Select
                  value={ticket.priority}
                  onValueChange={(v) => handlePriorityChange(v as Priority)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <Select
                  value={ticket.status}
                  onValueChange={(v) => handleStatusChange(v as Status)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Original description */}
            <div className="mb-4 rounded-md border bg-background p-3 text-sm">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <UserIcon className="h-3 w-3" />
                <span>Customer · {formatDate(ticket.createdAt)}</span>
              </div>
              <div className="whitespace-pre-wrap">{ticket.description}</div>
            </div>

            {/* Thread */}
            <div className="mb-4 space-y-3">
              {messages.map((m) => (
                <MessageBubble key={m._id} message={m} />
              ))}
              {messages.length === 0 && (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  No replies yet.
                </div>
              )}
            </div>

            {/* Reply box */}
            <div className="space-y-2 border-t pt-4">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={
                  internalNote
                    ? "Internal note (only visible to admins)…"
                    : "Reply to the customer…"
                }
                rows={4}
                className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={internalNote}
                    onChange={(e) => setInternalNote(e.target.checked)}
                  />
                  Post as internal note (not sent to customer)
                </label>
                <Button
                  onClick={handleSend}
                  disabled={sending || !reply.trim()}
                  size="sm"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4" />
                      {internalNote ? "Add note" : "Send reply"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MessageBubble({
  message,
}: {
  message: {
    _id: Id<"ticket_messages">;
    senderType: "customer" | "admin";
    senderName: string;
    message: string;
    isInternal: boolean;
    createdAt: number;
  };
}) {
  const isCustomer = message.senderType === "customer";
  return (
    <div className={isCustomer ? "flex justify-start" : "flex justify-end"}>
      <div
        className={
          "max-w-[80%] rounded-lg p-3 text-sm " +
          (isCustomer
            ? "bg-muted text-foreground"
            : message.isInternal
              ? "border border-amber-500/40 bg-amber-500/10 text-foreground"
              : "bg-primary text-primary-foreground")
        }
      >
        <div className="mb-1 flex items-center gap-2 text-xs opacity-80">
          {isCustomer ? (
            <UserIcon className="h-3 w-3" />
          ) : message.isInternal ? (
            <Bot className="h-3 w-3" />
          ) : (
            <Shield className="h-3 w-3" />
          )}
          <span className="font-medium">{message.senderName}</span>
          {message.isInternal && (
            <Badge variant="outline" className="h-4 text-[10px]">
              internal
            </Badge>
          )}
          <span>· {formatDate(message.createdAt)}</span>
        </div>
        <div className="whitespace-pre-wrap break-words">{message.message}</div>
      </div>
    </div>
  );
}

// ============================================
// Helpers
// ============================================
function FilterSelect({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: [string, string][];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, label]) => (
          <SelectItem key={v} value={v}>
            <span className="capitalize">{label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StatCard({
  title,
  value,
  hint,
  icon,
  tone,
}: {
  title: string;
  value: number;
  hint?: string;
  icon: React.ReactNode;
  tone: "blue" | "red" | "green" | "orange";
}) {
  const toneClasses: Record<typeof tone, string> = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{title}</div>
          <div className={"rounded-md p-2 " + toneClasses[tone]}>{icon}</div>
        </div>
        <div className="text-2xl font-semibold">{value}</div>
        {hint && (
          <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
        )}
      </CardContent>
    </Card>
  );
}
