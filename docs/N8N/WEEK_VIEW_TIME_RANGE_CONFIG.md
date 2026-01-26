# Week View Time Range Configuration - Jan 26, 2026 (8:15 PM)

## ✅ Configurable Week View Time Range Implemented!

### Problem
Week view showed hardcoded time range (6:00 AM - 9:00 PM) regardless of actual business hours or availability settings.

### Solution
Added configurable time range settings stored in `platform_config` table with category `booking`, allowing admins to customize the time range displayed in week view.

---

## 🔧 Implementation Details

### 1. Platform Config Storage

**Category:** `booking`

**New Keys:**
- `weekViewStartTime` - Start time for week view (e.g., "06:00")
- `weekViewEndTime` - End time for week view (e.g., "21:00")

**Default Values:**
- Start: "06:00" (6:00 AM)
- End: "21:00" (9:00 PM)

---

### 2. AvailabilitySettings Component

**File:** `components/booking/AvailabilitySettings.tsx`

**Changes:**

1. **Added State Variables:**
```typescript
const [weekViewStartTime, setWeekViewStartTime] = useState("06:00");
const [weekViewEndTime, setWeekViewEndTime] = useState("21:00");
```

2. **Load from Config:**
```typescript
useEffect(() => {
  if (bookingSettings) {
    if (bookingSettings.weekViewStartTime !== undefined) 
      setWeekViewStartTime(bookingSettings.weekViewStartTime as string);
    if (bookingSettings.weekViewEndTime !== undefined) 
      setWeekViewEndTime(bookingSettings.weekViewEndTime as string);
  }
}, [bookingSettings]);
```

3. **Save to Config:**
```typescript
await saveConfig({
  settings: [
    // ... other settings
    { key: "weekViewStartTime", value: weekViewStartTime, category: "booking", description: "Week view start time" },
    { key: "weekViewEndTime", value: weekViewEndTime, category: "booking", description: "Week view end time" },
  ],
});
```

4. **UI Controls:**
```typescript
{/* Week View Time Range */}
<div className="space-y-4">
  <h3 className="font-semibold text-sm">Week View Time Range</h3>
  <p className="text-sm text-gray-600">Set the time range displayed in the week view calendar</p>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <Label>Start Time</Label>
      <Input 
        type="time" 
        value={weekViewStartTime}
        onChange={(e) => { setWeekViewStartTime(e.target.value); setHasChanges(true); }}
      />
    </div>
    <div>
      <Label>End Time</Label>
      <Input 
        type="time" 
        value={weekViewEndTime}
        onChange={(e) => { setWeekViewEndTime(e.target.value); setHasChanges(true); }}
      />
    </div>
  </div>
</div>
```

---

### 3. WeekView Component

**File:** `components/booking/WeekView.tsx`

**Changes:**

1. **Query Booking Settings:**
```typescript
const bookingSettings = useQuery(api.platformConfig.getByCategory, { category: "booking" });
```

2. **Dynamic Time Slot Generation:**
```typescript
// Generate time slots based on settings (default 6 AM to 9 PM)
const weekViewStartTime = (bookingSettings?.weekViewStartTime as string) || "06:00";
const weekViewEndTime = (bookingSettings?.weekViewEndTime as string) || "21:00";

const startHour = parseInt(weekViewStartTime.split(":")[0]);
const endHour = parseInt(weekViewEndTime.split(":")[0]);

const timeSlots = [];
for (let hour = startHour; hour <= endHour; hour++) {
  timeSlots.push(`${String(hour).padStart(2, '0')}:00`);
}
```

**Before:**
```typescript
// Hardcoded
const timeSlots = [];
for (let hour = 6; hour <= 21; hour++) {
  timeSlots.push(`${String(hour).padStart(2, '0')}:00`);
}
```

**After:**
```typescript
// Dynamic from config
const weekViewStartTime = (bookingSettings?.weekViewStartTime as string) || "06:00";
const weekViewEndTime = (bookingSettings?.weekViewEndTime as string) || "21:00";
const startHour = parseInt(weekViewStartTime.split(":")[0]);
const endHour = parseInt(weekViewEndTime.split(":")[0]);

const timeSlots = [];
for (let hour = startHour; hour <= endHour; hour++) {
  timeSlots.push(`${String(hour).padStart(2, '0')}:00`);
}
```

---

## 🎯 How to Use

### Setting Week View Time Range:

1. **Navigate to Booking Management**
   - Click "Booking Management" in sidebar
   - Go to "Availability" tab

2. **Scroll to "Week View Time Range" Section**
   - Located in "Booking Settings" card
   - Below "Max meetings" section
   - Above "Scheduling window" section

3. **Set Time Range**
   - **Start Time:** Select earliest hour to display (e.g., 08:00)
   - **End Time:** Select latest hour to display (e.g., 18:00)

4. **Save Settings**
   - Click "Save All Settings" button at bottom
   - Settings are saved to `platform_config` table
   - Week view updates immediately

### Example Configurations:

**Standard Business Hours:**
- Start: 09:00
- End: 17:00
- Result: Week view shows 9 AM - 5 PM

**Extended Hours:**
- Start: 07:00
- End: 20:00
- Result: Week view shows 7 AM - 8 PM

**Minimal Range:**
- Start: 10:00
- End: 16:00
- Result: Week view shows 10 AM - 4 PM

---

## 📋 Features

### Week View Now:

1. ✅ **Dynamically loads time range** from platform_config
2. ✅ **Falls back to defaults** (06:00 - 21:00) if not configured
3. ✅ **Updates immediately** when settings change
4. ✅ **Respects availability settings** (blocked days/times still work)
5. ✅ **Admin configurable** via Availability Settings UI

### Benefits:

- **Cleaner UI:** Only show relevant business hours
- **Better UX:** No scrolling through irrelevant time slots
- **Flexible:** Each business can set their own hours
- **Consistent:** Same time range across all week views
- **Centralized:** Single source of truth in platform_config

---

## 🔗 Integration with Availability

### How It Works Together:

**Week View Time Range (Global):**
- Controls which hours are **displayed** in week view
- Stored in `platform_config` (category: booking)
- Applies to **all days**

**Day Availability (Per Day):**
- Controls which hours are **bookable** per day
- Stored in `availability` table
- Can be different for each day

**Example:**
- Week View Range: 06:00 - 21:00 (shows 6 AM - 9 PM)
- Monday Availability: 09:00 - 17:00 (bookable 9 AM - 5 PM)
- Result: Week view shows 6 AM - 9 PM, but only 9 AM - 5 PM slots are clickable on Monday

---

## 📁 Files Modified

1. **`components/booking/AvailabilitySettings.tsx`**
   - Added weekViewStartTime and weekViewEndTime state
   - Added UI controls for time range
   - Added save logic to platform_config

2. **`components/booking/WeekView.tsx`**
   - Added bookingSettings query
   - Changed time slot generation to use dynamic range
   - Falls back to defaults if not configured

---

## 🧪 Testing Guide

### Test 1: Default Behavior
1. Fresh install (no config set)
2. Open Week View
3. ✅ Should show 6:00 AM - 9:00 PM (default)

### Test 2: Set Custom Range
1. Go to Availability Settings
2. Set Start: 08:00, End: 18:00
3. Click "Save All Settings"
4. Go to Week View
5. ✅ Should show 8:00 AM - 6:00 PM

### Test 3: Narrow Range
1. Set Start: 10:00, End: 14:00
2. Save settings
3. Go to Week View
4. ✅ Should show 10:00 AM - 2:00 PM (5 time slots)

### Test 4: Wide Range
1. Set Start: 06:00, End: 23:00
2. Save settings
3. Go to Week View
4. ✅ Should show 6:00 AM - 11:00 PM (18 time slots)

### Test 5: Availability Still Works
1. Set Week View Range: 08:00 - 18:00
2. Set Monday Availability: 10:00 - 16:00
3. Go to Week View
4. ✅ Shows 8 AM - 6 PM
5. ✅ Only 10 AM - 4 PM slots are clickable on Monday
6. ✅ Other hours are grayed out

---

## 📊 Summary

### Before:
- ❌ Hardcoded 6:00 AM - 9:00 PM
- ❌ Not configurable
- ❌ Same for all businesses
- ❌ Showed irrelevant hours

### After:
- ✅ Configurable via Availability Settings
- ✅ Stored in platform_config
- ✅ Dynamic time slot generation
- ✅ Falls back to sensible defaults
- ✅ Works with availability blocking
- ✅ Clean, focused UI

---

## 💡 Next Steps

### For N8N Integration:

The same availability logic should be used in N8N booking endpoints:

1. **Query platform_config** for `weekViewStartTime` and `weekViewEndTime`
2. **Query availability** table for day-specific hours
3. **Validate bookings** against both:
   - Global time range (week view range)
   - Day-specific availability
   - Existing appointments (conflict detection)

**Endpoint Updates Needed:**
- `POST /api/booking/check-availability`
- `POST /api/booking/create-appointment`
- `GET /api/booking/available-slots`

**Validation Algorithm:**
```
1. Check if date is within maxDaysInFuture
2. Check if time >= minNoticeHours from now
3. Check if day is active (availability.isActive)
4. Check if time is within day hours (availability.startTime - endTime)
5. Check if time is within global range (weekViewStartTime - weekViewEndTime)
6. Check for conflicts with existing appointments
7. If all pass → Allow booking
8. If any fail → Return specific error message
```

---

**Status:** Week view time range configuration fully implemented! ✅

**Refresh your browser and configure your business hours in Availability Settings!** 🎉
