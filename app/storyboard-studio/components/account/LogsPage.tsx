"use client";

import { useState, useMemo } from "react";
import {
  PanelLeftClose, PanelLeftOpen, ChevronDown,
  Loader2, ExternalLink, Clock, Image as ImageIcon,
  AlertCircle, CheckCircle2, Copy, Coins,
  TrendingUp, XCircle, HardDrive, BarChart3, ScrollText,
} from "lucide-react";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentCompanyId } from "@/lib/auth-utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

interface LogsPageProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const STATUS_STYLES: Record<string, { dot: string; text: string }> = {
  completed: { dot: "bg-emerald-400", text: "text-emerald-400" },
  ready: { dot: "bg-emerald-400", text: "text-emerald-400" },
  generating: { dot: "bg-amber-400", text: "text-amber-400" },
  uploading: { dot: "bg-blue-400", text: "text-blue-400" },
  failed: { dot: "bg-red-400", text: "text-red-400" },
  error: { dot: "bg-red-400", text: "text-red-400" },
};

const PERIOD_OPTIONS = [
  { label: "This Month", value: "current_month" },
  { label: "Last 3 Months", value: "last_3_months" },
  { label: "Last 6 Months", value: "last_6_months" },
  { label: "This Year", value: "this_year" },
] as const;

type PeriodValue = typeof PERIOD_OPTIONS[number]["value"];

const CHART_COLORS = [
  "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b",
  "#ec4899", "#06b6d4", "#f97316", "#6366f1",
];

const CATEGORY_LABELS: Record<string, string> = {
  generated: "AI Generated",
  uploads: "Uploads",
  elements: "Elements",
  storyboard: "Storyboard",
  videos: "Videos",
  temps: "Temporary",
  other: "Other",
};

function getTimestampRange(period: PeriodValue): { from: number; to: number } {
  const now = new Date();
  const to = now.getTime();
  let from: Date;
  switch (period) {
    case "current_month": from = new Date(now.getFullYear(), now.getMonth(), 1); break;
    case "last_3_months": from = new Date(now.getFullYear(), now.getMonth() - 2, 1); break;
    case "last_6_months": from = new Date(now.getFullYear(), now.getMonth() - 5, 1); break;
    case "this_year": from = new Date(now.getFullYear(), 0, 1); break;
  }
  return { from: from.getTime(), to };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-3 shadow-2xl text-left">
      <p className="text-xs text-gray-400 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color || p.fill }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

export default function LogsPage({ sidebarOpen, onToggleSidebar }: LogsPageProps) {
  const { user } = useUser();
  const companyId = useCurrentCompanyId();
  const [statusFilter, setStatusFilter] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<PeriodValue>("current_month");
  const [activeTab, setActiveTab] = useState<"storage" | "generation" | "logs">("storage");

  const { from, to } = useMemo(() => getTimestampRange(analyticsPeriod), [analyticsPeriod]);

  const storageUsage = useQuery(
    api.storyboard.storyboardFiles.getStorageUsage,
    companyId ? { companyId } : "skip"
  );

  const analytics = useQuery(
    api.storyboard.storyboardFiles.getGenerationAnalytics,
    companyId ? { companyId, fromTimestamp: from, toTimestamp: to } : "skip"
  );

  const { results, status: queryStatus, loadMore, isLoading } = usePaginatedQuery(
    api.storyboard.storyboardFiles.listGenerationLogs,
    companyId ? { companyId, status: statusFilter || undefined } : "skip",
    { initialNumItems: 20 }
  );

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleString("en-US", {
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });

  const getModelFromFile = (file: any): string => {
    if (file.model) return file.model;
    if (file.metadata?.model) return file.metadata.model;
    const name = file.filename || "";
    const parts = name.split("_");
    if (parts.length > 1) return parts[0];
    return name.split(".")[0] || "Unknown";
  };

  // Chart data
  const storagePieData = useMemo(() => {
    if (!storageUsage?.categoryStats) return [];
    return storageUsage.categoryStats.map((c) => ({
      name: CATEGORY_LABELS[c.category] || c.category,
      value: c.size,
      count: c.count,
    }));
  }, [storageUsage]);

  const fileTypePieData = useMemo(() => {
    if (!storageUsage?.fileTypeStats) return [];
    return storageUsage.fileTypeStats.map((f) => ({
      name: f.fileType,
      value: f.size,
      count: f.count,
    }));
  }, [storageUsage]);

  const dailyChartData = useMemo(() => {
    if (!analytics?.dailyStats) return [];
    return analytics.dailyStats.map((d) => ({
      date: new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      Generations: d.count,
      Credits: d.credits,
    }));
  }, [analytics?.dailyStats]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-(--border-primary) bg-(--bg-secondary) shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onToggleSidebar} className="text-(--text-secondary) transition hover:text-(--text-primary) md:hidden">
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-(--text-primary)">Logs</h1>
            <ChevronDown className="w-4 h-4 text-(--text-tertiary)" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center self-end md:flex lg:self-auto">
            <OrganizationSwitcher appearance={{ elements: { rootBox: "flex items-center", organizationSwitcherTrigger: "px-3 py-2 rounded-lg border border-(--border-primary) bg-(--bg-secondary) hover:bg-(--bg-tertiary) text-white hover:text-gray-200 flex items-center gap-2 text-sm mr-3" } }} />
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-(--bg-primary) to-(--bg-secondary)">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">

          {/* Title + Tabs */}
          <div className="mb-6">
            <h1 className="text-3xl lg:text-4xl font-bold text-(--text-primary) mb-2">Logs</h1>
            <p className="text-lg text-(--text-secondary) mb-6">An overview of your AI generation requests and storage</p>

            <div className="flex items-center gap-1 bg-(--bg-tertiary) border border-(--border-primary) rounded-2xl p-1 w-fit">
              {([
                { key: "storage", label: "Storage Usage", icon: HardDrive },
                { key: "generation", label: "Model Generation", icon: BarChart3 },
                { key: "logs", label: "Log History", icon: ScrollText },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    activeTab === tab.key ? "bg-(--accent-purple) text-white shadow-lg" : "text-(--text-secondary) hover:text-(--text-primary)"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── STORAGE TAB ────────────────────────────────── */}
          {activeTab === "storage" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                      <HardDrive className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-xs text-(--text-secondary) mb-0.5">Total Storage</p>
                      <p className="text-2xl font-bold text-white">{formatBytes(storageUsage?.totalSize ?? 0)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-(--text-secondary) mb-0.5">Total Files</p>
                      <p className="text-2xl font-bold text-white">{(storageUsage?.totalFiles ?? 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-(--text-secondary) mb-0.5">Categories</p>
                      <p className="text-2xl font-bold text-white">{storageUsage?.categoryStats?.length ?? 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* By Category */}
                <div className="bg-gradient-to-br from-(--bg-secondary) to-(--bg-tertiary) border border-(--border-primary) rounded-3xl p-6 shadow-2xl">
                  <h3 className="text-sm font-semibold text-(--text-primary) mb-5">Storage by Category</h3>
                  {storagePieData.length > 0 ? (
                    <div className="flex items-center gap-6">
                      <div className="w-[180px] h-[180px] shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={storagePieData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                              {storagePieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={({ active, payload }: any) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              return (
                                <div className="bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
                                  <p className="text-xs text-gray-400">{d.name}</p>
                                  <p className="text-sm font-semibold text-white">{formatBytes(d.value)}</p>
                                  <p className="text-xs text-gray-400">{d.count} files</p>
                                </div>
                              );
                            }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-3">
                        {storagePieData.map((item, i) => (
                          <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                              <span className="text-xs text-(--text-secondary)">{item.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold text-white">{formatBytes(item.value)}</span>
                              <span className="text-xs text-(--text-tertiary) ml-2">{item.count} files</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[180px] text-sm text-(--text-tertiary)">No storage data</div>
                  )}
                </div>

                {/* By File Type */}
                <div className="bg-gradient-to-br from-(--bg-secondary) to-(--bg-tertiary) border border-(--border-primary) rounded-3xl p-6 shadow-2xl">
                  <h3 className="text-sm font-semibold text-(--text-primary) mb-5">Storage by File Type</h3>
                  {fileTypePieData.length > 0 ? (
                    <div className="flex items-center gap-6">
                      <div className="w-[180px] h-[180px] shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={fileTypePieData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                              {fileTypePieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={({ active, payload }: any) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              return (
                                <div className="bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
                                  <p className="text-xs text-gray-400">{d.name}</p>
                                  <p className="text-sm font-semibold text-white">{formatBytes(d.value)}</p>
                                  <p className="text-xs text-gray-400">{d.count} files</p>
                                </div>
                              );
                            }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-3">
                        {fileTypePieData.map((item, i) => (
                          <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[(i + 3) % CHART_COLORS.length] }} />
                              <span className="text-xs text-(--text-secondary)">{item.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold text-white">{formatBytes(item.value)}</span>
                              <span className="text-xs text-(--text-tertiary) ml-2">{item.count} files</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[180px] text-sm text-(--text-tertiary)">No file data</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── MODEL GENERATION TAB ───────────────────────── */}
          {activeTab === "generation" && (
            <div className="space-y-6">
              {/* Period selector */}
              <div className="flex items-center gap-2">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAnalyticsPeriod(opt.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      analyticsPeriod === opt.value
                        ? "bg-(--accent-purple) text-white shadow-lg"
                        : "bg-(--bg-tertiary) text-(--text-secondary) hover:text-(--text-primary) border border-(--border-primary)"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Generations", value: (analytics?.totalGenerations ?? 0).toLocaleString(), icon: TrendingUp, color: "from-blue-500/20 to-blue-600/20", iconColor: "text-blue-400", borderColor: "border-blue-500/30" },
                  { label: "Credits Used", value: (analytics?.totalCredits ?? 0).toLocaleString(), icon: Coins, color: "from-purple-500/20 to-purple-600/20", iconColor: "text-purple-400", borderColor: "border-purple-500/30" },
                  { label: "Success", value: (analytics?.totalSuccess ?? 0).toLocaleString(), icon: CheckCircle2, color: "from-emerald-500/20 to-emerald-600/20", iconColor: "text-emerald-400", borderColor: "border-emerald-500/30" },
                  { label: "Failed", value: (analytics?.totalFailed ?? 0).toLocaleString(), icon: XCircle, color: "from-red-500/20 to-red-600/20", iconColor: "text-red-400", borderColor: "border-red-500/30" },
                ].map((stat) => (
                  <div key={stat.label} className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm rounded-2xl p-5 border ${stat.borderColor}`}>
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

              {/* Usage chart */}
              <div className="bg-gradient-to-br from-(--bg-secondary) to-(--bg-tertiary) border border-(--border-primary) rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-(--text-primary)">Usage Over Time</h3>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-[#8b5cf6] inline-block" /> Generations</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-[#10b981] inline-block" /> Credits</span>
                  </div>
                </div>
                {dailyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradGen" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradCred" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<DarkTooltip />} />
                      <Area type="monotone" dataKey="Generations" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradGen)" />
                      <Area type="monotone" dataKey="Credits" stroke="#10b981" strokeWidth={2} fill="url(#gradCred)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-sm text-(--text-tertiary)">No activity in this period</div>
                )}
              </div>
            </div>
          )}

          {/* ── LOG HISTORY TAB ─────────────────────────────── */}
          {activeTab === "logs" && (
            <div className="space-y-6">
              {/* Retention Alert */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-400">Log Retention Policy</p>
                  <p className="text-xs text-(--text-secondary) mt-1">
                    Media files are retained for 14 days, log data for 2 months. Back up important files in advance.
                  </p>
                </div>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-xl text-sm bg-(--bg-tertiary) border border-(--border-primary) text-(--text-primary) focus:outline-none focus:border-(--accent-purple) [color-scheme:dark]"
                >
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="ready">Ready</option>
                  <option value="generating">Generating</option>
                  <option value="failed">Failed</option>
                  <option value="error">Error</option>
                </select>
                <span className="text-sm text-(--text-tertiary)">
                  {results ? `${results.length} logs loaded` : "Loading..."}
                </span>
              </div>

              {/* Table */}
              <div className="bg-gradient-to-br from-(--bg-secondary) to-(--bg-tertiary) border border-(--border-primary) rounded-3xl overflow-hidden shadow-2xl">
                {isLoading && !results?.length ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-(--text-secondary)" />
                  </div>
                ) : !results?.length ? (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-(--text-tertiary)" />
                    </div>
                    <p className="text-(--text-secondary) mb-1">No generation logs found</p>
                    <p className="text-sm text-(--text-tertiary)">Logs will appear here when you generate images or videos</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-(--border-primary) bg-(--bg-tertiary)/50">
                          <th className="px-5 py-4 text-left text-xs font-semibold text-(--text-secondary) uppercase tracking-wider">Model & Details</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold text-(--text-secondary) uppercase tracking-wider">Status</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold text-(--text-secondary) uppercase tracking-wider">Credits</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold text-(--text-secondary) uppercase tracking-wider">Size</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold text-(--text-secondary) uppercase tracking-wider">Task ID</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold text-(--text-secondary) uppercase tracking-wider">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((file: any, index: number) => {
                          const model = getModelFromFile(file);
                          const statusStyle = STATUS_STYLES[file.status] || STATUS_STYLES.completed;
                          const statusLabel = file.status === "ready" ? "success" : file.status;
                          return (
                            <tr key={file._id} className={`border-b border-(--border-primary) last:border-0 hover:bg-(--bg-tertiary)/30 transition-all duration-200 ${index % 2 === 0 ? "" : "bg-(--bg-primary)/20"}`}>
                              <td className="px-5 py-4">
                                <div className="space-y-1.5">
                                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-(--accent-purple)/20 text-(--accent-purple) border border-(--accent-purple)/30">{model}</span>
                                  <p className="text-xs text-(--text-secondary)">{formatDate(file.createdAt)}</p>
                                  {file.aiKeyName && <p className="text-xs text-(--text-tertiary)">AI Key: {file.aiKeyName}</p>}
                                  {file.fileType && <p className="text-xs text-(--text-tertiary)">Type: {file.fileType}</p>}
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                                  <span className={`text-xs font-medium uppercase ${statusStyle.text}`}>{statusLabel}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4"><span className="text-sm font-semibold text-white">{file.creditsUsed ?? 0}</span></td>
                              <td className="px-5 py-4"><span className="text-xs text-(--text-secondary)">{file.size ? formatBytes(file.size) : "-"}</span></td>
                              <td className="px-5 py-4">
                                {file.taskId ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-mono text-(--text-secondary) max-w-[180px] truncate">{file.taskId}</span>
                                    <button onClick={() => handleCopy(file.taskId, file._id)} className="text-(--text-tertiary) hover:text-white transition-colors shrink-0" title="Copy Task ID">
                                      {copiedId === file._id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                ) : <span className="text-xs text-(--text-tertiary)">-</span>}
                              </td>
                              <td className="px-5 py-4">
                                {file.sourceUrl ? (
                                  <a href={file.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium hover:bg-emerald-500/30 transition-colors">
                                    <ExternalLink className="w-3 h-3" /> Result
                                  </a>
                                ) : file.r2Key ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-medium">
                                    <ImageIcon className="w-3 h-3" /> Stored
                                  </span>
                                ) : <span className="text-xs text-(--text-tertiary)">-</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {queryStatus === "CanLoadMore" && (
                  <div className="flex justify-center py-4 border-t border-(--border-primary)">
                    <button onClick={() => loadMore(20)} disabled={isLoading} className="px-6 py-2.5 rounded-xl bg-(--bg-tertiary) border border-(--border-primary) text-sm text-(--text-secondary) hover:text-white hover:border-(--accent-purple)/50 transition-all disabled:opacity-50 flex items-center gap-2">
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                      Load More
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
