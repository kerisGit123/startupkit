# Referral Program & IP Blocking Implementation Plan

## Overview

This document outlines the implementation plan for two major features:
1. **IP/Country Blocking System** - Block users by IP address or country
2. **Referral Program** - Complete referral system with tracking, rewards, and leaderboard

---

## Part 1: IP/Country Blocking System

### Features

- **IP Blacklist** - Block specific IP addresses
- **Country Blacklist** - Block entire countries
- **Admin Management** - Add/remove IPs and countries from blacklist
- **Access Control** - Prevent blocked IPs/countries from accessing the system
- **Audit Logging** - Track all blocking activities

### Database Schema

#### New Table: `ip_blacklist`

```typescript
ip_blacklist: defineTable({
  ipAddress: v.string(),
  reason: v.optional(v.string()),
  blockedBy: v.string(), // Admin user ID
  blockedAt: v.number(),
  expiresAt: v.optional(v.number()), // Optional expiration
  isActive: v.boolean(),
})
  .index("by_ipAddress", ["ipAddress"])
  .index("by_isActive", ["isActive"])
```

#### New Table: `country_blacklist`

```typescript
country_blacklist: defineTable({
  countryCode: v.string(), // ISO 3166-1 alpha-2 (e.g., "US", "CN")
  countryName: v.string(),
  reason: v.optional(v.string()),
  blockedBy: v.string(),
  blockedAt: v.number(),
  isActive: v.boolean(),
})
  .index("by_countryCode", ["countryCode"])
  .index("by_isActive", ["isActive"])
```

### Implementation Steps

#### Step 1: Update Schema
- Add `ip_blacklist` table
- Add `country_blacklist` table

#### Step 2: Create Backend Functions

**Convex Functions** (`convex/ipBlocking.ts`):
- `addIpToBlacklist` - Add IP to blacklist
- `removeIpFromBlacklist` - Remove IP from blacklist
- `addCountryToBlacklist` - Add country to blacklist
- `removeCountryFromBlacklist` - Remove country from blacklist
- `checkIpBlocked` - Check if IP is blocked
- `checkCountryBlocked` - Check if country is blocked
- `getBlacklistedIps` - Get all blocked IPs
- `getBlacklistedCountries` - Get all blocked countries

#### Step 3: Create Middleware

**IP Detection Middleware** (`middleware.ts`):
- Detect user's IP address from request headers
- Detect user's country using IP geolocation API
- Check against blacklist
- Block access if IP/country is blacklisted

#### Step 4: Create Admin UI

**Admin Page** (`app/admin/security/page.tsx`):
- IP Blacklist management table
- Country Blacklist management table
- Add/Remove IP form
- Add/Remove Country form
- Search and filter functionality

#### Step 5: Integration

- Add IP/Country check to authentication flow
- Add IP/Country check to API routes
- Log all blocking events to audit logs

---

## Part 2: Referral Program

### Features

- **Unique Referral Links** - Each user gets a unique referral code
- **Referral Tracking** - Track who referred whom
- **Rewards System** - Award credits for successful referrals
- **Leaderboard** - Show top referrers
- **Automated Distribution** - Automatically award credits when referral converts

### Reward Structure

- **Referrer Reward**: 50 credits when referred user signs up
- **Referee Reward**: Optional bonus for new user (e.g., 10 credits)
- **Conversion Criteria**: User must complete signup and verify email

### Database Schema

#### New Table: `referral_codes`

```typescript
referral_codes: defineTable({
  userId: v.string(), // User who owns this referral code
  code: v.string(), // Unique referral code (e.g., "JOHN2024ABC")
  createdAt: v.number(),
  isActive: v.boolean(),
  totalReferrals: v.number(), // Count of successful referrals
  totalCreditsEarned: v.number(), // Total credits earned from referrals
})
  .index("by_userId", ["userId"])
  .index("by_code", ["code"])
```

#### New Table: `referrals`

```typescript
referrals: defineTable({
  referralCode: v.string(), // The referral code used
  referrerId: v.string(), // User who referred
  referredUserId: v.string(), // User who was referred
  referredAt: v.number(), // When they signed up
  status: v.union(
    v.literal("pending"), // Signed up but not verified
    v.literal("completed"), // Verified and active
    v.literal("rewarded"), // Credits awarded
    v.literal("cancelled") // User deleted account
  ),
  rewardAmount: v.number(), // Credits awarded to referrer
  rewardedAt: v.optional(v.number()), // When reward was given
  metadata: v.optional(v.any()), // Additional tracking data
})
  .index("by_referralCode", ["referralCode"])
  .index("by_referrerId", ["referrerId"])
  .index("by_referredUserId", ["referredUserId"])
  .index("by_status", ["status"])
```

#### Update Table: `credits_ledger`

Already exists, will be used to record referral rewards:

```typescript
// Add new transaction type
transactionType: v.union(
  v.literal("purchase"),
  v.literal("usage"),
  v.literal("refund"),
  v.literal("admin_adjustment"),
  v.literal("referral_reward"), // NEW
  v.literal("referral_bonus")   // NEW
)
```

### Implementation Steps

#### Step 1: Update Schema
- Add `referral_codes` table
- Add `referrals` table
- Update `credits_ledger` with new transaction types

#### Step 2: Create Backend Functions

**Convex Functions** (`convex/referrals.ts`):

**Referral Code Management**:
- `generateReferralCode(userId)` - Generate unique code for user
- `getReferralCode(userId)` - Get user's referral code
- `validateReferralCode(code)` - Check if code is valid

**Referral Tracking**:
- `trackReferral(code, newUserId)` - Record when someone uses referral code
- `completeReferral(referralId)` - Mark referral as completed
- `getReferralStats(userId)` - Get user's referral statistics

**Rewards**:
- `processReferralReward(referralId)` - Award credits to referrer
- `getReferralEarnings(userId)` - Get total earnings from referrals

**Leaderboard**:
- `getReferralLeaderboard(limit)` - Get top referrers
- `getUserReferralRank(userId)` - Get user's rank

#### Step 3: Update User Registration Flow

**Modify Clerk Webhook** (`app/api/clerk/webhook/route.ts`):
- Check for referral code in signup metadata
- Create referral record
- Award credits when user verifies email

#### Step 4: Create User UI

**User Dashboard** (`app/dashboard/referrals/page.tsx`):
- Display user's unique referral link
- Copy link button
- Referral statistics (total referrals, credits earned)
- List of referred users
- Referral history

**Leaderboard Page** (`app/dashboard/leaderboard/page.tsx`):
- Top 100 referrers
- User's current rank
- Total referrals and credits earned
- Badges/achievements for milestones

#### Step 5: Create Admin UI

**Admin Referral Management** (`app/admin/referrals/page.tsx`):
- View all referrals
- Referral analytics (conversion rate, top referrers)
- Manual reward adjustment
- Fraud detection (suspicious patterns)

#### Step 6: Automated Reward Distribution

**Background Job** (Convex scheduled function):
- Check for completed referrals that haven't been rewarded
- Award credits automatically
- Send notification to referrer
- Update referral status to "rewarded"

---

## Implementation Timeline

### Phase 1: IP/Country Blocking (2-3 hours)
1. Update schema (15 min)
2. Create backend functions (45 min)
3. Create middleware (30 min)
4. Create admin UI (60 min)
5. Testing (30 min)

### Phase 2: Referral Program (4-5 hours)
1. Update schema (15 min)
2. Create backend functions (90 min)
3. Update registration flow (30 min)
4. Create user UI (90 min)
5. Create admin UI (45 min)
6. Automated rewards (30 min)
7. Testing (30 min)

---

## Technical Considerations

### IP/Country Blocking

**IP Geolocation**:
- Use free API: `https://ipapi.co/{ip}/json/`
- Or use Cloudflare headers: `CF-IPCountry`
- Fallback to `x-forwarded-for` header

**Performance**:
- Cache IP/Country checks (5 min TTL)
- Use middleware for early blocking
- Minimal database queries

**Privacy**:
- Hash IP addresses in logs
- Comply with GDPR/privacy laws
- Allow users to request IP data deletion

### Referral Program

**Fraud Prevention**:
- Limit referrals per IP address
- Detect self-referrals (same IP/device)
- Manual review for high-value referrals
- Rate limiting on referral code usage

**Code Generation**:
- Format: `{USERNAME}{RANDOM}` (e.g., "JOHN2024ABC")
- 8-12 characters, alphanumeric
- Check uniqueness before creating

**Conversion Tracking**:
- Track referral source in cookies
- 30-day attribution window
- First-touch attribution model

**Scalability**:
- Index all foreign keys
- Batch reward processing
- Async notification sending

---

## API Endpoints

### IP Blocking

```typescript
// Admin only
POST /api/admin/ip-blocking/add-ip
POST /api/admin/ip-blocking/remove-ip
POST /api/admin/ip-blocking/add-country
POST /api/admin/ip-blocking/remove-country
GET  /api/admin/ip-blocking/list-ips
GET  /api/admin/ip-blocking/list-countries
```

### Referrals

```typescript
// User endpoints
GET  /api/referrals/my-code
GET  /api/referrals/my-stats
GET  /api/referrals/my-referrals
GET  /api/referrals/leaderboard

// Public
GET  /api/referrals/validate/{code}

// Admin only
GET  /api/admin/referrals/all
GET  /api/admin/referrals/analytics
POST /api/admin/referrals/adjust-reward
```

---

## User Flow Examples

### Referral Flow

1. **User A** logs in and goes to `/dashboard/referrals`
2. System generates unique code: `ALICE2024XYZ`
3. User A shares link: `https://yourapp.com/signup?ref=ALICE2024XYZ`
4. **User B** clicks link and signs up
5. System stores referral code in signup metadata
6. User B verifies email
7. System automatically:
   - Awards 50 credits to User A
   - Awards 10 credits to User B (optional)
   - Updates User A's referral count
   - Sends notification to User A
8. User A sees updated stats on referral dashboard

### IP Blocking Flow

1. **Admin** goes to `/admin/security`
2. Adds IP `192.168.1.100` to blacklist with reason "Spam"
3. **User** from that IP tries to access the site
4. Middleware detects IP is blacklisted
5. User sees "Access Denied" page
6. Access attempt is logged in audit logs

---

## Testing Checklist

### IP Blocking
- [ ] Add IP to blacklist
- [ ] Remove IP from blacklist
- [ ] Block access from blacklisted IP
- [ ] Add country to blacklist
- [ ] Block access from blacklisted country
- [ ] Verify admin can manage blacklists
- [ ] Test IP detection accuracy
- [ ] Test country detection accuracy

### Referral Program
- [ ] Generate referral code for user
- [ ] Share referral link
- [ ] Sign up with referral code
- [ ] Track referral in database
- [ ] Award credits on conversion
- [ ] Display referral stats
- [ ] Show leaderboard
- [ ] Prevent self-referrals
- [ ] Prevent duplicate referrals
- [ ] Test automated reward distribution

---

## Next Steps

**Ready to implement?** I can start with either:

1. **IP/Country Blocking** - Faster to implement, immediate security benefit
2. **Referral Program** - More complex, drives user growth

Which would you like me to implement first?
