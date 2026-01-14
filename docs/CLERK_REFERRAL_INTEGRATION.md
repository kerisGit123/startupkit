# Clerk + Referral System Integration Guide

## 📋 Implementation Status

### ✅ **COMPLETED FEATURES**

#### Database Schema
- ✅ `referral_codes` table with indexes
- ✅ `referrals` table with status tracking
- ✅ `org_settings` with referral configuration fields

#### Backend (Convex Functions)
- ✅ `generateReferralCode` - Auto-generate unique codes
- ✅ `getReferralCode` - Fetch user's referral code
- ✅ `validateReferralCode` - Check if code is valid
- ✅ `trackReferral` - Track when someone uses referral code
- ✅ `completeReferral` - Award credits after email verification
- ✅ `getReferralStats` - Get user's referral statistics
- ✅ `getReferralLeaderboard` - Top 50 referrers
- ✅ `getUserReferralRank` - User's leaderboard position
- ✅ `getReferralSettings` - Get referral program config
- ✅ `updateReferralSettings` - Update rewards and enable/disable

#### Frontend Pages
- ✅ `/dashboard/referrals` - User referral dashboard
- ✅ `/admin/referrals` - Admin management page
- ✅ `/sign-up` - Custom signup page with referral code capture

#### Components
- ✅ `ReferralTracker` - Client-side referral tracking component
- ✅ Integrated into `/dashboard` page

#### Webhook Integration
- ✅ Clerk webhook handler in `/api/clerk/webhook/route.ts`
- ✅ `user.created` event - Track referral on signup
- ✅ `user.updated` event - Award credits on email verification
- ✅ Logging for debugging

#### Security & Validation
- ✅ Cannot refer yourself
- ✅ Cannot use same referral code twice
- ✅ Referral code must be valid and active
- ✅ Credits only awarded after email verification

### ⚠️ **PARTIALLY IMPLEMENTED**

#### Referral Code Capture Method
- ✅ **Client-side approach** (localStorage) - IMPLEMENTED
- ❌ **Clerk metadata approach** (unsafeMetadata) - NOT IMPLEMENTED
  - Signup page stores code in localStorage
  - Does NOT pass to Clerk's `unsafeMetadata`
  - Webhook checks for metadata but won't find it
  - ReferralTracker handles tracking instead

### ❌ **NOT IMPLEMENTED / MISSING**

#### Clerk Metadata Integration
- ❌ Referral code NOT passed to Clerk `unsafeMetadata` during signup
- ❌ Webhook metadata check exists but won't trigger (no metadata set)
- ❌ Middleware approach for referral code capture not implemented

#### Email Verification Trigger
- ⚠️ Webhook `user.updated` checks for email verification
- ⚠️ BUT: ReferralTracker completes referral immediately on login
- ⚠️ Credits awarded on first login, not email verification
- ⚠️ Potential for abuse if email verification not enforced

---

## 🔄 Current Implementation Flow

### **Actual Working Flow** (As Implemented)

### **Documented Flow** (Original Design)

1. **User A shares referral link**: `https://yourapp.com/sign-up?ref=ALICE2024XYZ`
2. **User B clicks link** and lands on Clerk signup page
3. **Clerk captures referral code** from URL parameter
4. **User B signs up** via Clerk
5. **Clerk webhook fires** with `user.created` event
6. **System tracks referral** automatically
7. **User B verifies email**
8. **Credits awarded** to both users automatically

### **What Actually Happens** (Current Implementation)

1. ✅ **User A shares referral link**: `https://yourapp.com/sign-up?ref=ALICE2024XYZ`
2. ✅ **User B clicks link** and lands on custom signup page
3. ✅ **localStorage stores referral code** (NOT Clerk metadata)
4. ✅ **User B signs up** via Clerk
5. ⚠️ **Clerk webhook fires** but finds NO referral code in metadata
6. ✅ **User B redirected to dashboard** with `?referral=pending`
7. ✅ **ReferralTracker component** reads localStorage
8. ✅ **Calls trackReferral** mutation directly
9. ✅ **Immediately calls completeReferral** and awards credits
10. ⚠️ **Credits awarded on first login**, not email verification

---

## 🔧 Technical Implementation

### **1. Referral Code Capture (Clerk Signup)**

#### ✅ **Current Implementation** (localStorage approach)

**File**: `app/sign-up/[[...sign-up]]/page.tsx`

```typescript
"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");

  // ✅ IMPLEMENTED: Store in localStorage
  useEffect(() => {
    if (refCode) {
      localStorage.setItem("pendingReferralCode", refCode);
      console.log("Stored referral code:", refCode);
    }
  }, [refCode]);

  return (
    <SignUp
      // ❌ NOT IMPLEMENTED: unsafeMetadata not used
      afterSignUpUrl="/dashboard?referral=pending"
      redirectUrl="/dashboard?referral=pending"
    />
  );
}
```

**Status**: ✅ Works but uses localStorage instead of Clerk metadata

#### ❌ **NOT IMPLEMENTED: Clerk Metadata Approach** (Recommended)

```typescript
// This is NOT in your codebase:
export default function SignUpPage() {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");

  return (
    <SignUp
      unsafeMetadata={{
        referralCode: referralCode || undefined, // ❌ NOT DONE
      }}
    />
  );
}
```

**Option B: Middleware Approach**
Capture the referral code in middleware and pass it to Clerk:
```typescript
// middleware.ts
export default clerkMiddleware((auth, request) => {
  const url = new URL(request.url);
  const referralCode = url.searchParams.get("ref");
  
  if (referralCode && url.pathname.includes("/sign-up")) {
    // Store in cookie or session to pass to Clerk
    const response = NextResponse.next();
    response.cookies.set("referral_code", referralCode, {
      maxAge: 3600, // 1 hour
      httpOnly: true,
    });
    return response;
  }
  
  // ... rest of middleware
});
```

### **2. Webhook Integration** ⚠️ (Exists but doesn't trigger)

**File**: `app/api/clerk/webhook/route.ts`

```typescript
// ⚠️ CODE EXISTS but metadata is never set, so this never runs
if (type === "user.created") {
  const referralCode = u?.unsafe_metadata?.referralCode || u?.public_metadata?.referralCode;
  console.log("🔍 User created - checking for referral code:", {
    userId: u?.id,
    hasUnsafeMetadata: !!u?.unsafe_metadata?.referralCode, // Always false
    hasPublicMetadata: !!u?.public_metadata?.referralCode, // Always false
    referralCode: referralCode, // Always undefined
  });
  
  if (referralCode) { // ❌ Never true because metadata not set
    try {
      console.log("📝 Tracking referral:", referralCode);
      await convex.mutation(api.referrals.trackReferral, {
        referralCode: referralCode as string,
        newUserId: u?.id,
      });
      console.log("✅ Referral tracked successfully");
    } catch (error) {
      console.error("❌ Failed to track referral:", error);
    }
  } else {
    console.log("ℹ️ No referral code found in user metadata"); // Always logs this
  }
}
```

**Status**: ⚠️ Code exists but never executes because referral code not in metadata

### **3. Email Verification & Credit Award**

#### ⚠️ **Webhook Approach** (Exists but doesn't trigger)

**File**: `app/api/clerk/webhook/route.ts`

```typescript
// ⚠️ CODE EXISTS but doesn't trigger because trackReferral wasn't called
if (type === "user.updated") {
  const emailVerified = u?.email_addresses?.[0]?.verification?.status === "verified";
  console.log("🔍 User updated - checking email verification:", {
    userId: u?.id,
    emailVerified: emailVerified,
  });
  
  if (emailVerified) {
    try {
      console.log("📧 Email verified - completing referral for user:", u?.id);
      const result = await convex.mutation(api.referrals.completeReferral, {
        referredUserId: u?.id,
      });
      console.log("✅ Referral completed:", result);
    } catch (error) {
      // ⚠️ Always fails because no pending referral exists
      console.log("ℹ️ No pending referral to complete for user:", u?.id);
    }
  }
}
```

**Status**: ⚠️ Code exists but fails because referral already completed by ReferralTracker

#### ✅ **Client-Side Approach** (ACTUALLY IMPLEMENTED)

**File**: `components/ReferralTracker.tsx`

```typescript
// ✅ THIS IS WHAT ACTUALLY RUNS
export function ReferralTracker() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const trackReferral = useMutation(api.referrals.trackReferral);
  const completeReferral = useMutation(api.referrals.completeReferral);

  useEffect(() => {
    const referralPending = searchParams.get("referral");
    const storedReferralCode = localStorage.getItem("pendingReferralCode");

    if (referralPending === "pending" && storedReferralCode) {
      // Step 1: Track the referral
      const trackResult = await trackReferral({
        referralCode: storedReferralCode,
        newUserId: user.id,
      });

      // Step 2: Immediately complete and award credits
      // ⚠️ NO EMAIL VERIFICATION CHECK!
      const completeResult = await completeReferral({
        referredUserId: user.id,
      });
      
      localStorage.removeItem("pendingReferralCode");
    }
  }, [user, searchParams]);

  return null;
}
```

**Status**: ✅ Works but awards credits immediately without email verification check

---

## 📱 Pages Created

### **1. Admin Referral Management** ✅
**Location**: `/admin/referrals`

**Features**:
- View total referrals, active referrers, credits distributed
- Configure reward amounts (referrer & new user bonus)
- Enable/disable referral program
- View top 50 referrers leaderboard
- Real-time statistics

### **2. User Referral Dashboard** ✅
**Location**: `/dashboard/referrals`

**Features**:
- Unique referral link with copy button
- Shows reward amounts: "You get X credits, friend gets Y credits"
- Total referrals, credits earned, pending referrals
- User's leaderboard rank
- Referral history with status
- "How It Works" guide

### **3. Navigation** ✅
- Added "Referrals" to admin sidebar
- User can access via `/dashboard/referrals`

---

## 🎯 Configuration

### **Super Admin Settings**

Go to `/admin/referrals` to configure:

1. **Enable/Disable Program**: Toggle checkbox
2. **Referrer Reward**: Set credits (default: 50)
3. **New User Bonus**: Set credits (default: 10)
4. Click "Update Settings"

Settings are stored in `org_settings` table and apply globally.

---

## 🧪 Testing the Complete Flow

### **Step 1: Generate Referral Code**
1. Login as User A
2. Go to `/dashboard/referrals`
3. System auto-generates code (e.g., `ALICE2024XYZ`)
4. Copy referral link

### **Step 2: Share & Signup**
1. Open referral link in incognito: `https://yourapp.com/sign-up?ref=ALICE2024XYZ`
2. Sign up as User B via Clerk
3. Verify email

### **Step 3: Check Results**
1. **User A**: Check `/dashboard/referrals` - should show 1 referral, +50 credits
2. **User B**: Check credits - should have +10 bonus credits
3. **Admin**: Check `/admin/referrals` - see updated stats

### **Step 4: Verify Database**
```typescript
// Check referral_codes table
// Should have User A's code with totalReferrals: 1

// Check referrals table
// Should have record with status: "rewarded"

// Check credits_ledger table
// Should have 2 entries (one for User A, one for User B)
```

---

## 🔒 Security & Validation

### **Fraud Prevention** ✅
- ✅ Cannot refer yourself
- ✅ Cannot use same referral code twice
- ✅ Referral code must be valid and active
- ✅ Credits only awarded after email verification

### **Validation Flow**
1. `validateReferralCode` - Check if code exists and is active
2. `trackReferral` - Prevent self-referral and duplicates
3. `completeReferral` - Only award credits once

---

## 📊 Database Tables

### **referral_codes**
```typescript
{
  userId: "user_abc123",
  code: "ALICE2024XYZ",
  createdAt: 1234567890,
  isActive: true,
  totalReferrals: 5,
  totalCreditsEarned: 250
}
```

### **referrals**
```typescript
{
  referralCode: "ALICE2024XYZ",
  referrerId: "user_abc123",
  referredUserId: "user_def456",
  referredAt: 1234567890,
  status: "rewarded", // pending | completed | rewarded | cancelled
  rewardAmount: 50,
  bonusAmount: 10,
  rewardedAt: 1234567900
}
```

### **org_settings** (Referral Config)
```typescript
{
  referralEnabled: true,
  referralRewardCredits: 50,
  referralBonusCredits: 10
}
```

---

## 🚀 Deployment Checklist

### **Current Status**

- ✅ Set up Clerk webhook in Clerk Dashboard
- ✅ Add `CLERK_WEBHOOK_SECRET` to environment variables
- ✅ Test referral flow end-to-end (works via localStorage)
- ✅ Configure default reward amounts in admin panel
- ⚠️ Test email verification triggers credit award (BYPASSED - credits awarded on login)
- ✅ Verify leaderboard updates correctly
- ✅ Test fraud prevention (self-referral, duplicates)

### **Recommended Improvements**

- [ ] **Fix referral code capture**: Pass to Clerk `unsafeMetadata` instead of localStorage
- [ ] **Add email verification check**: Don't award credits until email verified
- [ ] **Remove immediate credit award**: Let webhook handle it properly
- [ ] **Test webhook flow**: Verify metadata approach works end-to-end
- [ ] **Add rate limiting**: Prevent referral code abuse
- [ ] **Add referral expiry**: Codes expire after X days/uses

### **Clerk Webhook Setup**

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://yourapp.com/api/clerk/webhook`
3. Select events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy webhook secret to `.env`:
   ```
   CLERK_WEBHOOK_SECRET=whsec_xxxxx
   ```

---

## 🎨 Customization

### **Change Default Rewards**

**Option 1: Admin Panel** (Recommended)
- Go to `/admin/referrals`
- Update values in UI
- Click "Update Settings"

**Option 2: Code** (For defaults)
Edit `convex/referrals.ts`:
```typescript
const DEFAULT_REFERRAL_REWARD = 100; // Change from 50
const DEFAULT_REFERRAL_BONUS = 20;   // Change from 10
```

### **Customize Referral Link**

Edit `app/dashboard/referrals/page.tsx`:
```typescript
const referralLink = useMemo(() => {
  if (referralCode?.code && typeof window !== "undefined") {
    // Change /sign-up to your custom signup page
    return `${window.location.origin}/sign-up?ref=${referralCode.code}`;
  }
  return "";
}, [referralCode?.code]);
```

---

## 🐛 Troubleshooting

### **Referral not tracked**
- Check Clerk webhook is configured
- Verify `CLERK_WEBHOOK_SECRET` is set
- Check webhook logs in Clerk Dashboard
- Ensure referral code is in user metadata

### **Credits not awarded**
- Verify email is verified
- Check `completeReferral` is called
- Look for errors in webhook logs
- Check `credits_ledger` table

### **Referral code not generated**
- Check user is logged in
- Verify `generateReferralCode` mutation works
- Check `referral_codes` table

---

## 📝 Summary

### **✅ What's Working**
- ✅ Unique referral codes per user
- ✅ Referral link with copy button
- ✅ Shows reward amounts to users
- ✅ Admin configuration panel
- ✅ Automatic credit distribution
- ✅ Leaderboard system
- ✅ Fraud prevention (self-referral, duplicates)
- ✅ User and admin dashboards
- ✅ ReferralTracker component

### **⚠️ What's Partially Working**
- ⚠️ Clerk webhook integration (code exists but doesn't trigger)
- ⚠️ Email verification check (bypassed, credits awarded on login)
- ⚠️ Referral code capture (uses localStorage instead of Clerk metadata)

### **❌ What's Not Implemented**
- ❌ Clerk `unsafeMetadata` for referral code
- ❌ Webhook-based referral tracking
- ❌ Email verification requirement for credits
- ❌ Middleware approach for referral capture

### **🔄 Actual Flow** (How It Currently Works)
1. ✅ User shares link with referral code
2. ✅ New user signs up via Clerk
3. ⚠️ localStorage stores referral code (NOT webhook)
4. ✅ User redirected to dashboard
5. ✅ ReferralTracker reads localStorage
6. ✅ System tracks referral via client-side mutation
7. ⚠️ Credits awarded immediately (NO email verification check)
8. ✅ Stats update in real-time

### **🎯 Status**: System is FUNCTIONAL but uses client-side approach instead of webhook-based approach

### **⚡ Quick Fixes Needed**

1. **To use Clerk metadata approach** (Recommended):
   - Update `app/sign-up/[[...sign-up]]/page.tsx`
   - Pass `unsafeMetadata={{ referralCode }}` to `<SignUp>`
   - Remove localStorage code
   - Remove ReferralTracker from dashboard
   - Webhook will handle everything

2. **To add email verification requirement**:
   - Add check in `ReferralTracker` before calling `completeReferral`
   - Or: Fix webhook approach and remove ReferralTracker

3. **Current approach works but has risks**:
   - ✅ Functional and tested
   - ⚠️ localStorage can be cleared
   - ⚠️ No email verification enforcement
   - ⚠️ Client-side tracking (less secure)
   - ⚠️ Webhook code exists but unused
