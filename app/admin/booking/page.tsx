"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CalendarView } from "@/components/booking/CalendarView";
import { WeekView } from "@/components/booking/WeekView";
import { AvailabilitySettings } from "@/components/booking/AvailabilitySettings";
import { EventTypesManager } from "@/components/booking/EventTypesManager";
import { BookingSettingsTab } from "@/components/booking/BookingSettingsTab";
import { CreateAppointmentModal } from "@/components/booking/CreateAppointmentModal";
import { AppointmentDetailsModal } from "@/components/booking/AppointmentDetailsModal";
import { Calendar, Clock, Settings, Grid, Plus, Cog } from "lucide-react";

export default function BookingAdminPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalDefaults, setCreateModalDefaults] = useState<{ date?: string; time?: string }>({});

  const handleTimeSlotClick = (date: string, time: string) => {
    setCreateModalDefaults({ date, time });
    setIsCreateModalOpen(true);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Booking Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your appointments, availability, and event types</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          New Appointment
        </Button>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="week" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Week View</span>
          </TabsTrigger>
          <TabsTrigger value="event-types" className="flex items-center gap-2">
            <Grid className="w-4 h-4" />
            <span className="hidden sm:inline">Event Types</span>
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Availability</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Cog className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar" className="space-y-4">
          <CalendarView
            onDateSelect={(date) => setSelectedDate(date)}
            onAppointmentClick={(id) => setSelectedAppointmentId(id)}
            onDateClick={(date) => {
              setCreateModalDefaults({ date, time: "09:00" });
              setIsCreateModalOpen(true);
            }}
          />
        </TabsContent>

        {/* Week View */}
        <TabsContent value="week" className="space-y-4">
          <WeekView
            onAppointmentClick={(id) => setSelectedAppointmentId(id)}
            onTimeSlotClick={handleTimeSlotClick}
          />
        </TabsContent>

        {/* Event Types */}
        <TabsContent value="event-types" className="space-y-4">
          <EventTypesManager />
        </TabsContent>

        {/* Availability Settings */}
        <TabsContent value="availability" className="space-y-4">
          <AvailabilitySettings />
        </TabsContent>

        {/* Booking Settings */}
        <TabsContent value="settings" className="space-y-4">
          <BookingSettingsTab />
        </TabsContent>
      </Tabs>

      {/* Create Appointment Modal */}
      <CreateAppointmentModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateModalDefaults({});
        }}
        defaultDate={createModalDefaults.date}
        defaultTime={createModalDefaults.time}
      />

      {/* Appointment Details Modal */}
      <AppointmentDetailsModal
        isOpen={!!selectedAppointmentId}
        onClose={() => setSelectedAppointmentId(null)}
        appointmentId={selectedAppointmentId}
      />
    </div>
  );
}
