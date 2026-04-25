# Admin Cleanup Plan

**Status**: Done (Phase 1-5), Phase 6 deferred
**Date**: 2025-04-25

## Goal

Cut admin from 30+ pages to ~15 focused pages. Remove bloat, merge overlaps, simplify email, unify billing.

---

## Phase 1: Delete Redundant/Low-Value Pages -- DONE

- [x] Delete `/admin/email-templates` page (duplicate of email-management Templates tab)
- [x] Delete `/admin/leads` page
- [x] Delete `/admin/referrals` page
- [x] Delete `/admin/activity` page (overlaps with dashboard + user management)
- [x] Delete `/admin/chatbot-analytics` page (inbox already shows conversations)
- [x] Delete `/admin/support-chat-reports` page
- [x] Delete `/admin/settings/testing` page (dev utility, not production)
- [x] Delete `/admin/settings/sync-data` page (one-off operation)
- [x] Delete `/admin/settings/report-header` page
- [x] Remove sidebar links and breadcrumb entries for all deleted pages
- [x] Clean up unused imports (tabler icons, lucide icons)

## Phase 2: Merge Settings Pages -- DONE

- [x] Merge `/admin/settings/invoices` + `/admin/settings/po` + `/admin/settings/invoice-po-config` into one tabbed page
- [x] Delete `/admin/settings/email` (redundant with email-management Settings tab)
- [x] Update settings layout sidebar

## Phase 3: Unify Billing -- DONE

- [x] Create `/admin/billing` with tabs: Overview | Subscriptions | Credit Purchases
- [x] Move revenue page content to `components/admin/billing/RevenueOverview.tsx`
- [x] Move subscriptions page content to `components/admin/billing/SubscriptionsTab.tsx`
- [x] Move purchases page content to `components/admin/billing/PurchasesTab.tsx`
- [x] Move `/admin/revenue/transactions` to `/admin/billing/transactions`
- [x] Delete old `/admin/revenue`, `/admin/subscriptions`, `/admin/purchases` pages
- [x] Update sidebar (Finance section: Billing, Transactions, Invoices & Sales Orders)
- [x] Update breadcrumbs

## Phase 4: Consolidate Support Navigation -- DONE

- [x] Move Support Tickets link under Inbox group (was in separate "AI Support" section)
- [x] Delete `/admin/support-chat-reports` page
- [x] Remove "AI Support" sidebar section
- [x] Add breadcrumb for support-tickets

## Phase 5: Simplify Email System -- DONE

- [x] Delete `/admin/email-management/campaigns` page
- [x] Delete `/admin/email-management/analytics` page
- [x] Remove `convex/emails/campaigns.ts`, `convex/emails/tracking.ts`, `convex/emails/analytics.ts`
- [x] Remove `convex/emails/sendEmailWithVariables.ts`
- [x] Remove `convex/emailCampaigns.ts`
- [x] Remove campaign migration files
- [x] Remove `components/email/CampaignCreatorDialog.tsx`
- [x] Clean up campaign references in email-management page text
- [x] Simplify Email sidebar to single link (no dropdown)
- Schema tables kept (removing requires Convex migration): `email_campaigns`, `email_events`, `campaign_recipients`, `email_unsubscribes`

## Phase 6: Deprecate Legacy Transactions Table -- DONE

- [x] `createPaymentTransaction` now triple-writes: transactions + credits_ledger + financial_ledger
- [x] `fraudCheck.ts` switched from `transactions` to `financial_ledger` reads
- [x] Deleted dead `convex/transactions/queries.ts` (no frontend callers)
- [x] Schema table marked DEPRECATED with clear comments
- [x] `createTransaction.ts` header documents the deprecation plan
- Kept: `transactions` write for backward-compat invoice joins (invoice.transactionId)
- Kept: `credits.ts` cleanup/purge still deletes from `transactions`

---

## Final Admin Structure (Current)

```
/admin                            Dashboard
/admin/customers                  Customers
/admin/users                      User Management
/admin/billing                    Billing (Overview | Subscriptions | Purchases)
/admin/billing/transactions       Transaction Ledger
/admin/invoices-and-pos           Invoices & Sales Orders
/admin/booking                    Bookings
/admin/inbox                      Inbox (All Messages)
/admin/support-tickets            Support Tickets
/admin/alerts                     Alerts
/admin/chatbot-settings           Chatbot (Settings | Knowledge Base)
/admin/email-management           Email (Settings | Templates | Logs)
/admin/fraud-check                Fraud Detection
/admin/security                   Security
/admin/settings                   Settings
  /admin/settings/company           Company
  /admin/settings/profile           Profile
  /admin/settings/invoice-po-config Invoice & SO Settings (General | Invoice Numbering | SO Numbering)
```

~16 pages, down from 30+. All duplicates and low-value pages removed. Billing unified. Email simplified. Chatbot consolidated.

---

## Not Changing

- Dashboard (already good)
- Booking system (fully featured, needed)
- Fraud detection (security-critical)
- Invoice/PO system (keep for now, evaluate later if Stripe invoices suffice)
- User/Customer management (core admin features)
