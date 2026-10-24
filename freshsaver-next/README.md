# FreshSaver — Next.js core app

A production-shaped Next.js App Router implementation of FreshSaver: AI receipt
scanning, a live household pantry, expiry rescue ideas, and an auto-generated
smart shopping list.

This app lives alongside the original Vite implementation in
`../freshsaver/freshsaver`. Keeping it separate means the working Vite app is
untouched while this Next.js application can be developed and deployed on its
own.

## Stack

- **Next.js 14 App Router** + React 18 + TypeScript
- **Tailwind CSS** with a custom emerald / cream / ink / amber / coral palette
- **Framer Motion** for page, list, modal, and micro-interactions
- **Lucide React** icons
- **Supabase** Auth, Postgres, RLS, Realtime, and Edge Functions
- **Zod** for client-side validation
- **Sonner** for accessible toasts

## Quick start

```bash
cd freshsaver-next
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo mode

If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing,
the app runs in **demo mode**:

- Auth forms simulate sign-in and sign-up.
- The dashboard uses a seeded household, pantry, savings, and shopping list.
- Receipt scanning uses the structured sample receipt.
- Add, delete, cook, check-off, copy, and share flows all work locally.

This makes the UI reviewable without a database. A `Demo mode` badge appears in
the top bar.

## Supabase setup

### 1. Create the schema

Create a Supabase project, then run:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Or paste `supabase/migrations/20261024000000_freshsaver_core.sql` into the
Supabase SQL editor.

The migration creates:

- `households` — shared kitchen, join code, dietary preferences
- `profiles` — one per Auth user, linked to a household
- `categories` — seeded pantry categories
- `food_items` — inventory with expiry, quantity, storage, and status
- `grocery_list` — auto-generated and custom shopping items
- RLS policies for every table
- A signup trigger that creates a profile automatically
- Realtime publication for `food_items` and `grocery_list`

### 2. Deploy the receipt parser

```bash
supabase functions deploy parse-receipt
supabase secrets set OPENAI_API_KEY=sk-...
# optional
supabase secrets set OPENAI_VISION_MODEL=gpt-4o-mini
```

The function authenticates the caller, sends the receipt image to OpenAI
vision, validates the returned items, and returns pantry-ready JSON. Without
`OPENAI_API_KEY`, it returns a structured sample so the review flow still works.

> PDF receipts currently return the sample parser output. Swap the PDF branch in
> `supabase/functions/parse-receipt/index.ts` for a document OCR provider when
> PDFs become a first-class requirement.

### 3. Configure Auth

In Supabase → Authentication:

- Enable **Email** sign-in.
- Enable **Google** and add your OAuth client credentials.
- Set the Site URL to `http://localhost:3000` (or your production URL).
- Add redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://your-domain.com/auth/callback`

### 4. Environment

`.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Architecture

```text
app/
  (auth)/login            Split-screen login
  (auth)/signup           Split-screen signup
  auth/callback           Supabase OAuth code exchange
  onboarding              Household + dietary preference wizard
  (app)/layout            Auth guard + app shell
  (app)/dashboard         Pantry dashboard
  (app)/shopping-list     Smart shopping list
  layout.tsx              Fonts, metadata, toaster
  globals.css             Design tokens, glass, range, scan styles

components/
  auth/                   Auth showcase, form, onboarding wizard
  dashboard/              Header, metrics, filters, grid, cards, modals
  layout/                 Sidebar, topbar, household menu, sync, mobile nav
  receipt/                Receipt scanner modal
  shopping/               List view, groups, rows, quick add, skeleton
  providers/              App context and realtime sync context
  ui/                     Button, input, card, badge, modal, skeleton, etc.

hooks/
  use-inventory.ts        Load, realtime, add, delete, consume, demo fallback
  use-shopping-list.ts    Auto-generation, toggles, custom items, realtime

lib/
  inventory.ts            Expiry state, filters, metrics, aisle grouping, recipes
  demo-data.ts            Seeded demo household and pantry
  supabase/               Browser client, server client, middleware refresh
  types.ts                Domain interfaces
  utils.ts                cn, currency, dates, IDs

services/
  profiles.ts             Household/profile resolution and onboarding writes
  foodItems.ts            Validated inventory reads and writes
  grocery.ts              Shopping list reads and writes
  receipt.ts              Edge Function invocation + fallbacks

supabase/
  migrations/             Consolidated schema, RLS, triggers, seeds
  functions/parse-receipt OCR + validation edge function
```

## Key flows

### Auth

- Email/password login and signup with Zod validation and inline errors.
- Google OAuth through Supabase, with a server-side `/auth/callback` route.
- New signups land on the onboarding wizard.
- Existing sessions are refreshed by middleware.

### Onboarding

Three animated steps:

1. Household name and member count.
2. Dietary preferences (vegetarian, vegan, gluten-free, etc.).
3. Confirmation summary.

Finishing creates or updates the household, links it to the profile, and
redirects to the dashboard.

### Dashboard

- Real-time inventory from Supabase (`postgres_changes` subscription).
- Four bento metrics: total items, expiring soon, expired, money saved.
- Category and expiry filters with animated list transitions.
- Item cards show freshness, countdown, storage, quantity, and cost.
- **Use recipe** opens a generated rescue recipe; cooking it decrements stock.
- **Delete** uses a confirmation dialog.
- Rescue radar surfaces the three most urgent items.
- Empty, loading, and error states are implemented.

### Receipt scanner

1. Drag/drop or choose an image/PDF (max 10 MB), or try the sample receipt.
2. Animated laser scanning state with progress and live status messages.
3. Editable review list: include/exclude, name, quantity, unit, category,
   expiry, cost, add row, remove row.
4. Import commits every selected row to Supabase and updates the dashboard.

### Shopping list

- Auto-generates from inventory items with quantity `<= 1` or expired status.
- Groups by supermarket aisle (produce, dairy, meat, bakery, pantry, frozen).
- Animated check-off, custom quick-add bar, and purchased section.
- Copy the formatted list or use the native share sheet.
- Realtime subscription keeps household members in sync.

## Scripts

```bash
npm run dev        # Next dev server
npm run build      # Production build
npm run start      # Serve the production build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
```

## Production notes

- Middleware protects `/dashboard`, `/shopping-list`, and `/onboarding`.
- Server components read the user, profile, and household before rendering the
  app shell; client components handle realtime data.
- Every inventory write falls back to safe values (`Unnamed Item`, `pieces`,
  quantity `1`, expiry in 7 days) and logs the payload before insertion.
- The app tolerates older Supabase schemas that lack optional columns such as
  `dietary_preferences` or `money_saved` by retrying with a smaller select.
- Set a production `NEXT_PUBLIC_APP_URL` and add it to Supabase redirect URLs.
