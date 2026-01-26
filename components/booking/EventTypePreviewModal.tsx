"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, Calendar } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface EventTypePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTypeId: string | null;
}

export function EventTypePreviewModal({ 
  isOpen, 
  onClose, 
  eventTypeId 
}: EventTypePreviewModalProps) {
  const eventType = useQuery(
    api.bookingQueries.getEventType,
    eventTypeId ? { id: eventTypeId as Id<"event_types"> } : "skip"
  );

  if (!eventType) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Event Type Preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Type Header */}
          <div className="border-b pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: eventType.color }}
              />
              <h2 className="text-2xl font-bold">{eventType.name}</h2>
            </div>
            {eventType.description && (
              <p className="text-gray-600 mt-2">{eventType.description}</p>
            )}
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold">{eventType.duration} minutes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold capitalize">
                      {eventType.locationType.replace("_", " ")}
                    </p>
                    {eventType.locationDetails && (
                      <p className="text-sm text-gray-500">{eventType.locationDetails}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Settings */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-purple-600 mt-1" />
                <div className="flex-1">
                  <p className="font-semibold mb-3">Booking Settings</p>
                  <div className="space-y-2 text-sm">
                    {eventType.minNoticeHours && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Minimum notice:</span>
                        <span className="font-medium">{eventType.minNoticeHours} hours</span>
                      </div>
                    )}
                    {eventType.maxDaysInFuture && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Can book up to:</span>
                        <span className="font-medium">{eventType.maxDaysInFuture} days in advance</span>
                      </div>
                    )}
                    {eventType.bufferBefore && eventType.bufferBefore > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Buffer before:</span>
                        <span className="font-medium">{eventType.bufferBefore} minutes</span>
                      </div>
                    )}
                    {eventType.bufferAfter && eventType.bufferAfter > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Buffer after:</span>
                        <span className="font-medium">{eventType.bufferAfter} minutes</span>
                      </div>
                    )}
                    {eventType.maxBookingsPerDay && eventType.maxBookingsPerDay > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max per day:</span>
                        <span className="font-medium">{eventType.maxBookingsPerDay} bookings</span>
                      </div>
                    )}
                    {eventType.maxBookingsPerWeek && eventType.maxBookingsPerWeek > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max per week:</span>
                        <span className="font-medium">{eventType.maxBookingsPerWeek} bookings</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Badges */}
          <div className="flex gap-2">
            {eventType.isPublic && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                Public
              </span>
            )}
            {!eventType.isActive && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                Inactive
              </span>
            )}
          </div>

          {/* Public Link */}
          {eventType.isPublic && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 mb-2">Public booking page:</p>
                <code className="text-sm bg-white px-3 py-2 rounded border block">
                  {window.location.origin}/book/{eventType.slug}
                </code>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
