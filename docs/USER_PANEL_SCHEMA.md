# User Panel & Admin System Schema Documentation

## Overview
This document describes the enhanced database schema for the user panel and admin system, including organization settings, user activity tracking, and admin management features.

---

## Database Tables

### 1. `org_settings` - Organization/Company Settings

**Purpose**: Store company information, configuration, and API keys for each organization or user.

#### Fields:

**Core Identification**
- `companyId` (string, required) - Unique identifier for the organization/user
- `subjectType` (union: "organization" | "user") - Type of entity

**Company Information**
- `companyName` (string, optional) - Company name
- `companyAddress` (string, optional) - Physical address
- `companyCountry` (string, optional) - Country code or name
- `companyTin` (string, optional) - Tax Identification Number
- `companyLicense` (string, optional) - Business license number
- `companyPhone` (string, optional) - Contact phone number
- `companyEmail` (string, optional) - Company email
- `companyWebsite` (string, optional) - Company website URL
- `companyTimezone` (string, optional) - Timezone (e.g., "America/New_York")
- `companyCurrency` (string, optional) - Currency code (e.g., "USD")
- `companyFaviconId` (storage ID, optional) - Favicon file reference
- `companyLogoId` (storage ID, optional) - Logo file reference
- `companyNote` (string, optional) - Internal notes about the company

**Additional Business Details**
- `companyVatNumber` (string, optional) - VAT number (EU)
- `companyRegistrationNumber` (string, optional) - Business registration ID
- `billingEmail` (string, optional) - Separate billing contact email
- `technicalContactEmail` (string, optional) - Technical support contact
- `companySize` (string, optional) - Employee count range
- `industry` (string, optional) - Business vertical/industry

**Legacy Fields** (for backward compatibility)
- `email` (string, optional)
- `contactNumber` (string, optional)
- `address` (string, optional)

**API & Integration Keys** ⚠️ **Should be encrypted**
- `secretKey` (string, optional) - Internal secret key
- `openaiKey` (string, optional) - OpenAI API key
- `openaiSecret` (string, optional) - OpenAI secret

**Activity Tracking**
- `lastActivityCheck` (number, optional) - Last activity check timestamp
- `lastApiCallAt` (number, optional) - Last API call timestamp
- `totalApiCall` (number, optional) - Total API calls count

**System Fields**
- `aiEnabled` (boolean, optional) - AI features enabled
- `onboardingCompletedAt` (number, optional) - Onboarding completion timestamp
- `trialEndsAt` (number, optional) - Trial period end timestamp
- `createdAt` (number, optional) - Creation timestamp
- `updatedAt` (number, required) - Last update timestamp
- `updatedBy` (string, required) - User who made the update

#### Indexes:
- `by_companyId` - Query by company ID

---

### 2. `users` - User Management with Activity Tracking

**Purpose**: Store user information with activity tracking for MAU (Monthly Active Users) calculation.

#### Fields:

**User Information**
- `clerkUserId` (string, optional) - Clerk authentication ID
- `email` (string, optional) - User email
- `firstName` (string, optional) - First name
- `lastName` (string, optional) - Last name
- `fullName` (string, optional) - Full name
- `imageUrl` (string, optional) - Profile image URL
- `username` (string, optional) - Username

**Activity Tracking for MAU**
- `lastLoginAt` (number, optional) - Last login timestamp
- `lastActivityAt` (number, optional) - Last activity timestamp (any action)
- `loginCount` (number, optional) - Total number of logins

**Admin Labels & Tags**
- `userLabel` (string, optional) - Admin-assigned label (e.g., "VIP", "Beta Tester", "Enterprise")
- `userTags` (array of strings, optional) - Multiple tags for categorization
- `isBlocked` (boolean, optional) - User blocked status
- `adminNotes` (string, optional) - Internal admin notes

**System Fields**
- `createdAt` (number, optional) - Account creation timestamp
- `updatedAt` (number, optional) - Last update timestamp
- `deletionTime` (number, optional) - Soft deletion timestamp

#### Indexes:
- `by_clerkUserId` - Query by Clerk user ID
- `by_email` - Query by email
- `by_lastLoginAt` - Query by last login (for MAU)
- `by_userLabel` - Query by admin label
- `by_isBlocked` - Query blocked users

#### Suggested User Labels:
- **VIP** - High-value customers
- **Premium** - Premium tier users
- **Beta Tester** - Early adopters
- **At Risk** - Churn risk users
- **Enterprise** - Enterprise clients
- **Support Priority** - Needs extra attention
- **Trial** - Trial period users
- **Blocked** - Access restricted
- **Suspended** - Temporarily suspended

---

### 3. `user_activity_logs` - Detailed Activity Tracking

**Purpose**: Log all user activities for MAU tracking, analytics, and audit trails.

#### Fields:
- `userId` (string, required) - User identifier
- `companyId` (string, required) - Company/organization identifier
- `activityType` (union, required) - Type of activity:
  - `"login"` - User login
  - `"api_call"` - API endpoint call
  - `"feature_usage"` - Feature usage
  - `"page_view"` - Page view
  - `"action"` - General action
- `timestamp` (number, required) - Activity timestamp
- `metadata` (any, optional) - Additional activity data
- `ipAddress` (string, optional) - User IP address
- `userAgent` (string, optional) - Browser user agent

#### Indexes:
- `by_userId` - Query by user
- `by_companyId` - Query by company
- `by_timestamp` - Query by time
- `by_userId_timestamp` - Composite index for user activity history
- `by_activityType` - Query by activity type

---

## API Functions

### Organization Settings Functions (`settings.ts`)

#### `ensureOrgSettings`
Creates organization settings if they don't exist.

```typescript
await ensureOrgSettings({
  companyId: "user_123",
  subjectType: "user",
  aiEnabled: true,
  updatedBy: "user_123"
});
```

#### `getSettings`
Retrieve organization settings.

```typescript
const settings = await getSettings({ companyId: "user_123" });
```

#### `updateSettings`
Update organization settings with any combination of fields.

```typescript
await updateSettings({
  companyId: "user_123",
  companyName: "Acme Corp",
  companyEmail: "contact@acme.com",
  companyTimezone: "America/New_York",
  companyCurrency: "USD",
  updatedBy: "admin_456"
});
```

---

### User Activity Functions (`userActivity.ts`)

#### `trackLogin`
Track user login and update activity timestamps.

```typescript
await trackLogin({
  clerkUserId: "user_123",
  companyId: "user_123",
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0..."
});
```

#### `logActivity`
Log any user activity.

```typescript
await logActivity({
  userId: "user_123",
  companyId: "user_123",
  activityType: "feature_usage",
  metadata: { feature: "dashboard", action: "view" },
  ipAddress: "192.168.1.1"
});
```

#### `getMonthlyActiveUsers`
Get MAU statistics.

```typescript
const mau = await getMonthlyActiveUsers({ daysBack: 30 });
// Returns: { count: 150, users: [...] }
```

#### `getUserActivityHistory`
Get user's activity history.

```typescript
const history = await getUserActivityHistory({
  userId: "user_123",
  limit: 50
});
```

#### `getActivityStatsByType`
Get activity statistics grouped by type.

```typescript
const stats = await getActivityStatsByType({
  companyId: "user_123",
  startDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
  endDate: Date.now()
});
// Returns: { total: 1000, byType: { login: 50, api_call: 800, ... } }
```

#### `trackApiCall`
Track API calls and update organization metrics.

```typescript
await trackApiCall({
  companyId: "user_123",
  userId: "user_123",
  metadata: { endpoint: "/api/data", method: "GET" }
});
```

---

### Admin User Management Functions (`adminUserManagement.ts`)

#### `updateUserLabel`
Assign or update user label.

```typescript
await updateUserLabel({
  userId: "users|abc123",
  userLabel: "VIP",
  userTags: ["premium", "early-adopter"],
  adminNotes: "High-value customer",
  updatedBy: "admin_456"
});
```

#### `toggleUserBlock`
Block or unblock a user.

```typescript
await toggleUserBlock({
  userId: "users|abc123",
  isBlocked: true,
  reason: "Violation of terms",
  updatedBy: "admin_456"
});
```

#### `getUsersByLabel`
Get all users with a specific label.

```typescript
const vipUsers = await getUsersByLabel({ userLabel: "VIP" });
```

#### `getAllUserLabels`
Get list of all unique user labels.

```typescript
const labels = await getAllUserLabels();
// Returns: ["VIP", "Beta Tester", "Enterprise", ...]
```

#### `getBlockedUsers`
Get all blocked users.

```typescript
const blocked = await getBlockedUsers();
```

#### `searchUsers`
Search users with filters.

```typescript
const results = await searchUsers({
  searchTerm: "john@example.com",
  userLabel: "VIP",
  isBlocked: false,
  limit: 50
});
```

#### `getUserDetailsWithActivity`
Get complete user profile with activity.

```typescript
const details = await getUserDetailsWithActivity({
  clerkUserId: "user_123"
});
// Returns: { user, orgSettings, subscription, recentActivity, credits }
```

#### `bulkUpdateUserLabels`
Update labels for multiple users.

```typescript
const result = await bulkUpdateUserLabels({
  userIds: ["users|abc", "users|def"],
  userLabel: "Enterprise",
  updatedBy: "admin_456"
});
```

#### `addUserTags` / `removeUserTags`
Manage user tags.

```typescript
await addUserTags({
  userId: "users|abc123",
  tags: ["premium", "priority-support"],
  updatedBy: "admin_456"
});
```

#### `getUserStatistics`
Get comprehensive user statistics.

```typescript
const stats = await getUserStatistics();
// Returns: {
//   total: 1000,
//   blocked: 5,
//   activeLastMonth: 750,
//   activeLastWeek: 400,
//   withLabels: 200,
//   byLabel: { "VIP": 50, "Enterprise": 30, ... }
// }
```

---

## MAU (Monthly Active Users) Tracking

### How It Works:

1. **Login Tracking**: Call `trackLogin()` when user logs in
2. **Activity Tracking**: Call `logActivity()` for any user action
3. **Automatic Updates**: User's `lastLoginAt` and `lastActivityAt` are automatically updated
4. **MAU Calculation**: Query users where `lastLoginAt` is within the last 30 days

### Example Implementation:

```typescript
// In your authentication callback
export async function onUserLogin(clerkUserId: string) {
  await trackLogin({
    clerkUserId,
    companyId: clerkUserId,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent']
  });
}

// In your API routes
export async function onApiCall(userId: string, endpoint: string) {
  await logActivity({
    userId,
    companyId: userId,
    activityType: "api_call",
    metadata: { endpoint }
  });
}

// Get MAU report
const mauReport = await getMonthlyActiveUsers({ daysBack: 30 });
console.log(`Monthly Active Users: ${mauReport.count}`);
```

---

## Security Considerations

### ⚠️ API Keys Storage

**IMPORTANT**: The following fields should be encrypted before storage:
- `secretKey`
- `openaiKey`
- `openaiSecret`

**Recommendations**:
1. Use Convex environment variables for sensitive keys when possible
2. Encrypt keys before storing in the database
3. Never expose these fields in client-side queries
4. Use server-side mutations only for key management
5. Implement proper access control for admin functions

### Admin Access Control

All admin functions in `adminUserManagement.ts` should be protected:
- Verify admin role before execution
- Log all admin actions
- Implement rate limiting
- Audit trail for sensitive operations

---

## Migration Notes

If you have existing data, you may need to:

1. **Backfill Activity Data**: Run a script to populate `lastLoginAt` from existing logs
2. **Set Default Values**: Set `loginCount` to 0 for existing users
3. **Legacy Field Mapping**: Map old field names to new ones
4. **Index Creation**: Convex will automatically create new indexes

---

## Next Steps

1. **Implement Login Tracking**: Add `trackLogin()` to your authentication flow
2. **Add Activity Logging**: Integrate `logActivity()` in key user actions
3. **Build Admin Dashboard**: Use admin functions to build user management UI
4. **Set Up MAU Reports**: Create scheduled reports using `getMonthlyActiveUsers()`
5. **Configure User Labels**: Define your user label taxonomy
6. **Implement Security**: Encrypt API keys and add access control

---

## Example Admin Dashboard Queries

```typescript
// Dashboard Overview
const stats = await getUserStatistics();
const mau = await getMonthlyActiveUsers({ daysBack: 30 });
const blocked = await getBlockedUsers();

// User Management
const vipUsers = await getUsersByLabel({ userLabel: "VIP" });
const atRiskUsers = await getUsersByLabel({ userLabel: "At Risk" });

// Activity Analysis
const activityStats = await getActivityStatsByType({
  startDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
  endDate: Date.now()
});
```

---

## Support

For questions or issues, refer to:
- Convex documentation: https://docs.convex.dev
- Schema file: `convex/schema.ts`
- Function implementations: `convex/settings.ts`, `convex/userActivity.ts`, `convex/adminUserManagement.ts`
