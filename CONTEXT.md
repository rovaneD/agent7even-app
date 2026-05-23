# Agent7even App — Full Implementation Context

Feed this entire document to Claude before continuing development. It is the source of truth for what has been built, how it works, and what comes next.

---

## What This Product Is

**Agent7even App** (`app.agent7even.com`) is a SaaS client portal for Agent7even — a full-service marketing agency for small businesses. Clients sign up, complete onboarding, choose a plan, and manage their services, AI tools, billing, and analytics from a single dashboard.

The marketing/landing site (`agent7even.com` / `www.agent7even.com`) is a **separate project** at `~/agent7even` and is NOT this codebase.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.6 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + `tailwindcss-animate` |
| Auth | Clerk (`@clerk/nextjs` v7.4.0) — production instance |
| Database | Supabase (Postgres) — no Supabase Auth, Clerk only |
| Supabase clients | `@supabase/ssr` v0.10.3 |
| Payments | Stripe (test mode, fully wired) |
| Email | Resend (installed, wired for order notifications) |
| AI | Anthropic Claude (`@anthropic-ai/sdk`) |
| Deployment | Vercel — auto-deploy from `main` branch |
| Repo | `github.com/rovaneD/agent7even-app` |

---

## Infrastructure

### Domains
- **Production app:** `https://app.agent7even.com` (CNAME → Vercel)
- **Clerk DNS:** `clerk.app.agent7even.com` (CNAME → Clerk frontend API)
- **Vercel alias:** `https://agent7even-app.vercel.app`

### Clerk (Production Instance)
- Secondary application on `agent7even.com` domain
- Sign-in: `/sign-in` · Sign-up: `/sign-up` · Post-auth redirect: `/dashboard`
- Webhook: `https://app.agent7even.com/api/webhooks/clerk` (events: `user.created`, `user.updated`, `user.deleted`)

### Supabase
- Project URL: `https://jianzyolobriaqpttamt.supabase.co`
- No RLS enforced — service role key used for all server-side writes
- No foreign key from `profiles.id` to `auth.users` (dropped — app uses Clerk, not Supabase Auth)

### Stripe (Test Mode)
- Webhook endpoint: `https://app.agent7even.com/api/webhooks/stripe`
- Events subscribed: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- One-time checkouts have `invoice_creation: { enabled: true }` so invoices appear in billing history

### Vercel Environment Variables (all set in production)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY    pk_live_...
CLERK_SECRET_KEY                     sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL        /sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL        /sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL   /dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL   /dashboard
CLERK_WEBHOOK_SIGNING_SECRET         whsec_...
NEXT_PUBLIC_SUPABASE_URL             https://jianzyolobriaqpttamt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY        eyJ...
SUPABASE_SERVICE_ROLE_KEY            eyJ...
NEXT_PUBLIC_APP_URL                  https://app.agent7even.com
NOTIFY_EMAIL                         melissa@agent7even.com
RESEND_API_KEY                       re_...
STRIPE_SECRET_KEY                    sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY   pk_test_...
STRIPE_WEBHOOK_SECRET                whsec_...
STRIPE_AI_SPRINT_PRICE_ID            price_1TZk47CjXyyqncdvyQIqOE9X
STRIPE_GROWTH_PRICE_ID               price_1TZk4rCjXyyqncdv4YPex6H8
STRIPE_DONE_FOR_YOU_PRICE_ID         price_1TZk5UCjXyyqncdvwUusrLxb
ANTHROPIC_API_KEY                    sk-ant-...
```

---

## File Structure

```
app/
  layout.tsx                              # ClerkProvider, Geist font, global styles
  page.tsx                                # Homepage/landing (dark, on-brand)
  globals.css                             # Tailwind v4 + tailwindcss-animate
  sign-in/[[...sign-in]]/page.tsx
  sign-up/[[...sign-up]]/page.tsx
  onboarding/page.tsx                     # Conversational onboarding (client component)
  pricing/page.tsx                        # Pricing page with 3 plans + Stripe checkout
  dashboard/
    layout.tsx                            # Sidebar nav layout (client component)
    page.tsx                              # Dashboard home — redirects admin→/admin, ungated→/onboarding
    services/
      page.tsx                            # Server: fetches profile + orders
      ServicesClient.tsx                  # Client: browse/request/track services
    ai-toolkit/
      page.tsx                            # Server: fetches prompts, saved prompts, usage stats
      AIToolkitClient.tsx                 # Client: prompt library, runner modal, saved tab
    billing/
      page.tsx                            # Server: fetches Stripe invoices + subscription
      BillingClient.tsx                   # Client: plan card, invoices, portal, upgrade
    analytics/page.tsx                    # Placeholder
    deliverables/page.tsx                 # Placeholder
    support/page.tsx                      # Placeholder
    settings/page.tsx                     # Placeholder
  admin/
    layout.tsx                            # Dark sidebar admin layout (client component)
    page.tsx                              # Command center — metrics + recent activity
    clients/
      page.tsx                            # All clients table
      [id]/
        page.tsx                          # Client detail — info, orders, notes
        AdminNotes.tsx                    # Internal notes (client component)
        OrderStatusUpdater.tsx            # Inline status dropdown (client component)
    orders/page.tsx                       # All orders — active + completed
    support/page.tsx                      # Placeholder
    revenue/page.tsx                      # Placeholder
    settings/page.tsx                     # Placeholder
  api/
    webhooks/
      clerk/route.ts                      # user.created/updated/deleted → profiles table
      stripe/route.ts                     # checkout.session.completed → plan + status update
    onboarding/
      complete/route.ts                   # Saves onboarding data, sets onboarding_complete=true
    orders/
      create/route.ts                     # Creates order in Supabase + notifies melissa@ via Resend
    stripe/
      checkout/route.ts                   # Creates Stripe Checkout session
      portal/route.ts                     # Opens Stripe Customer Portal
    admin/
      notes/route.ts                      # Creates admin_notes row
      orders/update-status/route.ts       # Updates order status + emails client on "delivered"

lib/
  supabase/
    server.ts                             # createClient() (anon) + createServiceClient() (service role)
    client.ts                             # Browser Supabase client
  requireAdmin.ts                         # Checks role = 'admin'|'owner', redirects otherwise

proxy.ts                                  # Clerk middleware — public routes: /, /sign-in, /sign-up, /pricing, /api/webhooks/*
```

---

## Database Schema (Supabase)

### `profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, `gen_random_uuid()` |
| `clerk_user_id` | text | Unique. Clerk identity link |
| `email` | text | |
| `full_name` | text | |
| `company_name` | text | Set during onboarding |
| `avatar_url` | text | |
| `role` | text | `client` (default), `admin`, `owner` |
| `plan` | text | `ai_sprint`, `growth`, `done_for_you` — set by Stripe webhook |
| `status` | text | `onboarding`, `active`, `paused`, `churned` |
| `stripe_customer_id` | text | |
| `stripe_subscription_id` | text | Only for `done_for_you` (subscription) |
| `onboarding_complete` | boolean | |
| `business_type` | text | Set during onboarding |
| `business_goals` | text[] | Multi-select from onboarding |
| `website_url` | text | |
| `instagram_handle` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `orders`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles.id |
| `service_type` | text | e.g. `website`, `social_media`, `photography` |
| `title` | text | Display name of service |
| `brief` | text | Client's project description |
| `status` | text | `submitted` → `in_review` → `in_progress` → `delivered` → `approved` |
| `priority` | text | `low`, `medium`, `high` |
| `due_date` | timestamptz | |
| `delivered_at` | timestamptz | Set by admin order-status API |
| `approved_at` | timestamptz | |
| `created_at` / `updated_at` | timestamptz | |

### `notifications`
| Column | Type |
|---|---|
| `id` | uuid |
| `user_id` | uuid → profiles |
| `title`, `body`, `type`, `link` | text |
| `read` | boolean |
| `created_at` | timestamptz |

### `admin_notes`
| Column | Type |
|---|---|
| `id` | uuid |
| `user_id` | uuid → profiles (the client) |
| `admin_id` | uuid → profiles (the admin) |
| `body` | text |
| `created_at` | timestamptz |

### `support_tickets`
| Column | Type |
|---|---|
| `id` | uuid |
| `user_id` | uuid → profiles |
| `subject` | text |
| `status` | text (`open`, `closed`) |
| `created_at` | timestamptz |

### `prompt_library`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `category` | text | `social`, `email`, `ads`, `seo`, `brand`, `operations` |
| `title`, `description` | text | |
| `prompt` | text | Template with `{{variable}}` placeholders |
| `variables` | jsonb | `[{key, label}]` array |
| `time_saved_mins` | int | Used for value scorecard |
| `sort_order` | int | |
| `is_active` | boolean | |

### `saved_prompts`
| Column | Type |
|---|---|
| `id` | uuid |
| `user_id` | uuid → profiles |
| `title`, `prompt`, `category` | text |
| `created_at` | timestamptz |

### `ai_tool_usage`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `user_id` | uuid → profiles | |
| `tool` | text | e.g. `prompt_library` |
| `prompt_id` | uuid | |
| `output_length` | int | |
| `time_saved_mins` | int | Feeds value scorecard |
| `created_at` | timestamptz | |

---

## Key Architectural Decisions

### Middleware filename
Next.js 16 renamed `middleware.ts` → `proxy.ts`. Same Clerk `clerkMiddleware` API, different filename.

### Admin access
`lib/requireAdmin.ts` — called at the top of every admin page. Checks `profiles.role` is `admin` or `owner`. Redirects to `/dashboard` otherwise. The `dashboard/page.tsx` also auto-redirects admins/owners to `/admin` on login.

### Stripe plans
- `ai_sprint` and `growth` → `mode: 'payment'` (one-time) with `invoice_creation: { enabled: true }`
- `done_for_you` → `mode: 'subscription'`
- Stripe webhook sets `plan`, `status`, `stripe_customer_id`, `stripe_subscription_id` in `profiles`

### Claude model
`claude-sonnet-4-20250514` — used in `/api/ai/run-prompt/route.ts`

### Lucide icons note
`Instagram` does not exist in the installed version of `lucide-react`. Use `Hash` as a substitute for social/Instagram contexts.

---

## What's Fully Built and Live

- [x] Homepage with sign-in/sign-up CTAs
- [x] Clerk auth (production instance, custom domain DNS)
- [x] Clerk webhook → Supabase `profiles` sync
- [x] Conversational onboarding (5 steps, typing animation)
- [x] Dashboard gated behind onboarding
- [x] Dashboard sidebar layout with 8 nav items
- [x] **Stripe billing** — pricing page, checkout, customer portal, invoice history, upgrade cards
- [x] **Services module** — browse 8 services, request modal, orders tracking, admin email notification
- [x] **AI Toolkit** — 8 seeded prompts, variable system, Claude generation, copy/save, usage tracking
- [x] **Billing tab** — live plan card, Stripe invoices, portal link, upgrade section
- [x] **Admin panel** — command center, clients table, client detail, order status updater, internal notes
- [x] Admin auto-redirect on login (role = owner/admin → /admin)
- [x] Order delivered → client email via Resend

---

## What's NOT Built Yet (Priority Order)

### 1. Email flows (Resend) — HIGH
- Welcome email on `user.created` webhook (currently missing)
- The order notification and delivery emails are wired but the welcome flow isn't

### 2. Analytics tab — HIGH
- Connect Google Analytics / Meta Pixel / Instagram Basic Display API
- Show followers, reach, website traffic in the dashboard
- Currently placeholder page

### 3. Deliverables tab — MEDIUM
- Admin uploads files (PDFs, brand guides, images) per client
- Client views and downloads from `/dashboard/deliverables`
- Needs Supabase Storage bucket

### 4. Support tab — MEDIUM
- Client submits a ticket from `/dashboard/support`
- Admin sees open tickets in `/admin/support`
- `support_tickets` table already exists

### 5. Admin Revenue tab — MEDIUM
- Pull MRR, total revenue, plan breakdown from Stripe
- Show in `/admin/revenue`

### 6. Settings tab — LOW
- Client can update `company_name`, `website_url`, `instagram_handle`
- At `/dashboard/settings`

### 7. Go live on Stripe — WHEN READY
- Switch from test keys (`sk_test_`, `pk_test_`) to live keys (`sk_live_`, `pk_live_`)
- Recreate the 3 products/prices in Stripe live mode → get new `price_` IDs
- Update all 6 Stripe env vars in Vercel

---

## Design Tokens

| Token | Value |
|---|---|
| Accent | `#c8522a` |
| Dark bg | `#0d0d0d` |
| Cream | `#f5f4f0` |
| Font | Geist (via `next/font/google`) |
| Dashboard bg | `gray-50` |
| Card | `bg-white rounded-2xl border border-gray-100` |
| Admin sidebar | `bg-[#0d0d0d]` dark, white text |
| Client sidebar | `bg-white` light, gray text |
