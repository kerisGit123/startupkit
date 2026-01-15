import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Create a shareable public link for a PO with expiration
 */
export const createPOShareLink = mutation({
  args: {
    poId: v.id("purchase_orders"),
    expiresInDays: v.optional(v.number()), // Default 7 days
  },
  handler: async (ctx, { poId, expiresInDays = 7 }) => {
    // Verify PO exists
    const po = await ctx.db.get(poId);
    if (!po) {
      throw new Error("Purchase order not found");
    }

    // Generate unique share token
    const shareToken = crypto.randomUUID();
    const expiresAt = Date.now() + (expiresInDays * 24 * 60 * 60 * 1000);

    // Create share link record
    const shareLinkId = await ctx.db.insert("po_share_links", {
      poId,
      shareToken,
      expiresAt,
      createdAt: Date.now(),
      accessCount: 0,
      isActive: true,
    });

    return {
      shareLinkId,
      shareToken,
      shareUrl: `/share/po/${shareToken}`,
      expiresAt,
    };
  },
});

/**
 * Get PO by share token (public access)
 */
export const getPOByShareToken = query({
  args: {
    shareToken: v.string(),
  },
  handler: async (ctx, { shareToken }) => {
    // Find share link
    const shareLink = await ctx.db
      .query("po_share_links")
      .withIndex("by_token", (q) => q.eq("shareToken", shareToken))
      .first();

    if (!shareLink) {
      return { error: "Share link not found" };
    }

    // Check if expired
    if (shareLink.expiresAt < Date.now()) {
      return { error: "Share link has expired" };
    }

    // Check if active
    if (!shareLink.isActive) {
      return { error: "Share link has been deactivated" };
    }

    // Note: Access count is incremented via separate mutation called from frontend

    // Get PO data
    const po = await ctx.db.get(shareLink.poId);
    if (!po) {
      return { error: "Purchase order not found" };
    }

    return {
      po,
      shareLink: {
        expiresAt: shareLink.expiresAt,
        accessCount: shareLink.accessCount + 1,
      },
    };
  },
});

/**
 * Deactivate a share link
 */
export const deactivateShareLink = mutation({
  args: {
    shareLinkId: v.id("po_share_links"),
  },
  handler: async (ctx, { shareLinkId }) => {
    await ctx.db.patch(shareLinkId, {
      isActive: false,
    });
    return { success: true };
  },
});

/**
 * Increment access count for a share link
 */
export const incrementShareLinkAccess = mutation({
  args: {
    shareToken: v.string(),
  },
  handler: async (ctx, { shareToken }) => {
    const shareLink = await ctx.db
      .query("po_share_links")
      .withIndex("by_token", (q) => q.eq("shareToken", shareToken))
      .first();

    if (shareLink) {
      await ctx.db.patch(shareLink._id, {
        accessCount: shareLink.accessCount + 1,
        lastAccessedAt: Date.now(),
      });
    }
  },
});

/**
 * Get all share links for a PO
 */
export const getPOShareLinks = query({
  args: {
    poId: v.id("purchase_orders"),
  },
  handler: async (ctx, { poId }) => {
    const shareLinks = await ctx.db
      .query("po_share_links")
      .withIndex("by_po", (q) => q.eq("poId", poId))
      .collect();

    return shareLinks;
  },
});
