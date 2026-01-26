"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DayViewProps {
  selectedDate?: string;
  onAppointmentClick?: (appointmentId: string) => void;
  onTimeSlotClick?: (date: string, time: string) => void;
}

export function DayView({ selectedDate, onAppointmentClick, onTimeSlotClick }: DayViewProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date().toISOString().split("T")[0]);

  const appointments = useQuery(api.bookingQueries.getAppointmentsByDate, {
    date: currentDate,
  });

  const availability = useQuery(api.bookingQueries.getAvailabilityForDate, {
    date: currentDate,
  });

  const bookingSettings = useQuery(api.platformConfig.getByCategory, { category: "booking" });

  const navigateDay = (direction: "prev" | "next") => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + (direction === "next" ? 1 : -1));
    setCurrentDate(date.toISOString().split("T")[0]);
  };

  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 0;
    const endHour = 24;

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
    return (durationMinutes / 60) * 80; // 80px per hour
  };

  const calculateAppointmentTop = (apt: any) => {
    const [, startMin] = apt.startTime.split(":").map(Number);
    return (startMin / 60) * 80; // Offset within the hour
  };

  const isWorkingHour = (hour: number) => {
    if (!availability?.availability) return false;
    const startHour = parseInt(availability.availability.startTime.split(":")[0]);
    const endHour = parseInt(availability.availability.endTime.split(":")[0]);
    return hour >= startHour && hour < endHour;
  };

  const isLunchBreak = (hour: number) => {
    const lunchBreakEnabled = bookingSettings?.lunchBreakEnabled as boolean || false;
    const lunchBreakStart = bookingSettings?.lunchBreakStart as string;
    const lunchBreakEnd = bookingSettings?.lunchBreakEnd as string;
    
    if (!lunchBreakEnabled || !lunchBreakStart || !lunchBreakEnd) return false;
    
    const lunchStartHour = parseInt(lunchBreakStart.split(":")[0]);
    const lunchEndHour = parseInt(lunchBreakEnd.split(":")[0]);
    return hour >= lunchStartHour && hour < lunchEndHour;
  };

  // Check if current date is a holiday from platform_config
  const holidays = (bookingSettings?.holidays as Array<{date: string; name: string; reason?: string}>) || [];
  const currentDateHoliday = holidays.find(h => h.date === currentDate);
  
  const isBlocked = availability?.override?.type === "blocked" || !!currentDateHoliday;
  const isHoliday = !!currentDateHoliday;

  const timeSlots = generateTimeSlots();
  const dateObj = new Date(currentDate);
  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

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

        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date().toISOString().split("T")[0])}>
          Today
        </Button>
      </div>

      {/* Day View Grid */}
      <Card className="p-4 overflow-auto max-h-[800px]">
        {isBlocked ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">{isHoliday ? "🎉 Holiday" : "Day is blocked"}</p>
            <p className="text-sm">{isHoliday && availability?.override?.holidayName ? availability.override.holidayName : availability?.override?.reason || "Not available"}</p>
          </div>
        ) : (
          <div className="relative">
            {timeSlots.map((slot) => {
              const hourAppointments = getAppointmentAtTime(slot.hour);
              const isWorking = isWorkingHour(slot.hour);
              const isLunch = isLunchBreak(slot.hour);

              return (
                <div
                  key={slot.time}
                  className={cn(
                    "relative border-t h-20 flex",
                    !isWorking && !isLunch && "bg-gray-50",
                    isLunch && "bg-orange-50"
                  )}
                >
                  {/* Time Label */}
                  <div className="w-20 flex-shrink-0 text-sm text-gray-600 pr-4 pt-1">
                    {slot.time}
                  </div>

                  {/* Time Slot Area */}
                  <div
                    className={cn(
                      "flex-1 relative transition-colors",
                      isLunch && "cursor-not-allowed",
                      !isLunch && isWorking && "cursor-pointer hover:bg-blue-50 bg-white",
                      !isLunch && !isWorking && "cursor-not-allowed"
                    )}
                    onClick={() => !isLunch && isWorking && onTimeSlotClick?.(currentDate, slot.time)}
                  >
                    {/* Lunch break indicator */}
                    {isLunch && (
                      <div className="absolute inset-0 flex items-center justify-center text-sm text-orange-600 font-medium">
                        🍽️ Lunch Break
                      </div>
                    )}
                    {/* Appointments */}
                    {hourAppointments?.map((apt) => {
                      const isFirstHour = slot.hour === parseInt(apt.startTime.split(":")[0]);
                      
                      if (!isFirstHour) return null; // Only render on first hour

                      return (
                        <div
                          key={apt._id}
                          className={cn(
                            "absolute left-0 right-0 mx-2 rounded-lg p-2 cursor-pointer shadow-sm border-l-4",
                            "hover:shadow-md transition-shadow",
                            apt.status === "confirmed" && "bg-blue-100 border-blue-500",
                            apt.status === "pending" && "bg-yellow-100 border-yellow-500",
                            apt.status === "cancelled" && "bg-gray-100 border-gray-400 opacity-60",
                            apt.status === "completed" && "bg-green-100 border-green-500"
                          )}
                          style={{
                            top: `${calculateAppointmentTop(apt)}px`,
                            height: `${calculateAppointmentHeight(apt)}px`,
                            minHeight: "40px",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick?.(apt._id);
                          }}
                        >
                          <div className="text-xs font-semibold">
                            {apt.startTime} - {apt.endTime}
                          </div>
                          <div className="text-sm font-medium truncate">
                            {apt.clientName}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {apt.appointmentType}
                          </div>
                        </div>
                      );
                    })}

                    {/* Available indicator */}
                    {isWorking && hourAppointments?.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-xs text-blue-600 font-medium">Click to book</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border-l-4 border-blue-500 rounded"></div>
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 border-l-4 border-yellow-500 rounded"></div>
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border-l-4 border-green-500 rounded"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border-l-4 border-gray-400 rounded"></div>
          <span>Cancelled</span>
        </div>
      </div>
    </div>
  );
}
