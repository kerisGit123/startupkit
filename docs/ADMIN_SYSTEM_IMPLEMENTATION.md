# Admin System Implementation Plan

## Overview
This document outlines the implementation plan for adding a comprehensive admin system to the SaaS platform. The system will support role-based access control (RBAC) with three admin tiers and include subscription management, purchase tracking, and a ticketing/dispute system.

---

## 1. Admin Role Structure

### 1.1 Role Hierarchy

**Super Admin (Full Access)**
- Complete system access
- User management (view, edit, delete users)
- Subscription & billing management
- Dispute & ticket management
- Analytics & reporting
- System configuration
- Can assign/revoke admin roles

**Billing Admin (Financial Operations)**
- View all subscriptions and purchases
- View payment history
- Manage refunds
- View Stripe disputes
- Export financial reports
- Cannot access support tickets
- Cannot manage users

**Support Admin (Customer Support)**
- View user profiles (limited)
- Manage support tickets/disputes
- View subscription status (read-only)
- Cannot process refunds
- Cannot access financial analytics
- Cannot manage users

### 1.2 Clerk Configuration

**Setting up roles in Clerk:**

1. **Using Clerk Metadata (Recommended)**
   - Add custom metadata to user object
   - Store in `publicMetadata` for client-side access
   - Store in `privateMetadata` for server-side only

   ```typescript
   // User metadata structure
   {
     publicMetadata: {
       role: "super_admin" | "billing_admin" | "support_admin" | "user"
     },
     privateMetadata: {
       adminPermissions: {
         canManageUsers: boolean,
         canManageBilling: boolean,
         canManageTickets: boolean,
         canAccessAnalytics: boolean
       }
     }
   }
   ```

2. **Manual Assignment Process:**
   - Go to Clerk Dashboard → Users
   - Select a user
   - Click "Metadata" tab
   - Add to `publicMetadata`:
     ```json
     {
       "role": "super_admin"
     }
     ```

3. **Programmatic Assignment (Recommended):**
   - Create an admin API endpoint
   - Use Clerk's `clerkClient.users.updateUserMetadata()`
   - Protect with super admin check

---

## 2. Database Schema Extensions

### 2.1 New Convex Tables

**admin_activity_logs**
```typescript
{
  _id: Id<"admin_activity_logs">,
  adminUserId: string,        // Clerk user ID
  adminEmail: string,
  action: string,             // "view_user", "refund_payment", "close_ticket"
  targetType: string,         // "user", "subscription", "ticket"
  targetId: string,
  details: object,            // Additional context
  ipAddress: string,
  createdAt: number
}
```

**support_tickets**
```typescript
{
  _id: Id<"support_tickets">,
  ticketNumber: string,       // "TKT-2024-0001"
  companyId: string,
  userId: string,
  userEmail: string,
  subject: string,
  description: string,
  category: "billing" | "technical" | "dispute" | "general",
  priority: "low" | "medium" | "high" | "urgent",
  status: "open" | "in_progress" | "waiting_customer" | "resolved" | "closed",
  assignedTo?: string,        // Admin user ID
  stripeDisputeId?: string,   // Link to Stripe dispute
  relatedSubscriptionId?: string,
  relatedPaymentId?: string,
  createdAt: number,
  updatedAt: number,
  resolvedAt?: number
}
```

**ticket_messages**
```typescript
{
  _id: Id<"ticket_messages">,
  ticketId: Id<"support_tickets">,
  senderId: string,           // User or admin ID
  senderType: "customer" | "admin",
  senderName: string,
  message: string,
  attachments?: string[],     // URLs to uploaded files
  isInternal: boolean,        // Internal admin notes
  createdAt: number
}
```

**admin_users**
```typescript
{
  _id: Id<"admin_users">,
  clerkUserId: string,
  email: string,
  role: "super_admin" | "billing_admin" | "support_admin",
  permissions: {
    canManageUsers: boolean,
    canManageBilling: boolean,
    canManageTickets: boolean,
    canAccessAnalytics: boolean,
    canManageAdmins: boolean
  },
  isActive: boolean,
  createdAt: number,
  createdBy: string,          // Admin who created this admin
  lastLoginAt?: number
}
```

---

## 3. Admin Dashboard Structure

### 3.1 Navigation Layout

```
/admin
├── /dashboard              (Overview & Analytics)
├── /users                  (User Management)
│   ├── /[userId]          (User Detail)
│   └── /activity          (User Activity Logs)
├── /subscriptions         (Subscription Management)
│   ├── /active            (Active Subscriptions)
│   ├── /canceled          (Canceled Subscriptions)
│   └── /[subscriptionId]  (Subscription Detail)
├── /purchases             (Credit Purchases)
│   ├── /all               (All Purchases)
│   └── /[purchaseId]      (Purchase Detail)
├── /tickets               (Support Tickets)
│   ├── /open              (Open Tickets)
│   ├── /assigned          (My Assigned Tickets)
│   └── /[ticketId]        (Ticket Detail)
├── /disputes              (Stripe Disputes)
│   └── /[disputeId]       (Dispute Detail)
├── /analytics             (Analytics & Reports)
│   ├── /revenue           (Revenue Analytics)
│   ├── /users             (User Analytics)
│   └── /exports           (Data Exports)
└── /settings              (Admin Settings)
    ├── /admins            (Manage Admins)
    └── /permissions       (Role Permissions)
```

### 3.2 Dashboard Components

**Overview Dashboard (/admin/dashboard)**
- Total users count
- Active subscriptions count
- Monthly recurring revenue (MRR)
- Total credits purchased this month
- Open tickets count
- Recent activity feed
- Revenue chart (last 30 days)
- New users chart
- Quick actions (Create ticket, View disputes)

**User Management (/admin/users)**
- Searchable user list
- Filters: Plan type, Status, Registration date
- Columns: Email, Company, Plan, Status, Credits, Joined Date
- Actions: View details, Impersonate (super admin only), Suspend
- Export to CSV

**Subscription Management (/admin/subscriptions)**
- List all subscriptions
- Filters: Plan, Status, Billing cycle
- Columns: User, Plan, Status, MRR, Next billing, Actions
- Actions: View in Stripe, Cancel, Refund
- Subscription history timeline

**Purchase Management (/admin/purchases)**
- List all credit purchases
- Filters: Date range, Amount, Status
- Columns: User, Credits, Amount, Date, Payment status
- Actions: View receipt, Refund
- Export to CSV

**Ticket System (/admin/tickets)**
- Ticket list with filters
- Kanban board view (Open, In Progress, Resolved)
- Ticket detail with message thread
- Internal notes (admin-only)
- Link to related subscription/payment
- Auto-link Stripe disputes
- Email notifications

---

## 4. Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** Set up admin roles and basic access control

- [ ] Create Convex schema for admin tables
- [ ] Implement admin role middleware
- [ ] Create admin layout component
- [ ] Set up admin navigation
- [ ] Create role check hooks (`useIsAdmin`, `useIsSuperAdmin`)
- [ ] Add admin role assignment API endpoint
- [ ] Create admin dashboard landing page

**Files to Create:**
- `convex/admin.ts` - Admin user management
- `convex/adminLogs.ts` - Activity logging
- `middleware/adminAuth.ts` - Admin authentication
- `hooks/useAdminRole.ts` - Role checking hooks
- `app/admin/layout.tsx` - Admin layout
- `app/admin/dashboard/page.tsx` - Dashboard overview

### Phase 2: User & Subscription Management (Week 2)
**Goal:** View and manage users, subscriptions, and purchases

- [ ] Create user list page with search/filters
- [ ] Create user detail page
- [ ] Create subscription list page
- [ ] Create subscription detail page
- [ ] Create purchase history page
- [ ] Add Stripe integration for refunds
- [ ] Implement activity logging
- [ ] Add export to CSV functionality

**Files to Create:**
- `app/admin/users/page.tsx` - User list
- `app/admin/users/[userId]/page.tsx` - User detail
- `app/admin/subscriptions/page.tsx` - Subscription list
- `app/admin/subscriptions/[id]/page.tsx` - Subscription detail
- `app/admin/purchases/page.tsx` - Purchase list
- `convex/adminUsers.ts` - User management queries
- `convex/adminSubscriptions.ts` - Subscription queries
- `app/api/admin/refund/route.ts` - Refund API

### Phase 3: Ticketing System (Week 3)
**Goal:** Build support ticket and dispute management

- [ ] Create ticket schema and mutations
- [ ] Create ticket list page
- [ ] Create ticket detail page with messaging
- [ ] Implement ticket assignment
- [ ] Add email notifications
- [ ] Create customer ticket submission form
- [ ] Integrate Stripe disputes
- [ ] Add internal notes feature

**Files to Create:**
- `convex/tickets.ts` - Ticket management
- `convex/ticketMessages.ts` - Ticket messages
- `app/admin/tickets/page.tsx` - Ticket list
- `app/admin/tickets/[ticketId]/page.tsx` - Ticket detail
- `app/support/page.tsx` - Customer ticket form
- `app/api/tickets/create/route.ts` - Ticket creation
- `app/api/tickets/notify/route.ts` - Email notifications
- `components/admin/TicketThread.tsx` - Message thread

### Phase 4: Analytics & Reporting (Week 4)
**Goal:** Add analytics dashboard and reporting

- [ ] Create analytics queries
- [ ] Build revenue analytics page
- [ ] Build user analytics page
- [ ] Add chart components (revenue, users, subscriptions)
- [ ] Implement data export functionality
- [ ] Add admin activity logs viewer
- [ ] Create scheduled reports (optional)

**Files to Create:**
- `convex/analytics.ts` - Analytics queries
- `app/admin/analytics/page.tsx` - Analytics dashboard
- `app/admin/analytics/revenue/page.tsx` - Revenue analytics
- `app/admin/analytics/users/page.tsx` - User analytics
- `components/admin/RevenueChart.tsx` - Chart component
- `app/api/admin/export/route.ts` - Data export

---

## 5. Security Considerations

### 5.1 Access Control

**Middleware Protection:**
```typescript
// middleware/adminAuth.ts
export async function requireAdmin(req: Request, minRole: AdminRole) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");
  
  const user = await clerkClient.users.getUser(userId);
  const role = user.publicMetadata.role as string;
  
  if (!isAdminRole(role)) throw new Error("Forbidden");
  if (!hasMinimumRole(role, minRole)) throw new Error("Insufficient permissions");
  
  return { userId, role };
}
```

**API Route Protection:**
```typescript
// app/api/admin/users/route.ts
export async function GET(req: Request) {
  await requireAdmin(req, "billing_admin");
  // ... admin logic
}
```

### 5.2 Activity Logging

Log all admin actions:
- User views
- Subscription changes
- Refunds processed
- Tickets accessed
- Role changes
- Data exports

### 5.3 Data Privacy

- Mask sensitive data (payment methods, full card numbers)
- Implement IP-based access restrictions (optional)
- Add 2FA requirement for super admins
- Log all admin access to user data
- Implement data retention policies

---

## 6. UI/UX Recommendations

### 6.1 Design System

**Color Coding:**
- Super Admin: Purple badge
- Billing Admin: Blue badge
- Support Admin: Green badge
- User: Gray badge

**Status Indicators:**
- Active subscriptions: Green
- Canceled: Orange
- Past due: Red
- Open tickets: Blue
- Resolved tickets: Green

### 6.2 Key Features

**Quick Actions:**
- Search bar in header (search users, tickets, subscriptions)
- Quick stats cards on dashboard
- Recent activity feed
- Notification bell for new tickets/disputes

**Filters & Sorting:**
- Date range pickers
- Multi-select filters
- Saved filter presets
- Export filtered results

**Responsive Design:**
- Mobile-friendly admin panel
- Collapsible sidebar
- Table pagination
- Infinite scroll for activity feeds

---

## 7. Integration Points

### 7.1 Stripe Integration

**Webhook Enhancements:**
- Listen for `charge.dispute.created`
- Auto-create tickets for disputes
- Link disputes to subscriptions
- Notify billing admins

**Admin Actions:**
- Process refunds via Stripe API
- View payment intent details
- Access customer portal links
- Download invoices

### 7.2 Email Notifications

**Notification Types:**
- New ticket created → Notify support admins
- Ticket assigned → Notify assigned admin
- Ticket message → Notify customer & assigned admin
- Dispute created → Notify billing admins
- Subscription canceled → Notify billing admins

**Email Service:**
- Use Resend (already configured)
- Create email templates
- Add unsubscribe links
- Track email delivery

### 7.3 Clerk Integration

**User Management:**
- View Clerk user details
- Update user metadata
- Suspend/unsuspend users
- View login history

---

## 8. Testing Strategy

### 8.1 Test Cases

**Role-Based Access:**
- [ ] Super admin can access all pages
- [ ] Billing admin cannot access tickets
- [ ] Support admin cannot process refunds
- [ ] Regular users cannot access /admin

**Functionality:**
- [ ] Create and assign tickets
- [ ] Process refunds
- [ ] Export data to CSV
- [ ] Search users and subscriptions
- [ ] Activity logging works correctly

### 8.2 Test Users

Create test users for each role:
- `superadmin@test.com` - Super Admin
- `billing@test.com` - Billing Admin
- `support@test.com` - Support Admin
- `user@test.com` - Regular User

---

## 9. Deployment Checklist

**Pre-Launch:**
- [ ] Set up first super admin in Clerk
- [ ] Test all admin endpoints
- [ ] Verify role permissions
- [ ] Test email notifications
- [ ] Review activity logging
- [ ] Test data exports
- [ ] Security audit
- [ ] Performance testing

**Post-Launch:**
- [ ] Monitor admin activity logs
- [ ] Collect admin feedback
- [ ] Iterate on UI/UX
- [ ] Add additional analytics
- [ ] Implement scheduled reports

---

## 10. Future Enhancements

**Phase 5+ (Optional):**
- Advanced analytics (cohort analysis, churn prediction)
- Automated ticket routing based on keywords
- AI-powered ticket response suggestions
- Multi-language support for tickets
- Mobile app for admin panel
- Webhook management UI
- A/B testing dashboard
- Customer health scores
- Automated dunning management
- Integration with Slack/Discord for notifications

---

## 11. Estimated Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 | 1 week | Admin foundation, roles, basic dashboard |
| Phase 2 | 1 week | User & subscription management |
| Phase 3 | 1 week | Ticketing system |
| Phase 4 | 1 week | Analytics & reporting |
| **Total** | **4 weeks** | **Complete admin system** |

---

## 12. Getting Started

### Step 1: Set Up First Super Admin

1. Go to Clerk Dashboard
2. Select your user account
3. Add to `publicMetadata`:
   ```json
   {
     "role": "super_admin"
   }
   ```

### Step 2: Create Admin Tables in Convex

Run the Convex schema updates to create the new tables.

### Step 3: Build Foundation

Start with Phase 1 implementation.

---

## Questions to Consider

1. **Do you want to implement all phases, or start with specific features?**
2. **Should we add impersonation feature for super admins?**
3. **Do you need multi-tenant admin (different admins per organization)?**
4. **Should admins have access to user's actual dashboard (read-only)?**
5. **Do you want automated ticket categorization using AI?**

---

## Next Steps

Once you approve this plan, I can start implementing:
1. Phase 1: Admin foundation and role system
2. Create the Convex schema
3. Build the admin layout and navigation
4. Implement role-based middleware

Let me know if you'd like to proceed or if you want to modify any part of this plan!
