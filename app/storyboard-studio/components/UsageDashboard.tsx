"use client";

import { useQuery } from "convex/react";
import { useOrganization, useUser, UserButton } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { BarChart2, Zap, Image as ImageIcon, Video, FileText, Users } from "lucide-react";

const ACTION_META: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  image_generation: { label: "Image Gen",  Icon: ImageIcon,  color: "text-purple-400" },
  video_generation: { label: "Video Gen",  Icon: Video,      color: "text-blue-400"   },
  script_generation:{ label: "AI Script",  Icon: FileText,   color: "text-emerald-400"},
  member_added:     { label: "Team",        Icon: Users,      color: "text-gray-400"   },
};

export function UsageDashboard() {
  const { organization } = useOrganization();
  const { user } = useUser();
  const orgId = organization?.id ?? user?.id ?? "personal";

  const summary = useQuery(api.storyboard.creditUsage.getOrgSummary, { orgId });
  const recent  = useQuery(api.storyboard.creditUsage.listByOrg, { orgId, limit: 20 });

  if (!summary) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d12]">
        <div className="flex items-center justify-end px-6 py-4 border-b border-white/6 shrink-0">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
                userButtonPopoverCard: "bg-[#1a1a1f] border border-white/10 shadow-xl",
                userButtonPopoverActionButton: "text-gray-300 hover:bg-white/5 hover:text-white",
                userButtonPopoverActionButtonText: "text-sm",
                userButtonPopoverFooter: "border-t border-white/10",
              },
            }}
            afterSignOutUrl="/"
          />
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const topActions = (Object.entries(summary.byAction) as [string, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topUsers = (Object.entries(summary.byUser) as [string, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const maxAction = topActions[0]?.[1] ?? 1;
  const maxUser   = topUsers[0]?.[1] ?? 1;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d12]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/6 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-purple-400" />
            Credit Usage
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Org-wide AI usage across all projects</p>
        </div>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
              userButtonPopoverCard: "bg-[#1a1a1f] border border-white/10 shadow-xl",
              userButtonPopoverActionButton: "text-gray-300 hover:bg-white/5 hover:text-white",
              userButtonPopoverActionButtonText: "text-sm",
              userButtonPopoverFooter: "border-t border-white/10",
            },
          }}
          afterSignOutUrl="/"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6 max-w-3xl">

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Credits Used", value: summary.total.toLocaleString(), icon: Zap, color: "text-yellow-400" },
          { label: "Total Generations",  value: summary.count.toLocaleString(), icon: BarChart2, color: "text-purple-400" },
          { label: "Members Active",     value: Object.keys(summary.byUser).length, icon: Users, color: "text-blue-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white/4 border border-white/8 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <p className="text-xs text-gray-500">{label}</p>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* By Action */}
        <div className="bg-white/4 border border-white/8 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-4">By Action</p>
          <div className="space-y-3">
            {topActions.length === 0 && <p className="text-xs text-gray-600">No data yet</p>}
            {topActions.map(([action, credits]) => {
              const meta = ACTION_META[action] ?? { label: action, Icon: Zap, color: "text-gray-400" };
              return (
                <div key={action}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <meta.Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                      <span className="text-xs text-gray-300">{meta.label}</span>
                    </div>
                    <span className="text-xs text-gray-500">{credits} cr</span>
                  </div>
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500/60 rounded-full transition-all"
                      style={{ width: `${(credits / maxAction) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By User */}
        <div className="bg-white/4 border border-white/8 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-4">By Member</p>
          <div className="space-y-3">
            {topUsers.length === 0 && <p className="text-xs text-gray-600">No data yet</p>}
            {topUsers.map(([userId, credits]) => (
              <div key={userId}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-300 font-mono truncate max-w-[120px]">{userId.slice(0, 8)}…</span>
                  <span className="text-xs text-gray-500">{credits} cr</span>
                </div>
                <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500/60 rounded-full transition-all"
                    style={{ width: `${(credits / maxUser) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent log */}
      <div className="bg-white/4 border border-white/8 rounded-xl p-4">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-4">Recent Usage</p>
        {!recent || recent.length === 0 ? (
          <p className="text-xs text-gray-600">No usage recorded yet</p>
        ) : (
          <div className="divide-y divide-white/6">
            {recent.map((r) => {
              const meta = ACTION_META[r.action] ?? { label: r.action, Icon: Zap, color: "text-gray-400" };
              return (
                <div key={r._id} className="flex items-center gap-3 py-2">
                  <meta.Icon className={`w-3.5 h-3.5 ${meta.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300">{meta.label}</p>
                    <p className="text-[10px] text-gray-600 font-mono truncate">{r.model}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-yellow-400 font-medium">{r.creditsUsed} cr</p>
                    <p className="text-[10px] text-gray-600">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
        </div>
      </div>
    </div>
  );
}
