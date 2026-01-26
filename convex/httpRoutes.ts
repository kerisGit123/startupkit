import { httpRouter } from "convex/server";
import { 
  checkAvailability, 
  bookAppointment, 
  updateAppointment, 
  deleteAppointment,
  createClient,
  lookupClient,
  createLead,
  searchKnowledgeBase,
  lookupAppointments,
  getAppointments 
} from "./bookingTools";

const http = httpRouter();

// ============================================
// BOOKING ENDPOINTS FOR N8N CHATBOT
// ============================================

// Core booking operations
http.route({
  path: "/api/booking/check-availability",
  method: "POST",
  handler: checkAvailability,
});

http.route({
  path: "/api/booking/create-appointment",
  method: "POST",
  handler: bookAppointment,
});

http.route({
  path: "/api/booking/update-appointment",
  method: "POST",
  handler: updateAppointment,
});

http.route({
  path: "/api/booking/delete-appointment",
  method: "POST",
  handler: deleteAppointment,
});

// Client and lead management
http.route({
  path: "/api/booking/create-client",
  method: "POST",
  handler: createClient,
});

http.route({
  path: "/api/booking/lookup-client",
  method: "POST",
  handler: lookupClient,
});

http.route({
  path: "/api/booking/create-lead",
  method: "POST",
  handler: createLead,
});

// Knowledge base
http.route({
  path: "/api/booking/search-knowledge",
  method: "POST",
  handler: searchKnowledgeBase,
});

// Appointment lookup
http.route({
  path: "/api/booking/lookup-appointments",
  method: "POST",
  handler: lookupAppointments,
});

http.route({
  path: "/api/booking/appointments",
  method: "POST",
  handler: getAppointments,
});

export default http;
