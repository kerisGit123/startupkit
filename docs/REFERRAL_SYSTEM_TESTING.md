# Referral System Testing Guide

## System Overview

The referral system tracks when users sign up using a referral link and awards credits to both parties:
- **Referrer**: Gets reward credits (configurable, default 30)
- **New User**: Gets bonus credits (configurable, default 11)

## How It Works

### 1. Referral Link Generation
- Every user automatically gets a unique referral code (e.g., `KERISN34F8N`)
- Referral link format: `https://your-domain.com/sign-up?ref=KERISN34F8N`
- Users can find their link on `/dashboard` or `/dashboard/referrals`

### 2. Sign-Up Flow
1. New user clicks referral link
2. Sign-up page stores referral code in localStorage
3. User completes Clerk signup
4. Redirects to `/dashboard?referral=pending`
5. `ReferralTracker` component activates
6. Calls `trackReferral` mutation
7. Creates pending referral record

### 3. Credit Distribution
1. New user verifies email
2. Clerk webhook fires `user.updated` event
3. System checks email verification status
4. Calls `completeReferral` mutation
5. Awards credits to both users:
   - Referrer gets reward credits
   - New user gets bonus credits
6. Updates referral status to "rewarded"

## Testing Steps

### Test 1: Complete Referral Flow

**Prerequisites:**
- Have at least one existing user account
- Clear browser localStorage
- Use incognito/private window for new user

**Steps:**

1. **Get Referral Link (Existing User)**
   - Login as existing user
   - Go to `/dashboard` or `/dashboard/referrals`
   - Copy referral link
   - Note the referral code (e.g., `KERISN34F8N`)

2. **Sign Up with Referral (New User)**
   - Open incognito/private window
   - Paste referral link in browser
   - Verify purple banner appears: "🎉 You were referred!"
   - Open browser console (F12)
   - Complete signup with NEW email
   - Check console for: "Stored referral code: KERISN34F8N"

3. **Verify Tracking**
   - After signup, should redirect to `/dashboard?referral=pending`
   - Check console for: "Tracking referral with code: KERISN34F8N"
   - Check console for: "✅ Referral tracked successfully!"

4. **Verify Email**
   - Check new user's email inbox
   - Click verification link from Clerk

5. **Check Credits Awarded**
   - Login as referrer (original user)
   - Check credits balance - should increase by 30
   - Login as new user
   - Check credits balance - should show 11
   - Go to admin panel `/admin/referrals`
   - Should show 1 total referral
   - Should show credits distributed

### Test 2: Invalid Referral Code

**Steps:**
1. Visit: `https://your-domain.com/sign-up?ref=INVALID123`
2. Sign up normally
3. Check console - should show error about invalid code
4. No credits should be awarded

### Test 3: Self-Referral Prevention

**Steps:**
1. Login as user
2. Get your own referral link
3. Logout
4. Try to sign up with your own referral code
5. System should reject with "Cannot refer yourself"

### Test 4: Duplicate Referral Prevention

**Steps:**
1. Use same new user account from Test 1
2. Try to use another referral link
3. System should reject with "User already referred"
4. No additional credits awarded

## Debugging

### Check Server Logs

Look for these log messages:

```
🔍 User created - checking for referral code
📝 Tracking referral: KERISN34F8N
✅ Referral tracked successfully
📧 Email verified - completing referral
✅ Referral completed
```

### Check Browser Console

```
Stored referral code: KERISN34F8N
Tracking referral with code: KERISN34F8N
✅ Referral tracked successfully!
```

### Check Convex Database

**referral_codes table:**
- Should have entry for each user
- `totalReferrals` should increment
- `totalCreditsEarned` should update

**referrals table:**
- Should have entry for each referral
- `status: "pending"` initially
- `status: "rewarded"` after email verification
- Contains `rewardAmount` and `bonusAmount`

**credits_ledger table:**
- Should have 2 entries after referral completion:
  1. Referrer's reward (e.g., 30 credits)
  2. New user's bonus (e.g., 11 credits)

## Common Issues

### Issue: "User already referred" error
**Cause:** User already used a referral code
**Solution:** This is expected behavior - users can only be referred once

### Issue: No credits awarded
**Possible Causes:**
1. Email not verified yet
2. Referral code invalid
3. Self-referral attempt
4. Webhook not firing

**Debug Steps:**
1. Check Clerk webhook logs
2. Check Convex function logs
3. Verify email verification status
4. Check `referrals` table for pending records

### Issue: Referral not tracked
**Possible Causes:**
1. localStorage cleared before tracking
2. User didn't land on `/dashboard?referral=pending`
3. ReferralTracker component not rendering

**Debug Steps:**
1. Check browser console for errors
2. Verify URL has `?referral=pending` parameter
3. Check localStorage for `pendingReferralCode`

## Configuration

### Update Reward Amounts

Go to `/admin/referrals`:
- **Referrer Reward**: Credits given to user who shared the link
- **New User Bonus**: Credits given to user who signed up
- Can set to 0 to disable bonus for new users
- Click "Update Settings" to save

### Enable/Disable Program

In admin panel:
- Toggle "Enable Program" checkbox
- When disabled, referral links still work but no credits awarded

## API Reference

### Mutations

**`generateReferralCode`**
- Creates unique referral code for user
- Auto-called when user visits dashboard

**`trackReferral`**
- Records referral relationship
- Called by ReferralTracker component
- Creates pending referral record

**`completeReferral`**
- Awards credits to both users
- Called by Clerk webhook on email verification
- Updates referral status to "rewarded"

### Queries

**`getReferralCode`**
- Gets user's referral code
- Returns code and stats

**`getReferralStats`**
- Gets user's referral statistics
- Returns total referrals and credits earned

**`getReferralLeaderboard`**
- Gets top referrers
- Sorted by total referrals

## Success Criteria

✅ New user signs up with referral link  
✅ Referral code stored in localStorage  
✅ Referral tracked in database (pending status)  
✅ New user verifies email  
✅ Referrer receives reward credits  
✅ New user receives bonus credits  
✅ Referral status updated to "rewarded"  
✅ Admin panel shows updated statistics  
✅ Duplicate referrals prevented  
✅ Self-referrals prevented  

## Notes

- Credits are only awarded AFTER email verification
- Each user can only be referred once
- Users cannot refer themselves
- Referral codes are case-insensitive
- System uses localStorage + URL params for reliability
- Comprehensive logging for debugging
