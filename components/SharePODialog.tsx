"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Share2, Copy, Check, ExternalLink, Clock } from "lucide-react";

interface SharePODialogProps {
  poId: Id<"purchase_orders">;
  isOpen: boolean;
  onClose: () => void;
}

export function SharePODialog({ poId, isOpen, onClose }: SharePODialogProps) {
  const [expiryDays, setExpiryDays] = useState(7);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  
  const createShareLink = useMutation(api.purchaseOrders.createShareLink.createPOShareLink);
  const existingLinks = useQuery(api.purchaseOrders.createShareLink.getPOShareLinks, { poId });
  const deactivateLink = useMutation(api.purchaseOrders.createShareLink.deactivateShareLink);

  const handleCreateLink = async () => {
    try {
      const result = await createShareLink({ poId, expiresInDays: expiryDays });
      toast.success("Share link created successfully!");
      
      // Auto-copy the link
      const fullUrl = `${window.location.origin}${result.shareUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedToken(result.shareToken);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (error) {
      toast.error("Failed to create share link");
    }
  };

  const handleCopyLink = async (shareToken: string, shareUrl: string) => {
    const fullUrl = `${window.location.origin}${shareUrl}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopiedToken(shareToken);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleDeactivate = async (shareLinkId: Id<"po_share_links">) => {
    try {
      await deactivateLink({ shareLinkId });
      toast.success("Share link deactivated");
    } catch (error) {
      toast.error("Failed to deactivate link");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const isExpired = (expiresAt: number) => {
    const now = Date.now();
    return expiresAt < now;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Purchase Order
          </DialogTitle>
          <DialogDescription>
            Create a public link to share this PO with anyone. Links expire automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Create New Link */}
          <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
            <h3 className="font-semibold">Create New Share Link</h3>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label htmlFor="expiryDays">Expires in (days)</Label>
                <Input
                  id="expiryDays"
                  type="number"
                  min="1"
                  max="365"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value) || 7)}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleCreateLink} className="gap-2">
                <Share2 className="h-4 w-4" />
                Generate Link
              </Button>
            </div>
          </div>

          {/* Existing Links */}
          {existingLinks && existingLinks.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Active Share Links</h3>
              <div className="space-y-2">
                {existingLinks.map((link) => {
                  const expired = isExpired(link.expiresAt);
                  const shareUrl = `/share/po/${link.shareToken}`;
                  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${shareUrl}` : shareUrl;
                  
                  return (
                    <div
                      key={link._id}
                      className={`border rounded-lg p-3 ${
                        !link.isActive || expired ? 'bg-gray-50 opacity-60' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {!link.isActive ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                                Deactivated
                              </span>
                            ) : expired ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                Expired
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                Active
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Expires: {formatDate(link.expiresAt)}
                            </span>
                          </div>
                          <div className="font-mono text-sm truncate text-muted-foreground">
                            {fullUrl}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Accessed {link.accessCount} times
                            {link.lastAccessedAt && ` • Last: ${formatDate(link.lastAccessedAt)}`}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {link.isActive && !expired && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCopyLink(link.shareToken, shareUrl)}
                                className="gap-1"
                              >
                                {copiedToken === link.shareToken ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(fullUrl, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {link.isActive && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeactivate(link._id)}
                              className="text-destructive hover:text-destructive"
                            >
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(!existingLinks || existingLinks.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <Share2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No share links created yet</p>
              <p className="text-sm mt-1">Create a link above to share this PO</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
