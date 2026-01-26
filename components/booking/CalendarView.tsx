"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { Id } from "@/convex/_generated/dataModel";
import { DraggableAppointment } from "./DraggableAppointment";
import { DroppableDate } from "./DroppableDate";

interface CalendarViewProps {
  onDateSelect?: (date: string) => void;
  onAppointmentClick?: (appointmentId: string) => void;
  onDateClick?: (date: string) => void;
}

export function CalendarView({ onDateSelect, onAppointmentClick, onDateClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const updateAppointment = useMutation(api.bookingMutations.updateAppointment);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get appointments for current month
  const startDate = new Date(year, month, 1).toISOString().split("T")[0];
  const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];
  
  const appointments = useQuery(api.bookingQueries.getAppointmentsByDateRange, {
    startDate,
    endDate,
  });
  
  const eventTypes = useQuery(api.bookingQueries.getAllEventTypes);
  const availability = useQuery(api.bookingQueries.getAllAvailability);
  const bookingSettings = useQuery(api.platformConfig.getByCategory, { category: "booking" });

  const getDaysInMonth = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: prevMonthLastDay - i,
        isCurrentMonth: false,
        fullDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: i,
        isCurrentMonth: true,
        fullDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: i,
        isCurrentMonth: false,
        fullDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      });
    }

    return days;
  };

  const getAppointmentsForDate = (date: string) => {
    return appointments?.filter((apt) => apt.date === date) || [];
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(new Date(year, month + (direction === "next" ? 1 : -1), 1));
  };

  const navigateToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const days = getDaysInMonth();
  const today = new Date().toISOString().split("T")[0];

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const appointmentId = active.id as string;
    const targetDate = over.id as string;

    // Find the appointment being dragged
    const appointment = appointments?.find(apt => apt._id === appointmentId);
    if (!appointment) return;

    // Check if target date is available
    const dateObj = new Date(targetDate);
    const dayOfWeek = dateObj.getDay();
    const dayAvailability = availability?.find(a => a.dayOfWeek === dayOfWeek);
    
    if (!dayAvailability || !dayAvailability.isActive) {
      alert('Cannot move appointment: This day is not available for bookings.');
      return;
    }

    // Check if time is within available hours
    const startHour = parseInt(appointment.startTime.split(":")[0]);
    const availStartHour = parseInt(dayAvailability.startTime.split(":")[0]);
    const availEndHour = parseInt(dayAvailability.endTime.split(":")[0]);
    
    if (startHour < availStartHour || startHour >= availEndHour) {
      alert(`Cannot move appointment: Time ${appointment.startTime} is outside available hours (${dayAvailability.startTime} - ${dayAvailability.endTime}).`);
      return;
    }

    // Check for conflicts on target date
    const targetDateAppointments = appointments?.filter(apt => apt.date === targetDate && apt._id !== appointmentId) || [];
    const [startH, startM] = appointment.startTime.split(":").map(Number);
    const draggedStartMinutes = startH * 60 + startM;
    const draggedEndMinutes = draggedStartMinutes + appointment.duration;

    const hasConflict = targetDateAppointments.some(apt => {
      const [aptStartH, aptStartM] = apt.startTime.split(":").map(Number);
      const aptStartMinutes = aptStartH * 60 + aptStartM;
      let aptEndMinutes;
      
      if (apt.endTime) {
        const [endH, endM] = apt.endTime.split(":").map(Number);
        aptEndMinutes = endH * 60 + endM;
      } else {
        aptEndMinutes = aptStartMinutes + apt.duration;
      }
      
      // Check for overlap: appointments overlap if one starts before the other ends
      return (draggedStartMinutes < aptEndMinutes && draggedEndMinutes > aptStartMinutes);
    });

    if (hasConflict) {
      alert('Cannot move appointment: The time slot conflicts with another appointment on this date.');
      return;
    }

    // Calculate endTime
    const endTotalMinutes = startH * 60 + startM + appointment.duration;
    const newEndHour = Math.floor(endTotalMinutes / 60);
    const newEndMin = endTotalMinutes % 60;
    const newEndTime = `${String(newEndHour).padStart(2, '0')}:${String(newEndMin).padStart(2, '0')}`;

    try {
      await updateAppointment({
        appointmentId: appointmentId as Id<"appointments">,
        date: targetDate,
        endTime: newEndTime,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Failed to update appointment:', error);
      alert('Failed to move appointment. Please try again.');
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">
            {monthNames[month]} {year}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={navigateToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => {
              const dayAppointments = getAppointmentsForDate(day.fullDate);
              const isToday = day.fullDate === today;
              
              // Check if this date is a holiday from platform_config
              const holidays = (bookingSettings?.holidays as Array<{date: string; name: string; reason?: string}>) || [];
              const isHoliday = holidays.some(h => h.date === day.fullDate);
              const holidayInfo = holidays.find(h => h.date === day.fullDate);

              // Check if day is available
              const dateObj = new Date(day.fullDate);
              const dayOfWeek = dateObj.getDay();
              const dayAvailability = availability?.find(a => a.dayOfWeek === dayOfWeek);
              const isDayAvailable = dayAvailability?.isActive ?? true;

              return (
                <DroppableDate
                  key={day.fullDate}
                  id={day.fullDate}
                  date={day.fullDate}
                  onClick={() => {
                    if (day.isCurrentMonth && !isHoliday && isDayAvailable) {
                      onDateClick?.(day.fullDate);
                    }
                  }}
                  className={cn(
                    "min-h-[100px] border p-2 transition-colors",
                    !day.isCurrentMonth && "bg-gray-50 text-gray-400",
                    isToday && !isHoliday && "bg-blue-50 border-blue-200",
                    isHoliday && "bg-red-100 border-red-300 cursor-not-allowed",
                    !isHoliday && day.isCurrentMonth && (isDayAvailable ? "cursor-pointer hover:bg-gray-50" : "bg-gray-100 cursor-not-allowed")
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isToday && !isHoliday && "text-blue-600 font-bold",
                    isHoliday && "text-red-600 font-bold"
                  )}>
                    {day.date}
                  </div>

                  {/* Holiday indicator */}
                  {isHoliday && (
                    <div className="text-xs text-red-600 font-medium mb-1">
                      🎉 {holidayInfo?.name}
                    </div>
                  )}

                  {/* Appointments */}
                  {!isHoliday && (
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map((apt) => {
                        const eventType = eventTypes?.find(et => et._id === apt.eventTypeId);
                        const bgColor = eventType?.color || "#4F46E5";
                        
                        return (
                          <DraggableAppointment
                            key={apt._id}
                            id={apt._id}
                            className="text-xs p-1 rounded truncate cursor-pointer text-white relative"
                            style={{ backgroundColor: bgColor }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAppointmentClick?.(apt._id);
                            }}
                          >
                            {apt.startTime} {apt.clientName}
                          </DraggableAppointment>
                        );
                      })}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-gray-500 pl-1">
                          +{dayAppointments.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </DroppableDate>
              );
            })}
          </div>
      </Card>
      </div>
    </DndContext>
  );
}
