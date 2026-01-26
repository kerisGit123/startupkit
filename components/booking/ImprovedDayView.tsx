"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImprovedDayViewProps {
  selectedDate?: string;
  onAppointmentClick?: (appointmentId: string) => void;
  onTimeSlotClick?: (date: string, time: string) => void;
}

export function ImprovedDayView({ selectedDate, onAppointmentClick, onTimeSlotClick }: ImprovedDayViewProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date().toISOString().split("T")[0]);

  const appointments = useQuery(api.bookingQueries.getAppointmentsByDate, {
    date: currentDate,
  });

  const availability = useQuery(api.bookingQueries.getAvailabilityForDate, {
    date: currentDate,
  });

  const navigateDay = (direction: "prev" | "next") => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + (direction === "next" ? 1 : -1));
    setCurrentDate(date.toISOString().split("T")[0]);
  };

  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 6; // Start at 6 AM
    const endHour = 22; // End at 10 PM

    for (let hour = startHour; hour < endHour; hour++) {
      slots.push({
        time: `${String(hour).padStart(2, "0")}:00`,
        hour,
      });
    }

    return slots;
  };

  const getAppointmentAtTime = (hour: number) => {
    return appointments?.filter((apt) => {
      const aptHour = parseInt(apt.startTime.split(":")[0]);
      const aptEndHour = parseInt(apt.endTime.split(":")[0]);
      return hour >= aptHour && hour < aptEndHour;
    });
  };

  const calculateAppointmentHeight = (apt: any) => {
    const [startHour, startMin] = apt.startTime.split(":").map(Number);
    const [endHour, endMin] = apt.endTime.split(":").map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    return (durationMinutes / 60) * 100; // 100px per hour
  };

  const calculateAppointmentTop = (apt: any) => {
    const [, startMin] = apt.startTime.split(":").map(Number);
    return (startMin / 60) * 100; // Offset within the hour
  };

  const isWorkingHour = (hour: number) => {
    if (!availability?.availability) return false;
    const startHour = parseInt(availability.availability.startTime.split(":")[0]);
    const endHour = parseInt(availability.availability.endTime.split(":")[0]);
    return hour >= startHour && hour < endHour;
  };

  const isBlocked = availability?.override?.type === "blocked";

  const timeSlots = generateTimeSlots();
  const dateObj = new Date(currentDate);
  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigateDay("prev")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{dayName}</h2>
            <p className="text-sm text-gray-600">{monthDay}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigateDay("next")}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date().toISOString().split("T")[0])}>
            Today
          </Button>
          <Button size="sm" onClick={() => onTimeSlotClick?.(currentDate, "09:00")}>
            <Plus className="w-4 h-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Day View Grid */}
      <Card className="overflow-hidden">
        {isBlocked ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">Day is blocked</p>
            <p className="text-sm">{availability?.override?.reason || "Not available"}</p>
          </div>
        ) : (
          <div className="flex">
            {/* Time Labels Column */}
            <div className="w-24 border-r bg-gray-50">
              {timeSlots.map((slot) => (
                <div
                  key={slot.time}
                  className="h-[100px] border-b flex items-start justify-end pr-3 pt-1 text-xs text-gray-500"
                >
                  {slot.time}
                </div>
              ))}
            </div>

            {/* Appointments Column */}
            <div className="flex-1 relative">
              {timeSlots.map((slot) => {
                const hourAppointments = getAppointmentAtTime(slot.hour);
                const isWorking = isWorkingHour(slot.hour);

                return (
                  <div
                    key={slot.time}
                    className={cn(
                      "relative h-[100px] border-b",
                      !isWorking && "bg-gray-50/50"
                    )}
                  >
                    {/* Clickable time slot */}
                    <div
                      className={cn(
                        "absolute inset-0 cursor-pointer hover:bg-blue-50/30 transition-colors group",
                        isWorking && "hover:bg-blue-50"
                      )}
                      onClick={() => isWorking && onTimeSlotClick?.(currentDate, slot.time)}
                    >
                      {isWorking && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-5 h-5 text-blue-600" />
                        </div>
                      )}
                    </div>

                    {/* Appointments */}
                    {hourAppointments?.map((apt) => {
                      const isFirstHour = slot.hour === parseInt(apt.startTime.split(":")[0]);
                      
                      if (!isFirstHour) return null; // Only render on first hour

                      return (
                        <div
                          key={apt._id}
                          className={cn(
                            "absolute left-2 right-2 rounded-lg p-3 cursor-pointer shadow-md border-l-4 z-10",
                            "hover:shadow-lg transition-all hover:scale-[1.02]",
                            apt.status === "confirmed" && "bg-blue-500 border-blue-700 text-white",
                            apt.status === "pending" && "bg-yellow-400 border-yellow-600 text-gray-900",
                            apt.status === "cancelled" && "bg-gray-300 border-gray-500 text-gray-600 opacity-70",
                            apt.status === "completed" && "bg-green-500 border-green-700 text-white"
                          )}
                          style={{
                            top: `${calculateAppointmentTop(apt)}px`,
                            height: `${calculateAppointmentHeight(apt)}px`,
                            minHeight: "60px",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick?.(apt._id);
                          }}
                        >
                          <div className="flex flex-col h-full">
                            <div className="text-xs font-semibold opacity-90">
                              {apt.startTime} - {apt.endTime}
                            </div>
                            <div className="text-sm font-bold mt-1">
                              {apt.clientName}
                            </div>
                            <div className="text-xs opacity-90 mt-auto">
                              {apt.appointmentType}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 border-l-4 border-blue-700 rounded"></div>
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400 border-l-4 border-yellow-600 rounded"></div>
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 border-l-4 border-green-700 rounded"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 border-l-4 border-gray-500 rounded"></div>
          <span>Cancelled</span>
        </div>
      </div>
    </div>
  );
}
