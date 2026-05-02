# Storytica — New Environment Setup Runbook

Complete step-by-step guide to bring a fresh environment from zero to running.
Follow sections in order — some steps depend on values from previous ones.

---

## 0. Prerequisites

```bash
node --version   # 18+
npm --version    # 9+
npx convex --version
```

Install deps first:
```bash
npm install
```

---

## 1. Generate Secrets (do this first)

Run this three times to generate three independent secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Label them:
```
SECRET_A → WEBHOOK_SECRET
SECRET_B → INTERNAL_REPAIR_SECRET
SECRET_C → SUPPORT_INTERNAL_SECRET
```

Keep these. You'll set the same value in both `.env.local` AND the Convex dashboard.

---

## 2. Clerk

**Dashboard:** https://dashboard.clerk.com

### 2a. Create Application
- New application → name it → enable Email + Google sign-in
- Copy **Publishable Key** (`pk_live_...`) and **Secret Key** (`sk_live_...`)

### 2b. JWT Template for Convex (REQUIRED)
Convex auth won't work without this.

1. Clerk Dashboard → **JWT Templates** → **New template** → choose **Convex**
2. Template name: `convex`
3. Copy the **Issuer URL** — looks like `https://your-app.clerk.accounts.dev`
   - This becomes `CLERK_JWT_ISSUER_DOMAIN` in the Convex dashboard

### 2c. Webhook for Stripe sync
1. Clerk Dashboard → **Webhooks** → **Add Endpoint**
2. URL: `https://your-domain.com/api/webhooks/clerk`
3. Events to subscribe: `user.created`, `user.updated`, `organization.created`, `organization.membership.created`

### 2d. Organizations
- Clerk Dashboard → **Organizations** → Enable organizations
- Set max memberships as needed

---

## 3. Convex

**Dashboard:** https://dashboard.convex.dev

### 3a. Create Deployment
```bash
npx convex dev
# Follow prompts → create new project → choose "production" for live
```

This writes `NEXT_PUBLIC_CONVEX_URL` to `.env.local` automatically.

For CI/CD production deploys:
```bash
npx convex deploy --prod
# Copy the deploy key shown → becomes CONVEX_DEPLOY_KEY
```

### 3b. Convex Dashboard Environment Variables

Go to: **Convex Dashboard → your project → Settings → Environment Variables**

Add ALL of these:

| Variable | Value | Where to get it |
|---|---|---|
| `CLERK_JWT_ISSUER_DOMAIN` | `https://your-app.clerk.accounts.dev` | Clerk → JWT Templates → Convex template → Issuer |
| `WEBHOOK_SECRET` | `SECRET_A` (from step 1) | Generated in step 1 |
| `INTERNAL_REPAIR_SECRET` | `SECRET_B` (from step 1) | Generated in step 1 |
| `SUPPORT_INTERNAL_SECRET` | `SECRET_C` (from step 1) | Generated in step 1 |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` | Your production domain |

> These are **Convex-side** env vars — separate from `.env.local`.
> The cron jobs (inactivity cleanup, orphan repair) and internal mutations read from here.

### 3c. Alternative: set via CLI
```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev
npx convex env set WEBHOOK_SECRET <SECRET_A>
npx convex env set INTERNAL_REPAIR_SECRET <SECRET_B>
npx convex env set SUPPORT_INTERNAL_SECRET <SECRET_C>
npx convex env set NEXT_PUBLIC_APP_URL https://your-domain.com
```

---

## 4. Cloudflare R2

**Dashboard:** https://dash.cloudflare.com → R2 Object Storage

### 4a. Create Bucket
1. R2 → **Create bucket** → name: `storyboardbucket` (or custom)
2. Location: Auto

### 4b. Public Access
1. Bucket → **Settings** → **Public Access** → **Allow Access**
2. Copy the public URL: `https://pub-xxxx.r2.dev`
   - Alternatively set a custom domain under **Custom Domains**

### 4c. API Token
1. Cloudflare Dashboard → **My Profile** → **API Tokens** → **Create Token**
2. Template: **Edit Cloudflare Workers** — or use:
   - Permissions: `Object Storage: Read & Write`
   - Scope: your bucket
3. Copy **Access Key ID** and **Secret Access Key**

### 4d. Account ID
- Cloudflare Dashboard → right sidebar → **Account ID**

### 4e. CORS (required for browser uploads)
Bucket → **Settings** → **CORS Policy** → Add:
```json
[
  {
    "AllowedOrigins": ["https://your-domain.com", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### 4f. Lifecycle Rule (auto-expire temp files)
Bucket → **Settings** → **Object Lifecycle Rules** → **Add Rule**:
- Rule name: `expire-temps`
- Prefix: `temps/`
- Expiration: **1 day**

This auto-cleans staging/upload temp files at the R2 level as a safety net.

---

## 5. Stripe

**Dashboard:** https://dashboard.stripe.com

### 5a. API Keys
- Developers → **API keys**
- Copy **Publishable key** (`pk_live_...`) and **Secret key** (`sk_live_...`)

### 5b. Webhook Endpoint
1. Developers → **Webhooks** → **Add endpoint**
2. URL: `https://your-domain.com/api/webhooks/stripe`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. After creating, reveal and copy the **Signing secret** (`whsec_...`)

### 5c. Products & Prices
Create your subscription products in the Stripe dashboard.
The price IDs are stored in Convex `platform_config` (via admin UI), not in env vars.

---

## 6. Kie AI (image + video generation)

**Dashboard:** https://kie.ai/dashboard

1. Log in → **API Keys** → create new key
2. Copy the key (`kie_...`)
3. The callback URL used: `https://your-domain.com/api/kie/callback`
   - Kie AI calls this when async generation completes

---

## 7. OpenRouter + Anthropic (AI Director & Support Chatbot)

### OpenRouter (primary — DeepSeek V3, cheap)
- https://openrouter.ai/keys → Create key
- Copy `sk-or-...`

### Anthropic (fallback + Agent mode)
- https://console.anthropic.com → API Keys → Create key
- Copy `sk-ant-...`

---

## 8. .env.local — Full Template

Create `.env.local` in the project root:

```env
# ── App ──────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://your-domain.com

# ── Clerk ────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# ── Convex ────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=prod:...

# ── Cloudflare R2 ─────────────────────────────────────────────────────────────
CLOUDFLARE_ACCOUNT_ID=abc123...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=storyboardbucket
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxxx.r2.dev
R2_PUBLIC_URL=https://pub-xxxx.r2.dev

# ── Stripe ────────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ── Kie AI ────────────────────────────────────────────────────────────────────
KIE_AI_API_KEY=kie_...

# ── AI (Director + Support Chatbot) ───────────────────────────────────────────
OPENROUTER_API_KEY=sk-or-...
ANTHROPIC_API_KEY=sk-ant-...

# ── Internal Secrets (same values as Convex dashboard) ────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
WEBHOOK_SECRET=<SECRET_A>
INTERNAL_REPAIR_SECRET=<SECRET_B>
SUPPORT_INTERNAL_SECRET=<SECRET_C>
```

---

## 9. Convex Dashboard — Environment Variables (Summary)

These go in **Convex Dashboard → Settings → Environment Variables**, NOT in `.env.local`.
The Convex runtime reads these for cron jobs, internal mutations, and auth.

| Variable | Value |
|---|---|
| `CLERK_JWT_ISSUER_DOMAIN` | From Clerk → JWT Templates → Convex template → Issuer URL |
| `WEBHOOK_SECRET` | Same as `WEBHOOK_SECRET` in `.env.local` |
| `INTERNAL_REPAIR_SECRET` | Same as `INTERNAL_REPAIR_SECRET` in `.env.local` |
| `SUPPORT_INTERNAL_SECRET` | Same as `SUPPORT_INTERNAL_SECRET` in `.env.local` |
| `NEXT_PUBLIC_APP_URL` | Your production domain (used by inactivity cron to call API routes) |

---

## 10. Email (SMTP / Brevo) — Admin UI Config

Email is configured **inside the app** (not via env vars).
After first login as super admin:

1. Go to **Admin → Settings → Email Settings**
2. Choose Brevo (recommended) or any SMTP provider:
   - **Brevo:** https://app.brevo.com → SMTP & API → API Keys
   - Fill in: SMTP host, port, username, password (or API key), from email, from name
3. Send a test email to verify

---

## 11. First Run

```bash
# 1. Install dependencies
npm install

# 2. Start Convex (keep this running in a separate terminal)
npx convex dev

# 3. Start Next.js
npm run dev
```

Open http://localhost:3000

### First-login checklist
- [ ] Sign up → you become the first user
- [ ] Go to Clerk Dashboard → Users → find your user → Edit → Metadata (public) → add `"role": "super_admin"`
- [ ] Back in app: Admin panel should now be visible
- [ ] Admin → Settings → Email Settings → configure SMTP/Brevo → send test email
- [ ] Admin → Settings → Stripe Plans → link your Stripe price IDs to plans
- [ ] Admin → System Cleaning → Storage → Refresh → confirm stats load
- [ ] Generate one test image to confirm R2 uploads + Kie AI callback work

---

## 12. Production Deploy Checklist

- [ ] All `.env.local` values set in your hosting platform (Vercel / Railway / etc.)
- [ ] All 5 Convex dashboard env vars set
- [ ] Stripe webhook endpoint URL updated to production domain
- [ ] Clerk webhook endpoint URL updated to production domain
- [ ] R2 CORS policy includes production domain
- [ ] R2 lifecycle rule set for `temps/` prefix (1 day expiry)
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain in both `.env.local` AND Convex dashboard
- [ ] Run `npx convex deploy --prod` to push schema + functions to production

---

## 13. Cron Jobs Reference

These run automatically once Convex is deployed. No setup needed beyond env vars above.

| Cron | Schedule | What it does |
|---|---|---|
| `cleanup-expired-temps` | Daily 03:00 UTC | Removes `storyboard_files` records with `category=temps` older than 30 days |
| `refresh-landing-stats` | Every hour | Updates cached landing page stats (creators, projects, generations) |
| `repair-orphan-files` | Daily 04:00 UTC | Soft/hard-deletes `storyboard_files` whose parent item was deleted |
| `send-inactivity-warnings` | Daily 06:00 UTC | Emails users at 10-month and 11-month inactivity marks |
| `purge-inactive-accounts` | Daily 06:30 UTC | Purges R2 files for accounts inactive 12+ months (20/day batch) |

---

## 14. Troubleshooting

### "Not authenticated" errors in Convex
→ Clerk JWT template not set up (section 2b). The Convex issuer domain must match exactly.

### Images not loading (broken thumbnails)
→ `NEXT_PUBLIC_R2_PUBLIC_URL` wrong or R2 bucket not set to public access (section 4b).

### Stripe webhooks failing
→ `STRIPE_WEBHOOK_SECRET` mismatch. Re-copy from Stripe dashboard webhook signing secret.

### Cron jobs not running
→ `INTERNAL_REPAIR_SECRET` and `NEXT_PUBLIC_APP_URL` not set in **Convex dashboard** (section 9).
   These are Convex env vars, not `.env.local`.

### Email not sending
→ SMTP/Brevo not configured. Do section 10 (admin UI config), not env vars.

### "Forbidden" on internal API routes
→ `INTERNAL_REPAIR_SECRET` in `.env.local` doesn't match the value in Convex dashboard.
   Both must be identical.
