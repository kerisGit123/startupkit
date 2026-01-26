# N8N Booking Integration - Testing Guide

**Last Updated:** Jan 26, 2026  
**Status:** Complete

---

## 📋 Overview

Comprehensive testing guide for N8N booking integration. This guide covers all validation scenarios, error cases, and performance testing.

---

## 🎯 Pre-Testing Checklist

### Configuration Setup
- [ ] Week view time range configured (e.g., 09:00 - 17:00)
- [ ] Global timezone set (e.g., Asia/Kuala_Lumpur)
- [ ] Day availability configured (at least one day enabled)
- [ ] Minimum notice hours set (default: 24)
- [ ] Maximum days in future set (default: 60)
- [ ] At least one event type created

### Environment Setup
- [ ] Convex deployment running
- [ ] N8N instance accessible
- [ ] Workflow imported and configured
- [ ] Endpoint URLs updated in N8N

---

## 🧪 Test Scenarios

### 1. Valid Booking Tests

#### Test 1.1: Standard Booking
**Objective:** Book a valid appointment

**Request:**
```bash
curl -X POST https://your-domain.convex.site/api/booking/create-appointment \
  -H "Content-Type: application/json" \
  -d '{
    "clientEmail": "test@example.com",
    "clientName": "Test User",
    "clientPhone": "+1234567890",
    "date": "2026-02-15",
    "startTime": "10:00",
    "duration": 60,
    "appointmentType": "consultation",
    "notes": "Test booking"
  }'
```

**Expected Result:**
- ✅ Status: 200
- ✅ Response: `{ "success": true, "appointmentId": "...", ... }`
- ✅ Appointment appears in calendar
- ✅ Client created/updated

#### Test 1.2: Back-to-Back Bookings
**Objective:** Book consecutive appointments

**Steps:**
1. Book appointment at 10:00 (60 min)
2. Book appointment at 11:00 (60 min)

**Expected Result:**
- ✅ Both bookings succeed
- ✅ No conflict detected
- ✅ Both appear in calendar

#### Test 1.3: Check Availability
**Objective:** Get available slots for a date

**Request:**
```bash
curl -X POST https://your-domain.convex.site/api/booking/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-02-15",
    "duration": 60
  }'
```

**Expected Result:**
- ✅ Status: 200
- ✅ Returns array of available slots
- ✅ Slots within configured time range
- ✅ Excludes already booked times

---

### 2. Validation Error Tests

#### Test 2.1: Past Date
**Objective:** Attempt to book in the past

**Request:**
```json
{
  "date": "2025-01-01",
  "startTime": "10:00",
  ...
}
```

**Expected Result:**
- ❌ Status: 400
- ❌ Error: "Cannot book appointments in the past"

#### Test 2.2: Too Far in Future
**Objective:** Book beyond maxDaysInFuture

**Request:**
```json
{
  "date": "2027-01-01",
  "startTime": "10:00",
  ...
}
```

**Expected Result:**
- ❌ Status: 400
- ❌ Error: "Cannot book more than 60 days in advance"

#### Test 2.3: Insufficient Notice
**Objective:** Book with less than minimum notice

**Request:**
```json
{
  "date": "2026-01-27",
  "startTime": "10:00",
  ...
}
```
*(Test within 24 hours)*

**Expected Result:**
- ❌ Status: 400
- ❌ Error: "Appointments must be booked at least 24 hours in advance"

#### Test 2.4: Outside Business Hours
**Objective:** Book outside global time range

**Request:**
```json
{
  "date": "2026-02-15",
  "startTime": "22:00",
  ...
}
```
*(If weekViewEndTime is 21:00)*

**Expected Result:**
- ❌ Status: 400
- ❌ Error: "Appointments must be between 06:00 and 21:00"

#### Test 2.5: Blocked Day
**Objective:** Book on inactive day (e.g., Sunday)

**Request:**
```json
{
  "date": "2026-02-16",
  "startTime": "10:00",
  ...
}
```
*(If Sunday is disabled)*

**Expected Result:**
- ❌ Status: 400
- ❌ Error: "This day is not available for bookings"

#### Test 2.6: Outside Day Hours
**Objective:** Book outside day-specific hours

**Request:**
```json
{
  "date": "2026-02-16",
  "startTime": "08:00",
  ...
}
```
*(If Monday hours are 09:00-17:00)*

**Expected Result:**
- ❌ Status: 400
- ❌ Error: "Time 08:00 is outside available hours (09:00 - 17:00)"

---

### 3. Conflict Detection Tests

#### Test 3.1: Exact Time Conflict
**Objective:** Book at exact same time

**Steps:**
1. Book appointment at 10:00 (60 min)
2. Attempt to book at 10:00 (60 min)

**Expected Result:**
- ❌ Status: 409
- ❌ Error: "This time slot conflicts with another appointment"

#### Test 3.2: Overlapping Start
**Objective:** Book with overlapping start time

**Steps:**
1. Book appointment at 10:00 (60 min) → ends at 11:00
2. Attempt to book at 10:30 (60 min)

**Expected Result:**
- ❌ Status: 409
- ❌ Error: "This time slot conflicts with another appointment"

#### Test 3.3: Overlapping End
**Objective:** Book with overlapping end time

**Steps:**
1. Book appointment at 10:00 (60 min) → ends at 11:00
2. Attempt to book at 09:30 (60 min) → would end at 10:30

**Expected Result:**
- ❌ Status: 409
- ❌ Error: "This time slot conflicts with another appointment"

#### Test 3.4: Contained Within
**Objective:** Book within existing appointment

**Steps:**
1. Book appointment at 10:00 (120 min) → ends at 12:00
2. Attempt to book at 10:30 (30 min) → ends at 11:00

**Expected Result:**
- ❌ Status: 409
- ❌ Error: "This time slot conflicts with another appointment"

---

### 4. Edge Cases

#### Test 4.1: Midnight Boundary
**Objective:** Book at 00:00

**Request:**
```json
{
  "date": "2026-02-15",
  "startTime": "00:00",
  "duration": 60
}
```

**Expected Result:**
- Depends on configuration
- Should validate against weekViewStartTime

#### Test 4.2: End of Day
**Objective:** Book at end of business hours

**Request:**
```json
{
  "date": "2026-02-15",
  "startTime": "20:00",
  "duration": 60
}
```
*(If weekViewEndTime is 21:00)*

**Expected Result:**
- ✅ Should succeed if within hours
- ❌ Should fail if would extend past end time

#### Test 4.3: Different Timezones
**Objective:** Test timezone handling

**Steps:**
1. Set globalTimezone to "America/New_York"
2. Book appointment
3. Verify time is stored correctly

**Expected Result:**
- ✅ Time stored in correct timezone
- ✅ Displays correctly in UI

#### Test 4.4: Leap Year Date
**Objective:** Book on Feb 29

**Request:**
```json
{
  "date": "2028-02-29",
  "startTime": "10:00",
  "duration": 60
}
```

**Expected Result:**
- ✅ Should handle leap year correctly

---

## 📊 Performance Testing

### Load Test 1: Concurrent Bookings
**Objective:** Test concurrent booking requests

**Steps:**
1. Send 10 simultaneous booking requests
2. All for different time slots
3. Measure response times

**Expected Result:**
- ✅ All bookings succeed
- ✅ No conflicts created
- ✅ Response time < 1000ms

### Load Test 2: Availability Queries
**Objective:** Test availability endpoint under load

**Steps:**
1. Send 50 availability requests
2. For different dates
3. Measure response times

**Expected Result:**
- ✅ All queries succeed
- ✅ Response time < 500ms
- ✅ Correct slots returned

---

## 🔍 Integration Testing

### N8N Workflow Test
**Objective:** Test complete chatbot flow

**Steps:**
1. User: "I want to book an appointment"
2. Bot: Asks for date
3. User: Provides date
4. Bot: Shows available times
5. User: Selects time
6. Bot: Confirms booking

**Expected Result:**
- ✅ Smooth conversation flow
- ✅ Correct available times shown
- ✅ Booking created successfully
- ✅ Confirmation message sent

---

## 🐛 Error Handling Tests

### Test: Network Timeout
**Objective:** Handle slow responses

**Steps:**
1. Simulate slow network
2. Attempt booking
3. Verify timeout handling

**Expected Result:**
- ✅ Appropriate error message
- ✅ No partial bookings created

### Test: Invalid Data
**Objective:** Handle malformed requests

**Request:**
```json
{
  "date": "invalid-date",
  "startTime": "25:00",
  "duration": -60
}
```

**Expected Result:**
- ❌ Status: 400
- ❌ Clear validation error message

---

## 📈 Monitoring Checklist

### During Testing
- [ ] Check Convex logs for errors
- [ ] Monitor response times
- [ ] Verify database updates
- [ ] Check for memory leaks
- [ ] Monitor API rate limits

### After Testing
- [ ] Review error logs
- [ ] Analyze performance metrics
- [ ] Document any issues found
- [ ] Update configuration if needed

---

## ✅ Test Results Template

```markdown
## Test Run: [Date]

### Environment
- Convex Deployment: [URL]
- N8N Instance: [URL]
- Timezone: [Timezone]

### Results
| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| 1.1 | Standard Booking | ✅ Pass | - |
| 1.2 | Back-to-Back | ✅ Pass | - |
| 2.1 | Past Date | ✅ Pass | Correct error |
| ... | ... | ... | ... |

### Issues Found
1. [Issue description]
2. [Issue description]

### Performance
- Average response time: XXXms
- P95 response time: XXXms
- Success rate: XX%
```

---

## 🚀 Automated Testing

### Recommended Tools
- **Postman** - API testing and collections
- **k6** - Load testing
- **Jest** - Unit tests for validation logic
- **Playwright** - E2E UI testing

### Sample Postman Collection
```json
{
  "info": {
    "name": "N8N Booking Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Valid Booking",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/booking/create-appointment",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"clientEmail\": \"test@example.com\",\n  \"clientName\": \"Test User\",\n  \"date\": \"2026-02-15\",\n  \"startTime\": \"10:00\",\n  \"duration\": 60\n}"
        }
      }
    }
  ]
}
```

---

## 📝 Testing Best Practices

1. **Test in Order**
   - Start with valid cases
   - Then test validation errors
   - Finally test edge cases

2. **Clean Up Between Tests**
   - Delete test appointments
   - Reset test data
   - Clear caches

3. **Document Everything**
   - Record test results
   - Note unexpected behavior
   - Track performance metrics

4. **Use Realistic Data**
   - Real email formats
   - Valid phone numbers
   - Reasonable time slots

5. **Test All Timezones**
   - UTC
   - Local timezone
   - Edge timezones (UTC+14, UTC-12)

---

**Testing guide complete!** Use this as a checklist for thorough validation. ✅
