"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useState } from "react";
import { Trash2, AlertCircle, CheckCircle } from "lucide-react";

export default function InboxCleanupPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ deletedCount: number; threadsProcessed: number } | null>(null);
  
  const cleanupDuplicates = useMutation(api.inbox.cleanupDuplicateInboxEntries);

  const handleCleanup = async () => {
    if (!confirm("This will remove duplicate inbox entries and keep only the original ticket message per thread. Continue?")) {
      return;
    }

    setIsRunning(true);
    setResult(null);

    try {
      const res = await cleanupDuplicates({});
      setResult(res);
      toast.success(`Cleanup complete! Removed ${res.deletedCount} duplicate entries.`);
    } catch (error) {
      toast.error("Cleanup failed: " + (error as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Inbox Data Cleanup</h1>
        <p className="text-muted-foreground mt-2">
          Clean up duplicate inbox entries to ensure one row per ticket
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900">What this does:</h3>
              <ul className="text-sm text-yellow-800 mt-2 space-y-1 list-disc list-inside">
                <li>Groups all inbox messages by ticket number (threadId)</li>
                <li>Keeps only the original ticket message (first inbound message)</li>
                <li>Removes all reply entries from inbox (replies stay in ticket_messages)</li>
                <li>Results in one clean row per ticket in the inbox</li>
              </ul>
            </div>
          </div>

          <Button
            onClick={handleCleanup}
            disabled={isRunning}
            size="lg"
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isRunning ? "Cleaning up..." : "Run Cleanup"}
          </Button>

          {result && (
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900">Cleanup Complete!</h3>
                <div className="text-sm text-green-800 mt-2 space-y-1">
                  <p>✓ Processed {result.threadsProcessed} ticket threads</p>
                  <p>✓ Removed {result.deletedCount} duplicate entries</p>
                  <p className="mt-2">Your inbox now shows one row per ticket.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">How the Inbox Works Now</h2>
        <div className="space-y-3 text-sm">
          <div>
            <h3 className="font-medium">📋 One Row Per Ticket</h3>
            <p className="text-muted-foreground">Each ticket appears as a single row in the inbox, not multiple rows for each reply.</p>
          </div>
          <div>
            <h3 className="font-medium">💬 View Full Conversation</h3>
            <p className="text-muted-foreground">Click on a ticket to see the full conversation thread with all replies.</p>
          </div>
          <div>
            <h3 className="font-medium">🔵 Unread = Unreplied</h3>
            <p className="text-muted-foreground">Unread filter shows tickets that haven't been replied to by admin yet.</p>
          </div>
          <div>
            <h3 className="font-medium">⭐ Important = Urgent/Follow-up</h3>
            <p className="text-muted-foreground">Important filter shows tickets labeled as urgent or follow-up.</p>
          </div>
          <div>
            <h3 className="font-medium">🏷️ Label Tickets</h3>
            <p className="text-muted-foreground">Use the colored dot buttons to label tickets as urgent (red), follow-up (yellow), or resolved (green).</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
