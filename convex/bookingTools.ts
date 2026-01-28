import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

// Helper function to calculate end time
function calculateEndTime(startTime: string, duration: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

// ============================================
// TOOL 1: Check Availability
// ============================================
export const checkAvailability = httpAction(async (ctx, request) => {
  const { date, duration = 60 } = await request.json();
  
  // 1. Get platform_config settings
  const bookingSettings = await ctx.runQuery(api.platformConfig.getByCategory, { 
    category: "booking" 
  });
  
  const weekViewStartTime = (bookingSettings?.weekViewStartTime as string) || "06:00";
  const weekViewEndTime = (bookingSettings?.weekViewEndTime as string) || "21:00";
  const maxDaysInFuture = (bookingSettings?.maxDaysInFuture as number) || 60;
  const minNoticeHours = (bookingSettings?.minNoticeHours as number) || 24;
  
  // 2. Validate date is within booking window
  const requestDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((requestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 0) {
    return new Response(JSON.stringify({ 
      available: false,
      slots: [],
      reason: "Cannot book appointments in the past"
    }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  
  if (daysDiff > maxDaysInFuture) {
    return new Response(JSON.stringify({ 
      available: false,
      slots: [],
      reason: `Cannot book more than ${maxDaysInFuture} days in advance`
    }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  
  // 3. Get day of week and check day availability
  const dayOfWeek = requestDate.getDay();
  
  const availability = await ctx.runQuery(api.bookingQueries.getAvailabilityByDay, { 
    dayOfWeek 
  });
  
  if (!availability || !availability.isActive) {
    return new Response(JSON.stringify({ 
      available: false,
      slots: [],
      reason: "This day is not available for bookings"
    }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  
  // 4. Check for date-specific overrides
  const override = await ctx.runQuery(api.bookingQueries.getAvailabilityOverride, { 
    date 
  });
  
  if (override?.type === "blocked") {
    return new Response(JSON.stringify({ 
      available: false,
      slots: [],
      reason: override.reason || "Not available on this date"
    }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  
  // 5. Get existing appointments for this date
  const appointments = await ctx.runQuery(api.bookingQueries.getAppointmentsByDate, { 
    date,
    statuses: ["confirmed", "pending"]
  });
  
  // 6. Calculate available slots within global time range and day availability
  const slots = await ctx.runQuery(api.bookingQueries.calculateAvailableSlots, {
    date,
    duration,
    availability,
    override,
    existingAppointments: appointments
  });
  
  // 7. Filter slots by global time range and minimum notice
  const now = Date.now();
  const minNoticeMs = minNoticeHours * 60 * 60 * 1000;
  
  const filteredSlots = slots.filter((slot: any) => {
    // Check if slot is within global time range
    const slotHour = parseInt(slot.startTime.split(":")[0]);
    const globalStartHour = parseInt(weekViewStartTime.split(":")[0]);
    const globalEndHour = parseInt(weekViewEndTime.split(":")[0]);
    
    if (slotHour < globalStartHour || slotHour >= globalEndHour) {
      return false;
    }
    
    // Check minimum notice time
    const slotDateTime = new Date(`${date}T${slot.startTime}:00`);
    if (slotDateTime.getTime() - now < minNoticeMs) {
      return false;
    }
    
    return true;
  });
  
  return new Response(JSON.stringify({ 
    available: filteredSlots.length > 0,
    slots: filteredSlots,
    date,
    settings: {
      weekViewStartTime,
      weekViewEndTime,
      maxDaysInFuture,
      minNoticeHours
    }
  }), {
    headers: { "Content-Type": "application/json" },
  });
});

// ============================================
// TOOL 2: Book Appointment
// ============================================
export const bookAppointment = httpAction(async (ctx, request) => {
  const { 
    clientEmail, 
    clientName, 
    clientPhone,
    date, 
    startTime,
    duration = 60,
    appointmentType = "consultation",
    notes,
    bookedBy = "chatbot"
  } = await request.json();
  
  // 1. Get platform_config settings for validation
  const bookingSettings = await ctx.runQuery(api.platformConfig.getByCategory, { 
    category: "booking" 
  });
  
  const weekViewStartTime = (bookingSettings?.weekViewStartTime as string) || "06:00";
  const weekViewEndTime = (bookingSettings?.weekViewEndTime as string) || "21:00";
  const maxDaysInFuture = (bookingSettings?.maxDaysInFuture as number) || 60;
  const minNoticeHours = (bookingSettings?.minNoticeHours as number) || 24;
  
  // 2. Validate date is within booking window
  const requestDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((requestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 0) {
    return new Response(JSON.stringify({ 
      success: false,
      error: "Cannot book appointments in the past"
    }), { 
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  if (daysDiff > maxDaysInFuture) {
    return new Response(JSON.stringify({ 
      success: false,
      error: `Cannot book more than ${maxDaysInFuture} days in advance`
    }), { 
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  // 3. Validate minimum notice time
  const slotDateTime = new Date(`${date}T${startTime}:00`);
  const now = Date.now();
  const minNoticeMs = minNoticeHours * 60 * 60 * 1000;
  
  if (slotDateTime.getTime() - now < minNoticeMs) {
    return new Response(JSON.stringify({ 
      success: false,
      error: `Appointments must be booked at least ${minNoticeHours} hours in advance`
    }), { 
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  // 4. Validate time is within global time range
  const startHour = parseInt(startTime.split(":")[0]);
  const globalStartHour = parseInt(weekViewStartTime.split(":")[0]);
  const globalEndHour = parseInt(weekViewEndTime.split(":")[0]);
  
  if (startHour < globalStartHour || startHour >= globalEndHour) {
    return new Response(JSON.stringify({ 
      success: false,
      error: `Appointments must be between ${weekViewStartTime} and ${weekViewEndTime}`
    }), { 
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  // 5. Check day availability
  const dayOfWeek = requestDate.getDay();
  const availability = await ctx.runQuery(api.bookingQueries.getAvailabilityByDay, { 
    dayOfWeek 
  });
  
  if (!availability || !availability.isActive) {
    return new Response(JSON.stringify({ 
      success: false,
      error: "This day is not available for bookings"
    }), { 
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  // 6. Validate time is within day availability hours
  const availStartHour = parseInt(availability.startTime.split(":")[0]);
  const availEndHour = parseInt(availability.endTime.split(":")[0]);
  
  if (startHour < availStartHour || startHour >= availEndHour) {
    return new Response(JSON.stringify({ 
      success: false,
      error: `Time ${startTime} is outside available hours (${availability.startTime} - ${availability.endTime})`
    }), { 
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  // 6a. Check for holiday conflict (from platform_config)
  const holidays = (bookingSettings?.holidays as Array<{date: string; name: string; reason?: string}>) || [];
  const isHoliday = holidays.some(h => h.date === date);
  const holidayInfo = holidays.find(h => h.date === date);
  
  if (isHoliday && holidayInfo) {
    return new Response(JSON.stringify({ 
      success: false,
      error: `Cannot book appointment on ${holidayInfo.name}. This date is a holiday.`
    }), { 
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 6b. Check for lunch break conflict (from platform_config)
  const lunchBreakEnabled = bookingSettings?.lunchBreakEnabled as boolean || false;
  const lunchBreakStart = bookingSettings?.lunchBreakStart as string;
  const lunchBreakEnd = bookingSettings?.lunchBreakEnd as string;
  
  if (lunchBreakEnabled && lunchBreakStart && lunchBreakEnd) {
    const endTime = calculateEndTime(startTime, duration);
    
    // Check if appointment overlaps with lunch break
    if (startTime < lunchBreakEnd && endTime > lunchBreakStart) {
      return new Response(JSON.stringify({ 
        success: false,
        error: `This time conflicts with lunch break (${lunchBreakStart} - ${lunchBreakEnd})`
      }), { 
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  
  // 6b. Check for holiday/blocked date
  const override = await ctx.runQuery(api.bookingQueries.getAvailabilityOverride, { 
    date 
  });
  
  if (override?.type === "blocked") {
    const reason = override.isHoliday 
      ? `This date is a holiday: ${override.holidayName || override.reason}`
      : override.reason || "This date is not available for bookings";
    
    return new Response(JSON.stringify({ 
      success: false,
      error: reason
    }), { 
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  // 7. Check for conflicts with existing appointments
  const appointments = await ctx.runQuery(api.bookingQueries.getAppointmentsByDate, { 
    date,
    statuses: ["confirmed", "pending"]
  });
  
  const [startH, startM] = startTime.split(":").map(Number);
  const requestStartMinutes = startH * 60 + startM;
  const requestEndMinutes = requestStartMinutes + duration;
  
  const hasConflict = appointments?.some((apt: any) => {
    const [aptStartH, aptStartM] = apt.startTime.split(":").map(Number);
    const aptStartMinutes = aptStartH * 60 + aptStartM;
    let aptEndMinutes;
    
    if (apt.endTime) {
      const [endH, endM] = apt.endTime.split(":").map(Number);
      aptEndMinutes = endH * 60 + endM;
    } else {
      aptEndMinutes = aptStartMinutes + apt.duration;
    }
    
    return (requestStartMinutes < aptEndMinutes && requestEndMinutes > aptStartMinutes);
  });
  
  if (hasConflict) {
    return new Response(JSON.stringify({ 
      success: false,
      error: "This time slot conflicts with another appointment"
    }), { 
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  // Get or create client
  let client = await ctx.runQuery(api.bookingQueries.getClientByEmail, { 
    email: clientEmail 
  });
  
  if (!client) {
    const clientId = await ctx.runMutation(api.bookingMutations.createClient, {
      name: clientName,
      email: clientEmail,
      phone: clientPhone,
      tags: [],
      totalAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      noShowCount: 0,
      firstBookedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    client = await ctx.runQuery(api.bookingQueries.getClient, { id: clientId });
  }
  
  // Calculate end time
  const endTime = calculateEndTime(startTime, duration);
  
  // Create appointment
  const appointmentId = await ctx.runMutation(api.bookingMutations.createAppointment, {
    clientId: client!._id,
    clientName,
    clientEmail,
    clientPhone,
    date,
    startTime,
    endTime,
    duration,
    status: "confirmed",
    appointmentType,
    notes,
    bookedBy,
    googleCalendarSynced: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  
  // Update client statistics
  await ctx.runMutation(api.bookingMutations.incrementClientAppointmentCount, {
    clientId: client!._id
  });
  
  return new Response(JSON.stringify({ 
    success: true,
    appointmentId,
    message: "Appointment booked successfully",
    appointment: {
      date,
      startTime,
      endTime,
      clientName,
      clientEmail
    }
  }), {
    headers: { "Content-Type": "application/json" },
  });
});

// ============================================
// TOOL 3: Lookup Client
// ============================================
export const lookupClient = httpAction(async (ctx, request) => {
  const { email, phone } = await request.json();
  
  let client = null;
  
  if (email) {
    client = await ctx.runQuery(api.bookingQueries.getClientByEmail, { email });
  } else if (phone) {
    client = await ctx.runQuery(api.bookingQueries.getClientByPhone, { phone });
  }
  
  if (!client) {
    return new Response(JSON.stringify({ 
      found: false,
      message: "Client not found"
    }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  
  // Get client's appointment history
  const appointments = await ctx.runQuery(api.bookingQueries.getAppointmentsByClient, {
    clientId: client._id,
    limit: 5
  });
  
  return new Response(JSON.stringify({ 
    found: true,
    client: {
      id: client._id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      totalAppointments: client.totalAppointments,
      lastBookedAt: client.lastBookedAt
    },
    recentAppointments: appointments
  }), {
    headers: { "Content-Type": "application/json" },
  });
});

// ============================================
// TOOL 4: Create Client
// ============================================
export const createClient = httpAction(async (ctx, request) => {
  const { name, email, phone, company, notes } = await request.json();
  
  // Check if client already exists
  const existing = await ctx.runQuery(api.bookingQueries.getClientByEmail, { email });
  
  if (existing) {
    return new Response(JSON.stringify({ 
      success: false,
      error: "Client with this email already exists",
      clientId: existing._id
    }), { 
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  const clientId = await ctx.runMutation(api.bookingMutations.createClient, {
    name,
    email,
    phone,
    company,
    notes,
    tags: [],
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    noShowCount: 0,
    firstBookedAt: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  
  return new Response(JSON.stringify({ 
    success: true,
    clientId,
    message: "Client created successfully"
  }), {
    headers: { "Content-Type": "application/json" },
  });
});

// ============================================
// TOOL 5: Client Lookup (Removed - duplicate of TOOL 3)
// ============================================

// ============================================
// TOOL 6: Create Lead (for new users)
// ============================================
export const createLead = httpAction(async (ctx, request) => {
  const { name, email, phone, message } = await request.json();
  
  // Check if lead already exists
  const existingLead = await ctx.runQuery(api.leads.getLeadByEmail, { email });
  
  if (existingLead) {
    return new Response(JSON.stringify({
      success: true,
      leadId: existingLead._id,
      message: "Lead already exists",
      isNew: false,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  
  // Create new lead
  const leadId = await ctx.runMutation(api.leads.createLead, {
    name,
    email,
    phone,
    message,
    source: "chatbot",
  });
  
  return new Response(JSON.stringify({
    success: true,
    leadId,
    message: "Lead created successfully",
    isNew: true,
  }), {
    headers: { "Content-Type": "application/json" },
  });
});

// ============================================
// TOOL 7A: Knowledge Base Search - Frontend Only
// ============================================
export const searchKnowledgeBaseFrontend = httpAction(async (ctx, request) => {
  const { query } = await request.json();
  
  if (!query || query.trim() === "") {
    return new Response(JSON.stringify({
      success: false,
      message: "Query parameter is required",
      results: [],
      count: 0,
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  // Search only frontend knowledge base
  const articles = await ctx.runQuery(api.knowledgeBase.searchArticles, {
    type: "frontend",
    query,
  });
  
  // Return top 3 most relevant articles as single concatenated text
  const topArticles = articles.slice(0, 3);
  
  // Concatenate all articles into one big chunk
  const concatenatedContent = topArticles
    .map((article, index) => 
      `Article ${index + 1}: ${article.title}\n${article.content}\nCategory: ${article.category}\nTags: ${article.tags.join(', ')}`
    )
    .join('\n\n---\n\n');
  
  return new Response(JSON.stringify({
    success: true,
    content: concatenatedContent,
    count: topArticles.length,
    source: "frontend",
  }), {
    headers: { "Content-Type": "application/json" },
  });
});

// ============================================
// TOOL 7B: Knowledge Base Search - Combined (Frontend + User Panel)
// ============================================
export const searchKnowledgeBaseCombined = httpAction(async (ctx, request) => {
  const { query } = await request.json();
  
  if (!query || query.trim() === "") {
    return new Response(JSON.stringify({
      success: false,
      message: "Query parameter is required",
      results: [],
      count: 0,
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  // Search both frontend and user_panel knowledge bases
  const frontendArticles = await ctx.runQuery(api.knowledgeBase.searchArticles, {
    type: "frontend",
    query,
  });
  
  const userPanelArticles = await ctx.runQuery(api.knowledgeBase.searchArticles, {
    type: "user_panel",
    query,
  });
  
  // Combine results - return more articles so AI can analyze and pick the right ones
  const allArticles = [...frontendArticles, ...userPanelArticles];
  
  // Return top 15 articles to give AI more context for analysis
  const topArticles = allArticles.slice(0, 15);
  
  // Concatenate all articles into one big chunk with better formatting for AI analysis
  const concatenatedContent = topArticles
    .map((article, index) => 
      `Article ${index + 1}: ${article.title}\nSource: ${article.type}\nCategory: ${article.category}\nTags: ${article.tags.join(', ')}\nKeywords: ${article.keywords?.join(', ') || 'N/A'}\n\nContent:\n${article.content}`
    )
    .join('\n\n---\n\n');
  
  return new Response(JSON.stringify({
    success: true,
    content: concatenatedContent,
    count: topArticles.length,
    source: "combined",
    breakdown: {
      frontend: frontendArticles.length,
      user_panel: userPanelArticles.length,
    },
  }), {
    headers: { "Content-Type": "application/json" },
  });
});

// ============================================
// TOOL 7C: Legacy Knowledge Base Search (Deprecated)
// ============================================
export const searchKnowledgeBase = httpAction(async (ctx, request) => {
  const { query, type = "frontend" } = await request.json();
  
  // Redirect to appropriate endpoint based on type
  if (type === "combined" || type === "user_panel") {
    return searchKnowledgeBaseCombined(ctx, request);
  }
  
  return searchKnowledgeBaseFrontend(ctx, request);
});

// ============================================
// TOOL 8: Lookup Appointments
// ============================================
export const lookupAppointments = httpAction(async (ctx, request) => {
  const { clientEmail } = await request.json();
  
  // Find client
  const client = await ctx.runQuery(api.bookingQueries.getClientByEmail, { 
    email: clientEmail 
  });
  
  if (!client) {
    return new Response(JSON.stringify({
      success: false,
      message: "Client not found",
      appointments: [],
    }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  
  // Get appointments
  const appointments = await ctx.runQuery(api.bookingQueries.getAppointmentsByClient, {
    clientId: client._id,
    limit: 10,
  });
  
  return new Response(JSON.stringify({
    success: true,
    appointments: appointments.map(apt => ({
      id: apt._id,
      date: apt.date,
      startTime: apt.startTime,
      endTime: apt.endTime,
      duration: apt.duration,
      status: apt.status,
      type: apt.appointmentType,
      notes: apt.notes,
    })),
  }), {
    headers: { "Content-Type": "application/json" },
  });
});

// ============================================
// TOOL 9: Get Appointments (Legacy)
// ============================================
export const getAppointments = httpAction(async (ctx, request) => {
  const { 
    date, 
    startDate, 
    endDate, 
    clientEmail,
    status,
    limit = 50 
  } = await request.json();
  
  let appointments;
  
  if (date) {
    // Get appointments for specific date
    appointments = await ctx.runQuery(api.bookingQueries.getAppointmentsByDate, {
      date,
      statuses: status ? [status] : undefined
    });
  } else if (startDate && endDate) {
    // Get appointments in date range
    appointments = await ctx.runQuery(api.bookingQueries.getAppointmentsByDateRange, {
      startDate,
      endDate,
      statuses: status ? [status] : undefined
    });
  } else if (clientEmail) {
    // Get appointments for specific client
    const client = await ctx.runQuery(api.bookingQueries.getClientByEmail, { 
      email: clientEmail 
    });
    
    if (client) {
      appointments = await ctx.runQuery(api.bookingQueries.getAppointmentsByClient, {
        clientId: client._id,
        limit
      });
    } else {
      appointments = [];
    }
  } else {
    // Get recent appointments
    appointments = await ctx.runQuery(api.bookingQueries.getRecentAppointments, {
      limit
    });
  }
  
  return new Response(JSON.stringify({ 
    appointments,
    count: appointments.length
  }), {
    headers: { "Content-Type": "application/json" },
  });
});

// ============================================
// TOOL 6: Update Appointment
// ============================================
export const updateAppointment = httpAction(async (ctx, request) => {
  const { 
    appointmentId, 
    date,
    startTime,
    duration,
    status,
    notes,
    internalNotes
  } = await request.json();
  
  const appointment = await ctx.runQuery(api.bookingQueries.getAppointment, { 
    id: appointmentId 
  });
  
  if (!appointment) {
    return new Response(JSON.stringify({ 
      success: false,
      error: "Appointment not found"
    }), { 
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  // If rescheduling, check new slot availability
  if (date && startTime && (date !== appointment.date || startTime !== appointment.startTime)) {
    const isAvailable = await ctx.runQuery(api.bookingQueries.isSlotAvailable, {
      date,
      startTime,
      duration: duration || appointment.duration,
      excludeAppointmentId: appointmentId
    });
    
    if (!isAvailable) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "New time slot is not available"
      }), { 
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  
  // Calculate new end time if needed
  const endTime = (startTime && duration) 
    ? calculateEndTime(startTime, duration)
    : appointment.endTime;
  
  // Update appointment
  await ctx.runMutation(api.bookingMutations.updateAppointment, {
    appointmentId,
    date: date || appointment.date,
    startTime: startTime || appointment.startTime,
    endTime,
    duration: duration || appointment.duration,
    status: status || appointment.status,
    notes: notes !== undefined ? notes : appointment.notes,
    internalNotes: internalNotes !== undefined ? internalNotes : appointment.internalNotes,
    updatedAt: Date.now(),
  });
  
  return new Response(JSON.stringify({ 
    success: true,
    message: "Appointment updated successfully"
  }), {
    headers: { "Content-Type": "application/json" },
  });
});

// ============================================
// TOOL 7: Delete Appointment
// ============================================
export const deleteAppointment = httpAction(async (ctx, request) => {
  const { appointmentId, reason } = await request.json();
  
  const appointment = await ctx.runQuery(api.bookingQueries.getAppointment, { 
    id: appointmentId 
  });
  
  if (!appointment) {
    return new Response(JSON.stringify({ 
      success: false,
      error: "Appointment not found"
    }), { 
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  // Update status to cancelled instead of hard delete
  await ctx.runMutation(api.bookingMutations.updateAppointment, {
    appointmentId,
    status: "cancelled",
    internalNotes: `Cancelled: ${reason || 'No reason provided'}`,
    updatedAt: Date.now(),
  });
  
  // Update client statistics
  await ctx.runMutation(api.bookingMutations.incrementClientCancelledCount, {
    clientId: appointment.clientId
  });
  
  return new Response(JSON.stringify({ 
    success: true,
    message: "Appointment cancelled successfully"
  }), {
    headers: { "Content-Type": "application/json" },
  });
});
