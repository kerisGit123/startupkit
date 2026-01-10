# Admin System Testing Guide

## 🎯 Two Separate Dashboards

Your application now has **TWO distinct dashboards**:

### 1. **User Dashboard** (`/dashboard`)
- **Purpose:** Regular user interface for managing their account
- **Access:** All logged-in users
- **Features:**
  - View account stats (scans, credits, team members)
  - Manage subscription
  - Buy credits
  - View usage and billing
  - Team management
  - Settings

### 2. **Admin Dashboard** (`/admin`)
- **Purpose:** Administrative panel for managing the entire SaaS platform
- **Access:** Only users with admin roles (super_admin, billing_admin, support_admin)
- **Features:**
  - View all users and subscriptions
  - Manage purchases and refunds
  - Handle support tickets
  - View analytics and reports
  - System configuration

---

## 🔄 Switching Between Dashboards

### If You're a Super Admin:

**From User Dashboard → Admin Panel:**
- Look for the **purple "Admin Panel" button** in the top-right corner of `/dashboard`
- Click it to go to `/admin`

**From Admin Panel → User Dashboard:**
- Look for the **"User Dashboard" button** in the admin header
- Click it to go back to `/dashboard`

### Navigation URLs:
- **User Dashboard:** `http://localhost:3000/dashboard`
- **Admin Panel:** `http://localhost:3000/admin`

---

## 📱 Mobile Responsiveness

### Hamburger Menu (Mobile Only)

**On Mobile Devices (screen width < 1024px):**
1. The sidebar is **hidden by default**
2. You'll see a **hamburger menu icon (☰)** in the top-left of the admin header
3. **Click the hamburger** to slide the sidebar in from the left
4. A **semi-transparent backdrop** appears behind the sidebar
5. **Click the backdrop or the X button** to close the sidebar
6. **Click any navigation link** to auto-close the sidebar

**On Desktop (screen width ≥ 1024px):**
- Sidebar is **always visible**
- No hamburger menu shown
- Sidebar is fixed on the left side

---

## ✅ Testing Checklist

### Step 1: Set Yourself as Super Admin

1. Go to Clerk Dashboard: https://dashboard.clerk.com
2. Navigate to **Users** → Find your account
3. Click **Metadata** tab
4. Add to `publicMetadata`:
   ```json
   {
     "role": "super_admin"
   }
   ```
5. **Log out and log back in** to your app

### Step 2: Test User Dashboard

1. Navigate to `http://localhost:3000/dashboard`
2. **You should see:**
   - Welcome message with your name
   - **Purple "Admin Panel" button** in top-right (because you're super admin)
   - Stats cards (Total Scans, Credits Balance, Team Members)
   - Subscription card
   - Credits card
   - Quick links section

3. **Click "Admin Panel" button** → Should redirect to `/admin`

### Step 3: Test Admin Dashboard

1. You should now be at `http://localhost:3000/admin`
2. **You should see:**
   - "Admin Panel" header
   - **"User Dashboard" button** in header (to go back)
   - Sidebar with navigation (Dashboard, Users, Subscriptions, etc.)
   - Dashboard with stats (Total Users, Active Subscriptions, MRR, Open Tickets)
   - Customer Health section
   - Recent Activity section

3. **Click "User Dashboard" button** → Should redirect to `/dashboard`

### Step 4: Test Mobile Responsiveness

**Option A: Use Browser DevTools**
1. Open Chrome DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select a mobile device (e.g., iPhone 12 Pro)
4. Navigate to `/admin`

**Option B: Resize Browser Window**
1. Make your browser window narrow (< 1024px wide)
2. Navigate to `/admin`

**What to Test:**
1. **Hamburger menu should be visible** in top-left corner
2. **Sidebar should be hidden** by default
3. **Click hamburger** → Sidebar slides in from left
4. **Backdrop appears** (semi-transparent black overlay)
5. **Click backdrop or X** → Sidebar closes
6. **Click any nav link** → Sidebar auto-closes and navigates

### Step 5: Test Admin Navigation

In the admin panel, test all navigation links:
- ✅ Dashboard (`/admin`)
- ✅ Users (`/admin/users`) - Super admin only
- ✅ Subscriptions (`/admin/subscriptions`) - Super admin & billing admin
- ✅ Purchases (`/admin/purchases`) - Super admin & billing admin
- ✅ Tickets (`/admin/tickets`) - Super admin & support admin
- ✅ Analytics (`/admin/analytics`) - Super admin & billing admin
- ✅ Settings (`/admin/settings`) - Super admin only

---

## 🐛 Troubleshooting

### Issue: "I don't see the Admin Panel button on /dashboard"

**Solution:**
1. Make sure you set `"role": "super_admin"` in Clerk metadata
2. Log out and log back in
3. Check browser console for errors
4. Verify you're on `/dashboard` not `/admin`

### Issue: "I can't access /admin, it redirects me to /dashboard"

**Solution:**
1. You don't have an admin role assigned
2. Go to Clerk Dashboard and add admin role to your user
3. Log out and log back in

### Issue: "Hamburger menu not visible on mobile"

**Solution:**
1. Make sure your screen width is < 1024px
2. Check if you're actually on `/admin` (not `/dashboard`)
3. Try hard refresh (Ctrl+Shift+R)
4. Check browser console for errors

### Issue: "Sidebar doesn't slide/animate"

**Solution:**
1. Make sure JavaScript is enabled
2. Check browser console for errors
3. Try clearing browser cache
4. Ensure you're using a modern browser (Chrome, Firefox, Safari, Edge)

---

## 📊 Role-Based Access

### Super Admin
- **Can access:** Everything
- **Sees in sidebar:** Dashboard, Users, Subscriptions, Purchases, Tickets, Analytics, Settings
- **Can switch:** Between user dashboard and admin panel

### Billing Admin
- **Can access:** Billing-related features
- **Sees in sidebar:** Dashboard, Subscriptions, Purchases, Analytics
- **Cannot access:** Users, Tickets, Settings

### Support Admin
- **Can access:** Support-related features
- **Sees in sidebar:** Dashboard, Tickets
- **Cannot access:** Users, Subscriptions, Purchases, Analytics, Settings

---

## 🎨 Visual Indicators

### User Dashboard
- **Background:** Light gray (`bg-gray-100`)
- **Cards:** White with rounded corners
- **Primary color:** Yellow (`bg-yellow-400`)
- **Admin button:** Purple (`bg-purple-600`)

### Admin Dashboard
- **Background:** Light gray (`bg-gray-50`)
- **Sidebar:** White with yellow highlights for active items
- **Header:** White with sticky positioning
- **Primary color:** Yellow for active states

---

## 📝 Next Steps

After testing the basic functionality:

1. **Phase 2:** User & Subscription Management
   - View all users
   - Manage subscriptions
   - Process refunds
   - Customer health scores

2. **Phase 3:** Ticketing System
   - Create support tickets
   - Assign tickets to admins
   - SLA tracking
   - Email notifications

3. **Phase 4:** Analytics & Reporting
   - Revenue analytics (MRR, ARR, churn)
   - User analytics
   - Data exports

---

## 🔗 Quick Links

- **User Dashboard:** http://localhost:3000/dashboard
- **Admin Panel:** http://localhost:3000/admin
- **Pricing Page:** http://localhost:3000/pricing
- **Clerk Dashboard:** https://dashboard.clerk.com

---

## ✨ Summary

You now have:
- ✅ **Two separate dashboards** (user and admin)
- ✅ **Easy switching** between dashboards for super admins
- ✅ **Mobile-responsive** admin panel with hamburger menu
- ✅ **Role-based access control** (3 admin roles)
- ✅ **Clean navigation** with visual indicators

**Test it now!** Set your role in Clerk and start exploring both dashboards! 🚀
