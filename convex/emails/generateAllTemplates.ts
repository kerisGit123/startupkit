import { mutation } from "../_generated/server";
import { internal } from "../_generated/api";

// Generate all 6 system templates at once
export const generateAllSystemTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const templateTypes = [
      "welcome_email",
      "password_reset",
      "subscription_email",
      "payment_notification",
      "usage_alert",
      "admin_notification",
    ];
    
    const results = [];
    
    for (const templateType of templateTypes) {
      try {
        const result = await ctx.runMutation(internal.emails.systemTemplates.generateSystemTemplate, {
          templateType: templateType as "welcome_email" | "password_reset" | "subscription_email" | "payment_notification" | "usage_alert" | "admin_notification",
          overwrite: true, // Always overwrite when generating all
        });
        results.push({ templateType, success: result.success });
      } catch (error) {
        results.push({ 
          templateType, 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    return {
      success: successCount === templateTypes.length,
      generated: successCount,
      total: templateTypes.length,
      results,
    };
  },
});
