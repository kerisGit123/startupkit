import { internalMutation } from "../_generated/server";

// Migration to add isActive field and remove draft status from existing campaigns
export const addIsActiveToCampaigns = internalMutation({
  args: {},
  handler: async (ctx) => {
    const campaigns = await ctx.db.query("email_campaigns").collect();
    
    let updated = 0;
    for (const campaign of campaigns) {
      const updates: any = {};
      
      // Add isActive if missing
      if (campaign.isActive === undefined) {
        updates.isActive = true; // Default existing campaigns to active
      }
      
      // Remove draft status (no longer valid in schema)
      if ((campaign as any).status === "draft") {
        updates.status = undefined; // Remove draft status
      }
      
      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(campaign._id, updates);
        updated++;
      }
    }
    
    console.log(`Migration complete: Updated ${updated} campaigns`);
    return { success: true, updated };
  },
});
