import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { BookingToolName } from "./agent-tools";

function stringifyResult(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export async function dispatchBookingTool(
  toolName: string,
  rawInput: unknown,
  convex: ConvexHttpClient
): Promise<{ output: string; isError: boolean }> {
  const input = (rawInput ?? {}) as Record<string, unknown>;

  try {
    switch (toolName as BookingToolName) {
      case "lookup_client": {
        const email = String(input.email || "").toLowerCase().trim();
        if (!email) return { output: "Email is required.", isError: true };

        const client = await convex.query(api.bookingQueries.getClientByEmail, { email });
        if (!client) {
          return {
            output: `No client found with email "${email}". You should ask for their name and phone, then use create_lead to register them.`,
            isError: false,
          };
        }
        return {
          output: stringifyResult({
            found: true,
            id: client._id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            totalAppointments: client.totalAppointments,
            lastBookedAt: client.lastBookedAt
              ? new Date(client.lastBookedAt).toISOString().slice(0, 10)
              : null,
          }),
          isError: false,
        };
      }

      case "create_lead": {
        const name = String(input.name || "").trim();
        const email = String(input.email || "").toLowerCase().trim();
        const phone = input.phone ? String(input.phone).trim() : undefined;

        if (!name || !email)
          return { output: "Both name and email are required.", isError: true };

        // Check if already exists
        const existing = await convex.query(api.bookingQueries.getClientByEmail, { email });
        if (existing) {
          return {
            output: `Client already exists: ${existing.name} (${existing.email}). No need to create again.`,
            isError: false,
          };
        }

        const clientId = await convex.mutation(api.bookingMutations.createClient, {
          name,
          email,
          phone,
          totalAppointments: 0,
          completedAppointments: 0,
          cancelledAppointments: 0,
          noShowCount: 0,
          firstBookedAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        return {
          output: `Client created successfully: ${name} (${email}). Client ID: ${clientId}. You can now book an appointment for them.`,
          isError: false,
        };
      }

      case "check_availability": {
        const date = String(input.date || "").trim();
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
          return { output: "Date must be in YYYY-MM-DD format.", isError: true };

        // Get booking settings
        const bookingSettings = await convex.query(api.platformConfig.getByCategory, {
          category: "booking",
        });
        const weekViewStartTime = (bookingSettings?.weekViewStartTime as string) || "06:00";
        const weekViewEndTime = (bookingSettings?.weekViewEndTime as string) || "21:00";
        const maxDaysInFuture = (bookingSettings?.maxDaysInFuture as number) || 60;
        const minNoticeHours = (bookingSettings?.minNoticeHours as number) || 24;

        // Validate date range
        const requestDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor(
          (requestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff < 0)
          return { output: "Cannot check availability for past dates.", isError: false };
        if (daysDiff > maxDaysInFuture)
          return {
            output: `Cannot book more than ${maxDaysInFuture} days in advance.`,
            isError: false,
          };

        // Get day availability
        const dayOfWeek = requestDate.getDay();
        const availability = await convex.query(api.bookingQueries.getAvailabilityByDay, {
          dayOfWeek,
        });

        if (!availability || !(availability as any).isActive) {
          return { output: `Sorry, we are not available on this day of the week.`, isError: false };
        }

        // Check overrides
        const override = await convex.query(api.bookingQueries.getAvailabilityOverride, { date });
        if ((override as any)?.type === "blocked") {
          return {
            output: `Sorry, we are not available on ${date}. ${(override as any).reason || ""}`.trim(),
            isError: false,
          };
        }

        // Get existing appointments
        const appointments = await convex.query(api.bookingQueries.getAppointmentsByDate, {
          date,
          statuses: ["confirmed", "pending"],
        });

        // Calculate slots
        const slots = await convex.query(api.bookingQueries.calculateAvailableSlots, {
          date,
          duration: 60,
          availability,
          override,
          existingAppointments: appointments,
        });

        // Filter by global time range and min notice
        const now = Date.now();
        const minNoticeMs = minNoticeHours * 60 * 60 * 1000;
        const filteredSlots = (slots as any[]).filter((slot) => {
          const slotHour = parseInt(slot.startTime.split(":")[0]);
          const globalStartHour = parseInt(weekViewStartTime.split(":")[0]);
          const globalEndHour = parseInt(weekViewEndTime.split(":")[0]);
          if (slotHour < globalStartHour || slotHour >= globalEndHour) return false;
          const slotDateTime = new Date(`${date}T${slot.startTime}:00`);
          if (slotDateTime.getTime() - now < minNoticeMs) return false;
          return true;
        });

        if (filteredSlots.length === 0) {
          return { output: `No available slots on ${date}. Please try another date.`, isError: false };
        }

        const slotList = filteredSlots.map((s: any) => s.startTime).join(", ");
        return {
          output: `Available time slots on ${date}: ${slotList}. All slots are 1 hour. Ask the client which time they prefer.`,
          isError: false,
        };
      }

      case "book_appointment": {
        const email = String(input.email || "").toLowerCase().trim();
        const date = String(input.date || "").trim();
        const startTime = String(input.startTime || "").trim();
        const endTime = String(input.endTime || "").trim();
        const appointmentType = String(input.appointmentType || "consultation").trim();
        const notes = input.notes ? String(input.notes).trim() : undefined;

        if (!email || !date || !startTime || !endTime) {
          return { output: "email, date, startTime, and endTime are all required.", isError: true };
        }

        // Find client
        const client = await convex.query(api.bookingQueries.getClientByEmail, { email });
        if (!client) {
          return {
            output: `No client found with email "${email}". Use create_lead first to register them.`,
            isError: true,
          };
        }

        // Calculate duration in minutes
        const [sh, sm] = startTime.split(":").map(Number);
        const [eh, em] = endTime.split(":").map(Number);
        const duration = (eh * 60 + em) - (sh * 60 + sm);

        // Create appointment — cast client._id since clients/contacts table mismatch (Phase 2 fix)
        const appointmentId = await convex.mutation(api.bookingMutations.createAppointment, {
          contactId: client._id as any,
          contactName: client.name,
          contactEmail: client.email,
          contactPhone: client.phone,
          date,
          startTime,
          endTime,
          duration: duration > 0 ? duration : 60,
          status: "confirmed",
          appointmentType,
          notes,
          bookedBy: "chatbot",
          googleCalendarSynced: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        return {
          output: `Appointment booked successfully!\n- Client: ${client.name}\n- Date: ${date}\n- Time: ${startTime} - ${endTime}\n- Type: ${appointmentType}\n- Appointment ID: ${appointmentId}`,
          isError: false,
        };
      }

      case "search_knowledge": {
        const query = String(input.query || "").trim();
        if (!query) return { output: "A search query is required.", isError: true };

        const articles = await convex.query(api.knowledgeBase.searchArticlesUnified, {
          query,
          limit: 8,
        });

        if (!articles || articles.length === 0) {
          return {
            output: `No knowledge base articles found for "${query}". Try answering based on your general knowledge, or let the user know you'll connect them with someone who can help.`,
            isError: false,
          };
        }

        const trimmed = articles.slice(0, 5).map((a) => ({
          title: a.title,
          content: a.content.length > 1200 ? a.content.slice(0, 1200) + "..." : a.content,
        }));

        return { output: stringifyResult(trimmed), isError: false };
      }

      default:
        return { output: `Unknown tool: ${toolName}`, isError: true };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[booking-chat] tool "${toolName}" failed:`, err);
    return {
      output: `Tool error: ${msg}. Please try again or let the user know there was a temporary issue.`,
      isError: true,
    };
  }
}
