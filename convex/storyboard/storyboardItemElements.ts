import { mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

// Add element to storyboard item
export const addElementToItem = mutation({
  args: {
    itemId: v.id("storyboard_items"),
    elementId: v.id("storyboard_elements"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }

    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Storyboard item not found");
    }

    const element = await ctx.db.get(args.elementId);
    if (!element) {
      throw new Error("Element not found");
    }

    // Get current linked elements
    const currentElements = item.linkedElements || [];
    
    // Check if element already linked
    const alreadyLinked = currentElements.some(el => el.id === args.elementId);
    if (alreadyLinked) {
      return item._id;
    }

    // Add new element
    const updatedElements = [
      ...currentElements,
      {
        id: args.elementId as Id<"storyboard_elements">,
        name: element.name,
        type: element.type,
      }
    ];

    await ctx.db.patch(args.itemId, {
      linkedElements: updatedElements,
    });

    return item._id;
  },
});

// Remove element from storyboard item
export const removeElementFromItem = mutation({
  args: {
    itemId: v.id("storyboard_items"),
    elementId: v.id("storyboard_elements"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }

    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Storyboard item not found");
    }

    // Get current linked elements
    const currentElements = item.linkedElements || [];
    
    // Remove the element
    const updatedElements = currentElements.filter(el => el.id !== args.elementId);

    await ctx.db.patch(args.itemId, {
      linkedElements: updatedElements,
    });

    return item._id;
  },
});

// Remove unused PRIVATE elements from all storyboard items in a project
export const removeUnusedElements = mutation({
  args: {
    projectId: v.id("storyboard_projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }

    // Get all elements for this project
    const allElements = await ctx.db
      .query("storyboard_elements")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .collect();

    // Create sets for element IDs - separate private and public
    const privateElementIds = new Set(
      allElements.filter(el => el.visibility === "private").map(el => el._id)
    );
    const allElementIds = new Set(allElements.map(el => el._id));

    // Get all storyboard items for this project
    const items = await ctx.db
      .query("storyboard_items")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .collect();

    let cleanedCount = 0;

    // Clean up each item's linkedElements
    for (const item of items) {
      if (!item.linkedElements || item.linkedElements.length === 0) {
        continue;
      }

      // Filter out:
      // 1. Private elements that no longer exist
      // 2. Keep all public elements (even if deleted)
      const validElements = item.linkedElements.filter(el => {
        // If element doesn't exist at all, remove it
        if (!allElementIds.has(el.id)) {
          return false;
        }
        // If element is private and doesn't exist, remove it
        if (privateElementIds.has(el.id)) {
          return true;
        }
        // Keep all public elements
        return true;
      });

      if (validElements.length !== item.linkedElements.length) {
        await ctx.db.patch(item._id, {
          linkedElements: validElements,
        });
        cleanedCount++;
      }
    }

    return {
      itemsCleaned: cleanedCount,
      message: `Cleaned ${cleanedCount} storyboard items (removed private unused elements only)`,
    };
  },
});
