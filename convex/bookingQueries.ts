import { query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// AVAILABILITY QUERIES
// ============================================

export const getAvailabilityByDay = query({
  args: { dayOfWeek: v.number() },
  handler: async (ctx, { dayOfWeek }) => {
    return await ctx.db
      .query("availability")
      .withIndex("by_day", (q) => q.eq("dayOfWeek", dayOfWeek))
      .first();
  },
});

export const getAvailabilityOverride = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    return await ctx.db
      .query("availability_overrides")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();
  },
});

export const calculateAvailableSlots = query({
  args: {
    date: v.string(),
    duration: v.number(),
    availability: v.any(),
    override: v.any(),
    existingAppointments: v.array(v.any()),
  },
  handler: async (ctx, { date, duration, availability, override, existingAppointments }) => {
    if (!availability && !override) {
      return [];
    }

    // Get booking settings from platform_config (lunch break and holidays)
    const bookingSettings = await ctx.db
      .query("platform_config")
      .withIndex("by_category", (q) => q.eq("category", "booking"))
      .first();
    
    // Check if this date is a holiday
    const holidays = (bookingSettings?.holidays as Array<{date: string; name: string; reason?: string}>) || [];
    const isHoliday = holidays.some(h => h.date === date);
    
    // If it's a holiday, return no available slots
    if (isHoliday) {
      return [];
    }
    
    const lunchBreakEnabled = bookingSettings?.lunchBreakEnabled as boolean || false;
    const lunchBreakStart = bookingSettings?.lunchBreakStart as string || "12:00";
    const lunchBreakEnd = bookingSettings?.lunchBreakEnd as string || "13:00";

    // Determine working hours
    const startTime = availability?.startTime || "09:00";
    const endTime = availability?.endTime || "17:00";
    const slotDuration = availability?.slotDuration || 60;
    const bufferTime = availability?.bufferBetweenSlots || 0;

    // Apply override if custom hours
    let workingStartTime = startTime;
    let workingEndTime = endTime;
    if (override?.type === "custom") {
      workingStartTime = override.customStartTime || startTime;
      workingEndTime = override.customEndTime || endTime;
    }

    // Generate time slots
    const slots = [];
    const [startHour, startMin] = workingStartTime.split(':').map(Number);
    const [endHour, endMin] = workingEndTime.split(':').map(Number);
    
    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    while (currentMinutes + duration <= endMinutes) {
      const slotStart = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;
      const slotEnd = `${String(Math.floor((currentMinutes + duration) / 60)).padStart(2, '0')}:${String((currentMinutes + duration) % 60).padStart(2, '0')}`;

      // Check if slot conflicts with existing appointments
      const hasConflict = existingAppointments.some((apt: any) => {
        const aptStart = apt.startTime;
        const aptEnd = apt.endTime;
        
        // Check for overlap
        return (slotStart < aptEnd && slotEnd > aptStart);
      });

      // Check if slot conflicts with break times
      const hasBreakConflict = availability?.breakTimes?.some((breakTime: any) => {
        return (slotStart < breakTime.end && slotEnd > breakTime.start);
      }) || false;

      // Check if slot conflicts with lunch break (from platform_config)
      const hasLunchConflict = lunchBreakEnabled &&
        (slotStart < lunchBreakEnd && slotEnd > lunchBreakStart);

      if (!hasConflict && !hasBreakConflict && !hasLunchConflict) {
        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          available: true
        });
      }

      currentMinutes += slotDuration + bufferTime;
    }

    return slots;
  },
});

export const isSlotAvailable = query({
  args: {
    date: v.string(),
    startTime: v.string(),
    duration: v.number(),
    excludeAppointmentId: v.optional(v.id("appointments")),
  },
  handler: async (ctx, { date, startTime, duration, excludeAppointmentId }) => {
    // Calculate end time
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

    // Get existing appointments for this date
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_date_status", (q) => q.eq("date", date))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "confirmed"),
          q.eq(q.field("status"), "pending")
        )
      )
      .collect();

    // Check for conflicts (excluding the specified appointment if updating)
    const hasConflict = appointments.some((apt) => {
      if (excludeAppointmentId && apt._id === excludeAppointmentId) {
        return false;
      }
      
      // Check for overlap
      return (startTime < apt.endTime && endTime > apt.startTime);
    });

    return !hasConflict;
  },
});

// ============================================
// APPOINTMENT QUERIES
// ============================================

export const getAppointment = query({
  args: { id: v.id("appointments") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getAppointmentsByDate = query({
  args: {
    date: v.string(),
    statuses: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { date, statuses }) => {
    let query = ctx.db
      .query("appointments")
      .withIndex("by_date", (q) => q.eq("date", date));

    if (statuses && statuses.length > 0) {
      const appointments = await query.collect();
      return appointments.filter((apt) => statuses.includes(apt.status));
    }

    return await query.collect();
  },
});

export const getAppointmentsByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
    statuses: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { startDate, endDate, statuses }) => {
    const allAppointments = await ctx.db
      .query("appointments")
      .collect();

    let filtered = allAppointments.filter((apt) => 
      apt.date >= startDate && apt.date <= endDate
    );

    if (statuses && statuses.length > 0) {
      filtered = filtered.filter((apt) => statuses.includes(apt.status));
    }

    return filtered.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
  },
});

export const getAppointmentsByClient = query({
  args: {
    clientId: v.id("clients"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { clientId, limit = 10 }) => {
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .order("desc")
      .take(limit);

    return appointments;
  },
});

export const getRecentAppointments = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    return await ctx.db
      .query("appointments")
      .order("desc")
      .take(limit);
  },
});

export const getAllAppointments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("appointments")
      .order("desc")
      .collect();
  },
});

// ============================================
// CLIENT QUERIES
// ============================================

export const getClient = query({
  args: { id: v.id("clients") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getClientByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
  },
});

export const getClientByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, { phone }) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first();
  },
});

export const getAllClients = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("clients")
      .order("desc")
      .collect();
  },
});

export const searchClients = query({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    const allClients = await ctx.db
      .query("clients")
      .collect();
    
    const searchLower = query.toLowerCase();
    return allClients.filter(client => 
      client.name.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower)
    ).slice(0, 10);
  },
});

// ============================================
// AVAILABILITY MANAGEMENT QUERIES
// ============================================

export const getAllAvailability = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("availability")
      .collect();
  },
});

export const getAvailabilityForDate = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const dayOfWeek = new Date(date).getDay();
    
    const availability = await ctx.db
      .query("availability")
      .withIndex("by_day", (q) => q.eq("dayOfWeek", dayOfWeek))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    const override = await ctx.db
      .query("availability_overrides")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();

    return { availability, override };
  },
});

// ============================================
// EVENT TYPES QUERIES
// ============================================

export const getAllEventTypes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("event_types")
      .order("desc")
      .collect();
  },
});

export const getEventType = query({
  args: { id: v.id("event_types") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getEventTypeBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("event_types")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
  },
});

export const getPublicEventTypes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("event_types")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// ============================================
// HOLIDAY QUERIES
// ============================================

export const getAllHolidays = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("availability_overrides")
      .withIndex("by_holiday", (q) => q.eq("isHoliday", true))
      .collect();
  },
});
