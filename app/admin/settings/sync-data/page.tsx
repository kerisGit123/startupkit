"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, CheckCircle, AlertCircle, Database } from "lucide-react";

export default function SyncDataPage() {
  const [syncing, setSyncing] = useState(false);
  const syncTickets = useMutation(api.migrations.syncTicketsToInbox.syncTicketsToInbox);
  const syncStatus = useQuery(api.migrations.syncTicketsToInbox.getSyncStatus);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncTickets();
      toast.success(`Synced ${result.synced} tickets to inbox! (${result.skipped} already existed)`);
    } catch (error) {
      toast.error("Failed to sync tickets");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 pt-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Sync</h1>
        <p className="text-muted-foreground mt-1">
          Sync existing data to unified inbox
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Sync Support Tickets to Inbox
          </CardTitle>
          <CardDescription>
            Copy existing support tickets into the unified inbox so they appear in the Inbox page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {syncStatus && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Total Support Tickets:</span>
                <span className="text-lg font-bold">{syncStatus.totalTickets}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Tickets in Inbox:</span>
                <span className="text-lg font-bold">{syncStatus.ticketsInInbox}</span>
              </div>
              {syncStatus.needsSync ? (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {syncStatus.totalTickets - syncStatus.ticketsInInbox} tickets need to be synced
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-800 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">All tickets are synced!</span>
                </div>
              )}
            </div>
          )}

          <Button 
            onClick={handleSync} 
            disabled={syncing || (syncStatus && !syncStatus.needsSync)}
            className="w-full"
          >
            {syncing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Tickets to Inbox
              </>
            )}
          </Button>

          <div className="text-sm text-muted-foreground space-y-1 pt-4 border-t">
            <p><strong>What this does:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Copies all support tickets to the inbox_messages table</li>
              <li>Maps ticket status to inbox status (open → unread, closed → archived)</li>
              <li>Preserves ticket metadata (number, category, priority)</li>
              <li>Skips tickets that are already in the inbox</li>
              <li>Safe to run multiple times</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
