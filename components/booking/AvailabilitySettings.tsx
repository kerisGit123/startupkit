"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Copy } from "lucide-react";

const DAYS = [
  { value: 0, label: "Sunday", short: "S" },
  { value: 1, label: "Monday", short: "M" },
  { value: 2, label: "Tuesday", short: "T" },
  { value: 3, label: "Wednesday", short: "W" },
  { value: 4, label: "Thursday", short: "T" },
  { value: 5, label: "Friday", short: "F" },
  { value: 6, label: "Saturday", short: "S" },
];

interface MaxMeetingLimit {
  id: string;
  count: number;
  period: "day" | "week" | "month";
}

export function AvailabilitySettings() {
  const availability = useQuery(api.bookingQueries.getAllAvailability);
  const createAvailability = useMutation(api.bookingMutations.createAvailability);
  const updateAvailability = useMutation(api.bookingMutations.updateAvailability);
  const bookingSettings = useQuery(api.platformConfig.getByCategory, { category: "booking" });
  const saveConfig = useMutation(api.platformConfig.batchSet);

  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    startTime: "09:00",
    endTime: "17:00",
  });

  // Global settings state
  const [bufferBefore, setBufferBefore] = useState(0);
  const [bufferAfter, setBufferAfter] = useState(0);
  const [minNoticeHours, setMinNoticeHours] = useState(24);
  const [maxDaysInFuture, setMaxDaysInFuture] = useState(60);
  const [weekViewStartTime, setWeekViewStartTime] = useState("06:00");
  const [weekViewEndTime, setWeekViewEndTime] = useState("21:00");
  const [globalTimezone, setGlobalTimezone] = useState("UTC");
  const [maxMeetingLimits, setMaxMeetingLimits] = useState<MaxMeetingLimit[]>([
    { id: "1", count: 2, period: "day" },
    { id: "2", count: 6, period: "week" },
  ]);

  // Lunch break state
  const [lunchBreakEnabled, setLunchBreakEnabled] = useState(false);
  const [lunchBreakStart, setLunchBreakStart] = useState("12:00");
  const [lunchBreakEnd, setLunchBreakEnd] = useState("13:00");

  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from platform_config on mount
  useEffect(() => {
    if (bookingSettings) {
      if (bookingSettings.bufferBefore !== undefined) setBufferBefore(bookingSettings.bufferBefore as number);
      if (bookingSettings.bufferAfter !== undefined) setBufferAfter(bookingSettings.bufferAfter as number);
      if (bookingSettings.minNoticeHours !== undefined) setMinNoticeHours(bookingSettings.minNoticeHours as number);
      if (bookingSettings.maxDaysInFuture !== undefined) setMaxDaysInFuture(bookingSettings.maxDaysInFuture as number);
      if (bookingSettings.weekViewStartTime !== undefined) setWeekViewStartTime(bookingSettings.weekViewStartTime as string);
      if (bookingSettings.weekViewEndTime !== undefined) setWeekViewEndTime(bookingSettings.weekViewEndTime as string);
      if (bookingSettings.globalTimezone !== undefined) setGlobalTimezone(bookingSettings.globalTimezone as string);
      if (bookingSettings.maxMeetingLimits !== undefined) setMaxMeetingLimits(bookingSettings.maxMeetingLimits as MaxMeetingLimit[]);
      if (bookingSettings.lunchBreakEnabled !== undefined) setLunchBreakEnabled(bookingSettings.lunchBreakEnabled as boolean);
      if (bookingSettings.lunchBreakStart !== undefined) setLunchBreakStart(bookingSettings.lunchBreakStart as string);
      if (bookingSettings.lunchBreakEnd !== undefined) setLunchBreakEnd(bookingSettings.lunchBreakEnd as string);
    }
  }, [bookingSettings]);

  const getDayAvailability = (dayOfWeek: number) => {
    return availability?.find((a) => a.dayOfWeek === dayOfWeek);
  };

  const handleToggleDay = async (dayOfWeek: number) => {
    const dayAvail = getDayAvailability(dayOfWeek);
    const now = Date.now();
    
    if (dayAvail) {
      await updateAvailability({
        availabilityId: dayAvail._id,
        isActive: !dayAvail.isActive,
        updatedAt: now,
      });
    } else {
      await createAvailability({
        dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
        slotDuration: 60,
        bufferBetweenSlots: 0,
        bufferBefore: bufferBefore,
        bufferAfter: bufferAfter,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  };

  const handleUpdateTimes = async (dayOfWeek: number) => {
    const dayAvail = getDayAvailability(dayOfWeek);
    if (!dayAvail) return;

    await updateAvailability({
      availabilityId: dayAvail._id,
      startTime: formData.startTime,
      endTime: formData.endTime,
      updatedAt: Date.now(),
    });
    
    setEditingDay(null);
  };

  const handleCopyToAll = async (dayOfWeek: number) => {
    const sourceDayAvail = getDayAvailability(dayOfWeek);
    if (!sourceDayAvail) return;

    const now = Date.now();
    for (const day of DAYS) {
      const targetDayAvail = getDayAvailability(day.value);
      
      if (targetDayAvail && targetDayAvail.isActive) {
        await updateAvailability({
          availabilityId: targetDayAvail._id,
          startTime: sourceDayAvail.startTime,
          endTime: sourceDayAvail.endTime,
          updatedAt: now,
        });
      }
    }
  };

  const handleSaveAllSettings = async () => {
    try {
      const now = Date.now();
      const maxPerDay = maxMeetingLimits.find(l => l.period === "day")?.count || 0;
      const maxPerWeek = maxMeetingLimits.find(l => l.period === "week")?.count || 0;

      // Save to platform_config
      await saveConfig({
        settings: [
          { key: "bufferBefore", value: bufferBefore, category: "booking", description: "Buffer time before appointments" },
          { key: "bufferAfter", value: bufferAfter, category: "booking", description: "Buffer time after appointments" },
          { key: "minNoticeHours", value: minNoticeHours, category: "booking", description: "Minimum notice hours" },
          { key: "maxDaysInFuture", value: maxDaysInFuture, category: "booking", description: "Maximum days in future" },
          { key: "weekViewStartTime", value: weekViewStartTime, category: "booking", description: "Week view start time" },
          { key: "weekViewEndTime", value: weekViewEndTime, category: "booking", description: "Week view end time" },
          { key: "globalTimezone", value: globalTimezone, category: "booking", description: "Global timezone for bookings" },
          { key: "maxMeetingLimits", value: maxMeetingLimits, category: "booking", description: "Maximum meeting limits" },
          { key: "lunchBreakEnabled", value: lunchBreakEnabled, category: "booking", description: "Enable lunch break blocking" },
          { key: "lunchBreakStart", value: lunchBreakStart, category: "booking", description: "Lunch break start time" },
          { key: "lunchBreakEnd", value: lunchBreakEnd, category: "booking", description: "Lunch break end time" },
        ],
      });

      // Update all active availability records with all settings
      for (const avail of availability || []) {
        if (avail.isActive) {
          await updateAvailability({
            availabilityId: avail._id,
            bufferBefore: bufferBefore,
            bufferAfter: bufferAfter,
            maxMeetingsPerDay: maxPerDay,
            maxMeetingsPerWeek: maxPerWeek,
            updatedAt: now,
          });
        }
      }

      setHasChanges(false);
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings. Please try again.");
    }
  };

  const addMaxMeetingLimit = () => {
    setMaxMeetingLimits([
      ...maxMeetingLimits,
      { id: Date.now().toString(), count: 1, period: "day" },
    ]);
    setHasChanges(true);
  };

  const removeMaxMeetingLimit = (id: string) => {
    setMaxMeetingLimits(maxMeetingLimits.filter(l => l.id !== id));
    setHasChanges(true);
  };

  const updateMaxMeetingLimit = (id: string, field: "count" | "period", value: number | string) => {
    setMaxMeetingLimits(maxMeetingLimits.map(l => 
      l.id === id ? { ...l, [field]: value } : l
    ));
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      {/* Weekly Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🔄</span>
            Weekly hours
          </CardTitle>
          <CardDescription>
            Set when you are typically available for meetings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((day) => {
            const dayAvail = getDayAvailability(day.value);
            const isEditing = editingDay === day.value;

            return (
              <div key={day.value} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50">
                {/* Day Circle */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                  dayAvail?.isActive ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {day.short}
                </div>

                {/* Day Name & Times */}
                <div className="flex-1">
                  {dayAvail?.isActive ? (
                    isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          className="w-32"
                        />
                        <span>-</span>
                        <Input
                          type="time"
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                          className="w-32"
                        />
                        <Button size="sm" onClick={() => handleUpdateTimes(day.value)}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingDay(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <span className="font-medium w-24">{day.label}</span>
                        <span className="text-gray-600">
                          {dayAvail.startTime} - {dayAvail.endTime}
                        </span>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-4">
                      <span className="font-medium w-24">{day.label}</span>
                      <span className="text-gray-400">Unavailable</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {dayAvail?.isActive && !isEditing && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setFormData({
                            startTime: dayAvail.startTime,
                            endTime: dayAvail.endTime,
                          });
                          setEditingDay(day.value);
                        }}
                        title="Edit times"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyToAll(day.value)}
                        title="Copy to all active days"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleDay(day.value)}
                    title={dayAvail?.isActive ? "Mark unavailable" : "Mark available"}
                  >
                    {dayAvail?.isActive ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Info Card - Settings Moved */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 text-2xl">ℹ️</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Booking Settings Moved</h3>
              <p className="text-sm text-blue-800">
                Buffer times, max meetings, lunch breaks, holidays, and other booking settings have been moved to the <strong>Settings</strong> tab for better organization.
              </p>
              <p className="text-sm text-blue-700 mt-2">
                Use this tab to configure your weekly availability schedule.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
