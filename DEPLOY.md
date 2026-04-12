# Swaggy — Deployment Guide

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
# Edit .env.local with your Supabase credentials
cp .env.local.example .env.local

# 3. Run the dev server
npm run dev
```

Visit http://localhost:3000

---

## Full Production Deployment

### Step 1: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (name it "swaggy")
3. Once created, go to **SQL Editor** and run the contents of `supabase-schema.sql`
4. Go to **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 2: Configure Environment Variables

Update `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 3: Create Your Admin Account

1. Sign up through the app at `/auth/signup`
2. In Supabase Dashboard → Table Editor → profiles table
3. Find your user row and change `role` from `client` to `admin`
4. Now you can access the admin portal at `/admin/dashboard`

### Step 4: Deploy to Vercel

1. Push this code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Add the environment variables in Vercel's project settings
4. Deploy!

```bash
# Or use the Vercel CLI
npm i -g vercel
vercel
```

---

## Project Structure

```
swaggy/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Landing page (marketing)
│   │   ├── auth/               # Login & Signup pages
│   │   ├── portal/             # Client portal
│   │   │   ├── dashboard/      # Client dashboard
│   │   │   ├── orders/         # Order list, detail, new order
│   │   │   └── orders/new/     # Progressive order builder
│   │   └── admin/              # Admin portal
│   │       ├── dashboard/      # Admin overview
│   │       └── orders/         # Order management
│   ├── components/
│   │   ├── landing/            # Marketing page components
│   │   ├── portal/             # Client portal layout
│   │   ├── admin/              # Admin portal layout
│   │   ├── auth/               # Auth forms
│   │   └── ui/                 # Reusable UI components
│   ├── lib/                    # Utilities, Supabase client, constants
│   └── types/                  # TypeScript type definitions
├── supabase-schema.sql         # Database schema (run in Supabase)
└── .env.local                  # Environment variables
```

## Key Routes

| Route | Description |
|-------|-------------|
| `/` | Marketing landing page |
| `/auth/login` | Client login |
| `/auth/signup` | Client signup |
| `/portal/dashboard` | Client dashboard |
| `/portal/orders` | Client order list |
| `/portal/orders/new` | New order (progressive form) |
| `/portal/orders/[id]` | Order detail & tracking |
| `/admin/dashboard` | Admin overview |
| `/admin/orders` | Admin order management |
| `/admin/orders/[id]` | Admin order detail & updates |

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase (PostgreSQL + Auth)
- **Icons:** Lucide React
- **Deployment:** Vercel (recommended)

## Brand Colors

- Primary Green: `#10b981` (emerald-500)
- Dark Green: `#059669` (emerald-600)
- Background: `#ffffff` (white)
- Light Gray: `#f5f5f5`
- Text: `#171717` (gray-900)
