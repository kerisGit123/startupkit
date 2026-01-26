import { mutation } from "./_generated/server";

/**
 * Initialize the booking system with default availability
 * Run this once after deploying the schema:
 * npx convex run initializeBookingSystem
 */
export default mutation({
  args: {},
  handler: async (ctx) => {
    console.log("🚀 Initializing booking system...");

    // Create default availability for Monday-Friday (9 AM - 5 PM)
    const daysOfWeek = [
      { day: 1, name: "Monday" },
      { day: 2, name: "Tuesday" },
      { day: 3, name: "Wednesday" },
      { day: 4, name: "Thursday" },
      { day: 5, name: "Friday" },
    ];

    let created = 0;
    let skipped = 0;

    for (const { day, name } of daysOfWeek) {
      const existing = await ctx.db
        .query("availability")
        .withIndex("by_day", (q) => q.eq("dayOfWeek", day))
        .first();

      if (!existing) {
        await ctx.db.insert("availability", {
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "17:00",
          slotDuration: 60,
          bufferBetweenSlots: 0,
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        console.log(`✅ Created availability for ${name}`);
        created++;
      } else {
        console.log(`⏭️  Skipped ${name} (already exists)`);
        skipped++;
      }
    }

    console.log("\n📊 Summary:");
    console.log(`   Created: ${created} days`);
    console.log(`   Skipped: ${skipped} days`);
    console.log("\n✅ Booking system initialized successfully!");
    console.log("\n📝 Default Configuration:");
    console.log("   Working Days: Monday - Friday");
    console.log("   Working Hours: 9:00 AM - 5:00 PM");
    console.log("   Slot Duration: 60 minutes");
    console.log("   Buffer Time: 0 minutes");

    return {
      success: true,
      created,
      skipped,
      message: `Booking system initialized with ${created} days of availability`,
    };
  },
});
