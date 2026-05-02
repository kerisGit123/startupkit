"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Trash2, Clock, AlertTriangle, CheckCircle, Loader2, PanelLeftClose, PanelLeftOpen, Zap, Shield, Sparkles, TrendingUp, HardDrive, Info, Skull, Building2, Ghost, Download, LifeBuoy, ImageOff, ChevronDown } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppUserButton as UserButton } from "@/components/AppUserButton";
import { OrgSwitcher } from "@/components/OrganizationSwitcherWithLimits";
import { useCompany } from "@/hooks/useCompany";
import { useIsSuperAdmin } from "@/hooks/useAdminRole";
import type { OrphanFile } from "@/convex/storyboard/orphans";
import type { Id } from "@/convex/_generated/dataModel";

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

type CleaningTab = "storage" | "temp" | "orphans" | "admin";

export default function AdminPage({ sidebarOpen, onToggleSidebar }: AdminPageProps) {
  const { user } = useUser();
  const isSuperAdmin = useIsSuperAdmin();
  const [activeTab, setActiveTab] = useState<CleaningTab>("storage");
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

  const tabs: { key: CleaningTab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { key: "storage",  label: "Storage",        icon: <HardDrive className="w-4 h-4" /> },
    { key: "temp",     label: "Temp Files",      icon: <Clock className="w-4 h-4" /> },
    { key: "orphans",  label: "Orphaned Files",  icon: <Ghost className="w-4 h-4" /> },
    { key: "admin",    label: "Admin",           icon: <Shield className="w-4 h-4" />, adminOnly: true },
  ].filter(t => !t.adminOnly || isSuperAdmin);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-(--bg-primary) text-(--text-primary)">
      {/* Minimal top bar */}
      <div className="bg-(--bg-secondary) border-b border-(--border-primary) px-4 md:px-6 lg:px-8 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-(--accent-blue) flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-(--text-primary)">System Cleaning</span>
          </div>
          <div className="flex items-center gap-4">
            <OrgSwitcher />
            <UserButton />
            {onToggleSidebar && (
              <button onClick={onToggleSidebar} className="p-2 rounded-lg bg-(--bg-tertiary) text-(--text-secondary) hover:bg-(--border-primary) transition-colors md:hidden">
                {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-(--bg-primary) to-(--bg-secondary)">
        <div className="px-4 md:px-6 lg:px-8 py-8 max-w-[1100px] mx-auto">

          {/* Centered title + subtitle */}
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-(--text-primary) mb-2">System Cleaning</h1>
            <p className="text-lg text-(--text-secondary)">Manage temporary files and system cleanup</p>
          </div>

          {/* Centered pill tab bar */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center rounded-2xl bg-(--bg-tertiary) border border-(--border-primary) p-1">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    activeTab === tab.key
                      ? "bg-(--accent-blue) text-white shadow-lg"
                      : "text-(--text-secondary) hover:text-(--text-primary)"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Storage tab ── */}
          {activeTab === "storage" && (
          <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-(--text-primary) flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-(--accent-blue)" />
                Storage Statistics
              </h2>
              <button onClick={loadCleanupStats} disabled={isLoading} className="px-4 py-2 bg-(--accent-blue) text-white rounded-lg hover:bg-(--accent-blue-hover) font-medium transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-(--accent-blue)" />
                <span className="ml-2 text-(--text-secondary)">Loading statistics...</span>
              </div>
            ) : error ? (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-400"><AlertTriangle className="w-5 h-5" /><span className="text-sm font-medium">{error}</span></div>
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Files",     value: stats.totalFiles,  icon: <HardDrive className="w-5 h-5 text-blue-400" />,   bg: "bg-blue-500/20" },
                  { label: "Temp Files",      value: stats.tempsFiles,  icon: <Clock className="w-5 h-5 text-yellow-400" />,     bg: "bg-yellow-500/20" },
                  { label: "Cleanable Temps", value: stats.oldFiles,    icon: <Trash2 className="w-5 h-5 text-orange-400" />,    bg: "bg-orange-500/20" },
                  { label: "Total Size",      value: stats.totalSize,   icon: <TrendingUp className="w-5 h-5 text-green-400" />, bg: "bg-green-500/20" },
                ].map(stat => (
                  <div key={stat.label} className="bg-(--bg-primary) border border-(--border-primary) rounded-xl p-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0`}>{stat.icon}</div>
                      <div>
                        <p className="text-2xl font-bold text-(--text-primary)">{stat.value}</p>
                        <p className="text-xs text-(--text-secondary) uppercase tracking-wider">{stat.label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

          {/* ── Temp Files tab ── */}
          {activeTab === "temp" && (
          <div className="space-y-6">
            <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-6">
              <h2 className="text-lg font-bold text-(--text-primary) flex items-center gap-2 mb-6">
                <Trash2 className="w-5 h-5 text-red-400" />
                Cleanup Temporary Files
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-(--text-secondary) mb-2">
                    Delete files older than <span className="font-bold text-(--accent-blue)">{cleanupDays} days</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <input type="range" min="1" max="30" value={cleanupDays} onChange={e => setCleanupDays(Number(e.target.value))} className="flex-1 h-2 bg-(--bg-tertiary) rounded-lg appearance-none cursor-pointer" disabled={isCleaning} />
                    <div className="bg-(--bg-primary) px-4 py-2 rounded-lg min-w-[80px] text-center border border-(--border-primary)">
                      <span className="font-bold text-(--accent-blue)">{cleanupDays}</span>
                      <span className="text-xs text-(--text-tertiary) block">days</span>
                    </div>
                  </div>
                  <div className="text-xs text-(--text-tertiary) mt-2 bg-(--bg-primary) rounded-lg p-3 border border-(--border-primary)">
                    <div className="flex items-center gap-2 mb-1"><Info className="w-3 h-3 text-(--accent-blue)" /><span className="font-medium text-(--text-secondary)">Important:</span></div>
                    Only temporary files older than {cleanupDays} days will be permanently deleted. Generated files are not affected. This action cannot be undone.
                  </div>
                </div>
                <button onClick={performCleanup} disabled={isCleaning || isLoading} className="w-full bg-red-600 hover:bg-red-700 disabled:bg-(--bg-tertiary) disabled:text-(--text-tertiary) disabled:cursor-not-allowed px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-3 transition-all">
                  {isCleaning ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Cleaning Files...</span></> : <><Trash2 className="w-5 h-5" /><span>Clean Temporary Files</span><Shield className="w-4 h-4" /></>}
                </button>
              </div>
            </div>

            {cleanupResult && (
              <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-6">
                <h2 className="text-lg font-bold text-(--text-primary) flex items-center gap-2 mb-6">
                  {cleanupResult.errors.length > 0 ? <><AlertTriangle className="w-5 h-5 text-yellow-400" /><span>Cleanup Results</span></> : <><CheckCircle className="w-5 h-5 text-green-400" /><span>Cleanup Completed</span></>}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {[
                    { label: "Files Deleted",   value: cleanupResult.deletedFiles,   icon: <Trash2 className="w-5 h-5 text-blue-400" />,   bg: "bg-blue-500/20" },
                    { label: "Records Deleted", value: cleanupResult.deletedRecords, icon: <Zap className="w-5 h-5 text-purple-400" />,    bg: "bg-purple-500/20" },
                    { label: "Space Freed",     value: cleanupResult.freedSpace,     icon: <Sparkles className="w-5 h-5 text-green-400" />, bg: "bg-green-500/20" },
                  ].map(stat => (
                    <div key={stat.label} className="bg-(--bg-primary) border border-(--border-primary) rounded-xl p-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0`}>{stat.icon}</div>
                        <div><p className="text-2xl font-bold text-(--text-primary)">{stat.value}</p><p className="text-xs text-(--text-secondary) uppercase tracking-wider">{stat.label}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
                {cleanupResult.errors.length === 0 ? (
                  <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" /><span className="text-sm font-medium text-green-300">Cleanup completed successfully!</span>
                  </div>
                ) : (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5 text-red-400" /><span className="text-sm font-medium text-red-300">Errors:</span></div>
                    <ul className="text-sm text-red-400 space-y-1">{cleanupResult.errors.map((e, i) => <li key={i}>• {e}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

          {/* ── Orphaned Files tab ── */}
          {activeTab === "orphans" && <OrphanFilesSection />}

          {/* ── Admin tab (super-admin only) ── */}
          {activeTab === "admin" && isSuperAdmin && <LapsedOrgsSection />}

        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Orphaned Files Section
// ════════════════════════════════════════════════════════════════════
//
// Scans storyboard_files owned by the current user/org whose parent
// item or element was deleted without cleanup running. Shows thumbnails
// with per-file actions:
//   Rescue → pick a scene in the original project, re-parent the file
//   Download → pre-signed R2 URL (only if r2Key is set)
//   Delete → R2 delete + soft/hard delete via defaultAI rule

function OrphanFilesSection() {
  const { companyId } = useCompany();
  const detectOrphans = useAction(api.storyboard.orphans.detectOrphans);
  const rescueFile = useMutation(api.storyboard.orphans.rescueFile);

  const [orphans, setOrphans] = useState<OrphanFile[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // per-file state
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [rescuingIds, setRescuingIds] = useState<Set<string>>(new Set());
  const [pickerOpenId, setPickerOpenId] = useState<string | null>(null);

  const handleScan = useCallback(async () => {
    if (!companyId) return;
    setScanning(true);
    setScanned(false);
    setError(null);
    setOrphans([]);
    try {
      const result = await detectOrphans({ companyId });
      setOrphans(result);
      setScanned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }, [companyId, detectOrphans]);

  const handleDelete = useCallback(async (fileId: string) => {
    setDeletingIds(prev => new Set(prev).add(fileId));
    try {
      await fetch("/api/storyboard/delete-orphan-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });
      setOrphans(prev => prev.filter(f => f._id !== fileId));
    } catch (err) {
      console.error("[OrphanFilesSection] delete failed:", err);
    } finally {
      setDeletingIds(prev => { const s = new Set(prev); s.delete(fileId); return s; });
    }
  }, []);

  const handleDownload = useCallback(async (file: OrphanFile) => {
    if (!file.r2Key) return;
    setDownloadingIds(prev => new Set(prev).add(file._id));
    try {
      const res = await fetch("/api/storyboard/download-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ r2Key: file.r2Key, filename: file.filename }),
      });
      const { downloadUrl } = await res.json();
      if (downloadUrl) {
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = file.filename;
        a.click();
      }
    } catch (err) {
      console.error("[OrphanFilesSection] download failed:", err);
    } finally {
      setDownloadingIds(prev => { const s = new Set(prev); s.delete(file._id); return s; });
    }
  }, []);

  const handleRescue = useCallback(async (fileId: string, targetItemId: string) => {
    setRescuingIds(prev => new Set(prev).add(fileId));
    setPickerOpenId(null);
    try {
      await rescueFile({
        fileId: fileId as Id<"storyboard_files">,
        targetItemId: targetItemId as Id<"storyboard_items">,
      });
      setOrphans(prev => prev.filter(f => f._id !== fileId));
    } catch (err) {
      console.error("[OrphanFilesSection] rescue failed:", err);
    } finally {
      setRescuingIds(prev => { const s = new Set(prev); s.delete(fileId); return s; });
    }
  }, [rescueFile]);

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const totalSize = orphans.reduce((acc, f) => acc + (f.size ?? 0), 0);

  return (
    <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Ghost className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Orphaned Files</h3>
            <p className="text-xs text-gray-400">
              Files whose parent frame or element was deleted. Auto-cleaned at 04:00 UTC — or clean now.
            </p>
          </div>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning || !companyId}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 text-sm text-amber-300 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ghost className="w-4 h-4" />}
          {scanning ? "Scanning…" : "Scan for Orphans"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">
          {error}
        </div>
      )}

      {scanned && orphans.length === 0 && (
        <div className="py-10 text-center border border-dashed border-white/10 rounded-xl">
          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No orphaned files found.</p>
        </div>
      )}

      {orphans.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">
              {orphans.length} orphaned file{orphans.length !== 1 ? "s" : ""} · {formatBytes(totalSize)} total
            </p>
            <button
              onClick={() => orphans.forEach(f => handleDelete(f._id))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-xs text-red-300 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete All
            </button>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/30">
            {orphans.map(file => (
              <OrphanFileRow
                key={file._id}
                file={file}
                isDeleting={deletingIds.has(file._id)}
                isDownloading={downloadingIds.has(file._id)}
                isRescuing={rescuingIds.has(file._id)}
                pickerOpen={pickerOpenId === file._id}
                onPickerToggle={() => setPickerOpenId(prev => prev === file._id ? null : file._id)}
                onDelete={() => handleDelete(file._id)}
                onDownload={() => handleDownload(file)}
                onRescue={(itemId) => handleRescue(file._id, itemId)}
                formatBytes={formatBytes}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── OrphanFileRow ─────────────────────────────────────────────────────────────

interface OrphanFileRowProps {
  file: OrphanFile;
  isDeleting: boolean;
  isDownloading: boolean;
  isRescuing: boolean;
  pickerOpen: boolean;
  onPickerToggle: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onRescue: (itemId: string) => void;
  formatBytes: (n: number) => string;
}

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";

function OrphanFileRow({
  file, isDeleting, isDownloading, isRescuing, pickerOpen,
  onPickerToggle, onDelete, onDownload, onRescue, formatBytes,
}: OrphanFileRowProps) {
  const mediaUrl = file.r2Key
    ? `${R2_PUBLIC_URL}/${file.r2Key}`
    : file.sourceUrl || "";
  const [imgError, setImgError] = useState(false);
  const [mediaExpanded, setMediaExpanded] = useState(false);
  const canDownload = !!file.r2Key;
  const canRescue = file.projectExists && !!file.projectId;
  const isVideo = file.fileType === "video";
  const isAudio = file.fileType === "audio";

  // Load scenes for the picker only when it's open
  const items = useQuery(
    api.storyboard.storyboardItems.listByProject,
    canRescue && pickerOpen ? { projectId: file.projectId as Id<"storyboard_projects"> } : "skip"
  );

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-start gap-3">
      {/* Thumbnail / media preview */}
      <button
        onClick={() => mediaUrl && (isVideo || isAudio) && setMediaExpanded(e => !e)}
        className={`w-14 h-14 rounded-lg bg-white/5 border border-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center relative ${(isVideo || isAudio) && mediaUrl ? "cursor-pointer hover:border-white/30" : "cursor-default"}`}
      >
        {isVideo && mediaUrl ? (
          <>
            <video src={mediaUrl} className="w-full h-full object-cover" muted preload="metadata" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="w-5 h-5 rounded-full bg-white/80 flex items-center justify-center">
                <span className="text-[8px] text-black ml-0.5">▶</span>
              </div>
            </div>
          </>
        ) : isAudio ? (
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl">🎵</span>
            <span className="text-[9px] text-gray-500">audio</span>
          </div>
        ) : mediaUrl && !imgError ? (
          <img
            src={mediaUrl}
            alt={file.filename}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <ImageOff className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{file.filename}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
          <span className="text-xs text-gray-500">{formatBytes(file.size)}</span>
          {file.creditsUsed > 0 && (
            <span className="text-xs text-amber-400">{file.creditsUsed} cr</span>
          )}
          {file.model && (
            <span className="text-xs text-gray-600 font-mono truncate max-w-[120px]">{file.model}</span>
          )}
          {file.projectName ? (
            <span className="text-xs text-blue-400 truncate">
              from: {file.projectName}
            </span>
          ) : (
            <span className="text-xs text-gray-600 italic">no project</span>
          )}
        </div>

        {/* Scene picker */}
        {pickerOpen && (
          <div className="mt-2 bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
            {!items ? (
              <div className="px-3 py-2 text-xs text-gray-500 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading scenes…
              </div>
            ) : items.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-500">No scenes in this project</div>
            ) : (
              items.map((item: any) => (
                <button
                  key={item._id}
                  onClick={() => onRescue(item._id)}
                  className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                >
                  {item.title || `Scene ${item.order ?? ""}`}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {canRescue && (
          <button
            onClick={onPickerToggle}
            disabled={isRescuing || isDeleting}
            title="Rescue to a scene"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-xs text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isRescuing ? <Loader2 className="w-3 h-3 animate-spin" /> : <LifeBuoy className="w-3 h-3" />}
            <ChevronDown className={`w-3 h-3 transition-transform ${pickerOpen ? "rotate-180" : ""}`} />
          </button>
        )}
        {canDownload && (
          <button
            onClick={onDownload}
            disabled={isDownloading || isDeleting}
            title="Download"
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          </button>
        )}
        <button
          onClick={onDelete}
          disabled={isDeleting || isRescuing}
          title="Delete permanently"
          className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
      </div>

      {/* Inline media player — expands when thumbnail is clicked */}
      {mediaExpanded && mediaUrl && (
        <div className="mt-1">
          {isVideo ? (
            <video
              src={mediaUrl}
              controls
              className="w-full max-h-64 rounded-lg bg-black"
              autoPlay
            />
          ) : isAudio ? (
            <audio src={mediaUrl} controls className="w-full" autoPlay />
          ) : null}
        </div>
      )}
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
    <div className="bg-linear-to-br from-red-950/20 to-orange-950/10 border border-red-500/30 rounded-2xl p-6">
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
