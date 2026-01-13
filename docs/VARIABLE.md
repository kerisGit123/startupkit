# Email Template Variable Management System

## Overview

This document outlines the comprehensive variable management system for email templates. Variables are stored in the `platform_config` table with `category = "variable"` and are automatically replaced when emails are sent.

## Architecture

### Storage Structure

All variables are stored in the `platform_config` table with the following schema:

```typescript
{
  category: "variable",        // Fixed category for all variables
  key: string,                 // Variable name (e.g., "login_link")
  value: string,               // Variable value (e.g., "https://app.startupkit.com/login")
  description: string,         // Human-readable description (same as key)
  isEncrypted: false,          // Always false for variables
  createdAt: number,
  updatedAt: number
}
```

### Variable Types

Variables are categorized into three types:

1. **Static Variables** - Manually configured values stored in platform_config
2. **Programmatic Variables** - Generated at runtime (e.g., current_year, event_date)
3. **Dynamic Variables** - Extracted from database records (e.g., invoiceNo, subscription_plan)

## Complete Variable List

### Global Variables (All Templates)

| Variable | Type | Source | Description |
|----------|------|--------|-------------|
| `{user_name}` | Dynamic | User record | User's full name or email |
| `{company_name}` | Static | Settings → Company Name | Company name from settings |
| `{company_email}` | Static | Settings → Company Email | Company email from settings |
| `{current_year}` | Programmatic | Runtime | Current year (e.g., "2026") |
| `{event_date}` | Programmatic | Runtime | Current date in dd/mm/yyyy |
| `{event_time}` | Programmatic | Runtime | Current time in hh:mm:ss |
| `{login_link}` | Static | Variable Settings | App login URL |
| `{upgrade_plan}` | Static | Variable Settings | Upgrade plan link |

### Welcome Email Variables

| Variable | Type | Source | Description |
|----------|------|--------|-------------|
| `{get_started_link}` | Static | Variable Settings | Getting started guide link |

### Password Reset Variables

| Variable | Type | Source | Description |
|----------|------|--------|-------------|
| `{password_reset_link}` | Dynamic | Auth system | Password reset link with token |

### Subscription Email Variables

| Variable | Type | Source | Description |
|----------|------|--------|-------------|
| `{invoiceNo}` | Dynamic | Invoice record | Invoice number |
| `{subscription_plan}` | Dynamic | Invoice record | Subscription plan name |
| `{subscription_status}` | Dynamic | Invoice record | Payment status (usually "paid") |
| `{next_billing_date}` | Dynamic | Invoice record | Next billing date in dd/mm/yyyy |
| `{subscription_link}` | Static | Variable Settings | User subscription management page |

### Payment Notification Variables

| Variable | Type | Source | Description |
|----------|------|--------|-------------|
| `{invoiceNo}` | Dynamic | Invoice record | Invoice number |
| `{credits_purchased}` | Dynamic | Invoice record | Number of credits purchased |
| `{payment_date}` | Dynamic | Invoice record | Payment date in dd/mm/yyyy |
| `{payment_method}` | Static | Default | "Credit Card" (default) |
| `{invoice_link}` | Dynamic | Invoice record | Invoice detail page URL |

### Usage Alert Variables

| Variable | Type | Source | Description |
|----------|------|--------|-------------|
| `{usage_percentage}` | Static | Variable Settings | Usage percentage threshold |
| `{usage_amount}` | Static | Variable Settings | Current usage amount |
| `{usage_limit}` | Static | Variable Settings | Usage limit |

### Admin Notification Variables

| Variable | Type | Source | Description |
|----------|------|--------|-------------|
| `{notification_type}` | Dynamic | Notification system | Type of notification |
| `{notification_priority}` | Dynamic | Notification system | Priority level |
| `{notification_time}` | Dynamic | Notification system | Notification timestamp |
| `{notification_message}` | Dynamic | Notification system | Notification message |
| `{notification_dashboard_link}` | Static | Variable Settings | Admin dashboard link |

### Newsletter Template Variables

| Variable | Type | Source | Description |
|----------|------|--------|-------------|
| `{month}` | Static | Variable Settings | Current month name |
| `{article_1_title}` | Static | Variable Settings | First article title |
| `{article_1_summary}` | Static | Variable Settings | First article summary |
| `{article_1_link}` | Static | Variable Settings | First article link |
| `{article_2_title}` | Static | Variable Settings | Second article title |
| `{article_2_summary}` | Static | Variable Settings | Second article summary |
| `{article_2_link}` | Static | Variable Settings | Second article link |
| `{article_3_title}` | Static | Variable Settings | Third article title |
| `{article_3_summary}` | Static | Variable Settings | Third article summary |
| `{article_3_link}` | Static | Variable Settings | Third article link |
| `{unsubscribe_link}` | Static | Variable Settings | Unsubscribe page link |

### Engagement Email Variables

| Variable | Type | Source | Description |
|----------|------|--------|-------------|
| `{feature_1}` | Static | Variable Settings | First feature highlight |
| `{feature_2}` | Static | Variable Settings | Second feature highlight |
| `{feature_3}` | Static | Variable Settings | Third feature highlight |
| `{welcome_back_link}` | Static | Variable Settings | Welcome back page link |

### Product Update Variables

| Variable | Type | Source | Description |
|----------|------|--------|-------------|
| `{feature_name}` | Static | Variable Settings | New feature name |
| `{feature_description}` | Static | Variable Settings | Feature description |
| `{benefit_1}` | Static | Variable Settings | First benefit |
| `{benefit_2}` | Static | Variable Settings | Second benefit |
| `{benefit_3}` | Static | Variable Settings | Third benefit |
| `{support_email}` | Static | Variable Settings | Support email address |
| `{try_it_now_link}` | Static | Variable Settings | Try feature link |

### Survey Request Variables

| Variable | Type | Source | Description |
|----------|------|--------|-------------|
| `{survey_duration}` | Static | Variable Settings | Survey duration (e.g., "5 minutes") |
| `{survey_topic}` | Static | Variable Settings | Survey topic |
| `{incentive}` | Static | Variable Settings | Survey incentive |
| `{survey_deadline}` | Static | Variable Settings | Survey deadline date |
| `{rsvp_link}` | Static | Variable Settings | Survey RSVP link |

### Sales Announcement Variables

| Variable | Type | Source | Description |
|----------|------|--------|-------------|
| `{product_name}` | Static | Variable Settings | Product name |
| `{discount_percentage}` | Static | Variable Settings | Discount percentage (e.g., "20%") |
| `{promo_code}` | Static | Variable Settings | Promotional code |
| `{expiry_date}` | Static | Variable Settings | Promotion expiry date |
| `{attendee_count}` | Static | Variable Settings | Expected attendee count |
| `{shownow_link}` | Static | Variable Settings | Shop now link |

### Event Invitation Variables

| Variable | Type | Source | Description |
|----------|------|--------|-------------|
| `{event_name}` | Static | Variable Settings | Event name |
| `{event_location}` | Static | Variable Settings | Event location |
| `{event_description}` | Static | Variable Settings | Event description |
| `{rsvp_deadline}` | Static | Variable Settings | RSVP deadline |
| `{event_rsvp_link}` | Static | Variable Settings | Event RSVP link |

## Implementation

### 1. Auto Generate Variables Function

The system provides an "Auto Generate Variables" button that creates all default variables in `platform_config`:

```typescript
// Mutation: generateDefaultVariables
// Creates all static variables with default values
// Checks for existing keys to prevent duplicates
```

**Duplicate Prevention**:
- Before creating a variable, query `platform_config` for existing key
- If key exists with `category = "variable"`, skip creation
- Only insert if key doesn't exist

### 2. Variable Settings UI

**Location**: Email Management → Variable Settings tab (6th tab)

**Features**:
- List all variables grouped by template type
- Edit variable values inline
- Auto Generate Variables button
- Search/filter variables
- Validation for required variables

### 3. Variable Replacement Logic

**Priority Order**:
1. **Programmatic Variables** - Generated at runtime (highest priority)
2. **Dynamic Variables** - Extracted from database records
3. **Static Variables** - Retrieved from platform_config
4. **Fallback** - Default values if not found

**Replacement Process**:
```typescript
1. Load all variables from platform_config (category = "variable")
2. Generate programmatic variables (current_year, event_date, event_time)
3. Extract dynamic variables from context (user, invoice, notification)
4. Merge all variables into single object
5. Replace {variable_name} in template HTML and subject
```

### 4. Variable Management Mutations

```typescript
// List all variables
listVariables() → Variable[]

// Get single variable
getVariable(key: string) → Variable

// Create/Update variable (upsert)
saveVariable(key: string, value: string, description: string) → Variable

// Delete variable
deleteVariable(key: string) → void

// Auto-generate all default variables
generateDefaultVariables() → { created: number, skipped: number }
```

## Usage Examples

### Example 1: Welcome Email

```html
<h1>Welcome, {user_name}!</h1>
<p>Thank you for joining {company_name}.</p>
<p>Current year: {current_year}</p>
<a href="{get_started_link}">Get Started</a>
<a href="{login_link}">Login to your account</a>
```

**Variables Replaced**:
- `{user_name}` → "John Doe" (from user record)
- `{company_name}` → "StartupKit" (from settings)
- `{current_year}` → "2026" (programmatic)
- `{get_started_link}` → "https://app.startupkit.com/getting-started" (from platform_config)
- `{login_link}` → "https://app.startupkit.com/login" (from platform_config)

### Example 2: Subscription Email

```html
<h1>Subscription Confirmed</h1>
<p>Invoice: {invoiceNo}</p>
<p>Plan: {subscription_plan}</p>
<p>Status: {subscription_status}</p>
<p>Next billing: {next_billing_date}</p>
<a href="{subscription_link}">Manage Subscription</a>
```

**Variables Replaced**:
- `{invoiceNo}` → "INV-2026-001" (from invoice)
- `{subscription_plan}` → "Pro Plan" (from invoice)
- `{subscription_status}` → "paid" (from invoice)
- `{next_billing_date}` → "13/02/2026" (from invoice)
- `{subscription_link}` → "https://app.startupkit.com/subscription" (from platform_config)

### Example 3: Newsletter

```html
<h1>{company_name} Newsletter - {month}</h1>

<article>
  <h2>{article_1_title}</h2>
  <p>{article_1_summary}</p>
  <a href="{article_1_link}">Read More</a>
</article>

<article>
  <h2>{article_2_title}</h2>
  <p>{article_2_summary}</p>
  <a href="{article_2_link}">Read More</a>
</article>

<a href="{unsubscribe_link}">Unsubscribe</a>
```

**Variables Replaced**:
- All from platform_config (Variable Settings)
- Admin updates these monthly via Variable Settings tab

## Default Values

When Auto Generate Variables is clicked, the following default values are created:

```typescript
{
  login_link: "https://app.startupkit.com/login",
  upgrade_plan: "https://app.startupkit.com/pricing",
  get_started_link: "https://app.startupkit.com/getting-started",
  subscription_link: "https://app.startupkit.com/subscription",
  invoice_link: "https://app.startupkit.com/invoices",
  notification_dashboard_link: "https://app.startupkit.com/admin",
  unsubscribe_link: "https://app.startupkit.com/unsubscribe",
  welcome_back_link: "https://app.startupkit.com/dashboard",
  try_it_now_link: "https://app.startupkit.com/features",
  rsvp_link: "https://app.startupkit.com/rsvp",
  shownow_link: "https://app.startupkit.com/shop",
  event_rsvp_link: "https://app.startupkit.com/events/rsvp",
  
  // Newsletter defaults
  month: "January",
  article_1_title: "Article Title 1",
  article_1_summary: "Article summary...",
  article_1_link: "https://blog.startupkit.com/article-1",
  // ... etc
  
  // Product Update defaults
  feature_name: "New Feature",
  feature_description: "Feature description...",
  benefit_1: "Benefit 1",
  benefit_2: "Benefit 2",
  benefit_3: "Benefit 3",
  support_email: "support@startupkit.com",
  
  // Survey defaults
  survey_duration: "5 minutes",
  survey_topic: "Product Feedback",
  incentive: "$10 Amazon Gift Card",
  survey_deadline: "31/01/2026",
  
  // Sales defaults
  product_name: "Product Name",
  discount_percentage: "20%",
  promo_code: "SAVE20",
  expiry_date: "31/01/2026",
  attendee_count: "100",
  
  // Event defaults
  event_name: "Event Name",
  event_location: "Virtual",
  event_description: "Event description...",
  rsvp_deadline: "31/01/2026",
  
  // Engagement defaults
  feature_1: "Feature 1",
  feature_2: "Feature 2",
  feature_3: "Feature 3",
  
  // Usage Alert defaults
  usage_percentage: "80%",
  usage_amount: "800",
  usage_limit: "1000",
  
  // Payment defaults
  payment_method: "Credit Card"
}
```

## Best Practices

1. **Always use Auto Generate** before creating templates to ensure all variables exist
2. **Update variables regularly** - especially newsletter, event, and sales variables
3. **Use descriptive values** - helps template editors understand what will be displayed
4. **Test templates** - Use System Notification (test mode) to verify variable replacement
5. **Keep URLs updated** - Ensure all link variables point to correct pages
6. **Backup before bulk changes** - Export variable settings before major updates

## Security Considerations

- All variables have `isEncrypted: false` (they contain public information)
- Sensitive data (API keys, passwords) should NOT be stored as variables
- Variables are visible to all admin users
- No PII (Personally Identifiable Information) should be stored as static variables

## Migration Guide

If you already have emails using hardcoded values:

1. Click "Auto Generate Variables" to create all variable entries
2. Update variable values in Variable Settings tab
3. Replace hardcoded values in templates with `{variable_name}`
4. Test with System Notification enabled
5. Verify all variables are replaced correctly
6. Deploy to production

## Troubleshooting

**Variable not replaced**:
- Check variable exists in platform_config with category = "variable"
- Verify variable name matches exactly (case-sensitive)
- Ensure curly braces are used: `{variable_name}` not `variable_name`

**Duplicate variables created**:
- Should not happen - Auto Generate checks for existing keys
- If duplicates exist, delete manually and regenerate

**Wrong value displayed**:
- Check Variable Settings tab for current value
- Programmatic variables (current_year, event_date) cannot be edited
- Dynamic variables come from database records, not platform_config
