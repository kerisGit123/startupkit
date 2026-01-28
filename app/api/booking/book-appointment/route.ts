import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, date, startTime, endTime, appointmentType, notes } = body;

    if (!email || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "email, date, startTime, and endTime are required" },
        { status: 400 }
      );
    }

    // Look up contact by email
    const clients = await convex.query(api.contacts.searchContacts, {
      query: email,
    });

    const client = clients.find(
      (c) =>
        c.email?.toLowerCase() === email.toLowerCase() ||
        c.contactPersonEmail?.toLowerCase() === email.toLowerCase()
    );

    if (!client) {
      return NextResponse.json(
        { error: "Client not found. Please create a lead first." },
        { status: 404 }
      );
    }

    // Create appointment
    const appointmentId = await convex.mutation(api.bookings.createBooking, {
      contactId: client._id,
      date,
      startTime,
      endTime,
      appointmentType: appointmentType || "consultation",
      status: "confirmed",
      notes: notes || "",
    });

    return NextResponse.json({
      success: true,
      appointmentId,
      message: "Appointment booked successfully",
      appointment: {
        id: appointmentId,
        date,
        startTime,
        endTime,
        status: "confirmed",
      },
    });
  } catch (error) {
    console.error("Book appointment error:", error);
    return NextResponse.json(
      { error: "Failed to book appointment", message: (error as Error).message },
      { status: 500 }
    );
  }
}
