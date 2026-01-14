# 🧪 Chatbot System Testing Checklist

**Complete testing guide for the chatbot implementation**

---

## ✅ Phase 1: Database Schema Testing

### Verify Tables Created
- [ ] Run `npx convex dev` successfully
- [ ] Check Convex dashboard for all 8 tables:
  - [ ] `knowledge_base`
  - [ ] `chatbot_config`
  - [ ] `chatbot_conversations`
  - [ ] `lead_capture_config`
  - [ ] `chat_appointments`
  - [ ] `user_attributes`
  - [ ] `chatbot_analytics`
  - [ ] `admin_chat_queue`

### Test Indexes
- [ ] Verify `by_type` index on `knowledge_base`
- [ ] Verify `by_type` index on `chatbot_config`
- [ ] Verify `by_type` index on `chatbot_conversations`
- [ ] Verify `by_category` index on `knowledge_base`

---

## ✅ Phase 2: Admin Chatbot Settings

### Access & UI
- [ ] Navigate to `/admin/chatbot-settings`
- [ ] Page loads without errors
- [ ] Both tabs visible (Frontend/User Panel)
- [ ] All form fields render correctly

### Frontend Chatbot Configuration
- [ ] Toggle "Enable Frontend Chatbot" on/off
- [ ] Enter n8n webhook URL
- [ ] Change primary color (color picker works)
- [ ] Test "Test Connection" button
- [ ] Click "Save Configuration"
- [ ] Verify toast notification appears
- [ ] Refresh page - settings persist

### User Panel Chatbot Configuration
- [ ] Switch to "User Panel Chatbot" tab
- [ ] Toggle "Enable User Panel Chatbot" on/off
- [ ] Enter different webhook URL
- [ ] Change primary color
- [ ] Test connection
- [ ] Save configuration
- [ ] Verify settings persist

---

## ✅ Phase 3: Chat Widget (Frontend)

### Widget Appearance
- [ ] Add `<ChatWidget type="frontend" />` to landing page
- [ ] Widget button appears in bottom-right corner
- [ ] Button shows correct color from config
- [ ] Company logo displays (if configured)
- [ ] Click button - chat window opens
- [ ] Chat window is 350x500px
- [ ] Header shows correct branding

### Widget Functionality
- [ ] Welcome message displays
- [ ] Type message in input field
- [ ] Press Enter - message sends
- [ ] User message appears (right side, correct color)
- [ ] Typing indicator shows
- [ ] Bot response appears (left side)
- [ ] Messages scroll automatically
- [ ] Close button works
- [ ] Reopen - session persists

### Session Management
- [ ] Send multiple messages
- [ ] Close widget
- [ ] Refresh page
- [ ] Reopen widget
- [ ] Previous messages still visible

---

## ✅ Phase 4: Admin Live Chat Dashboard

### Access & Layout
- [ ] Navigate to `/admin/live-chat`
- [ ] Page loads with 3-column layout
- [ ] Left sidebar shows conversation list
- [ ] Center panel shows chat interface
- [ ] Right sidebar shows user attributes

### Conversation List
- [ ] Status filters work (All, Active, Waiting, In Progress)
- [ ] Conversation cards display correctly
- [ ] User avatars show
- [ ] Status badges have correct colors
- [ ] Time since last message displays
- [ ] Click conversation - selects it

### Chat Interface
- [ ] Selected conversation displays in center
- [ ] User info shows in header
- [ ] All messages render correctly
- [ ] "Take Over" button visible
- [ ] Click "Take Over" - status changes
- [ ] "You are in control" badge appears
- [ ] Message input becomes active
- [ ] Type and send admin message
- [ ] Admin message appears (blue background)
- [ ] "Resolve" button works

### User Attributes Panel
- [ ] User info displays correctly
- [ ] Lead captured status shows
- [ ] Click "Edit" button
- [ ] Fields become editable
- [ ] Update name, email, phone, company
- [ ] Click "Save"
- [ ] Changes persist

---

## ✅ Phase 5: Lead Capture Form

### Form Display
- [ ] Trigger lead capture (after 3 messages or manual)
- [ ] Modal overlay appears
- [ ] Form title and description show
- [ ] All configured fields render

### Form Validation
- [ ] Try submitting empty form - errors show
- [ ] Enter invalid email - error shows
- [ ] Enter invalid phone - error shows
- [ ] Fill all required fields
- [ ] Submit form - success
- [ ] Form closes
- [ ] Lead data saved to conversation

### Custom Fields
- [ ] Text fields work
- [ ] Email fields validate
- [ ] Phone fields validate
- [ ] Select dropdowns work
- [ ] Textarea allows multi-line input
- [ ] Optional fields can be skipped

---

## ✅ Phase 6: Agent Intervention

### Manual Intervention (User-Initiated)
- [ ] "💬 Talk to Agent" button visible in widget
- [ ] Click button
- [ ] System message appears
- [ ] Button disappears after click
- [ ] Conversation status updates to `waiting_for_agent`
- [ ] Conversation appears in admin "Waiting" filter

### Auto-Escalation (Keyword Detection)
- [ ] Send message with "speak to human"
- [ ] n8n detects keyword
- [ ] Escalation response received
- [ ] Status updates to `waiting_for_agent`
- [ ] Admin sees in queue

### Test All Escalation Keywords
- [ ] "speak to human"
- [ ] "talk to agent"
- [ ] "real person"
- [ ] "frustrated"
- [ ] "angry"
- [ ] "not helpful"
- [ ] "manager"
- [ ] "complaint"
- [ ] "urgent"
- [ ] "emergency"

---

## ✅ Phase 7: Image Upload & Sharing

### User Upload
- [ ] Click 📷 camera button in widget
- [ ] File picker opens
- [ ] Select image file
- [ ] Image validates (size < 5MB)
- [ ] Image validates (type = image/*)
- [ ] Image preview appears in chat
- [ ] Image has rounded corners
- [ ] Image is responsive

### Admin View
- [ ] Open conversation with image
- [ ] Image displays in admin chat
- [ ] Image is clickable/viewable
- [ ] Image URL stored in database

### Error Handling
- [ ] Try uploading file > 5MB - error shows
- [ ] Try uploading non-image - error shows
- [ ] Error messages are clear

---

## ✅ Phase 8: Appointment Booking

### Modal Display
- [ ] Trigger appointment booking
- [ ] Modal opens with calendar
- [ ] Time slot picker visible
- [ ] Contact form visible

### Calendar Functionality
- [ ] Past dates are disabled
- [ ] Weekends are disabled (Sat/Sun)
- [ ] Click valid date - selects it
- [ ] Selected date highlights

### Time Slot Selection
- [ ] Time slots show 9 AM - 5 PM
- [ ] 30-minute intervals
- [ ] 12-hour format (AM/PM)
- [ ] Select time slot
- [ ] Summary card updates

### Form Submission
- [ ] Fill name (required)
- [ ] Fill email (required)
- [ ] Fill phone (optional)
- [ ] Select purpose
- [ ] Add notes
- [ ] Click "Book Appointment"
- [ ] Validation works
- [ ] Success confirmation
- [ ] Appointment saved to database

---

## ✅ Phase 9: Quick Replies

### Button Display
- [ ] Admin takes over conversation
- [ ] ⚡ Quick replies button visible
- [ ] Click button
- [ ] 6 quick reply buttons appear
- [ ] Buttons wrap to multiple rows

### Functionality
- [ ] Click quick reply
- [ ] Text inserts into message input
- [ ] Quick replies hide
- [ ] Can send inserted message
- [ ] Toggle button shows/hides replies

---

## ✅ Phase 10: Knowledge Base Management

### Access & UI
- [ ] Navigate to `/admin/knowledge-base`
- [ ] Page loads successfully
- [ ] Search bar visible
- [ ] "New Article" button visible
- [ ] Chatbot type tabs work

### Create Article
- [ ] Click "New Article"
- [ ] Dialog opens
- [ ] Fill title (required)
- [ ] Fill category (required)
- [ ] Fill content (required)
- [ ] Add tags (comma-separated)
- [ ] Add keywords (comma-separated)
- [ ] Select status (Draft/Published)
- [ ] Click "Create Article"
- [ ] Success toast appears
- [ ] Article appears in grid

### Edit Article
- [ ] Click "Edit" on article card
- [ ] Dialog opens with data
- [ ] Modify fields
- [ ] Click "Update Article"
- [ ] Changes save
- [ ] Version increments

### Delete Article
- [ ] Click delete button
- [ ] Confirmation dialog appears
- [ ] Confirm deletion
- [ ] Article removed from grid

### Search Functionality
- [ ] Type in search bar
- [ ] Results filter in real-time
- [ ] Search matches title
- [ ] Search matches content
- [ ] Search matches category
- [ ] Search matches tags

---

## ✅ Phase 11: n8n Workflow Integration

### Basic Workflow Setup
- [ ] Create n8n workflow
- [ ] Import JSON from guide
- [ ] Configure OpenAI credentials
- [ ] Test webhook trigger
- [ ] Webhook responds correctly

### Test Webhook Connection
- [ ] Copy production webhook URL
- [ ] Paste in admin settings
- [ ] Click "Test Connection"
- [ ] Success message appears
- [ ] Test message sent and received

### AI Response Testing
- [ ] Send test message from widget
- [ ] n8n receives webhook
- [ ] OpenAI processes message
- [ ] Response returns to widget
- [ ] Response displays correctly

### Knowledge Base Integration
- [ ] Create KB articles
- [ ] Configure n8n to query KB
- [ ] Ask question matching KB
- [ ] n8n finds relevant article
- [ ] Response includes KB content

### Escalation Workflow
- [ ] Import escalation workflow
- [ ] Test keyword detection
- [ ] Verify branching logic
- [ ] Test escalation response
- [ ] Verify status update

---

## ✅ Phase 12: Analytics Dashboard

### Access & Display
- [ ] Navigate to `/admin/chatbot-analytics`
- [ ] Page loads successfully
- [ ] All stat cards visible
- [ ] Charts render correctly

### Stat Cards
- [ ] Total Conversations shows count
- [ ] Resolution Rate shows percentage
- [ ] Avg Response Time shows seconds
- [ ] Escalation Rate shows percentage
- [ ] Trend indicators work

### Conversation Trends Chart
- [ ] Line chart displays
- [ ] Shows conversations over time
- [ ] Shows resolved count
- [ ] Shows escalated count
- [ ] Hover tooltips work

### Resolution Breakdown
- [ ] Pie chart displays
- [ ] Shows all status types
- [ ] Percentages are correct
- [ ] Colors are distinct
- [ ] Labels are readable

### Top Questions
- [ ] List displays
- [ ] Shows question text
- [ ] Shows count
- [ ] Progress bars work
- [ ] Sorted by frequency

### Admin Performance
- [ ] Bar chart displays
- [ ] Shows conversations handled
- [ ] Shows avg response time
- [ ] Multiple admins visible
- [ ] Sorted by performance

### User Satisfaction
- [ ] 5-star rating display
- [ ] Shows count per rating
- [ ] Shows percentage
- [ ] Progress bars work
- [ ] Average score calculates correctly

### Time Range Filters
- [ ] "Last 7 Days" works
- [ ] "Last 30 Days" works
- [ ] "Last 90 Days" works
- [ ] Data updates when changed

### Chatbot Type Filters
- [ ] Frontend tab works
- [ ] User Panel tab works
- [ ] Data switches correctly

---

## ✅ Integration Testing

### End-to-End Flow (Frontend)
1. [ ] User visits landing page
2. [ ] Clicks chat widget
3. [ ] Sends first message
4. [ ] Receives bot response
5. [ ] Sends 3+ messages
6. [ ] Lead capture form appears
7. [ ] Fills and submits form
8. [ ] Continues conversation
9. [ ] Requests agent intervention
10. [ ] Admin sees in queue
11. [ ] Admin takes over
12. [ ] Admin sends messages
13. [ ] User receives admin messages
14. [ ] Admin resolves conversation
15. [ ] Analytics updates

### End-to-End Flow (User Panel)
1. [ ] User logs into dashboard
2. [ ] Chat widget visible
3. [ ] Opens widget
4. [ ] User ID passed correctly
5. [ ] Sends authenticated message
6. [ ] Receives personalized response
7. [ ] Uploads image
8. [ ] Image displays correctly
9. [ ] Books appointment
10. [ ] Appointment saved
11. [ ] Analytics tracks user panel separately

---

## ✅ Performance Testing

### Load Testing
- [ ] Test with 10 concurrent conversations
- [ ] Test with 50 concurrent conversations
- [ ] Test with 100 concurrent conversations
- [ ] Response times remain acceptable
- [ ] No memory leaks
- [ ] Database queries optimized

### Widget Performance
- [ ] Widget loads in < 1 second
- [ ] Messages send in < 2 seconds
- [ ] Smooth scrolling
- [ ] No UI lag
- [ ] Mobile performance good

---

## ✅ Security Testing

### Webhook Security
- [ ] HTTPS only
- [ ] Test invalid webhook URL
- [ ] Test malformed requests
- [ ] Rate limiting works

### Data Privacy
- [ ] No sensitive data in logs
- [ ] User data encrypted
- [ ] Admin access controlled
- [ ] Session timeouts work

### Input Validation
- [ ] XSS prevention
- [ ] SQL injection prevention
- [ ] File upload validation
- [ ] Message length limits

---

## ✅ Mobile Testing

### Responsive Design
- [ ] Widget works on mobile (< 768px)
- [ ] Chat window fits screen
- [ ] Buttons are tappable
- [ ] Text is readable
- [ ] Forms work on mobile

### Mobile Browsers
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Test on mobile Firefox
- [ ] All features work

---

## ✅ Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Features to Test
- [ ] Widget display
- [ ] Chat functionality
- [ ] File uploads
- [ ] Calendar picker
- [ ] Color picker
- [ ] Charts render

---

## ✅ Error Handling

### Network Errors
- [ ] Test offline mode
- [ ] Test slow connection
- [ ] Test webhook timeout
- [ ] Error messages display
- [ ] Retry mechanisms work

### User Errors
- [ ] Invalid form inputs
- [ ] Empty messages
- [ ] Large file uploads
- [ ] Rapid clicking
- [ ] Graceful error handling

---

## 🎯 Final Checklist

### Documentation
- [ ] README updated
- [ ] API documentation complete
- [ ] n8n guide tested
- [ ] Deployment guide ready

### Deployment
- [ ] All environment variables set
- [ ] Convex schema deployed
- [ ] n8n workflows active
- [ ] Admin accounts created
- [ ] Navigation links added

### Monitoring
- [ ] Error tracking enabled
- [ ] Analytics working
- [ ] Logs configured
- [ ] Alerts set up

### Training
- [ ] Admin team trained
- [ ] Support docs created
- [ ] Video tutorials recorded
- [ ] FAQ prepared

---

**Testing Status**: ⏳ In Progress  
**Last Updated**: January 14, 2026  
**Tester**: _____________  
**Sign-off**: _____________
