"use client";

import React, { useState, useEffect } from "react";
import { Trash2, Clock, AlertTriangle, CheckCircle, Loader2, PanelLeftClose, PanelLeftOpen, Zap, Shield, Sparkles, TrendingUp, HardDrive, Info } from "lucide-react";
import { useUser, OrganizationSwitcher, UserButton } from "@clerk/nextjs";

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
            <OrganizationSwitcher />
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
      </div>
    </div>
  );
}
