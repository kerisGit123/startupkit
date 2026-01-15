# Logo Usage Guide

This document explains how to use logos in the StartupKit application.

## 1. Website Logo (Frontend)

**Location**: `/public/logo.png`

**Usage**: This logo is used throughout the frontend of your application.

**How to Update**:
1. Replace the file at `/public/logo.png` with your company logo
2. Recommended size: 200x200px or similar square dimensions
3. Format: PNG with transparent background recommended
4. The logo will be automatically used across the frontend

**Where it appears**:
- Navigation header
- Landing pages
- Marketing pages
- Any component that references `/logo.png`

---

## 2. Report Logo (PO & Invoice Documents)

**Location**: Cloud storage (Cloudinary, AWS S3, etc.)

**Usage**: This logo appears on printed Purchase Orders and Invoice reports.

**How to Setup**:

### Step 1: Upload Logo to Cloud Storage
Upload your logo to a cloud storage service:
- **Cloudinary** (recommended): https://cloudinary.com
- **AWS S3**: https://aws.amazon.com/s3/
- **Imgur**: https://imgur.com
- Any other image hosting service

### Step 2: Get the Public URL
After uploading, copy the public URL of your logo.
Example: `https://res.cloudinary.com/your-account/image/upload/v123456/logo.png`

### Step 3: Configure in Admin Settings
1. Go to **Admin → Settings → Company**
2. Scroll to **"Report Header Settings"** section
3. Paste your logo URL in the **"Report Logo URL"** field
4. Click **Save**

**Where it appears**:
- Purchase Order detail pages
- Purchase Order PDF exports
- Shared PO links
- Invoice reports (when implemented)

**Recommended Specifications**:
- **Height**: 64px (will be auto-scaled)
- **Format**: PNG or JPG
- **Background**: Transparent or white
- **Aspect Ratio**: Horizontal logos work best (e.g., 200x64px)

---

## 3. Chat Widget Logo

**Location**: Configured per widget in Widget Designer

**Usage**: Appears in the chat widget header.

**How to Setup**:
1. Go to **Admin → Widget Designer**
2. In the "Branding" section, enter your logo URL
3. The logo will appear in the chat widget preview and live widget

---

## Quick Reference

| Logo Type | Location | Configuration |
|-----------|----------|---------------|
| **Website Logo** | `/public/logo.png` | Replace file directly |
| **Report Logo** | Cloud storage | Admin → Settings → Company → Report Logo URL |
| **Widget Logo** | Cloud storage | Admin → Widget Designer → Logo URL |

---

## Notes

- The website logo must be named `logo.png` and placed in the `/public` folder
- Report and widget logos can be hosted anywhere with a public URL
- All logos should be optimized for web (compressed, appropriate size)
- Use HTTPS URLs for cloud-hosted logos for security
