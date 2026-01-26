"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Copy, Trash2, Eye, ExternalLink } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { EventTypePreviewModal } from "./EventTypePreviewModal";

export function EventTypesManager() {
  const eventTypes = useQuery(api.bookingQueries.getAllEventTypes);
  const createEventType = useMutation(api.bookingMutations.createEventType);
  const updateEventType = useMutation(api.bookingMutations.updateEventType);
  const deleteEventType = useMutation(api.bookingMutations.deleteEventType);
  const bookingSettings = useQuery(api.platformConfig.getByCategory, { category: "booking" });
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewEventTypeId, setPreviewEventTypeId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    duration: 30,
    locationType: "google_meet" as const,
    locationDetails: "",
    color: "#4F46E5",
    bufferBefore: 0,
    bufferAfter: 0,
    maxBookingsPerDay: 0,
    maxBookingsPerWeek: 0,
    minNoticeHours: 24,
    maxDaysInFuture: 60,
    isActive: true,
    isPublic: true,
  });

  // Load platform_config defaults when opening create dialog
  useEffect(() => {
    if (isCreateOpen && bookingSettings) {
      setFormData(prev => ({
        ...prev,
        bufferBefore: (bookingSettings.bufferBefore as number) || 0,
        bufferAfter: (bookingSettings.bufferAfter as number) || 0,
        minNoticeHours: (bookingSettings.minNoticeHours as number) || 24,
        maxDaysInFuture: (bookingSettings.maxDaysInFuture as number) || 60,
        maxBookingsPerDay: (bookingSettings.maxMeetingLimits as any)?.find((l: any) => l.period === "day")?.count || 0,
        maxBookingsPerWeek: (bookingSettings.maxMeetingLimits as any)?.find((l: any) => l.period === "week")?.count || 0,
      }));
    }
  }, [isCreateOpen, bookingSettings]);

  const handleCreateEventType = async () => {
    await createEventType({
      ...formData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleEditEventType = async () => {
    if (!editingId) return;
    await updateEventType({
      eventTypeId: editingId,
      ...formData,
      updatedAt: Date.now(),
    });
    setIsEditOpen(false);
    setEditingId(null);
    resetForm();
  };

  const handleCopyEventType = async (eventType: any) => {
    // Exclude _id and _creationTime from the copied object
    const { _id, _creationTime, ...eventTypeData } = eventType;
    await createEventType({
      ...eventTypeData,
      name: `${eventType.name} (Copy)`,
      slug: `${eventType.slug}-copy-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  const handleDeleteEventType = async (id: string) => {
    await deleteEventType({ eventTypeId: id });
    setDeleteConfirmId(null);
  };

  const openEditModal = (eventType: any) => {
    setEditingId(eventType._id);
    setFormData({
      name: eventType.name,
      slug: eventType.slug,
      description: eventType.description || "",
      duration: eventType.duration,
      locationType: eventType.locationType,
      locationDetails: eventType.locationDetails || "",
      color: eventType.color,
      bufferBefore: eventType.bufferBefore || 0,
      bufferAfter: eventType.bufferAfter || 0,
      maxBookingsPerDay: eventType.maxBookingsPerDay || 0,
      maxBookingsPerWeek: eventType.maxBookingsPerWeek || 0,
      minNoticeHours: eventType.minNoticeHours,
      maxDaysInFuture: eventType.maxDaysInFuture,
      isActive: eventType.isActive,
      isPublic: eventType.isPublic,
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      duration: 30,
      locationType: "google_meet",
      locationDetails: "",
      color: "#4F46E5",
      bufferBefore: 0,
      bufferAfter: 0,
      maxBookingsPerDay: 0,
      maxBookingsPerWeek: 0,
      minNoticeHours: 24,
      maxDaysInFuture: 60,
      isActive: true,
      isPublic: true,
    });
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Event Types</h2>
          <p className="text-sm text-gray-600">Create events to share for people to book on your calendar</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Event Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Event Type</DialogTitle>
              <DialogDescription>
                Set up a new type of appointment that clients can book
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Basic Info */}
              <div>
                <Label>Event Name *</Label>
                <Input
                  placeholder="30 Minute Meeting"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      name: e.target.value,
                      slug: generateSlug(e.target.value)
                    });
                  }}
                />
              </div>

              <div>
                <Label>URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">yoursite.com/book/</span>
                  <Input
                    placeholder="30-min-meeting"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Brief description of this meeting type"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Duration */}
              <div>
                <Label>Duration *</Label>
                <Select 
                  value={String(formData.duration)} 
                  onValueChange={(v) => setFormData({ ...formData, duration: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div>
                <Label>Location Type *</Label>
                <Select 
                  value={formData.locationType} 
                  onValueChange={(v: any) => setFormData({ ...formData, locationType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google_meet">Google Meet</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="in_person">In Person</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Color */}
              <div>
                <Label>Calendar Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#4F46E5"
                  />
                </div>
              </div>

              {/* Buffer Times */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Buffer Before (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.bufferBefore}
                    onChange={(e) => setFormData({ ...formData, bufferBefore: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Buffer After (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.bufferAfter}
                    onChange={(e) => setFormData({ ...formData, bufferAfter: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Booking Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max per Day (0 = unlimited)</Label>
                  <Input
                    type="number"
                    value={formData.maxBookingsPerDay}
                    onChange={(e) => setFormData({ ...formData, maxBookingsPerDay: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Max per Week (0 = unlimited)</Label>
                  <Input
                    type="number"
                    value={formData.maxBookingsPerWeek}
                    onChange={(e) => setFormData({ ...formData, maxBookingsPerWeek: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Scheduling Window */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min Notice (hours)</Label>
                  <Input
                    type="number"
                    value={formData.minNoticeHours}
                    onChange={(e) => setFormData({ ...formData, minNoticeHours: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Max Days in Future</Label>
                  <Input
                    type="number"
                    value={formData.maxDaysInFuture}
                    onChange={(e) => setFormData({ ...formData, maxDaysInFuture: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateEventType}>
                  Create Event Type
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Event Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {eventTypes?.map((eventType) => (
          <Card key={eventType._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: eventType.color }}
                    />
                    {eventType.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {eventType.duration} min • {eventType.locationType.replace("_", " ")}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  {eventType.isPublic && (
                    <Badge variant="secondary" className="text-xs">Public</Badge>
                  )}
                  {!eventType.isActive && (
                    <Badge variant="outline" className="text-xs">Inactive</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {eventType.description || "No description"}
              </p>
              
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setPreviewEventTypeId(eventType._id)}
                  title="Preview event type"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View Page
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleCopyEventType(eventType)}
                  title="Duplicate this event type"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => openEditModal(eventType)}
                  title="Edit event type"
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => setDeleteConfirmId(eventType._id)}
                  title="Delete event type"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              <div className="mt-3 pt-3 border-t text-xs text-gray-500 space-y-1">
                <div>Min notice: {eventType.minNoticeHours}h</div>
                {eventType.maxBookingsPerDay && eventType.maxBookingsPerDay > 0 && (
                  <div>Max: {eventType.maxBookingsPerDay}/day</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {(!eventTypes || eventTypes.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No event types yet</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Event Type
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event Type</DialogTitle>
            <DialogDescription>
              Update your event type settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Same form fields as create modal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Event Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="30 Minute Meeting"
                />
              </div>
              <div>
                <Label>Duration (minutes) *</Label>
                <Select
                  value={String(formData.duration)}
                  onValueChange={(v) => setFormData({ ...formData, duration: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                    <SelectItem value="90">90 min</SelectItem>
                    <SelectItem value="120">120 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Location Type</Label>
              <Select 
                value={formData.locationType} 
                onValueChange={(v: any) => setFormData({ ...formData, locationType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google_meet">Google Meet</SelectItem>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="in_person">In Person</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Calendar Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#4F46E5"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setIsEditOpen(false);
                setEditingId(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleEditEventType}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event Type?</DialogTitle>
            <DialogDescription>
              This will permanently delete this event type. Any existing bookings will remain but new bookings won't be possible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirmId && handleDeleteEventType(deleteConfirmId)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Type Preview Modal */}
      <EventTypePreviewModal
        isOpen={!!previewEventTypeId}
        onClose={() => setPreviewEventTypeId(null)}
        eventTypeId={previewEventTypeId}
      />
    </div>
  );
}
