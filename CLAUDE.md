# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StartupKit is a full-featured SaaS platform starter kit built with Next.js 16 (App Router), React 19, TypeScript, and Convex as the real-time database backend. It includes admin dashboard, email management, subscriptions/billing, support tickets, booking system, and a storyboard studio.

## Development Commands

```bash
npm run setup     # First-time setup: installs deps, initializes Convex, seeds DB, creates .env.local
npm run dev       # Start Next.js dev server (port 3000)
npm run build     # Production build (TypeScript errors are intentionally ignored — see next.config.ts)
npm run lint      # ESLint
```

Convex must be running alongside the dev server. The setup script handles initial Convex initialization. For ongoing development, Convex syncs automatically when `npm run dev` is used.

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 App Router, React 19, Tailwind CSS v4, shadcn/ui (New York style, Lucide icons)
- **Database**: Convex (real-time, TypeScript-first) — schema in `convex/schema.ts` (30+ tables)
- **Auth**: Clerk (users + organizations, role-based access via public metadata)
- **Payments**: Stripe (subscriptions + one-time purchases)
- **File Storage**: Cloudflare R2 (pre-signed URL uploads)
- **Email**: Nodemailer (SMTP) + Brevo HTTP API
- **AI**: Kie AI (script/image/video generation)

### Key Directories
- `app/` — Next.js pages and API routes (App Router). Admin pages under `app/admin/`, user dashboard under `app/dashboard/`, API endpoints under `app/api/`
- `convex/` — All database schema, queries, mutations, and server-side logic. Feature modules are organized by domain (e.g., `emailTemplates.ts`, `bookings.ts`, `admin.ts`)
- `components/` — React components. `components/ui/` contains shadcn/ui primitives; other subdirectories are feature-specific
- `lib/` — Utilities and helpers (Stripe, auth, R2 uploads, org limits, credits)
- `hooks/` — Custom React hooks (`useAdminRole`, `useCompany`, `useFeatures`, `useSubscription`, `use-mobile`)

### Data Flow Pattern
Frontend components use Convex React hooks (`useQuery`, `useMutation`) for real-time data. Convex functions in `convex/` handle all database operations with schema validation. External service integrations (Stripe, Clerk, Kie AI) communicate via webhook API routes in `app/api/`.

### Authentication & Routing
- `middleware.ts` defines public vs protected routes using Clerk middleware
- Public routes: `/`, `/pricing`, `/sign-in`, `/sign-up`, webhook endpoints, booking/chat APIs
- All other routes require authentication
- Admin access controlled via Clerk public metadata (`role: "super_admin"`)
- IP/country blocking is checked at login time (not per-request) — see `components/LoginTracker.tsx`

### Multi-tenancy
Organization support via Clerk organizations. Org-level settings and subscriptions stored in Convex (`org_settings`, `org_subscriptions`). Limits enforced through `lib/org-limits.ts`.

## Environment Variables

See `env.example` for the full list. Key services requiring configuration: Clerk, Convex, Stripe, Cloudflare R2, Kie AI. The `NEXT_PUBLIC_APP_URL` is used for Kie AI callback URLs.

## Build Notes

- TypeScript build errors are temporarily ignored (`ignoreBuildErrors: true`). Repo is at 2 known errors, both in `lib/director/tool-executor.ts` (active Director WIP — `api.credits.getBalance` returns `number | null` and needs `?? 0`). Flip the flag to `false` once those land, then keep it that way.
- Server actions have a 50MB body size limit (for file uploads)
