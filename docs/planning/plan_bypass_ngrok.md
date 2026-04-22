# Local Development Tunnel Guide

## The Problem

KIE AI (and other external services) send **callbacks** to your app after processing is complete. During local development, your `localhost:3000` isn't reachable from the internet. You need a tunnel to expose it.

**ngrok free tier** adds an interstitial "Visit Site" warning page that blocks external POST callbacks with a **307 Temporary Redirect**. KIE AI's callback never reaches your server.

---

## Option 1: Cloudflared (Recommended — Free, No Warning Page)

Cloudflare's free tunnel. No signup, no warning page, callbacks work instantly.

### Install

```bash
# Windows
winget install cloudflare.cloudflared

# macOS
brew install cloudflared

# Linux
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/
```

### Usage

```bash
# Start tunnel (generates a random public URL)
cloudflared tunnel --url http://localhost:3000
```

Output:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
|  https://random-name-here.trycloudflare.com                                                |
+--------------------------------------------------------------------------------------------+
```

### Configure

Update `.env.local`:
```
NEXT_PUBLIC_APP_URL=https://random-name-here.trycloudflare.com
```

Then restart your dev server (`npm run dev`).

### Pros & Cons

| Pros | Cons |
|---|---|
| Free, no account needed | URL changes every restart |
| No warning/interstitial page | Slightly slower than ngrok |
| POST callbacks work immediately | No custom subdomain on free tier |
| No 307 redirect issues | |

---

## Option 2: ngrok (Paid Recommended)

### Free Tier Issues

- Shows "Visit Site" warning page for first-time visitors
- External POST callbacks get **307 Temporary Redirect**
- Must visit the URL in browser and click "Visit Site" each session
- Warning page cookie doesn't apply to external services (KIE AI, Stripe, etc.)

### Free Tier Workaround

```bash
# Start ngrok
ngrok http 3000 --region ap

# Then IMMEDIATELY:
# 1. Open the ngrok URL in your browser
# 2. Click "Visit Site" on the warning page
# 3. This sets a session cookie
# 4. Callbacks MAY work for that session (unreliable)
```

**This workaround is unreliable** — the cookie is browser-specific and doesn't apply to KIE AI's server making the callback.

### Paid Tier ($8/month)

Removes the warning page entirely. All callbacks work.

```bash
# Login to paid account
ngrok config add-authtoken YOUR_TOKEN

# Start with custom subdomain (paid feature)
ngrok http 3000 --region ap --subdomain your-app-name
```

### Manual Callback Testing (When ngrok blocks callbacks)

If callbacks are getting 307, you can manually replay them via localhost:

```bash
# Example: Music generation callback
curl -X POST "http://localhost:3000/api/kie-callback?fileId=YOUR_FILE_ID" \
  -H "Content-Type: application/json" \
  -d '["https://tempfile.aiquickdraw.com/r/SONG1.mp3","https://tempfile.aiquickdraw.com/r/SONG2.mp3"]'

# Example: Image generation callback
curl -X POST "http://localhost:3000/api/kie-callback?fileId=YOUR_FILE_ID" \
  -H "Content-Type: application/json" \
  -d '{"code":200,"data":{"state":"success","resultUrl":"https://file.aiquickdraw.com/result.png"}}'
```

Get the callback URLs from KIE AI dashboard → task details → retry callback info.

---

## Option 3: Deploy to Vercel (Best for Stable Callbacks)

If your app is deployed on Vercel, use the Vercel URL for callbacks. No tunnel needed.

```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

- Local dev server handles UI/frontend
- Callbacks go to Vercel (always online, no tunnel issues)
- Vercel processes the callback and updates Convex DB
- Your local app sees the update in real-time (Convex is real-time)

**Note:** This requires the Vercel deployment to have the same environment variables (KIE AI keys, R2 credentials, etc.).

---

## Quick Reference

| Tunnel | Cost | Warning Page | Reliability | Setup |
|---|---|---|---|---|
| **Cloudflared** | Free | None | High | `cloudflared tunnel --url http://localhost:3000` |
| **ngrok Free** | Free | Yes (307 issue) | Low | `ngrok http 3000` + visit URL in browser |
| **ngrok Paid** | $8/mo | None | High | `ngrok http 3000 --subdomain xxx` |
| **Vercel** | Free | None | Highest | Deploy + set `NEXT_PUBLIC_APP_URL` |

---

## Affected Services

These services send callbacks that require a public URL:

| Service | Callback Route | Format |
|---|---|---|
| KIE AI (Image/Video) | `/api/kie-callback?fileId=xxx` | `{code: 200, data: {state, resultUrl}}` |
| KIE AI (Music) | `/api/kie-callback?fileId=xxx` | `["url1.mp3", "url2.mp3"]` (bare array) |
| Stripe | `/api/stripe/webhook` | Stripe event object |
| Clerk | `/api/clerk/webhook` | Clerk event object |

---

## Daily Development Note

The ngrok free tier warning page resets **every session** (restart, disconnect, or cookie expiry). This means every day (or whenever ngrok restarts), external callbacks will get **307 Temporary Redirect** again.

### Options to Avoid This Daily

1. **Switch to cloudflared** (free, permanent fix):
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
   No warning page ever. Just the URL changes each restart. Update `.env.local` with the new URL.

2. **Ask Claude to curl it** — whenever a callback is stuck, provide the fileId + result URLs and Claude can send it directly to `localhost:3000`, bypassing ngrok entirely. Works but manual.

3. **Deploy to Vercel** — set `NEXT_PUBLIC_APP_URL` to your Vercel domain. Callbacks go directly to production, no tunnel needed. Your local dev still sees real-time updates via Convex.

4. **Pay for ngrok** ($8/mo) — removes the warning page permanently. Stable subdomain too.

### Recommendation

Try **cloudflared** first — it's free, no signup, no warning page, and callbacks work immediately. If the URL changing each restart is annoying, deploy to Vercel for a stable callback URL.
