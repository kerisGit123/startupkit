import { internalMutation } from "./_generated/server";

export const verifyTaskIdField = internalMutation({
  handler: async (ctx) => {
    console.log('[verifyTaskIdField] Checking schema...');

    const sampleRecord = await ctx.db.query("storyboard_files").first();

    if (sampleRecord) {
      console.log('[verifyTaskIdField] Sample record fields:', Object.keys(sampleRecord));

      const hasTaskId = 'taskId' in sampleRecord;
      console.log('[verifyTaskIdField] taskId field exists:', hasTaskId);

      if (hasTaskId) {
        console.log('[verifyTaskIdField] ✅ Schema updated successfully');
      } else {
        console.log('[verifyTaskIdField] ❌ Schema not updated yet');
      }
    } else {
      console.log('[verifyTaskIdField] No records found, but schema should be updated');
    }

    return { success: true };
  },
});
