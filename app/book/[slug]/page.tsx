"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function PublicBookingPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const eventType = useQuery(api.bookingQueries.getEventTypeBySlug, { slug });

  if (eventType === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (eventType === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
          <p className="text-gray-600">This booking page does not exist or is no longer available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: eventType.color }}
              />
              <h1 className="text-3xl font-bold text-gray-900">{eventType.name}</h1>
            </div>
            {eventType.description && (
              <p className="text-gray-600 mb-4">{eventType.description}</p>
            )}
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span>⏱️</span>
                <span>{eventType.duration} minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span>{eventType.locationType.replace("_", " ")}</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-8">
            <h2 className="text-xl font-semibold mb-4">Select a Date & Time</h2>
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">📅 Booking Calendar Coming Soon</p>
              <p className="text-sm">
                This public booking page is under construction. 
                For now, please contact us directly to schedule an appointment.
              </p>
            </div>
          </div>

          <div className="border-t pt-6 mt-6">
            <div className="text-sm text-gray-500 space-y-2">
              <p><strong>Minimum notice:</strong> {eventType.minNoticeHours} hours</p>
              <p><strong>Booking window:</strong> Up to {eventType.maxDaysInFuture} days in advance</p>
              {eventType.maxBookingsPerDay && eventType.maxBookingsPerDay > 0 && (
                <p><strong>Availability:</strong> Maximum {eventType.maxBookingsPerDay} bookings per day</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
