import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, duration } = body;

    if (!date) {
      return NextResponse.json(
        { error: "Date is required (format: YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    // Get day of week
    const requestDate = new Date(date);
    const dayOfWeek = requestDate.getDay();

    // Get booking settings (for lunch breaks and holidays)
    const bookingSettings = await convex.query(api.platformConfig.getByCategory, {
      category: "booking",
    });

    // Check if this date is a holiday
    const holidays = (bookingSettings?.holidays as Array<{date: string; name: string; reason?: string}>) || [];
    const holiday = holidays.find(h => h.date === date);
    
    if (holiday) {
      return NextResponse.json({
        date,
        available: false,
        availableSlots: [],
        totalSlots: 0,
        reason: `Holiday: ${holiday.name}${holiday.reason ? ' - ' + holiday.reason : ''}`,
      });
    }

    // Get day availability settings
    const availability = await convex.query(api.bookingQueries.getAvailabilityByDay, {
      dayOfWeek,
    });

    if (!availability || !availability.isActive) {
      return NextResponse.json({
        date,
        available: false,
        availableSlots: [],
        totalSlots: 0,
        reason: "This day is not available for bookings",
      });
    }

    // Get existing appointments for this date
    const appointments = await convex.query(api.bookingQueries.getAppointmentsByDate, {
      date,
      statuses: ["confirmed", "pending"],
    });

    // Calculate available slots (filters out booked times)
    const slots = await convex.query(api.bookingQueries.calculateAvailableSlots, {
      date,
      duration: duration || 60,
      availability,
      override: null,
      existingAppointments: appointments,
    });

    return NextResponse.json({
      date,
      available: slots.length > 0,
      availableSlots: slots.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        available: true,
      })),
      totalSlots: slots.length,
    });
  } catch (error) {
    console.error("Check availability error:", error);
    return NextResponse.json(
      { error: "Failed to check availability", message: (error as Error).message },
      { status: 500 }
    );
  }
}
