# Settings System Configuration

## Overview

The Settings system manages all platform-level configuration stored in the `platform_config` table. This is a key-value store for SaaS core settings that apply globally across the platform.

---

## Architecture

### Database: `platform_config` Table

```typescript
{
  _id: Id<"platform_config">,
  key: string,                    // Unique setting identifier
  value: any,                     // Setting value (string, number, boolean, object)
  category: string,               // Category: "email", "company", "system", "testing"
  description: string,            // Human-readable description
  isEncrypted: boolean,           // Whether value should be encrypted
  updatedAt: number,              // Last update timestamp
  updatedBy: string,              // Who updated it (e.g., "super_admin", "user_xxx")
  _creationTime: number           // Convex auto-generated
}

Indexes:
  - by_key: [key]
  - by_category: [category]
```

---

## Settings Categories

### 1. Email Settings (category: "email")

| Key | Type | Description | Encrypted |
|-----|------|-------------|-----------|
| `emailEnabled` | boolean | Master toggle for all emails | No |
| `sendWelcomeEmail` | boolean | Send welcome emails to new users | No |
| `sendPasswordResetEmail` | boolean | Send password reset emails | No |
| `sendSubscriptionEmails` | boolean | Send subscription emails | No |
| `sendUsageAlerts` | boolean | Send usage alert emails | No |
| `sendAdminNotifications` | boolean | Send admin notifications | No |
| `sendPaymentNotifications` | boolean | Send payment notifications | No |
| `resendApiKey` | string | Resend API key | Yes |
| `emailFromName` | string | Default sender name | No |
| `emailFromAddress` | string | Default sender email | No |

### 2. Company Settings (category: "company")

| Key | Type | Description | Encrypted |
|-----|------|-------------|-----------|
| `companyName` | string | Platform company name | No |
| `companyEmail` | string | Main contact email | No |
| `companyPhone` | string | Contact phone number | No |
| `companyAddress` | string | Full company address | No |
| `companyCountry` | string | Country of registration | No |
| `passwordResetLink` | string | Clerk password reset URL | No |

### 3. Testing Settings (category: "testing")

| Key | Type | Description | Encrypted |
|-----|------|-------------|-----------|
| `initialSignupCredits` | number | Credits given to new users | No |
| `superAdminEmail` | string | Protected super admin email | No |

### 4. System Settings (category: "system")

| Key | Type | Description | Encrypted |
|-----|------|-------------|-----------|
| `platformName` | string | Platform display name | No |
| `platformUrl` | string | Platform base URL | No |
| `maintenanceMode` | boolean | Enable maintenance mode | No |
| `allowSignups` | boolean | Allow new user signups | No |

---

## Backend API Structure

### Generic Platform Config API (`convex/platformConfig.ts`)

```typescript
// Get single setting by key
export const get = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const config = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    return config?.value ?? null;
  }
});

// Get all settings by category
export const getByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, { category }) => {
    const configs = await ctx.db
      .query("platform_config")
      .withIndex("by_category", (q) => q.eq("category", category))
      .collect();
    
    // Convert to key-value object
    const settings: Record<string, any> = {};
    for (const config of configs) {
      settings[config.key] = config.value;
    }
    return settings;
  }
});

// Set or update a setting
export const set = mutation({
  args: {
    key: v.string(),
    value: v.any(),
    category: v.string(),
    description: v.string(),
    isEncrypted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt: Date.now(),
        updatedBy: "super_admin", // TODO: Get from auth context
      });
    } else {
      await ctx.db.insert("platform_config", {
        key: args.key,
        value: args.value,
        category: args.category,
        description: args.description,
        isEncrypted: args.isEncrypted ?? false,
        updatedAt: Date.now(),
        updatedBy: "super_admin",
      });
    }
    return { success: true };
  }
});

// Batch update multiple settings
export const batchSet = mutation({
  args: {
    settings: v.array(v.object({
      key: v.string(),
      value: v.any(),
      category: v.string(),
      description: v.string(),
      isEncrypted: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, { settings }) => {
    for (const setting of settings) {
      const existing = await ctx.db
        .query("platform_config")
        .withIndex("by_key", (q) => q.eq("key", setting.key))
        .first();
      
      if (existing) {
        await ctx.db.patch(existing._id, {
          value: setting.value,
          updatedAt: Date.now(),
          updatedBy: "super_admin",
        });
      } else {
        await ctx.db.insert("platform_config", {
          ...setting,
          isEncrypted: setting.isEncrypted ?? false,
          updatedAt: Date.now(),
          updatedBy: "super_admin",
        });
      }
    }
    return { success: true };
  }
});
```

---

## Frontend Structure

### Settings Layout (`app/admin/settings/layout.tsx`)

```
/admin/settings
├── layout.tsx          # Sidebar navigation
├── profile/
│   └── page.tsx       # Profile settings (admin role assignment)
├── company/
│   └── page.tsx       # Company information
└── testing/
    └── page.tsx       # Testing & configuration
```

### Sidebar Navigation

- **Profile** - Admin role assignment
- **Account** - (Future: user account settings)
- **Appearance** - (Future: theme, language)
- **Notifications** - (Future: notification preferences)
- **Display** - (Future: display settings)
- **Company** - Company information
- **Testing** - System configuration & testing tools

---

## Frontend Implementation Pattern

### 1. Load Settings

```typescript
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function CompanySettingsPage() {
  // Load all company settings
  const companySettings = useQuery(api.platformConfig.getByCategory, { 
    category: "company" 
  });
  
  if (companySettings === undefined) {
    return <div>Loading...</div>;
  }
  
  // companySettings is now: { companyName: "...", companyEmail: "...", ... }
}
```

### 2. Local State Management

```typescript
const [localSettings, setLocalSettings] = useState({
  companyName: "",
  companyEmail: "",
  companyPhone: "",
  companyAddress: "",
  companyCountry: "",
  passwordResetLink: "",
});

// Update local state when query loads
useEffect(() => {
  if (companySettings) {
    setLocalSettings({
      companyName: companySettings.companyName ?? "",
      companyEmail: companySettings.companyEmail ?? "",
      companyPhone: companySettings.companyPhone ?? "",
      companyAddress: companySettings.companyAddress ?? "",
      companyCountry: companySettings.companyCountry ?? "",
      passwordResetLink: companySettings.passwordResetLink ?? "",
    });
  }
}, [companySettings]);
```

### 3. Save Settings

```typescript
const batchSet = useMutation(api.platformConfig.batchSet);

const handleSave = async () => {
  try {
    await batchSet({
      settings: [
        {
          key: "companyName",
          value: localSettings.companyName,
          category: "company",
          description: "Platform company name",
        },
        {
          key: "companyEmail",
          value: localSettings.companyEmail,
          category: "company",
          description: "Main contact email",
        },
        // ... all other fields
      ],
    });
    alert("Settings saved successfully!");
  } catch (error) {
    console.error("Failed to save:", error);
    alert("Failed to save settings");
  }
};
```

---

## Data Flow

```
1. Page Load
   ↓
2. useQuery(api.platformConfig.getByCategory, { category: "company" })
   ↓
3. Backend queries platform_config table by category
   ↓
4. Returns { companyName: "...", companyEmail: "...", ... }
   ↓
5. Frontend updates local state
   ↓
6. User edits form fields (updates local state only)
   ↓
7. User clicks "Save Settings"
   ↓
8. useMutation(api.platformConfig.batchSet, { settings: [...] })
   ↓
9. Backend updates/inserts all settings in platform_config
   ↓
10. Success - page reloads data automatically (Convex reactivity)
```

---

## Security Considerations

### 1. Encrypted Fields
- `resendApiKey` - Always encrypted
- API keys, secrets, tokens - Always encrypted

### 2. Access Control
- Only super admins can access `/admin/settings`
- Implement role-based access control (RBAC)
- Validate user permissions in backend mutations

### 3. Input Validation
- Validate email formats
- Validate URLs
- Sanitize text inputs
- Validate number ranges

---

## Testing Checklist

### Backend Testing

```bash
# Test get by key
npx convex run platformConfig:get '{"key":"companyName"}'

# Test get by category
npx convex run platformConfig:getByCategory '{"category":"company"}'

# Test set
npx convex run platformConfig:set '{"key":"companyName","value":"Test Company","category":"company","description":"Company name"}'

# Test batch set
npx convex run platformConfig:batchSet '{"settings":[{"key":"companyName","value":"Test","category":"company","description":"Name"}]}'
```

### Frontend Testing

1. **Load Test**
   - Open settings page
   - Verify data loads from database
   - Check console for query logs

2. **Edit Test**
   - Change a field value
   - Verify local state updates
   - Check form shows new value

3. **Save Test**
   - Click "Save Settings"
   - Verify mutation succeeds
   - Check success message appears

4. **Persistence Test**
   - Refresh page
   - Verify saved values still display
   - Check database has updated values

5. **Empty State Test**
   - Delete all settings from database
   - Verify page shows default/empty values
   - Save new values
   - Verify they persist

---

## Migration & Seeding

### Initial Seed Data

Create `convex/migrations/seedPlatformSettings.ts`:

```typescript
import { internalMutation } from "../_generated/server";

export const seedPlatformSettings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("platform_config").first();
    if (existing) {
      console.log("Settings already seeded");
      return { success: true, message: "Already seeded" };
    }
    
    const defaultSettings = [
      // Email settings
      { key: "emailEnabled", value: false, category: "email", description: "Master email toggle", isEncrypted: false },
      { key: "sendWelcomeEmail", value: true, category: "email", description: "Send welcome emails", isEncrypted: false },
      // ... all other defaults
      
      // Company settings
      { key: "companyName", value: "Your SaaS", category: "company", description: "Company name", isEncrypted: false },
      { key: "companyEmail", value: "contact@yoursaas.com", category: "company", description: "Contact email", isEncrypted: false },
      // ... all other defaults
      
      // Testing settings
      { key: "initialSignupCredits", value: 0, category: "testing", description: "Signup credits", isEncrypted: false },
      { key: "superAdminEmail", value: "", category: "testing", description: "Super admin email", isEncrypted: false },
    ];
    
    for (const setting of defaultSettings) {
      await ctx.db.insert("platform_config", {
        ...setting,
        updatedAt: Date.now(),
        updatedBy: "system_seed",
      });
    }
    
    return { success: true, inserted: defaultSettings.length };
  }
});
```

Run: `npx convex run migrations:seedPlatformSettings`

---

## Common Issues & Solutions

### Issue: Settings not displaying
**Cause:** Query returns `undefined` or empty object
**Solution:** 
- Check if data exists in database
- Verify query is called with correct category
- Add console logs to track data flow

### Issue: Save succeeds but data doesn't persist
**Cause:** Mutation not updating database correctly
**Solution:**
- Check mutation logs in Convex dashboard
- Verify all required fields are passed
- Check for validation errors

### Issue: Form shows stale data after save
**Cause:** Local state not updating after mutation
**Solution:**
- Convex queries are reactive - they auto-update
- Ensure `useEffect` dependency array includes query result
- Force re-render if needed with key prop

---

## File Structure

```
convex/
├── platformConfig.ts           # Generic platform config API
├── schema.ts                   # platform_config table definition
└── migrations/
    └── seedPlatformSettings.ts # Initial seed data

app/admin/settings/
├── layout.tsx                  # Sidebar navigation layout
├── profile/
│   └── page.tsx               # Profile settings
├── company/
│   └── page.tsx               # Company settings
└── testing/
    └── page.tsx               # Testing settings

components/
└── settings/
    ├── SettingsSidebar.tsx    # Reusable sidebar component
    └── SettingsCard.tsx       # Reusable settings card
```

---

## Next Steps

1. ✅ Create `convex/platformConfig.ts` - Generic platform config API
2. ✅ Verify `platform_config` table exists in schema
3. ✅ Create seed migration
4. ⬜ Create settings layout with sidebar
5. ⬜ Create Profile settings page
6. ⬜ Create Company settings page
7. ⬜ Create Testing settings page
8. ⬜ Test complete flow: load → edit → save → persist

---

## References

- Convex Docs: https://docs.convex.dev
- Next.js App Router: https://nextjs.org/docs/app
- Shadcn UI: https://ui.shadcn.com
