"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { Id } from "@/convex/_generated/dataModel";
import { DraggableAppointment } from "./DraggableAppointment";
import { DroppableTimeSlot } from "./DroppableTimeSlot";

interface WeekViewProps {
  onAppointmentClick?: (appointmentId: string) => void;
  onTimeSlotClick?: (date: string, time: string) => void;
}

export function WeekView({ onTimeSlotClick, onAppointmentClick }: WeekViewProps) {
  const eventTypes = useQuery(api.bookingQueries.getAllEventTypes);
  const updateAppointment = useMutation(api.bookingMutations.updateAppointment);
  const availability = useQuery(api.bookingQueries.getAllAvailability);
  const bookingSettings = useQuery(api.platformConfig.getByCategory, { category: "booking" });
  
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    const sunday = new Date(today.setDate(diff));
    return `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const [year, month, day] = currentWeekStart.split('-').map(Number);
    const date = new Date(year, month - 1, day + i);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });

  const day0Appointments = useQuery(api.bookingQueries.getAppointmentsByDate, { date: weekDays[0] });
  const day1Appointments = useQuery(api.bookingQueries.getAppointmentsByDate, { date: weekDays[1] });
  const day2Appointments = useQuery(api.bookingQueries.getAppointmentsByDate, { date: weekDays[2] });
  const day3Appointments = useQuery(api.bookingQueries.getAppointmentsByDate, { date: weekDays[3] });
  const day4Appointments = useQuery(api.bookingQueries.getAppointmentsByDate, { date: weekDays[4] });
  const day5Appointments = useQuery(api.bookingQueries.getAppointmentsByDate, { date: weekDays[5] });
  const day6Appointments = useQuery(api.bookingQueries.getAppointmentsByDate, { date: weekDays[6] });
  
  const appointmentsData = [
    day0Appointments,
    day1Appointments,
    day2Appointments,
    day3Appointments,
    day4Appointments,
    day5Appointments,
    day6Appointments,
  ];

  const navigateWeek = (direction: "prev" | "next") => {
    const [year, month, day] = currentWeekStart.split('-').map(Number);
    const date = new Date(year, month - 1, day + (direction === "next" ? 7 : -7));
    setCurrentWeekStart(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
  };

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    const sunday = new Date(today.setDate(diff));
    setCurrentWeekStart(`${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`);
  };

  const weekViewStartTime = (bookingSettings?.weekViewStartTime as string) || "06:00";
  const weekViewEndTime = (bookingSettings?.weekViewEndTime as string) || "21:00";
  
  const startHour = parseInt(weekViewStartTime.split(":")[0]);
  const endHour = parseInt(weekViewEndTime.split(":")[0]);
  
  const timeSlots = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    timeSlots.push(`${String(hour).padStart(2, '0')}:00`);
  }

  const todayDate = new Date();
  const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

  const holidays = (bookingSettings?.holidays as Array<{date: string; name: string; reason?: string}>) || [];

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const appointmentId = active.id as string;
    const dropData = over.data.current as { date: string; time: string };
    
    if (!dropData) return;

    const targetDate = new Date(dropData.date);
    const targetDayOfWeek = targetDate.getDay();
    const dayAvailability = availability?.find(a => a.dayOfWeek === targetDayOfWeek);
    
    if (!dayAvailability || !dayAvailability.isActive) {
      alert('Cannot move appointment: This day is not available for bookings.');
      return;
    }
    
    const targetHour = parseInt(dropData.time.split(":")[0]);
    const availStartHour = parseInt(dayAvailability.startTime.split(":")[0]);
    const availEndHour = parseInt(dayAvailability.endTime.split(":")[0]);
    
    if (targetHour < availStartHour || targetHour >= availEndHour) {
      alert(`Cannot move appointment: Time slot is outside available hours (${dayAvailability.startTime} - ${dayAvailability.endTime}).`);
      return;
    }

    const targetDayIndex = weekDays.indexOf(dropData.date);
    if (targetDayIndex === -1) return;
    
    const targetDayAppointments = appointmentsData[targetDayIndex];
    const draggedAppointment = appointmentsData.flat().find(apt => apt?._id === appointmentId);
    
    if (!draggedAppointment) return;

    const draggedDuration = draggedAppointment.duration;
    const draggedEndMinutes = targetHour * 60 + draggedDuration;
    const draggedEndHour = Math.ceil(draggedEndMinutes / 60);

    const hasConflict = targetDayAppointments?.some(apt => {
      if (!apt || apt._id === appointmentId) return false;
      
      const aptStartHour = parseInt(apt.startTime.split(":")[0]);
      let aptEndHour;
      if (apt.endTime) {
        const [endH, endM] = apt.endTime.split(":").map(Number);
        aptEndHour = endM > 0 ? endH + 1 : endH;
      } else {
        const [startH, startM] = apt.startTime.split(":").map(Number);
        const endMinutes = startH * 60 + startM + apt.duration;
        aptEndHour = Math.ceil(endMinutes / 60);
      }
      
      return (targetHour < aptEndHour && draggedEndHour > aptStartHour);
    });

    if (hasConflict) {
      alert('Cannot move appointment: Time slot is already occupied.');
      return;
    }

    try {
      const [newStartHour, newStartMin] = dropData.time.split(":").map(Number);
      const newEndMinutes = newStartHour * 60 + newStartMin + draggedAppointment.duration;
      const newEndHour = Math.floor(newEndMinutes / 60);
      const newEndMin = newEndMinutes % 60;
      const newEndTime = `${String(newEndHour).padStart(2, '0')}:${String(newEndMin).padStart(2, '0')}`;

      await updateAppointment({
        appointmentId: appointmentId as Id<"appointments">,
        date: dropData.date,
        startTime: dropData.time,
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigateWeek("prev")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-2xl font-bold">
            {new Date(currentWeekStart).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigateWeek("next")}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button size="sm" onClick={() => onTimeSlotClick?.(today, "09:00")}>
            <Plus className="w-4 h-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex border-b bg-gray-50">
          <div className="w-20 border-r"></div>
          
          {weekDays.map((date) => {
            const dateObj = new Date(date);
            const isToday = date === today;
            const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
            const dayNumber = dateObj.getDate();

            return (
              <div 
                key={date} 
                className={cn(
                  "flex-1 text-center py-3 border-r",
                  isToday && "bg-blue-50"
                )}
              >
                <div className="text-xs text-gray-600 uppercase">{dayName}</div>
                <div className={cn(
                  "text-2xl font-bold mt-1",
                  isToday ? "text-blue-600" : "text-gray-900"
                )}>
                  {dayNumber}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex">
          <div className="w-20 border-r bg-gray-50">
            {timeSlots.map((time) => (
              <div key={time} className="h-20 border-b flex items-start justify-end pr-2 pt-1 text-xs text-gray-500">
                {time}
              </div>
            ))}
          </div>

          {weekDays.map((date, dayIndex) => {
            const appointments = appointmentsData[dayIndex];
            const isToday = date === today;
            
            const dateObj = new Date(date);
            const dayOfWeek = dateObj.getDay();
            const dayAvailability = availability?.find(a => a.dayOfWeek === dayOfWeek);
            const isDayAvailable = dayAvailability?.isActive ?? true;
            
            const isHoliday = holidays.some(h => h.date === date);
            const holidayInfo = holidays.find(h => h.date === date);

            return (
              <div key={date} className={cn(
                "flex-1 border-r",
                isToday && "bg-blue-50/30",
                !isDayAvailable && "bg-gray-100",
              )}>
                {timeSlots.map((time) => {
                  const hour = parseInt(time.split(":")[0]);
                  
                  if (isHoliday) {
                    return (
                      <div
                        key={time}
                        className="relative h-20 border-b border-gray-300 bg-red-100 cursor-not-allowed"
                        title={`Holiday: ${holidayInfo?.name}`}
                      >
                        {hour === startHour && (
                          <div className="absolute inset-0 flex items-center justify-center text-xs text-red-600 font-medium">
                            🎉 {holidayInfo?.name}
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  let isTimeAvailable = isDayAvailable;
                  let isLunchBreak = false;
                  
                  if (isDayAvailable && dayAvailability) {
                    const availStartHour = parseInt(dayAvailability.startTime.split(":")[0]);
                    const availEndHour = parseInt(dayAvailability.endTime.split(":")[0]);
                    isTimeAvailable = hour >= availStartHour && hour < availEndHour;
                    
                    const lunchBreakEnabled = bookingSettings?.lunchBreakEnabled as boolean || false;
                    const lunchBreakStart = bookingSettings?.lunchBreakStart as string;
                    const lunchBreakEnd = bookingSettings?.lunchBreakEnd as string;
                    
                    if (lunchBreakEnabled && lunchBreakStart && lunchBreakEnd) {
                      const lunchStartHour = parseInt(lunchBreakStart.split(":")[0]);
                      const lunchEndHour = parseInt(lunchBreakEnd.split(":")[0]);
                      isLunchBreak = hour >= lunchStartHour && hour < lunchEndHour;
                    }
                  }
                  
                  const slotAppointments = appointments?.filter((apt) => {
                    const aptStartHour = parseInt(apt.startTime.split(":")[0]);
                    let aptEndHour;
                    if (apt.endTime) {
                      const [endH, endM] = apt.endTime.split(":").map(Number);
                      aptEndHour = endM > 0 ? endH + 1 : endH;
                    } else {
                      const [startH, startM] = apt.startTime.split(":").map(Number);
                      const endMinutes = startH * 60 + startM + apt.duration;
                      aptEndHour = Math.ceil(endMinutes / 60);
                    }
                    return hour >= aptStartHour && hour < aptEndHour;
                  });

                  return (
                    <DroppableTimeSlot
                      key={time}
                      id={`${date}-${time}`}
                      date={date}
                      time={time}
                      className={cn(
                        "relative h-20 border-b border-gray-300 transition-colors group",
                        isLunchBreak && "bg-orange-50 cursor-not-allowed",
                        !isLunchBreak && isTimeAvailable && "hover:bg-blue-50 cursor-pointer",
                        !isLunchBreak && !isTimeAvailable && "bg-gray-100 cursor-not-allowed"
                      )}
                      onClick={() => !isLunchBreak && isTimeAvailable && onTimeSlotClick?.(date, time)}
                    >
                      {isLunchBreak && (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-orange-600 font-medium">
                          🍽️ Lunch
                        </div>
                      )}
                      
                      {!isLunchBreak && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-4 h-4 text-blue-600" />
                        </div>
                      )}

                      {slotAppointments?.map((apt) => {
                        const isFirstSlot = hour === parseInt(apt.startTime.split(":")[0]);
                        
                        if (!isFirstSlot) return null;

                        const [startHour, startMin] = apt.startTime.split(":").map(Number);
                        
                        let endHour, endMin, durationMinutes;
                        if (apt.endTime) {
                          [endHour, endMin] = apt.endTime.split(":").map(Number);
                          durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
                        } else {
                          durationMinutes = apt.duration;
                          const endTotalMinutes = startHour * 60 + startMin + durationMinutes;
                          endHour = Math.floor(endTotalMinutes / 60);
                          endMin = endTotalMinutes % 60;
                        }
                        
                        const heightPx = (durationMinutes / 60) * 80;
                        const eventType = eventTypes?.find(et => et._id === apt.eventTypeId);
                        const bgColor = eventType?.color || "#4F46E5";

                        return (
                          <DraggableAppointment
                            key={apt._id}
                            id={apt._id}
                            className="absolute left-1 right-1 rounded p-1 text-xs z-10 hover:shadow-lg transition-all border-l-2 text-white"
                            style={{
                              top: `${(startMin / 60) * 80}px`,
                              height: `${Math.max(heightPx, 40)}px`,
                              backgroundColor: bgColor,
                              borderLeftColor: bgColor,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAppointmentClick?.(apt._id);
                            }}
                          >
                            <div className="font-semibold truncate">{apt.clientName}</div>
                            <div className="text-xs opacity-90 truncate">
                              {apt.startTime} - {apt.endTime || `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`}
                            </div>
                            <div className="text-xs opacity-75 truncate capitalize">
                              {apt.appointmentType}
                            </div>
                          </DraggableAppointment>
                        );
                      })}
                    </DroppableTimeSlot>
                  );
                })}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex items-center gap-4 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 border-l-2 border-blue-700 rounded"></div>
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400 border-l-2 border-yellow-600 rounded"></div>
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 border-l-2 border-green-700 rounded"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 border-l-2 border-gray-500 rounded"></div>
          <span>Cancelled</span>
        </div>
      </div>
    </div>
    </DndContext>
  );
}
