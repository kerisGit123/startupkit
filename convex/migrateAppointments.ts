import { internalMutation } from "./_generated/server";

// Migration script to update old appointments from clientId/clientEmail to contactId/contactEmail
export const migrateOldAppointments = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all appointments
    const appointments = await ctx.db.query("appointments").collect();
    
    let migrated = 0;
    let skipped = 0;
    
    for (const appointment of appointments) {
      const doc = appointment as any;
      
      // Check if this is an old appointment with clientId/clientEmail
      if (doc.clientId && !doc.contactId) {
        // Update to new schema
        await ctx.db.patch(appointment._id, {
          contactId: doc.clientId,
          contactName: doc.clientName,
          contactEmail: doc.clientEmail,
          contactPhone: doc.clientPhone,
        });
        
        migrated++;
        console.log(`Migrated appointment ${appointment._id}`);
      } else {
        skipped++;
      }
    }
    
    return {
      total: appointments.length,
      migrated,
      skipped,
      message: `Migration complete: ${migrated} appointments migrated, ${skipped} skipped`,
    };
  },
});
