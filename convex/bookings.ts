import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get available time slots for a specific date
export const getAvailableSlots = query({
  args: {
    date: v.string(),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, { date, duration = 60 }) => {
    // For now, return standard business hours slots
    // In production, this would check existing bookings and return only available slots
    const businessHours = [
      { startTime: "09:00", endTime: "10:00" },
      { startTime: "10:00", endTime: "11:00" },
      { startTime: "11:00", endTime: "12:00" },
      { startTime: "14:00", endTime: "15:00" },
      { startTime: "15:00", endTime: "16:00" },
      { startTime: "16:00", endTime: "17:00" },
    ];

    return businessHours;
  },
});

// Get appointments for a specific contact
export const getClientAppointments = query({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, { contactId }) => {
    // This would query the appointments table
    // For now, return empty array since appointments table doesn't exist yet
    return [];
  },
});

// Book an appointment (legacy name for compatibility)
export const bookAppointment = mutation({
  args: {
    contactId: v.id("contacts"),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    appointmentType: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // This would create an appointment in the appointments table
    // For now, return a mock appointment ID
    console.log("Booking appointment:", args);
    
    return {
      appointmentId: "mock_appointment_" + Date.now(),
      status: "confirmed",
      message: "Appointment booked successfully",
    };
  },
});

// Create booking (used by book-appointment API)
export const createBooking = mutation({
  args: {
    contactId: v.id("contacts"),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    appointmentType: v.string(),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get contact details
    const contact = await ctx.db.get(args.contactId);
    
    if (!contact) {
      throw new Error("Contact not found");
    }

    // Calculate duration (assuming 1 hour if not specified)
    const duration = 60;

    // Create appointment in database
    const appointmentId = await ctx.db.insert("appointments", {
      contactId: args.contactId,
      contactName: contact.name,
      contactEmail: contact.email || contact.contactPersonEmail || "",
      contactPhone: contact.phone || contact.contactPersonPhone,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      duration: duration,
      status: args.status as "pending" | "confirmed" | "cancelled" | "completed" | "no_show",
      appointmentType: args.appointmentType,
      notes: args.notes,
      googleCalendarSynced: false,
      bookedBy: "chatbot",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log("Created appointment:", appointmentId);
    
    return appointmentId;
  },
});
