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
import { Id } from "@/convex/_generated/dataModel";

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string | null;
}

export function AppointmentDetailsModal({ 
  isOpen, 
  onClose, 
  appointmentId 
}: AppointmentDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    date: "",
    startTime: "",
    duration: 30,
    status: "confirmed" as "pending" | "confirmed" | "cancelled" | "completed" | "no_show",
    appointmentType: "",
    notes: "",
    location: "",
  });

  const appointment = useQuery(
    api.bookingQueries.getAppointment,
    appointmentId ? { id: appointmentId as Id<"appointments"> } : "skip"
  );
  const eventTypes = useQuery(api.bookingQueries.getAllEventTypes);
  const availability = useQuery(api.bookingQueries.getAllAvailability);
  const appointmentsOnDate = useQuery(
    api.bookingQueries.getAppointmentsByDate,
    formData.date ? { date: formData.date } : "skip"
  );
  const updateAppointment = useMutation(api.bookingMutations.updateAppointment);
  const deleteAppointment = useMutation(api.bookingMutations.deleteAppointment);

  // Update form when appointment loads
  useEffect(() => {
    if (appointment) {
      const apt = appointment as any;
      setFormData({
        clientName: apt.contactName || apt.clientName || "",
        clientEmail: apt.contactEmail || apt.clientEmail || "",
        clientPhone: apt.contactPhone || apt.clientPhone || "",
        date: appointment.date,
        startTime: appointment.startTime,
        duration: appointment.duration,
        status: appointment.status,
        appointmentType: appointment.appointmentType,
        notes: appointment.notes || "",
        location: appointment.location || "",
      });
    }
  }, [appointment]);

  const handleUpdate = async () => {
    if (!appointmentId) return;

    // Validate availability
    const dateObj = new Date(formData.date);
    const dayOfWeek = dateObj.getDay();
    const dayAvailability = availability?.find(a => a.dayOfWeek === dayOfWeek);
    
    if (!dayAvailability || !dayAvailability.isActive) {
      alert('Cannot save: This day is not available for bookings. Please choose an available day.');
      return;
    }
    
    // Validate time is within available hours
    const startHour = parseInt(formData.startTime.split(":")[0]);
    const availStartHour = parseInt(dayAvailability.startTime.split(":")[0]);
    const availEndHour = parseInt(dayAvailability.endTime.split(":")[0]);
    
    if (startHour < availStartHour || startHour >= availEndHour) {
      alert(`Cannot save: Time slot is outside available hours (${dayAvailability.startTime} - ${dayAvailability.endTime}). Please choose a time within available hours.`);
      return;
    }
    
    // Check for conflicts with other appointments
    if (appointmentsOnDate) {
      const endMinutes = startHour * 60 + formData.duration;
      const endHour = Math.ceil(endMinutes / 60);
      
      const hasConflict = appointmentsOnDate.some(apt => {
        if (apt._id === appointmentId) return false; // Skip current appointment
        
        const aptStartHour = parseInt(apt.startTime.split(":")[0]);
        let aptEndHour;
        if (apt.endTime) {
          const [endH, endM] = apt.endTime.split(":").map(Number);
          aptEndHour = endM > 0 ? endH + 1 : endH;
        } else {
          const [startH, startM] = apt.startTime.split(":").map(Number);
          const aptEndMinutes = startH * 60 + startM + apt.duration;
          aptEndHour = Math.ceil(aptEndMinutes / 60);
        }
        
        // Check for overlap
        return (startHour < aptEndHour && endHour > aptStartHour);
      });
      
      if (hasConflict) {
        alert("Cannot save: The selected time slot conflicts with another appointment. Please choose a different time.");
        return;
      }
    }

    try {
      // Calculate endTime from startTime and duration
      const [startHour, startMin] = formData.startTime.split(":").map(Number);
      const endTotalMinutes = startHour * 60 + startMin + formData.duration;
      const endHour = Math.floor(endTotalMinutes / 60);
      const endMin = endTotalMinutes % 60;
      const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
      
      await updateAppointment({
        appointmentId: appointmentId as Id<"appointments">,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        date: formData.date,
        startTime: formData.startTime,
        endTime: endTime,
        duration: formData.duration,
        status: formData.status,
        appointmentType: formData.appointmentType,
        notes: formData.notes,
        location: formData.location,
        updatedAt: Date.now(),
      });
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error("Failed to update appointment:", error);
      alert("Failed to update appointment. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!appointmentId || !confirm("Are you sure you want to delete this appointment?")) return;

    setIsDeleting(true);
    try {
      await deleteAppointment({
        appointmentId: appointmentId as Id<"appointments">,
      });
      onClose();
    } catch (error) {
      console.error("Failed to delete appointment:", error);
      alert("Failed to delete appointment. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!appointment) {
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Appointment" : "Appointment Details"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update appointment information" : "View appointment details"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Client Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Client Name</Label>
              {isEditing ? (
                <Input
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium">{(appointment as any).contactName || (appointment as any).clientName || "N/A"}</p>
              )}
            </div>
            <div>
              <Label>Client Email</Label>
              {isEditing ? (
                <Input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium">{(appointment as any).contactEmail || (appointment as any).clientEmail || "N/A"}</p>
              )}
            </div>
          </div>

          <div>
            <Label>Client Phone</Label>
            {isEditing ? (
              <Input
                value={formData.clientPhone}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
              />
            ) : (
              <p className="text-sm font-medium">{(appointment as any).contactPhone || (appointment as any).clientPhone || "N/A"}</p>
            )}
          </div>

          {/* Appointment Details */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Date</Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium">{appointment.date}</p>
              )}
            </div>
            <div>
              <Label>Start Time</Label>
              {isEditing ? (
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium">{appointment.startTime}</p>
              )}
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                />
              ) : (
                <p className="text-sm font-medium">{appointment.duration} min</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              {isEditing ? (
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium capitalize">{appointment.status}</p>
              )}
            </div>
            <div>
              <Label>Event Type</Label>
              {isEditing ? (
                <Select 
                  value={formData.appointmentType} 
                  onValueChange={(value) => setFormData({ ...formData, appointmentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes?.map((et) => (
                      <SelectItem key={et._id} value={et.name}>
                        {et.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium">{appointment.appointmentType}</p>
              )}
            </div>
          </div>

          <div>
            <Label>Location</Label>
            {isEditing ? (
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            ) : (
              <p className="text-sm font-medium">{appointment.location || "N/A"}</p>
            )}
          </div>

          <div>
            <Label>Notes</Label>
            {isEditing ? (
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            ) : (
              <p className="text-sm">{appointment.notes || "No notes"}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <div>
              {!isEditing && (
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete Appointment"}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdate}>
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                  <Button onClick={() => setIsEditing(true)}>
                    Edit Appointment
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
