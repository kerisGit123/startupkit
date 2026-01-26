"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  defaultTime?: string;
}

export function CreateAppointmentModal({ 
  isOpen, 
  onClose, 
  defaultDate, 
  defaultTime 
}: CreateAppointmentModalProps) {
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    date: defaultDate || new Date().toISOString().split("T")[0],
    startTime: defaultTime || "09:00",
    duration: 30,
    eventTypeId: "",
    appointmentType: "consultation",
    notes: "",
    location: "",
  });

  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when modal opens or defaultDate/defaultTime changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        date: defaultDate || new Date().toISOString().split("T")[0],
        startTime: defaultTime || "09:00",
        duration: 30,
        eventTypeId: "",
        appointmentType: "consultation",
        notes: "",
        location: "",
      });
      setClientSearchQuery("");
    }
  }, [isOpen, defaultDate, defaultTime]);

  const eventTypes = useQuery(api.bookingQueries.getAllEventTypes);
  const createAppointment = useMutation(api.bookingMutations.createAppointment);
  const createClient = useMutation(api.bookingMutations.createClient);
  const lookupClient = useQuery(
    api.bookingQueries.getClientByEmail,
    formData.clientEmail ? { email: formData.clientEmail } : "skip"
  );
  const searchResults = useQuery(
    api.bookingQueries.searchClients,
    clientSearchQuery.length >= 2 ? { query: clientSearchQuery } : "skip"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if client exists, if not create
      let clientId = lookupClient?._id;
      
      if (!clientId) {
        clientId = await createClient({
          name: formData.clientName,
          email: formData.clientEmail,
          phone: formData.clientPhone,
          totalAppointments: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      // Calculate end time
      const [hours, minutes] = formData.startTime.split(":").map(Number);
      const endMinutes = hours * 60 + minutes + formData.duration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;

      // Create appointment
      await createAppointment({
        clientId,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        eventTypeId: formData.eventTypeId || undefined,
        date: formData.date,
        startTime: formData.startTime,
        endTime,
        duration: formData.duration,
        status: "confirmed",
        appointmentType: formData.appointmentType,
        notes: formData.notes,
        location: formData.location,
        googleCalendarSynced: false,
        bookedBy: "admin",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      onClose();
      setFormData({
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        date: defaultDate || new Date().toISOString().split("T")[0],
        startTime: defaultTime || "09:00",
        duration: 30,
        eventTypeId: "",
        appointmentType: "consultation",
        notes: "",
        location: "",
      });
    } catch (error) {
      console.error("Failed to create appointment:", error);
      alert("Failed to create appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEventType = eventTypes?.find(et => et._id === formData.eventTypeId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Appointment</DialogTitle>
          <DialogDescription>
            Manually create a new appointment for a client
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event Type Selection */}
          <div>
            <Label>Event Type (Optional)</Label>
            <Select 
              value={formData.eventTypeId || "none"} 
              onValueChange={(value) => {
                if (value === "none") {
                  setFormData({ 
                    ...formData, 
                    eventTypeId: "",
                    duration: 30,
                    location: "",
                  });
                } else {
                  const eventType = eventTypes?.find(et => et._id === value);
                  setFormData({ 
                    ...formData, 
                    eventTypeId: value,
                    duration: eventType?.duration || 30,
                    location: eventType?.locationType || "",
                  });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No event type</SelectItem>
                {eventTypes?.map((et) => (
                  <SelectItem key={et._id} value={et._id}>
                    {et.name} ({et.duration} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client Search */}
          <div>
            <Label>Search Existing Client</Label>
            <Input
              value={clientSearchQuery}
              onChange={(e) => setClientSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
            />
            {searchResults && searchResults.length > 0 && (
              <div className="border rounded mt-1 max-h-40 overflow-y-auto bg-white shadow-lg">
                {searchResults.map(client => (
                  <div
                    key={client._id}
                    className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        clientName: client.name,
                        clientEmail: client.email,
                        clientPhone: client.phone || "",
                      });
                      setClientSearchQuery("");
                    }}
                  >
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-gray-600">{client.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Client Name *</Label>
              <Input
                required
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label>Client Email *</Label>
              <Input
                required
                type="email"
                value={formData.clientEmail}
                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <Label>Client Phone</Label>
            <Input
              value={formData.clientPhone}
              onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
              placeholder="+1 234 567 8900"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Date *</Label>
              <Input
                required
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <Label>Start Time *</Label>
              <Input
                required
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div>
              <Label>Duration (minutes) *</Label>
              <Input
                required
                type="number"
                min="15"
                step="15"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Appointment Type */}
          <div>
            <Label>Appointment Type</Label>
            <Select 
              value={formData.appointmentType} 
              onValueChange={(value) => setFormData({ ...formData, appointmentType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultation">Consultation</SelectItem>
                <SelectItem value="demo">Demo</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div>
            <Label>Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder={selectedEventType?.locationType || "Google Meet, Zoom, etc."}
            />
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Appointment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
