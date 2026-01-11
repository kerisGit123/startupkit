# IP/Country Blocking System - Usage Guide

## ✅ System Status

The IP/Country Blocking System is **fully implemented** but **disabled by default** for performance reasons.

---

## 🔧 Current Configuration

### **Development Mode (localhost)**
- ✅ IP blocking is **DISABLED**
- ✅ No API calls to check-access
- ✅ No geolocation lookups
- ✅ No performance impact
- ✅ Super admin protection active

### **Production Mode**
- ⚠️ IP blocking is **DISABLED by default**
- ✅ Can be enabled with environment variable
- ✅ Only checks non-local IPs
- ✅ Super admin protection active

---

## 🚀 How to Enable IP Blocking

### **In Production**

Add this environment variable to enable IP blocking:

```bash
ENABLE_IP_BLOCKING=true
```

**Where to add**:
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Environment Variables
- Local .env file: `.env.local`

### **Restart Required**

After adding the environment variable, restart your application:
- Vercel: Automatic on next deployment
- Netlify: Automatic on next deployment
- Local: Restart dev server

---

## 📊 How It Works

### **When Enabled**

1. **User visits your site**
2. **Middleware extracts IP** from request headers
3. **Detects country** using Cloudflare headers or ipapi.co
4. **Checks blacklist** via `/api/security/check-access`
5. **If blocked** → Redirect to `/blocked` page
6. **If allowed** → Continue normally

### **Performance Optimization**

- ✅ Skips local IPs (127.0.0.1, localhost, etc.)
- ✅ Skips unknown IPs
- ✅ Caches geolocation data (5 min)
- ✅ Graceful error handling
- ✅ No blocking on API errors

---

## 🛡️ Super Admin Protection

**Protected Email**: `shangwey123@gmail.com`

### **What's Protected**

1. ✅ **Cannot block super admin's IP**
   - System checks if IP belongs to super admin
   - Shows error: "Cannot block super admin IP address"

2. ✅ **Super admin bypasses all blocks**
   - Even if IP is blacklisted
   - Even if country is blacklisted
   - Always has access

3. ✅ **Add more super admins**
   - Edit `convex/ipBlocking.ts`
   - Add emails to `SUPER_ADMIN_EMAILS` array

```typescript
const SUPER_ADMIN_EMAILS = [
  "shangwey123@gmail.com",
  "admin@yourcompany.com", // Add more here
];
```

---

## 🎯 Using the Admin UI

### **Access the Security Page**

Navigate to: `/admin/security`

### **Block an IP Address**

1. Click "Add IP" button
2. Enter IP address (e.g., `203.0.113.45`)
3. Add optional reason
4. Click "Add to Blacklist"
5. ✅ IP is now blocked (if IP blocking is enabled)

### **Block a Country**

1. Click "Add Country" button
2. Enter country code (e.g., `CN` for China)
3. Enter country name (e.g., `China`)
4. Add optional reason
5. Click "Add to Blacklist"
6. ✅ All IPs from that country are blocked

### **Remove Blocks**

- Click the trash icon next to any IP or country
- Confirm the removal
- ✅ Block is removed immediately

---

## 🧪 Testing IP Blocking

### **Test in Development**

IP blocking is disabled in development, so you need to test in production or staging.

### **Test in Production**

1. **Enable IP blocking** (set `ENABLE_IP_BLOCKING=true`)
2. **Deploy to production**
3. **Add a test IP** to blacklist
4. **Use VPN** to access from that IP
5. **Verify** redirect to `/blocked` page
6. **Remove IP** from blacklist
7. **Verify** access restored

### **Test Country Blocking**

1. **Add a country** to blacklist (e.g., `XX` for testing)
2. **Use VPN** to access from that country
3. **Verify** redirect to `/blocked` page
4. **Remove country** from blacklist

---

## 📈 Monitoring

### **Check Statistics**

Go to `/admin/security` to see:
- Active IP blocks count
- Active country blocks count
- Total IP records
- Total country records

### **View Blocked IPs/Countries**

- All blocked IPs listed with reasons
- All blocked countries listed with reasons
- Timestamps for when blocks were added
- Who added the block (admin user ID)

---

## ⚠️ Important Notes

### **Rate Limiting**

The free IP geolocation API (ipapi.co) has limits:
- **1000 requests/day** on free tier
- After limit: Returns `countryCode: 'XX'`
- System handles this gracefully

**Solution for high traffic**:
- Use Cloudflare (provides country headers for free)
- Upgrade to paid ipapi.co plan
- Use alternative geolocation service

### **Local IPs**

These IPs are **never** checked or blocked:
- `127.0.0.1` (localhost)
- `::1` (IPv6 localhost)
- `192.168.x.x` (private network)
- `10.x.x.x` (private network)
- `172.16.x.x - 172.31.x.x` (private network)

### **Performance**

- Each request adds ~50-100ms when enabled
- Cloudflare headers are instant (0ms)
- API geolocation adds ~50-100ms
- Cached for 5 minutes per IP

---

## 🔐 Security Best Practices

### **Don't Block Too Broadly**

- ❌ Don't block entire countries unless necessary
- ❌ Don't block IP ranges (block specific IPs)
- ✅ Block specific malicious IPs
- ✅ Add clear reasons for blocks

### **Monitor Blocks**

- Review blocked IPs regularly
- Remove outdated blocks
- Check for false positives
- Monitor access denied logs

### **Super Admin Safety**

- Keep super admin list minimal
- Use strong passwords for super admins
- Enable 2FA for super admins
- Don't share super admin credentials

---

## 🛠️ Troubleshooting

### **Issue: Page loads slowly**

**Solution**: IP blocking is likely enabled in development
- Set `ENABLE_IP_BLOCKING=false` or remove the variable
- Restart dev server

### **Issue: 404 on /api/security/check-access**

**Solution**: API route not found
- Check file exists: `app/api/security/check-access/route.ts`
- Restart dev server
- Clear Next.js cache: `rm -rf .next`

### **Issue: Geolocation errors (429)**

**Solution**: Rate limit reached
- Use Cloudflare headers instead
- Reduce API calls
- Upgrade to paid plan
- System handles this gracefully (returns 'XX')

### **Issue: Can't access admin panel**

**Solution**: Check if your IP is blocked
- Use different network/VPN
- Access database directly to remove block
- Contact another admin

---

## 📝 Summary

**Current Status**:
- ✅ System fully implemented
- ✅ Disabled by default for performance
- ✅ Super admin protected
- ✅ Admin UI working at `/admin/security`

**To Enable**:
- Set `ENABLE_IP_BLOCKING=true` in production
- Restart application
- Test with VPN

**To Use**:
- Go to `/admin/security`
- Add IPs or countries to blacklist
- Monitor statistics
- Remove blocks as needed

**Super Admin**: `shangwey123@gmail.com` is always protected and cannot be blocked.
