@AGENTS.md

# Swaggy — B2B Supply Chain Sourcing Platform

## Stack
- **Framework:** Next.js 16 (App Router, TypeScript, `'use client'` components)
- **Styling:** Tailwind CSS (utility classes, no CSS modules)
- **Database & Auth:** Supabase (PostgreSQL + Auth + RLS + Storage)
- **Payments:** Stripe (Checkout Sessions, Webhooks)
- **Icons:** Lucide React
- **Deployment:** Vercel (auto-deploy on push to `main`)

## Supabase Project
- **Project ID:** `auyvhebnlxymcrtyyyem`
- **URL:** `https://auyvhebnlxymcrtyyyem.supabase.co`
- **Storage bucket:** `order-inspiration` (used for all file uploads: inspiration images, logo files, sample photos, dieline files)

## Git Remote
- **Repo:** `https://github.com/kyledou1995/swaggy-website.git`
- **Branch:** `main` (auto-deploys to Vercel)

## Environment Variables
Required in `.env.local` and Vercel:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_BASE_URL (optional, falls back to request origin)
```

## Project Structure
```
src/
  app/
    page.tsx                        # Marketing landing page
    auth/login, auth/signup         # Auth pages
    portal/                         # Client-facing portal
      dashboard/                    # Client dashboard
      orders/                       # Order list
      orders/new/                   # 5-step progressive order form
      orders/[id]/                  # Order detail & tracking (client side)
      messages/                     # Client messages
      notifications/                # Notification preferences
      settings/                     # Account settings
      team/                         # Team member management
    admin/                          # Admin portal (dark theme, gray-900 bg)
      dashboard/                    # Admin overview
      orders/                       # Order list (admin)
      orders/[id]/                  # Order detail & management (admin side)
      catalog/                      # Prefixed product catalog management
      clients/                      # Client management
      messages/                     # Admin messages
      users/                        # User management
    api/
      stripe/create-checkout/       # Creates Stripe Checkout Sessions
      stripe/webhook/               # Handles Stripe webhook events
      invoices/                     # Invoice generation
  components/
    landing/                        # Marketing page components
    portal/                         # Client layout (PortalLayout, NotificationBell)
    admin/                          # Admin layout (AdminLayout, AdminNotificationBell)
    auth/                           # Auth form components
    ui/                             # Reusable UI (Button, Card, Badge, etc.)
  lib/
    supabase.ts                     # Supabase client factory
    notifications.ts                # createNotification, notifyOrgMembers, notifyAdmins
    constants.ts                    # App constants
    demo-data.ts                    # Demo/seed data
  types/
    index.ts                        # All TypeScript interfaces & type definitions
```

## Database Schema (key tables)
- **profiles** — extends auth.users: `id, email, full_name, company_name, role ('client'|'admin'), client_role ('owner'|'manager'|'viewer'), organization_id, invite_status, notify_order_status, notify_new_message, email_order_status, email_new_message`
- **orders** — full order lifecycle: status enum from `draft` through `delivered`/`cancelled`, quote fields (air/ocean), deposit fields, sample fields (`sample_images, sample_description, sample_price_per_unit, sample_shipping_days, sample_quantity_requested, sample_quantity_approved, sample_physical_requested, sample_shipped`), packaging fields (`packaging_dieline_files`), cancellation fields, final payment fields, prefixed product fields, custom dimensions, inspiration/logo file arrays
- **order_updates** — status history log
- **order_messages** — chat between client and admin per order
- **order_specifications** — materials, colors, certifications
- **notifications** — in-app notifications with `target_role ('client'|'admin')`, `is_read`, `email_sent`
- **prefixed_products** — catalog of pre-configured products with sizes and pricing
- **delivery_addresses** — org-level shipping addresses
- **order_shipments** — shipment tracking per order

RLS is enabled on all tables. Admins can read/write everything; clients can only access their own org's data.

## Order Status Flow
```
draft → submitted → under_review → sourcing → quote_ready → quote_accepted →
deposit_required → deposit_paid → sample_production → sample_approval_pending →
sample_approved → manufacturing → quality_check → packing →
final_payment_required → preparing_to_ship → in_transit → delivered
(action_required / cancelled can happen at any point)
```

## Key Patterns

### Notifications
- `src/lib/notifications.ts` has three functions:
  - `createNotification()` — single user notification
  - `notifyOrgMembers()` — notifies all org members (client-facing), respects per-user preferences
  - `notifyAdmins()` — notifies all admin users
- Notification bells use polling (client: 30s, admin: 15s)
- Race condition prevention: `isMarkingRef` useRef guard prevents polling from overwriting optimistic UI updates during mark-as-read operations
- Always set `target_role` when creating notifications

### Stripe Integration
- `/api/stripe/create-checkout` — creates Checkout Sessions for deposits and sample payments
- `/api/stripe/webhook` — handles `checkout.session.completed` and `payment_intent.succeeded`
- Webhook uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for DB updates
- Payment types are tracked via `metadata.type` ('deposit', 'sample') and `metadata.paymentType`
- **TODO:** Webhook doesn't yet handle `paymentType: 'sample'` for sample payments

### File Uploads
- All uploads go to Supabase Storage bucket `order-inspiration`
- Upload pattern: generate unique filename → `supabase.storage.from('order-inspiration').upload()` → get public URL
- Used for: inspiration images, logo files, sample photos, dieline files

### Multi-tenancy
- Organizations group clients together
- Org members share orders and get collective notifications
- `client_role` controls permissions: owner > manager > viewer

### Admin vs Client Theme
- **Client portal:** Light theme (white bg, gray text, green accents `#10b981`)
- **Admin portal:** Dark theme (gray-900 bg, white/gray text, green accents)

## Commands
```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
```

## Pending Infrastructure Work
1. **Stripe webhook for sample payments** — The webhook at `/api/stripe/webhook/route.ts` only handles deposit payments. Needs to handle `paymentType: 'sample'` in checkout session metadata to update order after sample payment.
2. **Stripe env vars in Vercel** — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` need to be added.
3. **Stripe webhook endpoint in Dashboard** — webhook URL needs to be registered in Stripe Dashboard pointing to `/api/stripe/webhook`.
