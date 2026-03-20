import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Move a storyboard item up or down in the order
 * Swaps the order values between the current item and the adjacent item
 */
export const moveStoryboardItem = mutation({
  args: {
    projectId: v.id("storyboard_projects"),
    itemId: v.id("storyboard_items"),
    direction: v.union(v.literal("up"), v.literal("down")),
  },
  handler: async (ctx, args) => {
    // Get all items for this project, ordered by 'order' field using the index
    const items = await ctx.db
      .query("storyboard_items")
      .withIndex("by_order", (q) => q.eq("projectId", args.projectId))
      .order("asc")
      .collect();
    
    // Find current item and its position
    const currentIndex = items.findIndex(item => item._id === args.itemId);
    
    if (currentIndex === -1) {
      throw new Error("Item not found");
    }
    
    // Calculate new position
    const newIndex = args.direction === "up" 
      ? Math.max(0, currentIndex - 1)
      : Math.min(items.length - 1, currentIndex + 1);
    
    if (newIndex === currentIndex) {
      // Already at boundary, no move needed
      return;
    }
    
    // Swap order values
    const currentItem = items[currentIndex];
    const targetItem = items[newIndex];
    
    // Update database with swapped order values
    await ctx.db.patch(currentItem._id, { order: targetItem.order });
    await ctx.db.patch(targetItem._id, { order: currentItem.order });
  }
});

/**
 * Direct move storyboard item to a specific position
 * More efficient for drag-and-drop operations
 */
export const moveStoryboardItemToPosition = mutation({
  args: {
    projectId: v.id("storyboard_projects"),
    itemId: v.id("storyboard_items"),
    targetOrder: v.number(),
  },
  handler: async (ctx, args) => {
    // Get all items for this project, ordered by 'order' field using the index
    const items = await ctx.db
      .query("storyboard_items")
      .withIndex("by_order", (q) => q.eq("projectId", args.projectId))
      .order("asc")
      .collect();
    
    // Find current item and its position
    const currentItem = items.find(item => item._id === args.itemId);
    
    if (!currentItem) {
      throw new Error("Item not found");
    }
    
    const currentOrder = currentItem.order;
    
    // If target order is the same as current, no move needed
    if (currentOrder === args.targetOrder) {
      return;
    }
    
    // Clamp target order to valid range
    const clampedTargetOrder = Math.max(0, Math.min(items.length - 1, args.targetOrder));
    
    if (currentOrder === clampedTargetOrder) {
      return;
    }
    
    // Determine move direction
    const isMovingUp = currentOrder > clampedTargetOrder;
    
    // Update all affected items
    if (isMovingUp) {
      // Moving up: shift items between target and current position down
      const itemsToShift = items.filter(item => 
        item.order >= clampedTargetOrder && item.order < currentOrder
      );
      
      // Shift affected items down by 1
      for (const item of itemsToShift) {
        await ctx.db.patch(item._id, { order: item.order + 1 });
      }
      
      // Move current item to target position
      await ctx.db.patch(currentItem._id, { order: clampedTargetOrder });
    } else {
      // Moving down: shift items between current and target position up
      const itemsToShift = items.filter(item => 
        item.order > currentOrder && item.order <= clampedTargetOrder
      );
      
      // Shift affected items up by 1
      for (const item of itemsToShift) {
        await ctx.db.patch(item._id, { order: item.order - 1 });
      }
      
      // Move current item to target position
      await ctx.db.patch(currentItem._id, { order: clampedTargetOrder });
    }
  }
});

/**
 * Initialize order values for existing storyboard items
 * This is a migration script to ensure all items have proper order values
 */
export const initializeOrderForItems = mutation({
  args: {
    projectId: v.id("storyboard_projects"),
  },
  handler: async (ctx, args) => {
    // Get all items for this project
    const items = await ctx.db
      .query("storyboard_items")
      .filter(q => q.eq(q.field("projectId"), args.projectId))
      .collect();
    
    // Sort by creation time as fallback
    const sortedItems = items.sort((a, b) => a.createdAt - b.createdAt);
    
    // Update order values
    for (let i = 0; i < sortedItems.length; i++) {
      await ctx.db.patch(sortedItems[i]._id, { order: i });
    }
  }
});

/**
 * Get storyboard items with proper ordering
 */
export const getStoryboardItemsOrdered = query({
  args: {
    projectId: v.id("storyboard_projects"),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("storyboard_items")
      .withIndex("by_order", (q) => q.eq("projectId", args.projectId))
      .order("asc")
      .collect();
    
    return items;
  }
});
