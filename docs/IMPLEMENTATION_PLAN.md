# Implementation Plan: User Panel Settings & Admin User Management

## Overview
This document outlines the implementation plan for enhancing the user panel settings page and creating an admin user management system with activity tracking.

---

## Phase 1: User Panel Settings Page Enhancement

### Features to Implement:

#### 1.1 Company Information Section
Display and edit the following fields in the Settings page:

**Basic Information:**
- Company Name
- Company Address
- Company Country (dropdown with country list)
- Company Phone
- Company Email
- Company Website

**Business Details:**
- Company TIN (Tax Identification Number)
- Company License
- Company Timezone (dropdown with timezone list)
- Company Currency (dropdown with currency list)

**Additional Settings:**
- Company Note (textarea for internal notes)
- Company Favicon (file upload)

#### 1.2 API Keys & Secrets Section
Display API keys with security features:

**Fields:**
- Secret Key
- OpenAI API Key
- OpenAI Secret

**Security Features:**
- **Hide/Show Toggle**: Eye icon to toggle visibility (masked by default with `••••••••`)
- **Copy Button**: Copy icon to copy the full key to clipboard
- **Visual Feedback**: Show "Copied!" tooltip on successful copy
- **Masked Display**: Show only last 4 characters (e.g., `sk-...abc123`)

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│ API Keys & Secrets                                   │
├─────────────────────────────────────────────────────┤
│ Secret Key                                           │
│ [••••••••••••••••••••••••abc123] [👁️] [📋]         │
│                                                      │
│ OpenAI API Key                                       │
│ [••••••••••••••••••••••••xyz789] [👁️] [📋]         │
│                                                      │
│ OpenAI Secret                                        │
│ [••••••••••••••••••••••••def456] [👁️] [📋]         │
└─────────────────────────────────────────────────────┘
```

#### 1.3 Settings Page Tabs/Sections
Organize settings into logical sections:
- **Profile** (existing)
- **Company Information** (new)
- **API Configuration** (new)
- **Preferences** (timezone, currency, etc.)

---

## Phase 2: Admin User Management System

### Features to Implement:

#### 2.1 User List Page with Labeling
Location: `/admin/users`

**Features:**
- Display all users in a table
- Search by email, name, username
- Filter by user label
- Filter by status (active, blocked)
- Bulk actions (assign labels, block/unblock)

**Table Columns:**
- Checkbox (for bulk selection)
- User Avatar & Name
- Email
- User Label (editable badge)
- Tags (multiple tags display)
- Last Login
- Status (Active/Blocked)
- Actions (Edit, View Details, Block/Unblock)

**User Label System:**
Predefined labels with color coding:
- 🌟 **VIP** (Gold)
- 💎 **Premium** (Purple)
- 🏢 **Enterprise** (Blue)
- 🧪 **Beta Tester** (Green)
- ⚠️ **At Risk** (Orange)
- 🚫 **Blocked** (Red)
- 🆓 **Trial** (Gray)
- 🎯 **Support Priority** (Pink)

#### 2.2 User Detail Modal/Page
Click on a user to see detailed information:

**Sections:**
1. **User Information**
   - Profile details
   - Account creation date
   - Last login date
   - Total login count

2. **Activity Summary**
   - Last 10 activities
   - Activity type breakdown (login, api_call, feature_usage)
   - Activity timeline chart

3. **Subscription & Credits**
   - Current plan
   - Credits balance
   - Subscription status

4. **Admin Actions**
   - Assign/change label
   - Add/remove tags
   - Block/unblock user
   - Add admin notes

#### 2.3 Activity Tracking Dashboard
Location: `/admin/activity`

**Dashboard Sections:**

**A. Real-Time Activity**
- Users logged in today (list)
- Current active sessions
- Recent activities (live feed)

**B. Daily Activity Metrics**
```
┌─────────────────────────────────────────────────────┐
│ Today's Activity                                     │
├─────────────────────────────────────────────────────┤
│ 👥 Active Users Today: 45                           │
│ 🔐 Total Logins: 128                                │
│ 📊 API Calls: 1,234                                 │
│ 🎯 Feature Usage: 567                               │
└─────────────────────────────────────────────────────┘
```

**C. Monthly Active Users (MAU)**
```
┌─────────────────────────────────────────────────────┐
│ Monthly Active Users (Last 30 Days)                 │
├─────────────────────────────────────────────────────┤
│ 👥 Total MAU: 320                                   │
│ 📈 Growth: +15% from last month                     │
│ 📊 Chart: [Line chart showing daily active users]   │
└─────────────────────────────────────────────────────┘
```

**D. Activity Breakdown**
- Activity by type (pie chart)
- Activity by hour (bar chart)
- Top active users (leaderboard)

**E. Login Tracking**
Table showing:
- User
- Login Time
- IP Address
- User Agent (Browser/Device)
- Location (if available)

#### 2.4 Analytics & Reports
Location: `/admin/analytics`

**Reports Available:**
1. **Daily Active Users (DAU)**
   - Count of unique users per day
   - Chart showing trend

2. **Weekly Active Users (WAU)**
   - Count of unique users per week
   - Week-over-week comparison

3. **Monthly Active Users (MAU)**
   - Count of unique users per month
   - Month-over-month comparison

4. **User Engagement Metrics**
   - Average sessions per user
   - Average session duration
   - Feature adoption rates

5. **Retention Analysis**
   - New users vs returning users
   - Churn rate
   - User lifecycle stages

---

## Phase 3: Implementation Details

### 3.1 Frontend Components to Create

#### Settings Page Components:
```
app/settings/
├── page.tsx (main settings page)
├── components/
│   ├── CompanyInfoSection.tsx
│   ├── ApiKeysSection.tsx
│   ├── SecretKeyInput.tsx (with hide/show/copy)
│   ├── TimezoneSelect.tsx
│   ├── CurrencySelect.tsx
│   └── CountrySelect.tsx
```

#### Admin User Management Components:
```
app/admin/users/
├── page.tsx (user list)
├── [userId]/
│   └── page.tsx (user detail page)
├── components/
│   ├── UserTable.tsx
│   ├── UserLabelBadge.tsx
│   ├── UserTagsDisplay.tsx
│   ├── UserSearchFilter.tsx
│   ├── BulkActionBar.tsx
│   ├── UserDetailModal.tsx
│   └── AssignLabelModal.tsx
```

#### Activity Dashboard Components:
```
app/admin/activity/
├── page.tsx (activity dashboard)
├── components/
│   ├── TodayActivityCard.tsx
│   ├── MAUCard.tsx
│   ├── ActivityChart.tsx
│   ├── LoginTrackingTable.tsx
│   ├── RecentActivityFeed.tsx
│   └── TopActiveUsers.tsx
```

### 3.2 Backend Functions Already Available

✅ **User Activity Tracking:**
- `trackLogin()` - Track user logins
- `logActivity()` - Log any activity
- `getMonthlyActiveUsers()` - Get MAU
- `getUserActivityHistory()` - Get user activity
- `getActivityStatsByType()` - Activity statistics
- `trackApiCall()` - Track API calls

✅ **Admin User Management:**
- `updateUserLabel()` - Assign labels
- `toggleUserBlock()` - Block/unblock users
- `getUsersByLabel()` - Filter by label
- `searchUsers()` - Search users
- `getUserDetailsWithActivity()` - User details
- `bulkUpdateUserLabels()` - Bulk operations
- `addUserTags()` / `removeUserTags()` - Tag management
- `getUserStatistics()` - User statistics

✅ **Settings Management:**
- `updateSettings()` - Update all company fields
- `getSettings()` - Retrieve settings

### 3.3 New Backend Functions Needed

#### Activity Dashboard Queries:
```typescript
// Get users active today
export const getUsersActiveToday = query({...});

// Get daily active users count
export const getDailyActiveUsers = query({...});

// Get activity by hour (for charts)
export const getActivityByHour = query({...});

// Get login history with details
export const getLoginHistory = query({...});

// Get retention metrics
export const getRetentionMetrics = query({...});
```

### 3.4 UI/UX Considerations

#### Secret Key Input Component:
```typescript
interface SecretKeyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

// Features:
// - Masked by default (show last 4 chars)
// - Eye icon to toggle visibility
// - Copy button with success feedback
// - Secure input handling
```

#### User Label Badge:
```typescript
interface UserLabelBadgeProps {
  label: string;
  editable?: boolean;
  onLabelChange?: (newLabel: string) => void;
}

// Features:
// - Color-coded by label type
// - Click to edit (if editable)
// - Dropdown with predefined labels
```

---

## Phase 4: Implementation Order

### Step 1: Enhance Settings Page (2-3 days)
1. Create CompanyInfoSection component
2. Create ApiKeysSection component
3. Implement SecretKeyInput with hide/show/copy
4. Add timezone, currency, country selects
5. Update settings page layout with tabs
6. Connect to backend updateSettings mutation
7. Test all fields and validation

### Step 2: Admin User List (2-3 days)
1. Create user list page layout
2. Implement UserTable component
3. Add search and filter functionality
4. Create UserLabelBadge component
5. Implement bulk actions
6. Add pagination
7. Connect to backend queries
8. Test user management features

### Step 3: User Detail View (1-2 days)
1. Create user detail modal/page
2. Display user information
3. Show activity summary
4. Add admin action buttons
5. Implement label/tag editing
6. Test all interactions

### Step 4: Activity Dashboard (3-4 days)
1. Create activity dashboard layout
2. Implement TodayActivityCard
3. Create MAUCard with chart
4. Build ActivityChart component
5. Create LoginTrackingTable
6. Add RecentActivityFeed
7. Implement real-time updates (optional)
8. Test all metrics and charts

### Step 5: Analytics & Reports (2-3 days)
1. Create analytics page
2. Implement DAU/WAU/MAU charts
3. Add engagement metrics
4. Create retention analysis
5. Add export functionality
6. Test all reports

### Step 6: Integration & Testing (1-2 days)
1. Integrate login tracking in auth flow
2. Add activity logging to key actions
3. Test MAU calculation accuracy
4. Performance testing
5. Security audit (especially API keys)
6. User acceptance testing

---

## Phase 5: Security Considerations

### API Keys Security:
1. **Never log API keys** in console or logs
2. **Encrypt at rest** - Use encryption before storing
3. **Mask in UI** - Show only last 4 characters
4. **Secure transmission** - HTTPS only
5. **Access control** - Admin-only access
6. **Audit trail** - Log all key access/changes

### User Privacy:
1. **IP address handling** - Consider GDPR compliance
2. **Activity data retention** - Set retention policies
3. **User consent** - Inform users about tracking
4. **Data anonymization** - For analytics

### Admin Access:
1. **Role-based access control** - Verify admin role
2. **Audit logging** - Log all admin actions
3. **Rate limiting** - Prevent abuse
4. **Session management** - Secure admin sessions

---

## Phase 6: Testing Checklist

### Settings Page:
- [ ] All company fields save correctly
- [ ] API keys hide/show toggle works
- [ ] Copy button copies full key
- [ ] Timezone/currency dropdowns work
- [ ] Form validation works
- [ ] Error handling displays properly

### User Management:
- [ ] User list loads and displays correctly
- [ ] Search filters work
- [ ] Label assignment works
- [ ] Bulk actions work
- [ ] User blocking works
- [ ] Tag management works

### Activity Tracking:
- [ ] Login tracking records correctly
- [ ] Activity logs are created
- [ ] MAU calculation is accurate
- [ ] Dashboard metrics are correct
- [ ] Charts display properly
- [ ] Real-time updates work (if implemented)

---

## Phase 7: Performance Optimization

### Database Queries:
- Use indexes for frequent queries
- Implement pagination for large datasets
- Cache frequently accessed data
- Optimize activity log queries

### Frontend:
- Lazy load components
- Implement virtual scrolling for large lists
- Debounce search inputs
- Optimize chart rendering

---

## Phase 8: Documentation

### User Documentation:
- Settings page guide
- API key management guide
- User label system explanation

### Admin Documentation:
- User management guide
- Activity dashboard guide
- Analytics interpretation guide

### Developer Documentation:
- API reference
- Component documentation
- Database schema reference

---

## Estimated Timeline

- **Phase 1 (Settings)**: 2-3 days
- **Phase 2 (User Management)**: 3-4 days
- **Phase 3 (Activity Dashboard)**: 3-4 days
- **Phase 4 (Analytics)**: 2-3 days
- **Phase 5 (Testing)**: 2-3 days
- **Phase 6 (Polish & Documentation)**: 1-2 days

**Total Estimated Time**: 13-19 days (2-3 weeks)

---

## Priority Order

### High Priority (Must Have):
1. Settings page with company info
2. API keys with hide/show/copy
3. User list with labels
4. Basic activity tracking
5. MAU calculation

### Medium Priority (Should Have):
1. User detail view
2. Activity dashboard
3. Login tracking table
4. Search and filters
5. Bulk actions

### Low Priority (Nice to Have):
1. Advanced analytics
2. Real-time updates
3. Export functionality
4. Custom reports
5. Advanced charts

---

## Next Steps

1. **Review this plan** and confirm requirements
2. **Prioritize features** based on business needs
3. **Start with Phase 1** (Settings page enhancement)
4. **Iterate and test** each phase before moving to next
5. **Gather feedback** from stakeholders

---

## Questions to Consider

1. Should API keys be editable in the UI or set via environment variables?
2. Do you want real-time activity updates or periodic refresh?
3. Should activity data have a retention policy (e.g., keep for 90 days)?
4. Do you need export functionality for reports?
5. Should there be different admin roles (super admin, support admin)?
6. Do you want email notifications for specific events (e.g., user blocked)?

---

## Success Metrics

- Settings page completion rate
- Admin user management efficiency
- MAU tracking accuracy
- Dashboard load time < 2 seconds
- User satisfaction with new features
