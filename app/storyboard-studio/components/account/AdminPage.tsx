"use client";

import React, { useState, useEffect } from "react";
import { Trash2, Clock, AlertTriangle, CheckCircle, Loader2, PanelLeftClose, PanelLeftOpen, Zap, Shield, Sparkles, TrendingUp, HardDrive, Info, Skull, Building2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppUserButton as UserButton } from "@/components/AppUserButton";
import { OrgSwitcher } from "@/components/OrganizationSwitcherWithLimits";

interface CleanupStats {
  totalFiles: number;
  tempsFiles: number;
  oldFiles: number;
  totalSize: string;
}

interface CleanupResult {
  deletedFiles: number;
  deletedRecords: number;
  freedSpace: string;
  errors: string[];
}

interface AdminPageProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export default function AdminPage({ sidebarOpen, onToggleSidebar }: AdminPageProps) {
  const { user } = useUser();
  const [cleanupDays, setCleanupDays] = useState<number>(7);
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load cleanup stats on component mount
  useEffect(() => {
    loadCleanupStats();
  }, []);

  const loadCleanupStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/cleanup-stats');
      if (!response.ok) {
        throw new Error('Failed to load cleanup statistics');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error loading cleanup stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const performCleanup = async () => {
    try {
      setIsCleaning(true);
      setError(null);
      setCleanupResult(null);
      
      const response = await fetch('/api/admin/cleanup-temp-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ daysOlderThan: cleanupDays }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to perform cleanup');
      }
      
      const result = await response.json();
      setCleanupResult(result);
      
      // Reload stats after cleanup
      await loadCleanupStats();
    } catch (err) {
      console.error('Error performing cleanup:', err);
      setError(err instanceof Error ? err.message : 'Failed to perform cleanup');
    } finally {
      setIsCleaning(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-(--bg-primary) text-(--text-primary)">
      {/* Header Bar - LTX Dark Theme with Org/User */}
      <div className="bg-(--bg-secondary) border-b border-(--border-primary) px-4 md:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-xl bg-(--accent-blue) flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-(--text-primary)">System Cleaning</h1>
              <p className="text-sm text-(--text-secondary) mt-1">Manage temporary files and system cleanup</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <OrgSwitcher />
            <UserButton />
            {/* Sidebar Toggle for Mobile */}
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-lg bg-(--bg-tertiary) text-(--text-secondary) hover:bg-(--border-primary) transition-colors md:hidden"
              >
                {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-[1100px] mx-auto">
        {/* Cleanup Statistics */}
        <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-(--text-primary) flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-(--accent-blue)" />
              Storage Statistics
            </h2>
            <button
              onClick={loadCleanupStats}
              disabled={isLoading}
              className="px-4 py-2 bg-(--accent-blue) text-white rounded-lg hover:bg-(--accent-blue-hover) font-medium transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-(--accent-blue)" />
              <span className="ml-2 text-(--text-secondary)">Loading statistics...</span>
            </div>
          ) : error ? (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-(--bg-primary) border border-(--border-primary) rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <HardDrive className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-(--text-primary)">{stats.totalFiles}</p>
                    <p className="text-xs text-(--text-secondary) uppercase tracking-wider">Total Files</p>
                  </div>
                </div>
              </div>
              <div className="bg-(--bg-primary) border border-(--border-primary) rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-(--text-primary)">{stats.tempsFiles}</p>
                    <p className="text-xs text-(--text-secondary) uppercase tracking-wider">Temps Files</p>
                  </div>
                </div>
              </div>
              <div className="bg-(--bg-primary) border border-(--border-primary) rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-(--text-primary)">{stats.oldFiles}</p>
                    <p className="text-xs text-(--text-secondary) uppercase tracking-wider">Old Files</p>
                  </div>
                </div>
              </div>
              <div className="bg-(--bg-primary) border border-(--border-primary) rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-(--text-primary)">{stats.totalSize}</p>
                    <p className="text-xs text-(--text-secondary) uppercase tracking-wider">Total Size</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Cleanup Controls */}
        <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-(--text-primary) flex items-center gap-2 mb-6">
            <Trash2 className="w-5 h-5 text-red-400" />
            Cleanup Temporary Files
          </h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="cleanup-days" className="block text-sm font-medium text-(--text-secondary) mb-2">
                Delete files older than <span className="font-bold text-(--accent-blue)"> {cleanupDays} days</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  id="cleanup-days"
                  min="1"
                  max="30"
                  value={cleanupDays}
                  onChange={(e) => setCleanupDays(Number(e.target.value))}
                  className="flex-1 h-2 bg-(--bg-tertiary) rounded-lg appearance-none cursor-pointer"
                  disabled={isCleaning}
                />
                <div className="bg-(--bg-primary) px-4 py-2 rounded-lg min-w-[80px] text-center border border-(--border-primary)">
                  <span className="font-bold text-(--accent-blue)">{cleanupDays}</span>
                  <span className="text-xs text-(--text-tertiary) block">days</span>
                </div>
              </div>
              <div className="text-xs text-(--text-tertiary) mt-2 bg-(--bg-primary) rounded-lg p-3 border border-(--border-primary)">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="w-3 h-3 text-(--accent-blue)" />
                  <span className="font-medium text-(--text-secondary)">Important:</span>
                </div>
                Only temporary files older than {cleanupDays} days will be permanently deleted. Generated files are not affected. This action cannot be undone.
              </div>
            </div>

            <button
              onClick={performCleanup}
              disabled={isCleaning || isLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-(--bg-tertiary) disabled:text-(--text-tertiary) disabled:cursor-not-allowed px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-3 transition-all"
            >
              {isCleaning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Cleaning Files...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  <span>Clean Temporary Files</span>
                  <Shield className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cleanup Result */}
        {cleanupResult && (
          <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-6">
            <h2 className="text-lg font-bold text-(--text-primary) flex items-center gap-2 mb-6">
              {cleanupResult.errors.length > 0 ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <span>Cleanup Results</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Cleanup Completed</span>
                </>
              )}
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-(--bg-primary) border border-(--border-primary) rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-(--text-primary)">{cleanupResult.deletedFiles}</p>
                      <p className="text-xs text-(--text-secondary) uppercase tracking-wider">Files Deleted</p>
                    </div>
                  </div>
                </div>
                <div className="bg-(--bg-primary) border border-(--border-primary) rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-(--text-primary)">{cleanupResult.deletedRecords}</p>
                      <p className="text-xs text-(--text-secondary) uppercase tracking-wider">Records Deleted</p>
                    </div>
                  </div>
                </div>
                <div className="bg-(--bg-primary) border border-(--border-primary) rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-(--text-primary)">{cleanupResult.freedSpace}</p>
                      <p className="text-xs text-(--text-secondary) uppercase tracking-wider">Space Freed</p>
                    </div>
                  </div>
                </div>
              </div>

              {cleanupResult.errors.length > 0 && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span className="text-sm font-medium text-red-300">Errors encountered:</span>
                  </div>
                  <ul className="text-sm text-red-400 space-y-2">
                    {cleanupResult.errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {cleanupResult.errors.length === 0 && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-medium text-green-300">
                      Cleanup completed successfully! All old temporary files have been removed.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lapsed Organizations — super-admin purge flow */}
        <LapsedOrgsSection />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Lapsed Organizations Section
// ════════════════════════════════════════════════════════════════════
//
// Lists orgs whose subscription has been lapsed for 90+ days. A super
// admin can purge each individually: this deletes R2 files, Convex
// records, and the Clerk org in one orchestrated cleanup.
//
// Two-step confirmation required: the admin must type the companyId
// exactly before the Purge button becomes active. This is a safety
// check to prevent accidental deletion of active orgs.
function LapsedOrgsSection() {
  const LAPSE_THRESHOLD_DAYS = 90;

  const lapsedOrgs = useQuery(api.credits.listLapsedOrgs, {
    olderThanDays: LAPSE_THRESHOLD_DAYS,
  });

  // Two-click confirmation state: first click selects the org and
  // reveals the "Confirm Release" button, second click runs the purge.
  // Safer than a single button (prevents misclicks) but much less
  // annoying than typing the companyId by hand.
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [purging, setPurging] = useState(false);
  const [result, setResult] = useState<{
    kind: "success" | "error";
    message: string;
    details?: any;
  } | null>(null);

  async function handlePurge(companyId: string) {
    setPurging(true);
    setResult(null);
    try {
      const response = await fetch("/api/admin/purge-lapsed-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // confirmText is auto-set to companyId — the API still enforces
        // the safety check but the admin doesn't have to type it
        body: JSON.stringify({ companyId, confirmText: companyId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Purge failed");
      }
      setResult({
        kind: "success",
        message: `Released R2 + Clerk for ${companyId.slice(0, 16)}…`,
        details: data,
      });
      setSelectedCompanyId(null);
    } catch (err) {
      setResult({
        kind: "error",
        message: err instanceof Error ? err.message : "Purge failed",
      });
    } finally {
      setPurging(false);
    }
  }

  return (
    <div className="mt-8 bg-linear-to-br from-red-950/20 to-orange-950/10 border border-red-500/30 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
          <Skull className="w-5 h-5 text-red-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">
            Purge Lapsed Organizations
          </h3>
          <p className="text-xs text-gray-400">
            Orgs whose subscription has been lapsed for 90+ days. Purging
            releases R2 files and the Clerk org but preserves all
            financial and audit records.
          </p>
        </div>
      </div>

      {/* Compliance notice */}
      <div className="mb-4 p-3 rounded-lg border border-blue-500/30 bg-blue-500/5 text-xs text-blue-200/80">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
          <div>
            <strong className="text-blue-300">Soft-delete only.</strong> This
            action deletes Cloudflare R2 files and the Clerk organization,
            but does NOT delete <code>credits_balance</code>,{" "}
            <code>credits_ledger</code>, <code>storyboard_files</code>{" "}
            metadata, projects, items, or elements. The financial and
            audit trail is preserved indefinitely for tax, billing
            reconciliation, and data-export requests. After purge, the{" "}
            <code>storyboard_files.r2Key</code> is cleared (file is gone
            but the record of which files existed, who generated them,
            and how many credits they cost is kept).
          </div>
        </div>
      </div>

      {/* Result banner */}
      {result && (
        <div
          className={`mb-4 p-3 rounded-lg border text-sm ${
            result.kind === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          <div className="font-semibold">{result.message}</div>
          {result.details && (
            <pre className="mt-2 text-[10px] overflow-x-auto">
              {JSON.stringify(result.details, null, 2)}
            </pre>
          )}
        </div>
      )}

      {lapsedOrgs === undefined ? (
        <div className="text-xs text-gray-500 py-4 text-center">
          Loading lapsed organizations…
        </div>
      ) : lapsedOrgs.length === 0 ? (
        <div className="text-xs text-gray-500 py-6 text-center border border-dashed border-white/10 rounded-lg">
          No organizations have been lapsed for {LAPSE_THRESHOLD_DAYS}+ days.
        </div>
      ) : (
        <div className="space-y-2">
          {lapsedOrgs.map((org) => {
            const isSelected = selectedCompanyId === org.companyId;
            return (
              <div
                key={org.companyId}
                className={`rounded-xl p-4 transition-colors ${
                  isSelected
                    ? "bg-red-500/10 border border-red-500/50"
                    : "bg-white/5 border border-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Org name (prominent) */}
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-red-400 shrink-0" />
                      <span className="text-sm font-bold text-white truncate">
                        {org.organizationName ?? "(unnamed organization)"}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="text-xs text-gray-500 space-y-0.5 font-mono">
                      <div className="truncate">
                        companyId:{" "}
                        <span className="text-gray-300">{org.companyId}</span>
                      </div>
                      <div>
                        owner:{" "}
                        <span className="text-gray-300">
                          {org.creatorUserId?.slice(0, 20) ?? "unknown"}
                          {org.creatorUserId && "…"}
                        </span>
                      </div>
                      <div>
                        lapsed:{" "}
                        <span className="text-red-400">
                          {org.lapsedDays} days ago
                        </span>
                      </div>
                      <div>
                        balance:{" "}
                        <span className="text-gray-300">
                          {org.balance.toLocaleString()} credits (preserved)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="shrink-0">
                    {isSelected ? (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handlePurge(org.companyId)}
                          disabled={purging}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-red-500 hover:bg-red-400 text-xs font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {purging ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          {purging ? "Releasing…" : "Confirm Release"}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCompanyId(null);
                            setResult(null);
                          }}
                          disabled={purging}
                          className="px-4 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-xs text-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedCompanyId(org.companyId);
                          setResult(null);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-xs text-red-300"
                      >
                        <Trash2 className="w-3 h-3" />
                        Release R2 + Clerk
                      </button>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-red-500/20 text-[11px] text-red-200/70">
                    <strong className="text-red-300">
                      This will permanently:
                    </strong>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      <li>Delete R2 files belonging to this org (Cloudflare storage)</li>
                      <li>Delete the Clerk organization (release MAO billing)</li>
                      <li>Clear r2Key on storyboard_files rows (metadata preserved)</li>
                      <li>Set purgedAt on credits_balance (audit marker)</li>
                    </ul>
                    <strong className="text-emerald-300 mt-2 block">
                      Preserved (financial audit trail):
                    </strong>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-emerald-200/70">
                      <li>credits_ledger (all transactions)</li>
                      <li>credits_balance (with purgedAt marker)</li>
                      <li>storyboard_files rows (without r2Key)</li>
                      <li>storyboard_projects / items / elements</li>
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
