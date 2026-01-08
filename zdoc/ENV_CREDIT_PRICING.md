# Environment Variables for Credit Pricing

## How to Configure Credit Pricing via .env.local

You can now control credit pricing through environment variables instead of hardcoding values.

### Add to `.env.local`:

```bash
# Credit Pricing Configuration (all prices in cents)
# IMPORTANT: Use NEXT_PUBLIC_ prefix for client-side access

# Small Package
NEXT_PUBLIC_CREDIT_SMALL_AMOUNT=100
NEXT_PUBLIC_CREDIT_SMALL_PRICE_CENTS=1000

# Medium Package
NEXT_PUBLIC_CREDIT_MEDIUM_AMOUNT=500
NEXT_PUBLIC_CREDIT_MEDIUM_PRICE_CENTS=4000

# Large Package
NEXT_PUBLIC_CREDIT_LARGE_AMOUNT=1000
NEXT_PUBLIC_CREDIT_LARGE_PRICE_CENTS=7000
```

### Default Values (if not set):
- **Small**: 100 credits for MYR 10.00 (1000 cents)
- **Medium**: 500 credits for MYR 40.00 (4000 cents)
- **Large**: 1000 credits for MYR 70.00 (7000 cents)

### How to Change Pricing:

#### Example 1: Change Small Package to 150 credits for MYR 15.00
```bash
NEXT_PUBLIC_CREDIT_SMALL_AMOUNT=150
NEXT_PUBLIC_CREDIT_SMALL_PRICE_CENTS=1500
```

#### Example 2: Change Medium Package to 600 credits for MYR 50.00
```bash
NEXT_PUBLIC_CREDIT_MEDIUM_AMOUNT=600
NEXT_PUBLIC_CREDIT_MEDIUM_PRICE_CENTS=5000
```

#### Example 3: Change Large Package to 8000 credits for MYR 80.00
```bash
NEXT_PUBLIC_CREDIT_LARGE_AMOUNT=8000
NEXT_PUBLIC_CREDIT_LARGE_PRICE_CENTS=8000
```

### Important Notes:

1. **Prices are in CENTS**: 
   - MYR 10.00 = 1000 cents
   - MYR 40.00 = 4000 cents
   - MYR 70.00 = 7000 cents

2. **Restart Required**: After changing `.env.local`, restart your development server:
   ```bash
   npm run dev
   ```

3. **Production**: Set these environment variables in your deployment platform (Vercel, Netlify, etc.)

### How It Works:

The system uses `lib/credit-pricing.ts` which:
1. Reads environment variables
2. Falls back to default values if not set
3. Automatically calculates display price (MYR X.XX) from cents
4. Used by both Pricing page and Billing page

### Files Affected:
- `lib/credit-pricing.ts` - Configuration logic
- `app/pricing/page.tsx` - Uses `getCreditPackages()`
- `app/dashboard/billing/page.tsx` - Uses `getCreditPackages()`

### Testing:

1. Add variables to `.env.local`
2. Restart dev server
3. Visit `/pricing` page
4. Check credit packages show new prices
5. Visit `/dashboard/billing` page
6. Verify same prices appear

### Complete .env.local Example:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Stripe Price IDs
STARTER_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
PRO_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STARTER_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
PRO_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx

# Credit Pricing (Optional - uses defaults if not set)
NEXT_PUBLIC_CREDIT_SMALL_AMOUNT=100
NEXT_PUBLIC_CREDIT_SMALL_PRICE_CENTS=1000
NEXT_PUBLIC_CREDIT_MEDIUM_AMOUNT=500
NEXT_PUBLIC_CREDIT_MEDIUM_PRICE_CENTS=4000
NEXT_PUBLIC_CREDIT_LARGE_AMOUNT=1000
NEXT_PUBLIC_CREDIT_LARGE_PRICE_CENTS=7000

# N8N Configuration
N8N_BASE_URL=https://your-n8n-instance.com
N8N_SCAN_WEBHOOK_PATH=/webhook-test/scan
N8N_SUPPORT_WEBHOOK_PATH=/webhook-test/support
N8N_CALLBACK_SHARED_SECRET=your-secret-key
N8N_CALLBACK_URL=https://your-app.com/api/n8n/callback

# Support Email
EMAIL_SUPPORT=support@yourcompany.com

# Storage Limits (Optional)
FREE_STORAGE_MB=10
STARTER_STORAGE_MB=100
PRO_STORAGE_MB=300
```
