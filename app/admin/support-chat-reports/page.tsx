"use client";

import { useMemo, useState } from "react";
import { useConvex, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CleanupButton } from "@/components/admin/CleanupButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Users,
  Coins,
  DollarSign,
  Loader2,
  Bot,
  User as UserIcon,
  Wrench,
  MonitorPlay,
  Landmark,
} from "lucide-react";

type TimeRange = "7d" | "30d" | "90d" | "all";
type VariantFilter = "all" | "landing" | "studio";

const rangeToMs: Record<TimeRange, number | null> = {
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
  all: null,
};

function formatUsd(n: number | null | undefined): string {
  if (n == null) return "$0.00";
  if (n < 0.01 && n > 0) return "<$0.01";
  return `$${n.toFixed(n < 1 ? 4 : 2)}`;
}

function formatNum(n: number | null | undefined): string {
  if (n == null) return "0";
  return new Intl.NumberFormat("en-US").format(n);
}

function formatDate(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SupportChatReportsPage() {
  const convex = useConvex();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [variantFilter, setVariantFilter] = useState<VariantFilter>("all");
  const [selectedSessionId, setSelectedSessionId] =
    useState<Id<"support_chat_sessions"> | null>(null);

  const sinceMs = useMemo(() => {
    const delta = rangeToMs[timeRange];
    return delta === null ? undefined : Date.now() - delta;
  }, [timeRange]);

  const stats = useQuery(api.supportChat.adminGetStats, { sinceMs });
  const sessions = useQuery(api.supportChat.adminListSessions, {
    sinceMs,
    variant: variantFilter === "all" ? undefined : variantFilter,
    limit: 100,
  });

  const loading = stats === undefined || sessions === undefined;
  const error =
    stats === null || (sessions as unknown) === null
      ? "You need super_admin role to view this page."
      : null;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Support Chat Reports</h1>
          <p className="mt-1 text-muted-foreground">
            Usage, cost, and conversation logs for the Haiku-powered support
            widget.
          </p>
        </div>
        <CleanupButton
          triggerLabel="Clean up sessions"
          itemNoun="session"
          eligibilityHint="All chat sessions older than the cutoff will be deleted along with their messages. This does not affect support tickets or KB articles."
          preview={async (olderThanMs) => {
            const res = await convex.query(
              api.supportChat.adminCountStaleSessions,
              { olderThanMs }
            );
            return {
              count: res.sessionCount,
              secondaryCount: res.messageCount,
              secondaryLabel: "message records",
              cutoffDate: res.cutoffDate,
            };
          }}
          run={async (olderThanMs) => {
            const res = await convex.mutation(
              api.supportChat.adminCleanupStaleSessions,
              { olderThanMs }
            );
            return {
              deleted: res.deletedSessions,
              hasMore: res.hasMore,
              extraLines: [`Removed ${res.deletedMessages} message records.`],
            };
          }}
        />
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="py-4 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      <div className="mb-6 flex flex-wrap gap-4">
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <TabsList>
            <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
            <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
            <TabsTrigger value="90d">Last 90 Days</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs
          value={variantFilter}
          onValueChange={(v) => setVariantFilter(v as VariantFilter)}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="landing">Landing</TabsTrigger>
            <TabsTrigger value="studio">Studio</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sessions"
          value={formatNum(stats?.totalSessions)}
          icon={<MessageSquare className="h-5 w-5" />}
          tone="blue"
          subtitle={
            stats
              ? `${formatNum(stats.landingSessions)} landing · ${formatNum(stats.studioSessions)} studio`
              : undefined
          }
        />
        <StatCard
          title="Total Messages"
          value={formatNum(stats?.totalMessages)}
          icon={<Bot className="h-5 w-5" />}
          tone="violet"
          subtitle={
            stats
              ? `${(stats.avgMessagesPerSession || 0).toFixed(1)} avg per session`
              : undefined
          }
        />
        <StatCard
          title="Estimated Cost"
          value={formatUsd(stats?.estCostUsd)}
          icon={<DollarSign className="h-5 w-5" />}
          tone="green"
          subtitle={
            stats
              ? `${formatNum(stats.totalTokensIn)} in · ${formatNum(stats.totalTokensOut)} out`
              : undefined
          }
        />
        <StatCard
          title="Unique Users"
          value={formatNum(stats?.uniqueUsers)}
          icon={<Users className="h-5 w-5" />}
          tone="orange"
          subtitle={
            stats ? `+${formatNum(stats.anonSessions)} anon sessions` : undefined
          }
        />
      </div>

      {stats && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Pricing basis</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Cost is estimated from Haiku 4.5 list pricing:{" "}
            <span className="font-mono">${stats.haikuInputPer1M.toFixed(2)}/1M input</span>{" "}
            ·{" "}
            <span className="font-mono">${stats.haikuOutputPer1M.toFixed(2)}/1M output</span>.
            Prompt-cache reads (cheaper) are counted at full rate, so this is an
            upper bound.
          </CardContent>
        </Card>
      )}

      {/* Sessions list */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading…</span>
            </div>
          )}

          {!loading && sessions && sessions.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              No sessions in this range.
            </div>
          )}

          {!loading && sessions && sessions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Started</th>
                    <th className="py-2 pr-3 font-medium">User</th>
                    <th className="py-2 pr-3 font-medium">Where</th>
                    <th className="py-2 pr-3 font-medium">Title</th>
                    <th className="py-2 pr-3 text-right font-medium">Msgs</th>
                    <th className="py-2 pr-3 text-right font-medium">Tok In</th>
                    <th className="py-2 pr-3 text-right font-medium">Tok Out</th>
                    <th className="py-2 pr-3 text-right font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr
                      key={s._id}
                      onClick={() => setSelectedSessionId(s._id)}
                      className="cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/50"
                    >
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {formatDate(s.createdAt)}
                      </td>
                      <td className="py-2 pr-3">
                        {s.userEmail ? (
                          <div>
                            <div className="font-medium">
                              {s.userName ?? s.userEmail}
                            </div>
                            {s.userName && (
                              <div className="text-xs text-muted-foreground">
                                {s.userEmail}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            anonymous
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        {s.variant === "studio" ? (
                          <Badge variant="secondary" className="gap-1">
                            <MonitorPlay className="h-3 w-3" /> Studio
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <Landmark className="h-3 w-3" /> Landing
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 pr-3 max-w-[280px] truncate">
                        {s.title ?? (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right">{s.messageCount}</td>
                      <td className="py-2 pr-3 text-right font-mono text-xs">
                        {formatNum(s.tokensIn)}
                      </td>
                      <td className="py-2 pr-3 text-right font-mono text-xs">
                        {formatNum(s.tokensOut)}
                      </td>
                      <td className="py-2 pr-3 text-right font-mono">
                        {formatUsd(s.estCostUsd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <SessionTranscriptDialog
        sessionId={selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
      />
    </div>
  );
}

// ============================================
// Session transcript dialog
// ============================================
function SessionTranscriptDialog({
  sessionId,
  onClose,
}: {
  sessionId: Id<"support_chat_sessions"> | null;
  onClose: () => void;
}) {
  const detail = useQuery(
    api.supportChat.adminGetSessionDetail,
    sessionId ? { sessionId } : "skip"
  );

  return (
    <Dialog open={sessionId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Session Transcript</DialogTitle>
        </DialogHeader>

        {!detail && sessionId && (
          <div className="flex items-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}

        {detail && (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 rounded-md border bg-muted/30 p-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">User</div>
                <div>
                  {detail.session.userEmail ? (
                    <>
                      <span className="font-medium">
                        {detail.session.userName ?? detail.session.userEmail}
                      </span>
                      {detail.session.userName && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {detail.session.userEmail}
                        </span>
                      )}
                    </>
                  ) : (
                    <Badge variant="outline">anonymous</Badge>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Variant</div>
                <div className="capitalize">{detail.session.variant}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Started</div>
                <div>{formatDate(detail.session.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Tokens / Cost</div>
                <div className="font-mono text-xs">
                  {formatNum(detail.session.tokensIn)} in ·{" "}
                  {formatNum(detail.session.tokensOut)} out ·{" "}
                  {formatUsd(detail.session.estCostUsd)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {detail.messages.map((m) => (
                <TranscriptMessage
                  key={m._id}
                  role={m.role}
                  content={m.content}
                  toolCalls={m.toolCalls}
                  createdAt={m.createdAt}
                />
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TranscriptMessage({
  role,
  content,
  toolCalls,
  createdAt,
}: {
  role: "user" | "assistant" | "tool";
  content: string;
  toolCalls: Array<{
    toolName: string;
    toolUseId: string;
    input: string;
    output?: string;
    isError?: boolean;
  }>;
  createdAt: number;
}) {
  const isUser = role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          "max-w-[85%] rounded-lg p-3 text-sm " +
          (isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground")
        }
      >
        <div className="mb-1 flex items-center gap-2 text-xs opacity-70">
          {isUser ? (
            <UserIcon className="h-3 w-3" />
          ) : (
            <Bot className="h-3 w-3" />
          )}
          <span className="font-medium">
            {isUser ? "User" : "Assistant"}
          </span>
          <span>· {formatDate(createdAt)}</span>
        </div>
        {content && (
          <div className="whitespace-pre-wrap break-words">{content}</div>
        )}
        {toolCalls.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {toolCalls.map((tc) => (
              <div
                key={tc.toolUseId}
                className="rounded border border-border/40 bg-background/50 p-2 text-xs"
              >
                <div className="mb-1 flex items-center gap-1.5 font-medium">
                  <Wrench className="h-3 w-3" />
                  <span>{tc.toolName}</span>
                  {tc.isError && (
                    <Badge variant="destructive" className="ml-1 text-[10px]">
                      error
                    </Badge>
                  )}
                </div>
                {tc.input && tc.input !== "{}" && (
                  <div className="mb-1">
                    <span className="text-muted-foreground">input:</span>{" "}
                    <span className="font-mono">{tc.input}</span>
                  </div>
                )}
                {tc.output && (
                  <div className="line-clamp-6">
                    <span className="text-muted-foreground">output:</span>{" "}
                    <span className="font-mono">{tc.output}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Stat card
// ============================================
function StatCard({
  title,
  value,
  icon,
  tone,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  tone: "blue" | "violet" | "green" | "orange";
  subtitle?: string;
}) {
  const toneClasses: Record<typeof tone, string> = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
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
        {subtitle && (
          <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
        )}
      </CardContent>
    </Card>
  );
}
