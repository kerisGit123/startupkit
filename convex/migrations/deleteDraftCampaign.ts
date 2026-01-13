import { internalMutation } from "../_generated/server";

// Delete the problematic campaign with draft status
export const deleteDraftCampaign = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Find all campaigns with draft status
    const allCampaigns = await ctx.db.query("email_campaigns").collect();
    
    let deleted = 0;
    for (const campaign of allCampaigns) {
      // Check if campaign has draft status (using any to bypass type checking)
      if ((campaign as any).status === "draft") {
        console.log(`Deleting campaign: ${campaign.name} (ID: ${campaign._id})`);
        await ctx.db.delete(campaign._id);
        deleted++;
      }
    }
    
    console.log(`Deleted ${deleted} campaigns with draft status`);
    return { success: true, deleted };
  },
});
