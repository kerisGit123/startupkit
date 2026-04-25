import type Anthropic from "@anthropic-ai/sdk";

/**
 * Booking chatbot tool definitions for Claude API tool-use.
 * These mirror the n8n booking tools and call existing Convex mutations/queries.
 */

export const BOOKING_TOOLS: Anthropic.Tool[] = [
  {
    name: "lookup_client",
    description:
      "Search for an existing client by email address. Returns client info if found, or null if not found. Always call this first when the user provides their email.",
    input_schema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "Client email address to search for",
        },
      },
      required: ["email"],
    },
  },
  {
    name: "create_lead",
    description:
      "Create a new client/lead in the CRM. Use when lookup_client returns no results and the user provides their name and email.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Client full name" },
        email: { type: "string", description: "Client email address" },
        phone: { type: "string", description: "Client phone number (optional)" },
      },
      required: ["name", "email"],
    },
  },
  {
    name: "check_availability",
    description:
      "Check available appointment time slots for a specific date. Returns a list of available start times. The date must be in YYYY-MM-DD format.",
    input_schema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Date to check in YYYY-MM-DD format (e.g., 2026-04-28)",
        },
      },
      required: ["date"],
    },
  },
  {
    name: "book_appointment",
    description:
      "Book an appointment for a client. The client must already exist (use lookup_client or create_lead first). Requires date, start time, end time, and appointment type.",
    input_schema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "Client email address (must already exist in CRM)",
        },
        date: {
          type: "string",
          description: "Appointment date in YYYY-MM-DD format",
        },
        startTime: {
          type: "string",
          description: "Start time in HH:MM 24-hour format (e.g., 14:00)",
        },
        endTime: {
          type: "string",
          description: "End time in HH:MM 24-hour format (e.g., 15:00, typically 1 hour after start)",
        },
        appointmentType: {
          type: "string",
          description: "Type of appointment: consultation, demo, support, or general",
        },
        notes: {
          type: "string",
          description: "Optional notes or special requests for the appointment",
        },
      },
      required: ["email", "date", "startTime", "endTime", "appointmentType"],
    },
  },
  {
    name: "search_knowledge",
    description:
      "Search the knowledge base for answers to general questions about services, policies, pricing, or features. Use this when the user asks questions that aren't about booking.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Short keyword search query (e.g., 'pricing plans', 'refund policy')",
        },
      },
      required: ["query"],
    },
  },
];

export type BookingToolName =
  | "lookup_client"
  | "create_lead"
  | "check_availability"
  | "book_appointment"
  | "search_knowledge";
