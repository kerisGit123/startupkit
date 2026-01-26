"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface MaxMeetingLimit {
  id: string;
  count: number;
  period: "day" | "week" | "month";
}

export function BookingSettingsTab() {
  const bookingSettings = useQuery(api.platformConfig.getByCategory, { category: "booking" });
  const saveConfig = useMutation(api.platformConfig.batchSet);

  // Lunch break state
  const [lunchBreakEnabled, setLunchBreakEnabled] = useState(false);
  const [lunchBreakStart, setLunchBreakStart] = useState("12:00");
  const [lunchBreakEnd, setLunchBreakEnd] = useState("13:00");

  // Holiday state
  const [holidays, setHolidays] = useState<Array<{date: string; name: string; reason?: string}>>([]);
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayName, setNewHolidayName] = useState("");
  const [newHolidayReason, setNewHolidayReason] = useState("");
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Preset Malaysia holidays for 2026 (since API doesn't support it)
  const malaysiaHolidays2026 = [
    { date: "2026-01-01", name: "New Year's Day", reason: "Public Holiday" },
    { date: "2026-01-25", name: "Thaipusam", reason: "Public Holiday" },
    { date: "2026-02-01", name: "Federal Territory Day", reason: "Public Holiday (KL, Labuan, Putrajaya)" },
    { date: "2026-03-23", name: "Hari Raya Aidilfitri", reason: "Public Holiday" },
    { date: "2026-03-24", name: "Hari Raya Aidilfitri (2nd day)", reason: "Public Holiday" },
    { date: "2026-05-01", name: "Labour Day", reason: "Public Holiday" },
    { date: "2026-05-26", name: "Wesak Day", reason: "Public Holiday" },
    { date: "2026-06-01", name: "Agong's Birthday", reason: "Public Holiday" },
    { date: "2026-06-29", name: "Hari Raya Aidiladha", reason: "Public Holiday" },
    { date: "2026-07-20", name: "Awal Muharram", reason: "Islamic New Year" },
    { date: "2026-08-31", name: "Merdeka Day", reason: "National Day" },
    { date: "2026-09-16", name: "Malaysia Day", reason: "Public Holiday" },
    { date: "2026-09-28", name: "Prophet Muhammad's Birthday", reason: "Public Holiday" },
    { date: "2026-10-24", name: "Deepavali", reason: "Public Holiday" },
    { date: "2026-12-25", name: "Christmas Day", reason: "Public Holiday" },
  ];

  const handleLoadMalaysiaHolidays = () => {
    const existingDates = new Set(holidays.map(h => h.date));
    const newHolidays = malaysiaHolidays2026.filter(h => !existingDates.has(h.date));
    
    if (newHolidays.length === 0) {
      toast.info("All Malaysia holidays are already added");
      return;
    }
    
    setHolidays([...holidays, ...newHolidays]);
    setHasChanges(true);
    toast.success(`Loaded ${newHolidays.length} Malaysia holidays for 2026!`);
  };

  // Global settings state
  const [bufferBefore, setBufferBefore] = useState(0);
  const [bufferAfter, setBufferAfter] = useState(0);
  const [minNoticeHours, setMinNoticeHours] = useState(24);
  const [maxDaysInFuture, setMaxDaysInFuture] = useState(60);
  const [weekViewStartTime, setWeekViewStartTime] = useState("06:00");
  const [weekViewEndTime, setWeekViewEndTime] = useState("21:00");
  const [maxMeetingLimits, setMaxMeetingLimits] = useState<MaxMeetingLimit[]>([
    { id: "1", count: 2, period: "day" },
    { id: "2", count: 6, period: "week" },
  ]);

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
      if (bookingSettings.maxMeetingLimits !== undefined) setMaxMeetingLimits(bookingSettings.maxMeetingLimits as MaxMeetingLimit[]);
      if (bookingSettings.lunchBreakEnabled !== undefined) setLunchBreakEnabled(bookingSettings.lunchBreakEnabled as boolean);
      if (bookingSettings.lunchBreakStart !== undefined) setLunchBreakStart(bookingSettings.lunchBreakStart as string);
      if (bookingSettings.lunchBreakEnd !== undefined) setLunchBreakEnd(bookingSettings.lunchBreakEnd as string);
      if (bookingSettings.holidays !== undefined) setHolidays(bookingSettings.holidays as Array<{date: string; name: string; reason?: string}>);
    }
  }, [bookingSettings]);

  const handleSaveSettings = async () => {
    try {
      await saveConfig({
        settings: [
          { key: "bufferBefore", value: bufferBefore, category: "booking", description: "Buffer time before appointments" },
          { key: "bufferAfter", value: bufferAfter, category: "booking", description: "Buffer time after appointments" },
          { key: "minNoticeHours", value: minNoticeHours, category: "booking", description: "Minimum notice hours" },
          { key: "maxDaysInFuture", value: maxDaysInFuture, category: "booking", description: "Maximum days in future" },
          { key: "weekViewStartTime", value: weekViewStartTime, category: "booking", description: "Week view start time" },
          { key: "weekViewEndTime", value: weekViewEndTime, category: "booking", description: "Week view end time" },
          { key: "maxMeetingLimits", value: maxMeetingLimits, category: "booking", description: "Maximum meeting limits" },
          { key: "lunchBreakEnabled", value: lunchBreakEnabled, category: "booking", description: "Enable lunch break blocking" },
          { key: "lunchBreakStart", value: lunchBreakStart, category: "booking", description: "Lunch break start time" },
          { key: "lunchBreakEnd", value: lunchBreakEnd, category: "booking", description: "Lunch break end time" },
          { key: "holidays", value: holidays, category: "booking", description: "Configured holidays" },
        ],
      });

      setHasChanges(false);
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings. Please try again.");
    }
  };

  const handleAddHoliday = () => {
    if (!newHolidayDate || !newHolidayName) {
      toast.error("Please enter both date and holiday name");
      return;
    }

    const newHoliday = {
      date: newHolidayDate,
      name: newHolidayName,
      reason: newHolidayReason || undefined,
    };

    setHolidays([...holidays, newHoliday]);
    setNewHolidayDate("");
    setNewHolidayName("");
    setNewHolidayReason("");
    setHasChanges(true);
    toast.success("Holiday added! Remember to save settings.");
  };

  const handleDeleteHoliday = (holidayDate: string) => {
    if (!confirm("Are you sure you want to delete this holiday?")) return;
    setHolidays(holidays.filter(h => h.date !== holidayDate));
    setHasChanges(true);
    toast.success("Holiday removed! Remember to save settings.");
  };

  const handleClearAllHolidays = () => {
    if (!confirm("Are you sure you want to clear all holidays? This cannot be undone.")) return;
    setHolidays([]);
    setHasChanges(true);
    toast.success("All holidays cleared! Remember to save settings.");
  };

  const handleLoadHolidaysFromAPI = async () => {
    setIsLoadingHolidays(true);
    try {
      // Using free Nager.Date API
      const response = await fetch(
        `https://date.nager.at/api/v3/PublicHolidays/${selectedYear}/${selectedCountry}`
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error(`Country "${selectedCountry}" is not supported by the holiday API. Please add holidays manually or try another country.`);
        } else {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        return;
      }
      
      const text = await response.text();
      if (!text) {
        throw new Error("Empty response from API");
      }
      
      const data = JSON.parse(text);
      
      if (!Array.isArray(data) || data.length === 0) {
        toast.error(`No holidays found for ${selectedCountry} in ${selectedYear}`);
        return;
      }
      
      const loadedHolidays = data.map((holiday: any) => ({
        date: holiday.date,
        name: holiday.localName || holiday.name,
        reason: holiday.name !== holiday.localName ? holiday.name : undefined,
      }));
      
      // Filter out duplicates
      const existingDates = new Set(holidays.map(h => h.date));
      const newHolidays = loadedHolidays.filter((h: any) => !existingDates.has(h.date));
      
      if (newHolidays.length === 0) {
        toast.info("All holidays from this country/year are already added");
        return;
      }
      
      setHolidays([...holidays, ...newHolidays]);
      setHasChanges(true);
      toast.success(`Loaded ${newHolidays.length} holidays from ${selectedCountry}!`);
    } catch (error) {
      console.error("Failed to load holidays:", error);
      toast.error(`Failed to load holidays: ${error instanceof Error ? error.message : "Unknown error"}. Please add them manually.`);
    } finally {
      setIsLoadingHolidays(false);
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
      {/* Lunch Break Card */}
      <Card>
        <CardHeader>
          <CardTitle>Lunch Break</CardTitle>
          <CardDescription>
            Block appointments during lunch hours across all days
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="lunchBreakEnabled"
              checked={lunchBreakEnabled}
              onChange={(e) => { setLunchBreakEnabled(e.target.checked); setHasChanges(true); }}
              className="w-4 h-4 rounded border-gray-300"
            />
            <Label htmlFor="lunchBreakEnabled" className="cursor-pointer">
              Enable lunch break blocking
            </Label>
          </div>

          {lunchBreakEnabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input 
                    type="time" 
                    value={lunchBreakStart}
                    onChange={(e) => { setLunchBreakStart(e.target.value); setHasChanges(true); }}
                    className="w-full" 
                  />
                </div>

                <div>
                  <Label>End Time</Label>
                  <Input 
                    type="time" 
                    value={lunchBreakEnd}
                    onChange={(e) => { setLunchBreakEnd(e.target.value); setHasChanges(true); }}
                    className="w-full" 
                  />
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800">
                  🍽️ Lunch break from {lunchBreakStart} to {lunchBreakEnd} will be blocked in calendar views
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Holidays Card */}
      <Card>
        <CardHeader>
          <CardTitle>Holidays</CardTitle>
          <CardDescription>
            Block specific dates for holidays - no appointments can be booked on these days
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Load from API */}
          <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-sm mb-3">🌍 Load Holidays from Internet API</h3>
            <p className="text-xs text-gray-600 mb-3">Automatically load public holidays (API-supported countries only)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Country</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">🇺🇸 United States</SelectItem>
                    <SelectItem value="GB">🇬🇧 United Kingdom</SelectItem>
                    <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                    <SelectItem value="AU">🇦🇺 Australia</SelectItem>
                    <SelectItem value="DE">🇩🇪 Germany</SelectItem>
                    <SelectItem value="FR">🇫🇷 France</SelectItem>
                    <SelectItem value="SG">🇸🇬 Singapore</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Year</Label>
                <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={String(new Date().getFullYear())}>{new Date().getFullYear()}</SelectItem>
                    <SelectItem value={String(new Date().getFullYear() + 1)}>{new Date().getFullYear() + 1}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleLoadHolidaysFromAPI}
                  disabled={isLoadingHolidays}
                  className="w-full"
                  size="sm"
                >
                  {isLoadingHolidays ? "Loading..." : "Load Holidays"}
                </Button>
              </div>
            </div>
          </div>

          {/* Malaysia Preset */}
          <div className="border rounded-lg p-4 bg-green-50 border-green-200">
            <h3 className="font-semibold text-sm mb-2">🇲🇾 Malaysia Holidays 2026</h3>
            <p className="text-xs text-gray-600 mb-3">Pre-configured Malaysia public holidays (API not available)</p>
            <Button 
              onClick={handleLoadMalaysiaHolidays}
              variant="outline"
              size="sm"
              className="w-full md:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Load Malaysia Holidays 2026
            </Button>
          </div>

          {/* Add Holiday Form */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-sm mb-3">➕ Add Custom Holiday</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Date</Label>
                <Input 
                  type="date" 
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  className="w-full" 
                />
              </div>

              <div>
                <Label>Holiday Name</Label>
                <Input 
                  type="text" 
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  placeholder="e.g., Christmas Day"
                  className="w-full" 
                />
              </div>

              <div>
                <Label>Reason (Optional)</Label>
                <Input 
                  type="text" 
                  value={newHolidayReason}
                  onChange={(e) => setNewHolidayReason(e.target.value)}
                  placeholder="e.g., Office closed"
                  className="w-full" 
                />
              </div>
            </div>

            <Button 
              onClick={handleAddHoliday}
              className="mt-3"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Holiday
            </Button>
          </div>

          {/* Holidays List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Configured Holidays ({holidays.length})</h3>
              {holidays.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllHolidays}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
            {holidays && holidays.length > 0 ? (
              <div className="space-y-2">
                {holidays.map((holiday, index) => (
                  <div 
                    key={`${holiday.date}-${index}`}
                    className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-4 h-4 text-red-600" />
                      <div>
                        <div className="font-medium">{holiday.name}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(holiday.date).toLocaleDateString("en-US", { 
                            weekday: "long", 
                            year: "numeric", 
                            month: "long", 
                            day: "numeric" 
                          })}
                        </div>
                        {holiday.reason && (
                          <div className="text-xs text-gray-500 mt-1">{holiday.reason}</div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteHoliday(holiday.date)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No holidays configured yet</p>
                <p className="text-xs mt-1">Load from internet or add manually above</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Buffer Times Card */}
      <Card>
        <CardHeader>
          <CardTitle>Buffer Times</CardTitle>
          <CardDescription>
            Add buffer time before or after booked events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Before event:</Label>
              <Select value={String(bufferBefore)} onValueChange={(v) => { setBufferBefore(Number(v)); setHasChanges(true); }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No buffer</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>After event:</Label>
              <Select value={String(bufferAfter)} onValueChange={(v) => { setBufferAfter(Number(v)); setHasChanges(true); }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No buffer</SelectItem>
                  <SelectItem value="10">10 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Max Meetings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Max Meetings</CardTitle>
          <CardDescription>
            Set the maximum events allowed per day, week or month
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {maxMeetingLimits.map((limit) => (
            <div key={limit.id} className="flex items-center gap-4">
              <Input 
                type="number" 
                value={limit.count}
                onChange={(e) => updateMaxMeetingLimit(limit.id, "count", Number(e.target.value))}
                className="w-24" 
                min="1"
              />
              <span>meetings per</span>
              <Select 
                value={limit.period}
                onValueChange={(v) => updateMaxMeetingLimit(limit.id, "period", v)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">day</SelectItem>
                  <SelectItem value="week">week</SelectItem>
                  <SelectItem value="month">month</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => removeMaxMeetingLimit(limit.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addMaxMeetingLimit}>
            <Plus className="w-4 h-4 mr-2" />
            Add another limit
          </Button>
        </CardContent>
      </Card>

      {/* Week View Time Range Card */}
      <Card>
        <CardHeader>
          <CardTitle>Week View Time Range</CardTitle>
          <CardDescription>
            Set the time range displayed in the week view calendar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Time</Label>
              <Input 
                type="time" 
                value={weekViewStartTime}
                onChange={(e) => { setWeekViewStartTime(e.target.value); setHasChanges(true); }}
                className="w-full" 
              />
            </div>

            <div>
              <Label>End Time</Label>
              <Input 
                type="time" 
                value={weekViewEndTime}
                onChange={(e) => { setWeekViewEndTime(e.target.value); setHasChanges(true); }}
                className="w-full" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduling Window Card */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduling Window</CardTitle>
          <CardDescription>
            Set how far in advance people can book and minimum notice time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Minimum notice time</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  value={minNoticeHours}
                  onChange={(e) => { setMinNoticeHours(Number(e.target.value)); setHasChanges(true); }}
                  className="w-24" 
                  min="0"
                />
                <span className="text-sm">hours before event</span>
              </div>
            </div>

            <div>
              <Label>Maximum booking window</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  value={maxDaysInFuture}
                  onChange={(e) => { setMaxDaysInFuture(Number(e.target.value)); setHasChanges(true); }}
                  className="w-24" 
                  min="1"
                />
                <span className="text-sm">days into the future</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button - Sticky */}
      <div className="sticky bottom-4 bg-white border rounded-lg shadow-lg p-4 flex items-center justify-between">
        {hasChanges ? (
          <>
            <p className="text-sm text-gray-600">You have unsaved changes</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setHasChanges(false)}>
                Discard
              </Button>
              <Button onClick={handleSaveSettings}>
                Save Settings
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500">All settings saved</p>
            <Button onClick={handleSaveSettings} variant="outline">
              Save Settings
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
