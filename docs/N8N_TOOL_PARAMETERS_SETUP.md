# n8n AI Agent Tool Parameters Setup Guide

## ⚠️ Critical Issue: Parameters Not Configured

If you see this error: **"No parameters are set up to be filled by AI"**

This means you haven't added parameters to your tool. The AI Agent cannot extract values from user messages without parameters.

---

## 🔧 How to Add Parameters (Step-by-Step)

### For Each Tool (lookup_client, create_lead, check_availability, book_appointment):

1. **Click on the HTTP Request node** in your n8n workflow
2. **Look for the "Parameters" tab** at the top (next to "HTTP Request", "Mapping", "Settings")
3. **Click the "Parameters" tab**
4. **Click "Add Parameter" button**
5. **Fill in the parameter details** (see tables below)
6. **Click the ✨ sparkle icon** next to each parameter to enable AI extraction
7. **Repeat for all parameters** in that tool
8. **Go back to "HTTP Request" tab**
9. **Update the JSON body** to reference the parameters
10. **Save the workflow**

---

## 📋 Tool 1: lookup_client

### Parameters Tab Configuration:

**Parameter 1:**
- **Name:** `email`
- **Type:** `String`
- **Description:** `Client's email address to search for`
- **Required:** ✅ Check this box
- **✨ Enable AI:** Click the sparkle icon

### HTTP Request Tab - JSON Body:
```json
{
  "email": "={{ $json.email }}"
}
```

---

## 📋 Tool 2: create_lead

### Parameters Tab Configuration:

**Parameter 1:**
- **Name:** `name`
- **Type:** `String`
- **Description:** `Client's full name`
- **Required:** ✅ Check this box
- **✨ Enable AI:** Click the sparkle icon

**Parameter 2:**
- **Name:** `email`
- **Type:** `String`
- **Description:** `Client's email address`
- **Required:** ✅ Check this box
- **✨ Enable AI:** Click the sparkle icon

**Parameter 3:**
- **Name:** `phone`
- **Type:** `String`
- **Description:** `Client's phone number (optional)`
- **Required:** ⬜ Leave unchecked
- **✨ Enable AI:** Click the sparkle icon

### HTTP Request Tab - JSON Body:
```json
{
  "name": "={{ $json.name }}",
  "email": "={{ $json.email }}",
  "phone": "={{ $json.phone }}",
  "source": "chatbot"
}
```

---

## 📋 Tool 3: check_availability

### Parameters Tab Configuration:

**Parameter 1:**
- **Name:** `date`
- **Type:** `String`
- **Description:** `Date to check availability in YYYY-MM-DD format (e.g., 2026-01-28)`
- **Required:** ✅ Check this box
- **✨ Enable AI:** Click the sparkle icon

**Parameter 2:**
- **Name:** `duration`
- **Type:** `Number`
- **Description:** `Appointment duration in minutes (default: 60)`
- **Required:** ⬜ Leave unchecked
- **✨ Enable AI:** Click the sparkle icon

### HTTP Request Tab - JSON Body:
```json
{
  "date": "={{ $json.date }}",
  "duration": 60
}
```

---

## 📋 Tool 4: book_appointment

### Parameters Tab Configuration:

**Parameter 1:**
- **Name:** `contactId`
- **Type:** `String`
- **Description:** `Contact ID from lookup_client result`
- **Required:** ✅ Check this box
- **✨ Enable AI:** Click the sparkle icon

**Parameter 2:**
- **Name:** `date`
- **Type:** `String`
- **Description:** `Appointment date in YYYY-MM-DD format (e.g., 2026-01-28)`
- **Required:** ✅ Check this box
- **✨ Enable AI:** Click the sparkle icon

**Parameter 3:**
- **Name:** `startTime`
- **Type:** `String`
- **Description:** `Start time in HH:MM format (e.g., 14:00 for 2pm)`
- **Required:** ✅ Check this box
- **✨ Enable AI:** Click the sparkle icon

**Parameter 4:**
- **Name:** `endTime`
- **Type:** `String`
- **Description:** `End time in HH:MM format (e.g., 15:00 for 3pm)`
- **Required:** ✅ Check this box
- **✨ Enable AI:** Click the sparkle icon

**Parameter 5:**
- **Name:** `appointmentType`
- **Type:** `String`
- **Description:** `Type of appointment (e.g., consultation, meeting, follow-up)`
- **Required:** ✅ Check this box
- **✨ Enable AI:** Click the sparkle icon

**Parameter 6:**
- **Name:** `notes`
- **Type:** `String`
- **Description:** `Additional notes or special requests (optional)`
- **Required:** ⬜ Leave unchecked
- **✨ Enable AI:** Click the sparkle icon

### HTTP Request Tab - JSON Body:
```json
{
  "contactId": "={{ $json.contactId }}",
  "date": "={{ $json.date }}",
  "startTime": "={{ $json.startTime }}",
  "endTime": "={{ $json.endTime }}",
  "appointmentType": "={{ $json.appointmentType }}",
  "notes": "={{ $json.notes }}"
}
```

---

## ✅ Verification Checklist

After configuring each tool, verify:

- [ ] Parameters tab has all required parameters added
- [ ] Each parameter has the ✨ sparkle icon enabled
- [ ] Required parameters are marked as required
- [ ] HTTP Request tab JSON body uses `={{ $json.parameterName }}`
- [ ] Workflow is saved
- [ ] Test the tool by executing it

---

## 🧪 Testing Each Tool

### Test lookup_client:
**User message:** "Look up shangwey@yahoo.com"
**Expected:** Should find the contact

### Test create_lead:
**User message:** "Create a lead for John Doe, email john@example.com, phone 123456789"
**Expected:** Should create contact and lead

### Test check_availability:
**User message:** "What times are available on January 28th, 2026?"
**Expected:** Should return available time slots

### Test book_appointment:
**User message:** "Book an appointment for January 28th at 2pm"
**Expected:** Should book the appointment

---

## 🎯 Common Mistakes

1. **Not clicking the ✨ sparkle icon** - Parameters won't be AI-extractable
2. **Not adding parameters to Parameters tab** - Tool will fail with "No parameters set up"
3. **Wrong JSON body syntax** - Use `={{ $json.parameterName }}` not `$parameter.name`
4. **Not saving the workflow** - Changes won't take effect
5. **Missing required parameters** - Tool will fail validation

---

## 📊 Backend API Status

All backend APIs are working correctly:

✅ `/api/booking/lookup-client` - Searches contacts by email/contactPersonEmail
✅ `/api/booking/create-lead` - Creates contacts and leads, handles duplicates
✅ `/api/booking/check-availability` - Returns available time slots
✅ `/api/booking/book-appointment` - Books appointments

The issue is **only** in n8n tool parameter configuration.

---

## 🚀 Next Steps

1. Configure parameters for all 4 tools using this guide
2. Save the workflow
3. Test each tool individually
4. Test the complete booking flow
5. Implement Kylie AI conversational flow

---

**Follow this guide exactly to configure your n8n tools. The backend is ready and working.**
