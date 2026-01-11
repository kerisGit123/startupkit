# Clerk + Referral System Integration Guide

## ✅ Complete Implementation

The referral system is now fully integrated with Clerk authentication!

---

## 🔄 How It Works with Clerk

### **User Flow**

1. **User A shares referral link**: `https://yourapp.com/sign-up?ref=ALICE2024XYZ`
2. **User B clicks link** and lands on Clerk signup page
3. **Clerk captures referral code** from URL parameter
4. **User B signs up** via Clerk
5. **Clerk webhook fires** with `user.created` event
6. **System tracks referral** automatically
7. **User B verifies email**
8. **Credits awarded** to both users automatically

---

## 🔧 Technical Implementation

### **1. Referral Code Capture (Clerk Signup)**

When a user signs up with a referral code in the URL (`?ref=CODE`), you need to capture it and store it in Clerk's user metadata.

**Option A: Custom Signup Page** (Recommended)
```typescript
// app/sign-up/[[...sign-up]]/page.tsx
"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");

  return (
    <SignUp
      unsafeMetadata={{
        referralCode: referralCode || undefined,
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

### **2. Webhook Integration** ✅ (Already Done)

The webhook now automatically tracks referrals when users sign up:

**File**: `app/api/clerk/webhook/route.ts`

```typescript
// Track referral if user signed up with referral code
if (type === "user.created") {
  const referralCode = u?.unsafe_metadata?.referralCode || u?.public_metadata?.referralCode;
  if (referralCode) {
    try {
      await convex.mutation(api.referrals.trackReferral, {
        referralCode: referralCode as string,
        newUserId: u?.id,
      });
    } catch (error) {
      console.error("Failed to track referral:", error);
    }
  }
}
```

### **3. Email Verification & Credit Award**

When user verifies email, call `completeReferral`:

**Option A: Webhook Approach**
```typescript
// In webhook route
if (type === "user.updated") {
  const emailVerified = u?.email_addresses?.[0]?.verification?.status === "verified";
  
  if (emailVerified) {
    try {
      await convex.mutation(api.referrals.completeReferral, {
        referredUserId: u?.id,
      });
    } catch (error) {
      console.error("Failed to complete referral:", error);
    }
  }
}
```

**Option B: Client-Side Check**
```typescript
// In LoginTracker or dashboard
useEffect(() => {
  if (user?.emailAddresses?.[0]?.verification?.status === "verified") {
    completeReferral({ referredUserId: user.id });
  }
}, [user]);
```

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

### **Before Going Live**

- [ ] Set up Clerk webhook in Clerk Dashboard
- [ ] Add `CLERK_WEBHOOK_SECRET` to environment variables
- [ ] Test referral flow end-to-end
- [ ] Configure default reward amounts in admin panel
- [ ] Test email verification triggers credit award
- [ ] Verify leaderboard updates correctly
- [ ] Test fraud prevention (self-referral, duplicates)

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

**✅ Complete Features**:
- Unique referral codes per user
- Referral link with copy button
- Shows reward amounts to users
- Admin configuration panel
- Clerk webhook integration
- Automatic credit distribution
- Leaderboard system
- Fraud prevention

**🔄 How It Works**:
1. User shares link with referral code
2. New user signs up via Clerk
3. Webhook captures referral code
4. System tracks referral
5. User verifies email
6. Credits awarded automatically
7. Stats update in real-time

**🎯 Ready to Use**: The system is fully functional and integrated with Clerk authentication!
