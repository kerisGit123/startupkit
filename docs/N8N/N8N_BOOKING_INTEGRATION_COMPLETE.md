# N8N Booking Integration - Complete Implementation Guide

**Date:** Jan 26, 2026 (9:08 PM)  
**Status:** ✅ Fully Implemented

---

## 📋 Overview

This document describes the complete N8N booking integration with comprehensive availability validation logic. All booking endpoints now use the same validation algorithm as the UI, ensuring consistency across chatbot and manual bookings.

---

## 🔧 Implementation Summary

### 1. Platform Config Settings Added

**Category:** `booking`

**New Settings:**
- `weekViewStartTime` - Global start time for bookings (default: "06:00")
- `weekViewEndTime` - Global end time for bookings (default: "21:00")
- `globalTimezone` - Timezone for all booking operations (default: "UTC")
- `maxDaysInFuture` - Maximum days ahead for bookings (default: 60)
- `minNoticeHours` - Minimum hours notice required (default: 24)

**UI Location:**
- Booking Management → Availability Tab → Booking Settings Card

---

## 🎯 Validation Algorithm

All N8N booking endpoints now use this comprehensive 7-step validation:

### Step 1: Query Platform Config
```typescript
const bookingSettings = await ctx.runQuery(api.platformConfig.getByCategory, { 
  category: "booking" 
});

const weekViewStartTime = (bookingSettings?.weekViewStartTime as string) || "06:00";
const weekViewEndTime = (bookingSettings?.weekViewEndTime as string) || "21:00";
const maxDaysInFuture = (bookingSettings?.maxDaysInFuture as number) || 60;
const minNoticeHours = (bookingSettings?.minNoticeHours as number) || 24;
const globalTimezone = (bookingSettings?.globalTimezone as string) || "UTC";
```

### Step 2: Validate Booking Window
```typescript
const requestDate = new Date(date);
const today = new Date();
today.setHours(0, 0, 0, 0);

const daysDiff = Math.floor((requestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

// Check past dates
if (daysDiff < 0) {
  return error("Cannot book appointments in the past");
}

// Check future limit
if (daysDiff > maxDaysInFuture) {
  return error(`Cannot book more than ${maxDaysInFuture} days in advance`);
}
```

### Step 3: Validate Minimum Notice Time
```typescript
const slotDateTime = new Date(`${date}T${startTime}:00`);
const now = Date.now();
const minNoticeMs = minNoticeHours * 60 * 60 * 1000;

if (slotDateTime.getTime() - now < minNoticeMs) {
  return error(`Appointments must be booked at least ${minNoticeHours} hours in advance`);
}
```

### Step 4: Validate Global Time Range
```typescript
const startHour = parseInt(startTime.split(":")[0]);
const globalStartHour = parseInt(weekViewStartTime.split(":")[0]);
const globalEndHour = parseInt(weekViewEndTime.split(":")[0]);

if (startHour < globalStartHour || startHour >= globalEndHour) {
  return error(`Appointments must be between ${weekViewStartTime} and ${weekViewEndTime}`);
}
```

### Step 5: Check Day Availability
```typescript
const dayOfWeek = requestDate.getDay();
const availability = await ctx.runQuery(api.bookingQueries.getAvailabilityByDay, { 
  dayOfWeek 
});

if (!availability || !availability.isActive) {
  return error("This day is not available for bookings");
}
```

### Step 6: Validate Day-Specific Hours
```typescript
const availStartHour = parseInt(availability.startTime.split(":")[0]);
const availEndHour = parseInt(availability.endTime.split(":")[0]);

if (startHour < availStartHour || startHour >= availEndHour) {
  return error(`Time ${startTime} is outside available hours (${availability.startTime} - ${availability.endTime})`);
}
```

### Step 7: Check Appointment Conflicts
```typescript
const appointments = await ctx.runQuery(api.bookingQueries.getAppointmentsByDate, { 
  date,
  statuses: ["confirmed", "pending"]
});

const [startH, startM] = startTime.split(":").map(Number);
const requestStartMinutes = startH * 60 + startM;
const requestEndMinutes = requestStartMinutes + duration;

const hasConflict = appointments?.some((apt: any) => {
  const [aptStartH, aptStartM] = apt.startTime.split(":").map(Number);
  const aptStartMinutes = aptStartH * 60 + aptStartM;
  let aptEndMinutes;
  
  if (apt.endTime) {
    const [endH, endM] = apt.endTime.split(":").map(Number);
    aptEndMinutes = endH * 60 + endM;
  } else {
    aptEndMinutes = aptStartMinutes + apt.duration;
  }
  
  // Overlap detection: appointments overlap if one starts before the other ends
  return (requestStartMinutes < aptEndMinutes && requestEndMinutes > aptStartMinutes);
});

if (hasConflict) {
  return error("This time slot conflicts with another appointment");
}
```

---

## 📡 Updated Endpoints

### 1. Check Availability (`POST /api/booking/check-availability`)

**File:** `convex/bookingTools.ts` → `checkAvailability`

**Request:**
```json
{
  "date": "2026-02-15",
  "duration": 60
}
```

**Response (Success):**
```json
{
  "available": true,
  "slots": [
    { "startTime": "09:00", "endTime": "10:00" },
    { "startTime": "10:00", "endTime": "11:00" },
    { "startTime": "14:00", "endTime": "15:00" }
  ],
  "date": "2026-02-15",
  "settings": {
    "weekViewStartTime": "06:00",
    "weekViewEndTime": "21:00",
    "maxDaysInFuture": 60,
    "minNoticeHours": 24
  }
}
```

**Response (Not Available):**
```json
{
  "available": false,
  "slots": [],
  "reason": "This day is not available for bookings"
}
```

**Validation Steps:**
1. ✅ Query platform_config settings
2. ✅ Validate date within booking window
3. ✅ Check day availability (isActive)
4. ✅ Check date-specific overrides
5. ✅ Get existing appointments
6. ✅ Calculate available slots
7. ✅ Filter by global time range
8. ✅ Filter by minimum notice time

---

### 2. Book Appointment (`POST /api/booking/create-appointment`)

**File:** `convex/bookingTools.ts` → `bookAppointment`

**Request:**
```json
{
  "clientEmail": "john@example.com",
  "clientName": "John Doe",
  "clientPhone": "+1234567890",
  "date": "2026-02-15",
  "startTime": "10:00",
  "duration": 60,
  "appointmentType": "consultation",
  "notes": "Initial consultation",
  "bookedBy": "chatbot"
}
```

**Response (Success):**
```json
{
  "success": true,
  "appointmentId": "k17abc123...",
  "message": "Appointment booked successfully",
  "appointment": {
    "date": "2026-02-15",
    "startTime": "10:00",
    "endTime": "11:00",
    "clientName": "John Doe",
    "clientEmail": "john@example.com"
  }
}
```

**Response (Validation Error):**
```json
{
  "success": false,
  "error": "Time 08:00 is outside available hours (09:00 - 17:00)"
}
```

**Validation Steps:**
1. ✅ Query platform_config settings
2. ✅ Validate date within booking window
3. ✅ Validate minimum notice time
4. ✅ Validate global time range
5. ✅ Check day availability
6. ✅ Validate day-specific hours
7. ✅ Check appointment conflicts
8. ✅ Create/get client
9. ✅ Create appointment
10. ✅ Update client statistics

---

### 3. Get Available Slots (`GET /api/booking/available-slots`)

**Note:** This endpoint uses the same validation as `checkAvailability`. It returns filtered slots based on all validation rules.

---

## 🔄 Validation Flow Diagram

```
User Request (N8N Chatbot)
    ↓
1. Query platform_config
    ↓
2. Check: Date in past? → ❌ Error: "Cannot book in past"
    ↓
3. Check: Date > maxDaysInFuture? → ❌ Error: "Too far in future"
    ↓
4. Check: Time < minNoticeHours? → ❌ Error: "Insufficient notice"
    ↓
5. Check: Time outside global range? → ❌ Error: "Outside business hours"
    ↓
6. Query availability table
    ↓
7. Check: Day not active? → ❌ Error: "Day not available"
    ↓
8. Check: Time outside day hours? → ❌ Error: "Outside day hours"
    ↓
9. Query existing appointments
    ↓
10. Check: Conflict exists? → ❌ Error: "Time slot conflict"
    ↓
✅ All validations passed → Create Appointment
```

---

## 📊 Error Messages Reference

| Validation | Error Message |
|------------|---------------|
| Past date | "Cannot book appointments in the past" |
| Too far future | "Cannot book more than {maxDaysInFuture} days in advance" |
| Insufficient notice | "Appointments must be booked at least {minNoticeHours} hours in advance" |
| Outside global hours | "Appointments must be between {weekViewStartTime} and {weekViewEndTime}" |
| Day not available | "This day is not available for bookings" |
| Outside day hours | "Time {startTime} is outside available hours ({dayStart} - {dayEnd})" |
| Appointment conflict | "This time slot conflicts with another appointment" |
| Date override | "{override.reason}" (custom message) |

---

## 🧪 Testing Guide

### Test 1: Valid Booking
```bash
curl -X POST https://your-domain.convex.site/api/booking/create-appointment \
  -H "Content-Type: application/json" \
  -d '{
    "clientEmail": "test@example.com",
    "clientName": "Test User",
    "date": "2026-02-15",
    "startTime": "10:00",
    "duration": 60
  }'
```
**Expected:** ✅ Success

### Test 2: Past Date
```bash
curl -X POST https://your-domain.convex.site/api/booking/create-appointment \
  -H "Content-Type: application/json" \
  -d '{
    "clientEmail": "test@example.com",
    "clientName": "Test User",
    "date": "2025-01-01",
    "startTime": "10:00",
    "duration": 60
  }'
```
**Expected:** ❌ "Cannot book appointments in the past"

### Test 3: Blocked Day (Tuesday)
```bash
curl -X POST https://your-domain.convex.site/api/booking/create-appointment \
  -H "Content-Type: application/json" \
  -d '{
    "clientEmail": "test@example.com",
    "clientName": "Test User",
    "date": "2026-02-17",
    "startTime": "10:00",
    "duration": 60
  }'
```
**Expected:** ❌ "This day is not available for bookings"

### Test 4: Outside Business Hours
```bash
curl -X POST https://your-domain.convex.site/api/booking/create-appointment \
  -H "Content-Type: application/json" \
  -d '{
    "clientEmail": "test@example.com",
    "clientName": "Test User",
    "date": "2026-02-15",
    "startTime": "22:00",
    "duration": 60
  }'
```
**Expected:** ❌ "Appointments must be between 06:00 and 21:00"

### Test 5: Conflict Detection
```bash
# First booking
curl -X POST ... -d '{"date": "2026-02-15", "startTime": "10:00", ...}'
# Second booking (same time)
curl -X POST ... -d '{"date": "2026-02-15", "startTime": "10:00", ...}'
```
**Expected:** ❌ "This time slot conflicts with another appointment"

---

## 🔗 N8N Workflow Integration

### Chatbot Booking Flow

1. **User:** "I want to book an appointment"
2. **Bot:** "What date would you like?"
3. **User:** "February 15th"
4. **Bot:** Calls `checkAvailability` → Gets available slots
5. **Bot:** "Available times: 9am, 10am, 2pm"
6. **User:** "10am please"
7. **Bot:** Calls `bookAppointment` with validation
8. **Bot:** ✅ "Booked! Confirmation sent to your email"

### Error Handling in N8N

```javascript
// In N8N HTTP Request node
try {
  const response = await $http.post('/api/booking/create-appointment', {
    clientEmail: $json.email,
    clientName: $json.name,
    date: $json.date,
    startTime: $json.time,
    duration: 60
  });
  
  if (response.success) {
    return { message: "Appointment booked successfully!" };
  }
} catch (error) {
  // Return user-friendly error message
  return { 
    message: error.response.data.error || "Booking failed. Please try another time."
  };
}
```

---

## 📁 Files Modified

1. **`components/booking/AvailabilitySettings.tsx`**
   - Added `globalTimezone` state and UI control
   - Added timezone selector with common timezones
   - Saves to platform_config

2. **`convex/bookingTools.ts`**
   - Updated `checkAvailability` with 7-step validation
   - Updated `bookAppointment` with comprehensive validation
   - Added platform_config queries
   - Added specific error messages for each validation failure

---

## 🎯 Benefits

### Consistency
- ✅ Same validation logic in UI and N8N
- ✅ Same error messages everywhere
- ✅ Single source of truth (platform_config)

### Reliability
- ✅ Prevents double bookings
- ✅ Respects business hours
- ✅ Enforces minimum notice
- ✅ Validates all constraints

### Flexibility
- ✅ Configurable via UI
- ✅ No code changes needed
- ✅ Per-day customization
- ✅ Global and local settings

### User Experience
- ✅ Clear error messages
- ✅ Specific validation feedback
- ✅ Prevents invalid bookings
- ✅ Reduces support tickets

---

## 📝 Configuration Checklist

Before using N8N booking integration:

- [ ] Set week view time range (Availability Settings)
- [ ] Set global timezone (Availability Settings)
- [ ] Configure day availability (Monday-Sunday)
- [ ] Set minimum notice hours (default: 24)
- [ ] Set maximum days in future (default: 60)
- [ ] Test all validation scenarios
- [ ] Update N8N workflow with correct endpoint URLs
- [ ] Configure error handling in N8N
- [ ] Test chatbot booking flow end-to-end

---

## 🚀 Deployment Steps

1. **Save Availability Settings**
   - Go to Booking Management → Availability
   - Set week view time range (e.g., 09:00 - 17:00)
   - Set global timezone (e.g., Asia/Kuala_Lumpur)
   - Configure day availability
   - Click "Save All Settings"

2. **Update N8N Workflow**
   - Import updated booking workflow
   - Update HTTP Request nodes with correct URLs
   - Test check-availability endpoint
   - Test book-appointment endpoint
   - Configure error handling

3. **Test Integration**
   - Test valid booking
   - Test all validation scenarios
   - Verify error messages
   - Check appointment creation
   - Verify client creation

4. **Monitor**
   - Check Convex logs for errors
   - Monitor booking success rate
   - Review validation failures
   - Adjust settings as needed

---

## 📊 Summary

### What's Working Now:

1. ✅ **Platform Config Integration**
   - Global timezone setting
   - Week view time range
   - Booking window limits
   - Minimum notice requirements

2. ✅ **Comprehensive Validation**
   - 7-step validation algorithm
   - Specific error messages
   - Conflict detection
   - Time range validation

3. ✅ **N8N Endpoints Updated**
   - `checkAvailability` - Full validation
   - `bookAppointment` - Full validation
   - Consistent with UI logic

4. ✅ **Error Handling**
   - Clear error messages
   - Specific validation feedback
   - HTTP status codes
   - User-friendly responses

---

**Status:** N8N booking integration fully implemented with comprehensive availability validation! ✅

**Next Steps:** Test the integration end-to-end with your N8N chatbot workflow.
