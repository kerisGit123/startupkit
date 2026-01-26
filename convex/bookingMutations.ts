import { mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// APPOINTMENT MUTATIONS
// ============================================

export const createAppointment = mutation({
  args: {
    clientId: v.id("clients"),
    clientName: v.string(),
    clientEmail: v.string(),
    clientPhone: v.optional(v.string()),
    eventTypeId: v.optional(v.id("event_types")),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    duration: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed"),
      v.literal("no_show")
    ),
    appointmentType: v.string(),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    bookedBy: v.union(
      v.literal("chatbot"),
      v.literal("admin"),
      v.literal("api")
    ),
    googleCalendarSynced: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("appointments", args);
  },
});

export const updateAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    clientName: v.optional(v.string()),
    clientEmail: v.optional(v.string()),
    clientPhone: v.optional(v.string()),
    date: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    duration: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed"),
      v.literal("no_show")
    )),
    appointmentType: v.optional(v.string()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    internalNotes: v.optional(v.string()),
    googleEventId: v.optional(v.string()),
    googleCalendarSynced: v.optional(v.boolean()),
    lastSyncedAt: v.optional(v.number()),
    updatedAt: v.number(),
  },
  handler: async (ctx, { appointmentId, updatedAt, ...updates }) => {
    await ctx.db.patch(appointmentId, {
      ...updates,
      updatedAt,
    });
    return appointmentId;
  },
});

export const deleteAppointment = mutation({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, { appointmentId }) => {
    await ctx.db.delete(appointmentId);
  },
});

// ============================================
// CLIENT MUTATIONS
// ============================================

export const createClient = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    timezone: v.optional(v.string()),
    preferredContactMethod: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    totalAppointments: v.optional(v.number()),
    completedAppointments: v.optional(v.number()),
    cancelledAppointments: v.optional(v.number()),
    noShowCount: v.optional(v.number()),
    firstBookedAt: v.optional(v.number()),
    lastBookedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Set defaults for optional fields
    const clientData = {
      ...args,
      tags: args.tags || [],
      totalAppointments: args.totalAppointments || 0,
      completedAppointments: args.completedAppointments || 0,
      cancelledAppointments: args.cancelledAppointments || 0,
      noShowCount: args.noShowCount || 0,
      firstBookedAt: args.firstBookedAt || Date.now(),
    };
    return await ctx.db.insert("clients", clientData);
  },
});

export const updateClient = mutation({
  args: {
    clientId: v.id("clients"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    timezone: v.optional(v.string()),
    preferredContactMethod: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    updatedAt: v.number(),
  },
  handler: async (ctx, { clientId, updatedAt, ...updates }) => {
    await ctx.db.patch(clientId, {
      ...updates,
      updatedAt,
    });
    return clientId;
  },
});

export const incrementClientAppointmentCount = mutation({
  args: { clientId: v.id("clients") },
  handler: async (ctx, { clientId }) => {
    const client = await ctx.db.get(clientId);
    if (!client) return;

    await ctx.db.patch(clientId, {
      totalAppointments: client.totalAppointments + 1,
      lastBookedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const incrementClientCancelledCount = mutation({
  args: { clientId: v.id("clients") },
  handler: async (ctx, { clientId }) => {
    const client = await ctx.db.get(clientId);
    if (!client) return;

    await ctx.db.patch(clientId, {
      cancelledAppointments: client.cancelledAppointments + 1,
      updatedAt: Date.now(),
    });
  },
});

export const incrementClientCompletedCount = mutation({
  args: { clientId: v.id("clients") },
  handler: async (ctx, { clientId }) => {
    const client = await ctx.db.get(clientId);
    if (!client) return;

    await ctx.db.patch(clientId, {
      completedAppointments: client.completedAppointments + 1,
      updatedAt: Date.now(),
    });
  },
});

export const incrementClientNoShowCount = mutation({
  args: { clientId: v.id("clients") },
  handler: async (ctx, { clientId }) => {
    const client = await ctx.db.get(clientId);
    if (!client) return;

    await ctx.db.patch(clientId, {
      noShowCount: client.noShowCount + 1,
      updatedAt: Date.now(),
    });
  },
});

// ============================================
// AVAILABILITY MUTATIONS
// ============================================

export const createAvailability = mutation({
  args: {
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    slotDuration: v.number(),
    bufferBetweenSlots: v.number(),
    bufferBefore: v.optional(v.number()),
    bufferAfter: v.optional(v.number()),
    maxMeetingsPerDay: v.optional(v.number()),
    maxMeetingsPerWeek: v.optional(v.number()),
    breakTimes: v.optional(v.array(v.object({
      start: v.string(),
      end: v.string(),
    }))),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("availability", args);
  },
});

export const updateAvailability = mutation({
  args: {
    availabilityId: v.id("availability"),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    slotDuration: v.optional(v.number()),
    bufferBetweenSlots: v.optional(v.number()),
    bufferBefore: v.optional(v.number()),
    bufferAfter: v.optional(v.number()),
    maxMeetingsPerDay: v.optional(v.number()),
    maxMeetingsPerWeek: v.optional(v.number()),
    breakTimes: v.optional(v.array(v.object({
      start: v.string(),
      end: v.string(),
    }))),
    isActive: v.optional(v.boolean()),
    updatedAt: v.number(),
  },
  handler: async (ctx, { availabilityId, updatedAt, ...updates }) => {
    await ctx.db.patch(availabilityId, {
      ...updates,
      updatedAt,
    });
    return availabilityId;
  },
});

export const createAvailabilityOverride = mutation({
  args: {
    date: v.string(),
    type: v.union(v.literal("blocked"), v.literal("custom")),
    customStartTime: v.optional(v.string()),
    customEndTime: v.optional(v.string()),
    reason: v.optional(v.string()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("availability_overrides", args);
  },
});

export const deleteAvailabilityOverride = mutation({
  args: { overrideId: v.id("availability_overrides") },
  handler: async (ctx, { overrideId }) => {
    await ctx.db.delete(overrideId);
  },
});

// ============================================
// GOOGLE CALENDAR SYNC MUTATIONS
// ============================================

export const updateGoogleCalendarSync = mutation({
  args: {
    syncId: v.id("google_calendar_sync"),
    isEnabled: v.optional(v.boolean()),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    lastSyncAt: v.optional(v.number()),
    lastSyncStatus: v.optional(v.string()),
    updatedAt: v.number(),
  },
  handler: async (ctx, { syncId, updatedAt, ...updates }) => {
    await ctx.db.patch(syncId, {
      ...updates,
      updatedAt,
    });
    return syncId;
  },
});

export const logGoogleCalendarSyncError = mutation({
  args: {
    syncId: v.id("google_calendar_sync"),
    error: v.string(),
  },
  handler: async (ctx, { syncId, error }) => {
    const sync = await ctx.db.get(syncId);
    if (!sync) return;

    const errors = sync.syncErrors || [];
    errors.push({
      timestamp: Date.now(),
      error,
    });

    await ctx.db.patch(syncId, {
      syncErrors: errors,
      updatedAt: Date.now(),
    });
  },
});

// ============================================
// BOOKING CONVERSATION MUTATIONS
// ============================================

export const createBookingConversation = mutation({
  args: {
    sessionId: v.string(),
    clientId: v.optional(v.id("clients")),
    status: v.union(
      v.literal("active"),
      v.literal("booking_in_progress"),
      v.literal("completed"),
      v.literal("abandoned")
    ),
    currentIntent: v.optional(v.string()),
    collectedData: v.optional(v.any()),
    lastMessageAt: v.number(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("booking_conversations", args);
  },
});

export const updateBookingConversation = mutation({
  args: {
    conversationId: v.id("booking_conversations"),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("booking_in_progress"),
      v.literal("completed"),
      v.literal("abandoned")
    )),
    currentIntent: v.optional(v.string()),
    collectedData: v.optional(v.any()),
    lastMessageAt: v.optional(v.number()),
  },
  handler: async (ctx, { conversationId, ...updates }) => {
    await ctx.db.patch(conversationId, updates);
    return conversationId;
  },
});

// ============================================
// EVENT TYPES MUTATIONS
// ============================================

export const createEventType = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    duration: v.number(),
    locationType: v.union(
      v.literal("google_meet"),
      v.literal("zoom"),
      v.literal("phone"),
      v.literal("in_person"),
      v.literal("custom")
    ),
    locationDetails: v.optional(v.string()),
    color: v.string(),
    customAvailability: v.optional(v.boolean()),
    bufferBefore: v.optional(v.number()),
    bufferAfter: v.optional(v.number()),
    maxBookingsPerDay: v.optional(v.number()),
    maxBookingsPerWeek: v.optional(v.number()),
    minNoticeHours: v.optional(v.number()),
    maxDaysInFuture: v.optional(v.number()),
    isActive: v.boolean(),
    isPublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("event_types", args);
  },
});

export const updateEventType = mutation({
  args: {
    eventTypeId: v.id("event_types"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),
    locationType: v.optional(v.union(
      v.literal("google_meet"),
      v.literal("zoom"),
      v.literal("phone"),
      v.literal("in_person"),
      v.literal("custom")
    )),
    locationDetails: v.optional(v.string()),
    color: v.optional(v.string()),
    customAvailability: v.optional(v.boolean()),
    bufferBefore: v.optional(v.number()),
    bufferAfter: v.optional(v.number()),
    maxBookingsPerDay: v.optional(v.number()),
    maxBookingsPerWeek: v.optional(v.number()),
    minNoticeHours: v.optional(v.number()),
    maxDaysInFuture: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    isPublic: v.optional(v.boolean()),
    updatedAt: v.number(),
  },
  handler: async (ctx, { eventTypeId, updatedAt, ...updates }) => {
    await ctx.db.patch(eventTypeId, {
      ...updates,
      updatedAt,
    });
    return eventTypeId;
  },
});

export const deleteEventType = mutation({
  args: { eventTypeId: v.id("event_types") },
  handler: async (ctx, { eventTypeId }) => {
    await ctx.db.delete(eventTypeId);
  },
});

// ============================================
// HOLIDAY MUTATIONS
// ============================================

export const createHoliday = mutation({
  args: {
    date: v.string(),
    holidayName: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, { date, holidayName, reason }) => {
    return await ctx.db.insert("availability_overrides", {
      date,
      type: "blocked",
      isHoliday: true,
      holidayName,
      reason,
      createdAt: Date.now(),
    });
  },
});

export const deleteHoliday = mutation({
  args: { holidayId: v.id("availability_overrides") },
  handler: async (ctx, { holidayId }) => {
    await ctx.db.delete(holidayId);
  },
});
