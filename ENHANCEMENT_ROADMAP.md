# Enhancement Roadmap

This document tracks UI/UX enhancements requested for the StartupKit application.

## ✅ Completed

### 1. Support Tickets - Dashboard Integration
- **Status**: ✅ Completed
- **Files Modified**:
  - `app/support/tickets/page.tsx` - Added DashboardLayout wrapper
  - `app/support/tickets/[id]/page.tsx` - Added DashboardLayout wrapper
- **Result**: Both ticket list and detail pages now have left navigation menu

### 2. Force Fix All Notifications
done

## 📋 Pending Enhancements

### 3. Support Ticket Form as Dialog/Modal
- **Status**: ⏳ Pending
- **Description**: Convert `/support` page to use a dialog/modal instead of full page
- **Reference**: Image 2 from user request
- **Implementation Plan**:
  1. Create `components/SupportTicketDialog.tsx` component
  2. Add trigger button in dashboard
  3. Use shadcn/ui Dialog component
  4. Keep form fields the same, just in modal format

### 4. Admin Ticket Management - Inbox Style
- **Status**: ⏳ Pending
- **Description**: Redesign admin tickets page to look like an email inbox
- **Reference**: Image 4 from user request
- **Features Needed**:
  - Left sidebar with ticket categories/filters
  - Middle panel with ticket list (inbox style)
  - Right panel with ticket detail/conversation
  - Search functionality
  - Status indicators
  - Priority tags
- **Files to Create/Modify**:
  - `app/admin/tickets/page.tsx` - Complete redesign
  - `components/admin/TicketInbox.tsx` - New component
  - `components/admin/TicketList.tsx` - New component
  - `components/admin/TicketDetail.tsx` - New component

### 5. Enhanced Dashboard with Analytics
- **Status**: ⏳ Pending
- **Description**: Add comprehensive dashboard with overview, analytics, reports
- **Reference**: Image 5 from user request
- **Features Needed**:
  - Overview tab with key metrics
  - Analytics tab with charts
  - Reports tab with downloadable reports
  - Notifications tab
  - Date range selector
  - Download report functionality
  - Revenue, subscriptions, sales metrics
  - Recent sales list
- **Files to Create/Modify**:
  - `app/admin/dashboard/page.tsx` - Enhanced dashboard
  - `components/admin/DashboardOverview.tsx` - Overview tab
  - `components/admin/DashboardAnalytics.tsx` - Analytics tab
  - `components/admin/DashboardReports.tsx` - Reports tab
  - `convex/analytics.ts` - Analytics queries

### 6. Settings Page Redesign
- **Status**: ⏳ Pending
- **Description**: Cleaner settings page with left sidebar navigation
- **Reference**: Image 6 from user request
- **Features Needed**:
  - Left sidebar with settings categories (Profile, Account, Appearance, Notifications, Display)
  - Right panel with settings content
  - Clean form layouts
  - Better spacing and typography
  - Input validation
- **Files to Create/Modify**:
  - `app/settings/page.tsx` - Complete redesign
  - `components/settings/SettingsSidebar.tsx` - New component
  - `components/settings/ProfileSettings.tsx` - New component
  - `components/settings/AccountSettings.tsx` - New component
  - `components/settings/AppearanceSettings.tsx` - New component

## Implementation Priority

1.  (DONE)
2.  (DONE)
3. Support Ticket Form as Dialog
4. Admin Ticket Management - Inbox Style
5. Enhanced Dashboard with Analytics
6. Settings Page Redesign

## Notes

- All enhancements should use shadcn/ui components for consistency
- Maintain responsive design for mobile/tablet
- Follow existing color scheme and branding
- Ensure accessibility standards are met
- Add loading states and error handling


