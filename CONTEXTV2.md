# CONTEXT.md Versioning Rule

Every time there is a significant shift in concept, architecture, or product direction — create a new version
Name files sequentially: CONTEXT.md → CONTEXTV2.md → CONTEXTV3.md etc.
Each version is never edited retroactively — it's a snapshot of where the product stood at that moment
The highest numbered version is always the source of truth for active development
Lower versions serve as a changelog and roadmap audit trail

**What triggers a new version:**
- Pricing/business model change
- Major architectural decision (new auth, new DB, new payment model)
- Significant feature set added that changes the product's scope
- Strategic pivot in how the product is positioned or sold

| Version | Date | What changed |
|---|---|---|
| V1 | May 2025 | Initial build — auth, onboarding, dashboard, Stripe (3 plans), services, AI toolkit, admin panel |
| V2 | May 2025 | Strategic shift to subscription SaaS model — 3 tiers (Starter/Growth/ProAgent), welcome email added, analytics tab built (GA OAuth), privacy/terms pages, pricing redesign queued |

---

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
| Email | Resend (installed, wired for order notifications + welcome) |
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

### Cross-Site Links
The marketing site (`agent7even.com`) links directly to the app for auth actions:

- **Sign up CTA** → `https://app.agent7even.com/sign-up`
- **Log in / Sign in CTA** → `https://app.agent7even.com/sign-in`

No changes are needed on the app side. These are simple `href` updates on the marketing site (`~/agent7even`) only.

### Google OAuth (Analytics)
- GCP Project: `agent7even-analytics` (project number `98873543191`)
- OAuth 2.0 Client ID: `98873543191-tr84f0b2218cac6u7e9v95sfpogohmie.apps.googleusercontent.com`
- Authorized redirect URI: `https://app.agent7even.com/api/analytics/ga-callback`
- Scope requested: `https://www.googleapis.com/auth/analytics.readonly`
- APIs enabled in GCP: **Google Analytics Data API** + **Google Analytics Admin API**
- Service account: `agent7even-analytics@agent7even-analytics.iam.gserviceaccount.com`
- OAuth consent screen: **External, branding verified and published** ✅ — no "unverified app" warning shown to users
- Consent screen branding: App name "Agent7even", homepage `https://app.agent7even.com`, privacy `https://app.agent7even.com/privacy`, terms `https://app.agent7even.com/terms`
- Authorized domain: `agent7even.com` (verified via Google Search Console)

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
STRIPE_AI_SPRINT_PRICE_ID            price_1TZk47CjXyyqncdvyQIqOE9X  # DEPRECATED — kept in place, not referenced
STRIPE_GROWTH_PRICE_ID               price_1TZk4rCjXyyqncdv4YPex6H8  # DEPRECATED
STRIPE_DONE_FOR_YOU_PRICE_ID         price_1TZk5UCjXyyqncdvwUusrLxb  # DEPRECATED
STRIPE_STARTER_MONTHLY_PRICE_ID      price_1TaGc5CjXyyqncdvNQJwQHs4
STRIPE_STARTER_ANNUAL_PRICE_ID       price_1TaGc5CjXyyqncdvmNsCBXGw
STRIPE_GROWTH_MONTHLY_PRICE_ID       price_1TaGdnCjXyyqncdvG1VU9B20
STRIPE_GROWTH_ANNUAL_PRICE_ID        price_1TaGdnCjXyyqncdvX6OZesUh
STRIPE_PROAGENT_MONTHLY_PRICE_ID     price_1TaGfiCjXyyqncdvubhiuZOh
STRIPE_PROAGENT_ANNUAL_PRICE_ID      price_1TaGfiCjXyyqncdv4kAP523z
ANTHROPIC_API_KEY                    sk-ant-...
GOOGLE_OAUTH_CLIENT_ID               98873543191-tr84f...
GOOGLE_OAUTH_CLIENT_SECRET           GOCSPX-...
GOOGLE_SA_CLIENT_EMAIL               agent7even-analytics@agent7even-analytics.iam.gserviceaccount.com
GOOGLE_SA_PRIVATE_KEY                -----BEGIN PRIVATE KEY-----...
NEXT_PUBLIC_GOOGLE_SA_CLIENT_EMAIL   agent7even-analytics@agent7even-analytics.iam.gserviceaccount.com
```

---

## File Structure

```
app/
  layout.tsx                              # ClerkProvider, Geist font, global styles
  page.tsx                                # Homepage/landing (dark, on-brand) + footer
  globals.css                             # Tailwind v4 + tailwindcss-animate
  privacy/page.tsx                        # Privacy Policy (public, no auth)
  terms/page.tsx                          # Terms of Service (public, no auth)
  sign-in/[[...sign-in]]/page.tsx         # + Privacy/Terms links below Clerk component
  sign-up/[[...sign-up]]/page.tsx         # + Privacy/Terms links below Clerk component
  onboarding/page.tsx                     # Conversational onboarding (client component)
  pricing/page.tsx                        # Pricing page — BEING REDESIGNED (3 subscription tiers)
  dashboard/
    layout.tsx                            # Sidebar nav layout — Privacy/Terms in sidebar bottom
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
    analytics/
      page.tsx                            # Server: fetches GA + social connection state from profiles
      AnalyticsClient.tsx                 # Client: GA OAuth flow, property selector, live charts
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
      clerk/route.ts                      # user.created → profiles + welcome email; updated/deleted → profiles
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
    analytics/
      ga-connect/route.ts                 # Redirects to Google OAuth consent screen
      ga-callback/route.ts                # Exchanges OAuth code → stores refresh token + email
      ga-properties/route.ts              # Lists user's GA4 properties via accountSummaries API
      ga-data/route.ts                    # Fetches GA4 report data (OAuth first, SA fallback)
      connect/route.ts                    # Saves GA property ID / Instagram / Meta IDs to profiles
      disconnect/route.ts                 # Clears all GA OAuth tokens + property ID from profiles
    ai/
      run-prompt/route.ts                 # Runs Claude generation, logs to ai_tool_usage
      save-prompt/route.ts                # Saves prompt to saved_prompts

lib/
  supabase/
    server.ts                             # createClient() (anon) + createServiceClient() (service role)
    client.ts                             # Browser Supabase client
  requireAdmin.ts                         # Checks role = 'admin'|'owner', redirects otherwise

proxy.ts                                  # Clerk middleware — public: /, /sign-in, /sign-up, /pricing,
                                          #   /privacy, /terms, /api/webhooks/*, /api/analytics/ga-callback
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
| `plan` | text | `starter`, `growth`, `proagent` — set by Stripe webhook. **Being updated** from old values (`ai_sprint`, `growth`, `done_for_you`) |
| `status` | text | `onboarding`, `active`, `paused`, `churned` |
| `stripe_customer_id` | text | |
| `stripe_subscription_id` | text | All plans are now subscriptions — populated for all paid tiers |
| `onboarding_complete` | boolean | |
| `business_type` | text | Set during onboarding |
| `business_goals` | text[] | Multi-select from onboarding |
| `website_url` | text | |
| `instagram_handle` | text | Set via Analytics connect modal |
| `ga_measurement_id` | text | GA4 Property ID (numeric, not G-...) — set after OAuth property selection |
| `meta_ad_account_id` | text | Meta Ads account ID |
| `ga_refresh_token` | text | Google OAuth refresh token — stored after OAuth flow |
| `ga_oauth_email` | text | Google account email used for OAuth |
| `ga_connected` | boolean | True once OAuth + property both confirmed |
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

### Stripe plans — BEING REDESIGNED
The current 3-plan structure (`ai_sprint`, `growth`, `done_for_you`) is being replaced in the next session with:
- **3 subscription tiers:** Starter ($49/mo), Growth ($89/mo), ProAgent ($149/mo)
- **Annual option on all tiers:** 2 months free — $490/yr, $890/yr, $1,490/yr
- **All plans are recurring subscriptions** (`mode: 'subscription'`) — no more one-time payments
- **Add-on services** purchased inside the platform per project (separate Stripe prices, TBD)
- Old price IDs (`STRIPE_AI_SPRINT_PRICE_ID`, `STRIPE_GROWTH_PRICE_ID`, `STRIPE_DONE_FOR_YOU_PRICE_ID`) will be replaced with 6 new price IDs (3 tiers × monthly + annual)
- Stripe webhook sets `plan`, `status`, `stripe_customer_id`, `stripe_subscription_id` in `profiles`
- `profiles.plan` values will change to: `starter`, `growth`, `proagent`

### Claude model
`claude-sonnet-4-20250514` — used in `/api/ai/run-prompt/route.ts`

### Lucide icons note
`Instagram` does not exist in the installed version of `lucide-react`. Use `Hash` as a substitute for social/Instagram contexts.

---

## What's Fully Built and Live

- [x] Homepage with sign-in/sign-up CTAs + footer
- [x] Clerk auth (production instance, custom domain DNS)
- [x] Clerk webhook → Supabase `profiles` sync
- [x] Conversational onboarding (5 steps, typing animation)
- [x] Dashboard gated behind onboarding
- [x] Dashboard sidebar layout with 8 nav items + Privacy/Terms links
- [x] **Stripe billing** — pricing page, checkout, customer portal, invoice history, upgrade cards
- [x] **Services module** — browse 8 services, request modal, orders tracking, admin email notification
- [x] **AI Toolkit** — 8 seeded prompts, variable system, Claude generation, copy/save, usage tracking
- [x] **Billing tab** — live plan card, Stripe invoices, portal link, upgrade section
- [x] **Admin panel** — command center, clients table, client detail, order status updater, internal notes
- [x] Admin auto-redirect on login (role = owner/admin → /admin)
- [x] Order delivered → client email via Resend
- [x] **Welcome email** — Resend welcome email triggered on `user.created` webhook
- [x] **Analytics tab** — Google Analytics OAuth self-serve flow (connect, property selector, live chart), Instagram + Meta pending placeholders, disconnect/reset
- [x] **Privacy Policy** (`/privacy`) and **Terms of Service** (`/terms`) — public pages, no auth required
- [x] Legal links on sign-in, sign-up, homepage, dashboard sidebar, and marketing site footer
- [x] **Google OAuth verified and published** — branding verified, clean consent screen, no unverified warning
- [x] GA tag moved to `<head>` on marketing site for proper Search Console detection
- [x] `agent7even.com` verified in Google Search Console

---

## What's NOT Built Yet (Priority Order)

### 1. Pricing & billing redesign — HIGH (next session)
- Replace 3 old plans with new 3-tier subscription model: Starter / Growth / ProAgent
- Monthly + annual billing toggle on pricing page (2 months free on annual)
- New Stripe products + 6 price IDs to create in Stripe dashboard
- Update `pricing/page.tsx`, `billing/` tab, Stripe webhook, and `profiles.plan` values
- Self-serve signup flow — no book-a-call, purchase directly on pricing page
- Feature gates per tier: AI runs (15/mo Starter, unlimited Growth+), active orders (1/3/unlimited), support level, add-on discounts

### 2. Analytics tab — Instagram + Meta — MEDIUM
- Instagram and Meta Ads sections are placeholders (pending connection only)
- Instagram needs Meta Business API access (user grants via Meta Business Suite)
- Meta Ads needs Meta Marketing API (Ads Insights API) with the user's ad account ID

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

### 7. Marketing site auth links — WHEN READY
- Update sign up and log in CTAs on `agent7even.com` to point to `app.agent7even.com/sign-up` and `app.agent7even.com/sign-in`
- Changes are in `~/agent7even/src/components/` (Nav.tsx, Hero.tsx, CTA.tsx) — simple `href` swaps only

### 8. Go live on Stripe — WHEN READY
- Switch from test keys (`sk_test_`, `pk_test_`) to live keys (`sk_live_`, `pk_live_`)
- Create the 3 new subscription products/prices in Stripe live mode (monthly + annual × 3 tiers = 6 price IDs)
- Update all Stripe env vars in Vercel

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
