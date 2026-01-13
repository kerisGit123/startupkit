import { mutation } from "../_generated/server";

// Fix existing templates to have system category
export const fixTemplateCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const systemTypes = ["welcome", "password_reset", "subscription", "payment", "usage_alert", "admin_notification"];
    
    const templates = await ctx.db.query("email_templates").collect();
    let updated = 0;
    
    for (const template of templates) {
      if (template.type && systemTypes.includes(template.type) && template.category !== "system") {
        await ctx.db.patch(template._id, {
          category: "system",
          updatedAt: Date.now(),
        });
        updated++;
      }
    }
    
    return { updated, message: `Updated ${updated} templates to system category` };
  },
});
