# Calendar Drag-and-Drop Fix - Jan 26, 2026 (8:03 PM)

## ✅ Calendar Drag-and-Drop Now Working!

### Problem
Calendar view didn't support drag-and-drop functionality - only week view had it.

### Solution
Added complete drag-and-drop support to calendar view with the same validation as week view.

---

## 🔧 Implementation Details

### 1. Created DroppableDate Component

**New File:** `components/booking/DroppableDate.tsx`

```typescript
"use client";

import { useDroppable } from "@dnd-kit/core";

interface DroppableDateProps {
  id: string;
  date: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function DroppableDate({ 
  id, 
  date, 
  children, 
  className,
  onClick 
}: DroppableDateProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: { date },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
```

**Purpose:** Makes each calendar date cell a droppable target for appointments

---

### 2. Updated CalendarView.tsx

**Changes Made:**

1. **Added Imports:**
```typescript
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { Id } from "@/convex/_generated/dataModel";
import { DraggableAppointment } from "./DraggableAppointment";
import { DroppableDate } from "./DroppableDate";
import { useMutation } from "convex/react";
```

2. **Added Mutation:**
```typescript
const updateAppointment = useMutation(api.bookingMutations.updateAppointment);
```

3. **Added Drag Handler with Full Validation:**
```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  
  if (!over || active.id === over.id) return;

  const appointmentId = active.id as string;
  const targetDate = over.id as string;

  // Find the appointment being dragged
  const appointment = appointments?.find(apt => apt._id === appointmentId);
  if (!appointment) return;

  // Validation 1: Check if target date is available
  const dateObj = new Date(targetDate);
  const dayOfWeek = dateObj.getDay();
  const dayAvailability = availability?.find(a => a.dayOfWeek === dayOfWeek);
  
  if (!dayAvailability || !dayAvailability.isActive) {
    alert('Cannot move appointment: This day is not available for bookings.');
    return;
  }

  // Validation 2: Check if time is within available hours
  const startHour = parseInt(appointment.startTime.split(":")[0]);
  const availStartHour = parseInt(dayAvailability.startTime.split(":")[0]);
  const availEndHour = parseInt(dayAvailability.endTime.split(":")[0]);
  
  if (startHour < availStartHour || startHour >= availEndHour) {
    alert(`Cannot move: Time ${appointment.startTime} is outside available hours.`);
    return;
  }

  // Validation 3: Check for conflicts on target date
  const targetDateAppointments = appointments?.filter(
    apt => apt.date === targetDate && apt._id !== appointmentId
  ) || [];
  
  const [startH, startM] = appointment.startTime.split(":").map(Number);
  const endMinutes = startH * 60 + startM + appointment.duration;
  const endHour = Math.ceil(endMinutes / 60);

  const hasConflict = targetDateAppointments.some(apt => {
    // Overlap detection logic
  });

  if (hasConflict) {
    alert('Cannot move: Time slot conflicts with another appointment.');
    return;
  }

  // Calculate endTime and update
  const endTotalMinutes = startH * 60 + startM + appointment.duration;
  const newEndHour = Math.floor(endTotalMinutes / 60);
  const newEndMin = endTotalMinutes % 60;
  const newEndTime = `${String(newEndHour).padStart(2, '0')}:${String(newEndMin).padStart(2, '0')}`;

  await updateAppointment({
    appointmentId: appointmentId as Id<"appointments">,
    date: targetDate,
    endTime: newEndTime,
    updatedAt: Date.now(),
  });
};
```

4. **Wrapped in DndContext:**
```typescript
return (
  <DndContext onDragEnd={handleDragEnd}>
    <div className="space-y-4">
      {/* Calendar content */}
    </div>
  </DndContext>
);
```

5. **Made Date Cells Droppable:**
```typescript
<DroppableDate
  key={day.fullDate}
  id={day.fullDate}
  date={day.fullDate}
  className={/* styling */}
  onClick={/* click handler */}
>
  {/* Date content */}
</DroppableDate>
```

6. **Made Appointments Draggable:**
```typescript
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
```

---

## 🎯 How to Use

### Drag-and-Drop in Calendar View:

1. **Hover over any appointment** in the calendar
2. **Find the grip icon (⋮⋮)** on the left edge
3. **Click and drag from the grip** to move the appointment
4. **Drop on any date cell** to move the appointment to that date
5. **System validates:**
   - ✅ Is target day available?
   - ✅ Is appointment time within available hours?
   - ✅ Any conflicts on target date?
6. **If valid** → Appointment moves successfully
7. **If invalid** → Alert shown, appointment stays in place

### Visual Feedback:

- **Dragging:** Appointment becomes semi-transparent (opacity 0.5)
- **Hovering over valid date:** Blue ring appears around date cell
- **Drop successful:** Appointment appears on new date
- **Drop invalid:** Alert message, appointment returns to original date

---

## ✅ Validation Rules

### 1. Day Availability
- Cannot drop on blocked days (Tuesday, Saturday)
- Alert: "Cannot move appointment: This day is not available for bookings."

### 2. Time Availability
- Appointment time must be within available hours (09:00-16:00)
- Alert: "Cannot move appointment: Time [time] is outside available hours ([start] - [end])."

### 3. Conflict Detection
- Cannot drop if time slot conflicts with existing appointment
- Alert: "Cannot move appointment: The time slot conflicts with another appointment on this date."

---

## 📋 Features

### Calendar View Now Has:

1. ✅ **Drag-and-drop** with grip handle
2. ✅ **Click-to-edit** appointments
3. ✅ **Click-to-create** on available dates
4. ✅ **Day availability** validation
5. ✅ **Time availability** validation
6. ✅ **Conflict detection** validation
7. ✅ **Visual feedback** during drag
8. ✅ **Error messages** for invalid drops

### Same as Week View:

Both views now have identical functionality:
- ✅ Drag-and-drop with grip handle
- ✅ Click-to-edit appointments
- ✅ Full validation (day, time, conflicts)
- ✅ Visual indicators for blocked areas
- ✅ Specific error messages

---

## 📁 Files Modified

1. **`components/booking/CalendarView.tsx`**
   - Added DndContext wrapper
   - Added handleDragEnd with validation
   - Wrapped date cells in DroppableDate
   - Wrapped appointments in DraggableAppointment
   - Added updateAppointment mutation

2. **`components/booking/DroppableDate.tsx`** (NEW)
   - Created droppable wrapper for date cells
   - Visual feedback on hover (blue ring)

---

## 🧪 Testing Guide

### Test 1: Drag to Valid Date
1. Drag appointment from Monday to Wednesday
2. ✅ Appointment moves successfully
3. ✅ Appears on Wednesday

### Test 2: Drag to Blocked Day
1. Drag appointment to Tuesday (blocked)
2. ✅ Alert: "This day is not available"
3. ✅ Appointment stays on original date

### Test 3: Drag to Date with Conflict
1. Drag appointment to date with existing appointment at same time
2. ✅ Alert: "Time slot conflicts"
3. ✅ Appointment stays on original date

### Test 4: Drag Outside Available Hours
1. Drag 08:00 appointment to any date
2. ✅ Alert: "Outside available hours (09:00 - 16:00)"
3. ✅ Appointment stays on original date

### Test 5: Visual Feedback
1. Start dragging appointment
2. ✅ Appointment becomes semi-transparent
3. Hover over valid date
4. ✅ Blue ring appears around date
5. Hover over blocked date
6. ✅ Blue ring appears (but drop will be rejected)

---

## 📊 Summary

### Before:
- ❌ Calendar view: No drag-and-drop
- ✅ Week view: Drag-and-drop working

### After:
- ✅ Calendar view: Full drag-and-drop with validation
- ✅ Week view: Drag-and-drop working
- ✅ Both views: Identical functionality
- ✅ Both views: Same validation rules
- ✅ Both views: Grip handle pattern

---

## 💡 Key Points

1. **Grip Handle Required:** Must drag from grip icon (⋮⋮) on left edge
2. **Same Validation:** Calendar uses same rules as week view
3. **Visual Feedback:** Blue ring shows where you're dropping
4. **Error Messages:** Specific alerts for each validation failure
5. **No Mode Switch:** Drag and edit work simultaneously

---

**Status:** Calendar drag-and-drop fully implemented! ✅

**Next Steps:**
1. Refresh browser
2. Go to Calendar view
3. Drag appointments from grip handle
4. Drop on different dates
5. Enjoy full drag-and-drop functionality! 🎉
