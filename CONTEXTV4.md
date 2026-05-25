# CONTEXT.md Versioning Rule

Every time there is a significant shift in concept, architecture, or product direction — create a new version.
Name files sequentially: CONTEXT.md → CONTEXTV2.md → CONTEXTV3.md → CONTEXTV4.md etc.
Each version is never edited retroactively — it's a snapshot of where the product stood at that moment.
The highest numbered version is always the source of truth for active development.
Lower versions serve as a changelog and roadmap audit trail.

**What triggers a new version:**
- Pricing/business model change
- Major architectural decision (new auth, new DB, new payment model)
- Significant feature set added that changes the product's scope
- Strategic pivot in how the product is positioned or sold

| Version | Date | What changed |
|---|---|---|
| V1 | May 2025 | Initial build — auth, onboarding, dashboard, Stripe (3 plans), services, AI toolkit, admin panel |
| V2 | May 2025 | Strategic shift to subscription SaaS model — 3 tiers (Starter/Growth/ProAgent), welcome email added, analytics tab built (GA OAuth), privacy/terms pages, pricing redesign queued |
| V3 | May 2025 | Stripe billing redesign shipped. AI Toolkit plan gating. Sign-in/sign-up redesigned. Meta/Instagram OAuth. Analytics tab fully merged. Brand Kit built (6-chapter flow, 4 Claude-generated documents, inline editing, version history). Brand voice injected into AI Toolkit. |
| V4 | May 2026 | Deliverables tab, Support tab (threaded), Admin Revenue, Admin Settings (full control center), Client Settings, Brand Kit in Admin, Trial strategy (Starter only, 3 days, 5 AI runs, Brand Kit locked), Marketing site updated (new copy, pricing, chatbot system prompt), Platform settings table, Services table seeded, Integrations roadmap added. Deployment safeguards added (pre-push hook, CI workflow, vercel.json). Pricing page hardened (3-day trial badge, Start your free trial CTA, comparison table with Brand Kit row). CTA copy standardised across both sites. Marketing site copy refreshed (HowItWorks, ProofBar icons, hero pill badge removed, Website Building description). |

---

# Agent7even App — Full Implementation Context

Feed this entire document to Claude before continuing development. It is the source of truth for what has been built, how it works, and what comes next.

---

## What This Product Is

**Agent7even App** (`app.agent7even.com`) is a SaaS client portal for Agent7even — a full-service marketing agency for small businesses. Clients sign up, complete onboarding, choose a plan, and manage their services, AI tools, billing, analytics, brand assets, deliverables, and support from a single dashboard.

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
| Storage | Supabase Storage — `deliverables` bucket (private, 50MB max) |
| Payments | Stripe (test mode — 3-tier subscription) |
| Email | Resend (order notifications + welcome email + support emails) |
| AI | Anthropic Claude (`@anthropic-ai/sdk`) — model: `claude-sonnet-4-20250514` |
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
- Google SSO enabled on production instance
- Webhook: `https://app.agent7even.com/api/webhooks/clerk` (events: `user.created`, `user.updated`, `user.deleted`)

### Supabase
- Project URL: `https://jianzyolobriaqpttamt.supabase.co`
- No RLS enforced — service role key used for all server-side writes
- Storage bucket: `deliverables` — private, signed URLs, 50MB max per file

### Stripe (Test Mode — switch to live when ready)
- API version: `2026-04-22.dahlia`
- Always cast: `{ apiVersion: '2026-04-22.dahlia' as any }` — SDK types may not recognise this string
- **NEVER use `'2025-04-30.basil'`** — wrong version, causes build failure
- Webhook endpoint: `https://app.agent7even.com/api/webhooks/stripe`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- All plans: `mode: 'subscription'`
- Trial: **Starter only — 3 days** — `trial_period_days: 3` in `subscription_data`
- Growth and ProAgent: no trial, charged immediately

### Trial Strategy
- **Starter plan only** gets a 3-day free trial
- Trial limits enforced server-side in `/api/ai/run-prompt`:
  - Max 5 AI Toolkit runs total during trial (not per month)
  - Brand Kit locked during trial — shows upgrade CTA
  - After trial converts to paid: normal Starter limits apply (15 runs/mo from `platform_settings`)
- Growth and ProAgent: no trial, full access from day one
- Error codes returned: `TRIAL_LIMIT`, `MONTHLY_LIMIT`, `NO_PLAN`

### Notification Email
- Stored dynamically in `platform_settings` table (`key = 'notify_email'`)
- All notification routes use `lib/getNotifyEmail.ts` helper — reads from DB, falls back to `NOTIFY_EMAIL` env var
- Changeable from Admin → Settings → Notifications without a redeploy

### Cross-Site Links (Marketing Site)
- **Sign up CTA** → `https://app.agent7even.com/sign-up`
- **Log in / Sign in CTA** → `https://app.agent7even.com/sign-in`
- **Pricing nav link** → `https://app.agent7even.com/pricing`
- Marketing site chatbot system prompt updated to reflect SaaS model
- Chatbot improvement loop (`improve-prompt/route.ts`) meta-prompt updated — preserves new plan names, CTAs point to app

### Google OAuth (Analytics)
- GCP Project: `agent7even-analytics` (project number `98873543191`)
- OAuth 2.0 Client ID: `98873543191-tr84f0b2218cac6u7e9v95sfpogohmie.apps.googleusercontent.com`
- Authorized redirect URI: `https://app.agent7even.com/api/analytics/ga-callback`
- Scope: `https://www.googleapis.com/auth/analytics.readonly`
- OAuth consent screen: **External, published** ✅

### Meta OAuth (Analytics)
- **Marketing API App:** Agent7even (App ID: `992647829846107`)
- **Instagram API App:** Agent7even-IG (App ID: `1323722066356909`)
- Authorized redirect URI: `https://app.agent7even.com/api/analytics/meta-callback`
- Registered in Facebook Login for Business → Settings → Valid OAuth Redirect URIs
- Scopes live: `ads_read`, `ads_management`, `business_management`, `pages_read_engagement`, `pages_show_list`, `public_profile`
- Scopes pending app review: `instagram_basic`, `instagram_manage_insights`
- Business ID: `738598814681808`
- Token: short-lived → long-lived (60 days) exchanged on callback

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
STRIPE_AI_SPRINT_PRICE_ID            price_1TZk47CjXyyqncdvyQIqOE9X   # DEPRECATED
STRIPE_GROWTH_PRICE_ID               price_1TZk4rCjXyyqncdv4YPex6H8   # DEPRECATED
STRIPE_DONE_FOR_YOU_PRICE_ID         price_1TZk5UCjXyyqncdvwUusrLxb   # DEPRECATED
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
META_APP_ID                          992647829846107
META_APP_SECRET                      eb234e81b4b7511dfd8446df17e089d7
META_BUSINESS_ID                     738598814681808
META_IG_APP_ID                       1323722066356909
META_IG_APP_SECRET                   55fc717ebfd6c51675960c558b78ca8b
```

---

## Deployment Safeguards

**Root cause of past reversions:** Changes deployed via `vercel --prod` CLI (local state) were overwritten when GitHub's auto-deploy fired from a later push that didn't include those local changes. GitHub always wins the production alias assignment.

**Safeguards now in place (`agent7even-app`):**

| File | What it does |
|---|---|
| `.git/hooks/pre-push` | Blocks any push when working tree is dirty — prevents pushing without committing |
| `.github/workflows/ci.yml` | TypeScript check + Next.js build on every push to `main` — catches broken builds before Vercel deploys |
| `vercel.json` | Locks build config, ensures GitHub auto-alias is always authoritative |
| `AGENTS.md` | Documents deployment rules for every future agent session |

**Deployment rule — never break this:**
1. Finish the feature
2. `git add -A && git commit -m "..."` — commit everything
3. `git push` — Vercel auto-deploys via GitHub
4. Never run `vercel --prod` with uncommitted local changes

**Marketing site (`agent7even`) deploys from `master` branch** (not `main`). Always push with `git push origin master`.

---

## File Structure

```
agent7even-app/
  .github/workflows/ci.yml           # TypeScript check + build on every push to main
  vercel.json                        # Locks build config, GitHub auto-alias
  AGENTS.md                          # Deployment rules + product ground rules
  app/
    layout.tsx
    page.tsx                                      # Homepage/landing
    globals.css
    privacy/page.tsx
    terms/page.tsx
    sign-in/[[...sign-in]]/page.tsx               # Branded split-screen
    sign-up/[[...sign-up]]/page.tsx               # Branded split-screen, passes plan param to onboarding
    onboarding/page.tsx                           # Reads plan param, redirects to checkout-now
    checkout-now/page.tsx                         # Auto-initiates Stripe checkout from URL params
    pricing/page.tsx                              # 3 tiers, monthly/annual, trial badge on Starter only
    dashboard/
      layout.tsx                                  # Sidebar nav
      page.tsx                                    # Redirects admin→/admin, ungated→/onboarding
      services/
        page.tsx
        ServicesClient.tsx
      ai-toolkit/
        page.tsx                                  # Fetches prompts, brand docs, plan, usage
        AIToolkitClient.tsx                       # Brand voice toggle, nudge banner, plan gates
      billing/
        page.tsx
        BillingClient.tsx
      analytics/
        page.tsx
        AnalyticsClient.tsx
      brand-kit/
        page.tsx                                  # Locked during trial — shows upgrade CTA
        BrandKitClient.tsx
        BrandFlow.tsx
        BrandDocument.tsx
        questions.ts
      deliverables/
        page.tsx
        DeliverablesClient.tsx                    # Upload modal, grouped by project, signed URLs
      support/
        page.tsx
        SupportClient.tsx                         # New ticket, thread view, reply, open/closed
      settings/
        page.tsx
        SettingsClient.tsx                        # Edit company name, website, Instagram handle
    admin/
      layout.tsx
      page.tsx                                    # Command center
      clients/
        page.tsx
        [id]/
          page.tsx
          AdminNotes.tsx
          OrderStatusUpdater.tsx
          AdminDeliverables.tsx                   # Upload + manage files per client
          AdminBrandKit.tsx                       # Read-only brand document viewer
      orders/page.tsx                             # All orders — active + completed table
      support/
        page.tsx                                  # All tickets — open/closed
        [id]/
          page.tsx
          AdminSupportThread.tsx                  # Thread view, reply, priority, close/reopen
      revenue/page.tsx                            # MRR, plan breakdown, Stripe charges
      settings/
        page.tsx
        AdminSettingsClient.tsx                   # 6-tab control center
    api/
      webhooks/
        clerk/route.ts
        stripe/route.ts
      onboarding/complete/route.ts
      orders/create/route.ts
      stripe/
        checkout/route.ts                         # 3-day trial Starter only, all subscriptions
        portal/route.ts
      admin/
        notes/route.ts
        orders/update-status/route.ts
        settings/
          update/route.ts
          update-user/route.ts
          update-prompt/route.ts
          update-service/route.ts
      analytics/
        ga-connect/route.ts
        ga-callback/route.ts
        ga-properties/route.ts
        ga-data/route.ts
        connect/route.ts
        disconnect/route.ts
        meta-connect/route.ts
        meta-callback/route.ts
        meta-data/route.ts
        meta-disconnect/route.ts
      ai/
        run-prompt/route.ts                       # Trial limit (5 total), Starter limit (dynamic from DB)
        save-prompt/route.ts
      brand/
        save-answers/route.ts
        generate/route.ts
        save-document/route.ts
      deliverables/
        upload/route.ts
        admin-upload/route.ts
        download/route.ts
        delete/route.ts
      support/
        create/route.ts
        reply/route.ts
        update/route.ts
      settings/
        update/route.ts

  emails/
    welcome.ts

  lib/
    supabase/server.ts
    supabase/client.ts
    requireAdmin.ts
    getNotifyEmail.ts                             # Reads notify_email from platform_settings, falls back to env var

  proxy.ts                                        # Public routes: /, /sign-in, /sign-up, /pricing,
                                                  # /privacy, /terms, /api/webhooks/*,
                                                  # /api/analytics/ga-callback, /api/analytics/meta-callback
```

---

## Auto-Checkout Flow

Sign-up → Onboarding → Checkout → Stripe, end-to-end without extra clicks.

1. Marketing site CTA links to `/sign-up?plan=starter` (or `growth`/`proagent`)
2. `sign-up/page.tsx` reads `plan` from searchParams, sets `forceRedirectUrl=/onboarding?plan={plan}`
3. `onboarding/page.tsx` (client, wrapped in Suspense) reads `plan` from URL, on complete redirects to `/checkout-now?plan={plan}`
4. `checkout-now/page.tsx` (client, Suspense) immediately calls `/api/stripe/checkout` and redirects to Stripe
5. On success, Stripe returns to `/dashboard?upgraded=true`

**Note:** Both `onboarding` and `checkout-now` use `useSearchParams` — must be wrapped in `<Suspense>` or Next.js prerendering will fail.

---

## Database Schema (Supabase)

### `profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `clerk_user_id` | text | Unique |
| `email` | text | |
| `full_name` | text | |
| `company_name` | text | |
| `avatar_url` | text | |
| `role` | text | `client`, `admin`, `owner` |
| `plan` | text | `starter`, `growth`, `proagent` |
| `status` | text | `onboarding`, `active`, `paused`, `churned` |
| `stripe_customer_id` | text | |
| `stripe_subscription_id` | text | |
| `onboarding_complete` | boolean | |
| `business_type` | text | |
| `business_goals` | text[] | |
| `website_url` | text | |
| `instagram_handle` | text | |
| `ga_measurement_id` | text | |
| `ga_refresh_token` | text | |
| `ga_oauth_email` | text | |
| `ga_connected` | boolean | |
| `meta_access_token` | text | Long-lived (60 days) |
| `meta_ad_account_id` | text | |
| `meta_ig_account_id` | text | |
| `meta_connected` | boolean | |
| `created_at` / `updated_at` | timestamptz | |

### `orders`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles.id |
| `service_type` | text | |
| `title` | text | |
| `brief` | text | |
| `status` | text | `submitted` → `in_review` → `in_progress` → `delivered` → `approved` |
| `priority` | text | `low`, `medium`, `high` |
| `due_date` / `delivered_at` / `approved_at` | timestamptz | |
| `created_at` / `updated_at` | timestamptz | |

### `support_tickets`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles.id |
| `subject` | text | |
| `body` | text | First message body |
| `status` | text | `open`, `closed` |
| `priority` | text | `low`, `medium`, `urgent` |
| `created_at` / `updated_at` | timestamptz | |

### `support_messages`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `ticket_id` | uuid | FK → support_tickets.id |
| `sender_id` | uuid | FK → profiles.id |
| `sender_role` | text | `client` or `admin` |
| `body` | text | |
| `created_at` | timestamptz | |

### `deliverables`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles.id (the client) |
| `uploaded_by` | uuid | FK → profiles.id (uploader) |
| `project_name` | text | Groups files into folders |
| `file_name` | text | |
| `file_path` | text | Path in Supabase Storage |
| `file_size` | bigint | Bytes |
| `file_type` | text | MIME type |
| `notes` | text | |
| `uploaded_by_role` | text | `admin` or `client` |
| `created_at` | timestamptz | |

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
| `user_id` | uuid → profiles (client) |
| `admin_id` | uuid → profiles (admin) |
| `body` | text |
| `created_at` | timestamptz |

### `prompt_library`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `category` | text | `social`, `email`, `ads`, `seo`, `brand`, `operations` |
| `title`, `description` | text | |
| `prompt` | text | Template with `{{variable}}` placeholders |
| `variables` | jsonb | `[{key, label}]` |
| `time_saved_mins` | int | |
| `sort_order` | int | |
| `is_active` | boolean | Toggleable from Admin Settings |

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
| `tool` | text | |
| `prompt_id` | uuid | |
| `output_length` | int | |
| `time_saved_mins` | int | |
| `created_at` | timestamptz | |

### `brand_answers`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles.id, unique |
| `answers` | jsonb | All 24 question responses |
| `completed` | boolean | |
| `created_at` / `updated_at` | timestamptz | |

### `brand_documents`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles.id |
| `type` | text | `voice`, `story`, `persona`, `positioning` — unique per user |
| `title` | text | |
| `content` | text | Editable by client |
| `version` | int | Increments on every save |
| `created_at` / `updated_at` | timestamptz | |

### `brand_document_versions`
| Column | Type |
|---|---|
| `id` | uuid |
| `document_id` | uuid → brand_documents.id |
| `content` | text |
| `version` | int |
| `created_at` | timestamptz |

### `services`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | |
| `description` | text | |
| `icon` | text | Emoji |
| `sort_order` | int | |
| `is_active` | boolean | Toggleable from Admin Settings |
| `created_at` | timestamptz | |

Seeded with 8 services: Social Media Management, Website Building, Brand Identity & Logo, Email Marketing Setup, Product Photography, SEO Basics, Video & Reels Editing, Ad Management.

### `platform_settings`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `key` | text | Unique |
| `value` | jsonb | |
| `updated_at` | timestamptz | |

Seeded rows:
- `notify_email` — admin notification email (default: `admin@agent7even.com`)
- `starter_ai_limit` — Starter monthly AI run limit (default: `15`)
- `platform_banner` — `{ enabled, message, type }` global dashboard banner

---

## Key Architectural Decisions

### Middleware filename
Next.js 16 renamed `middleware.ts` → `proxy.ts`.

### Admin access
`lib/requireAdmin.ts` — checks `profiles.role` is `admin` or `owner`. Dashboard auto-redirects admins to `/admin`.

### Stripe plans
- Starter: $49/mo or $490/yr — 3-day trial
- Growth: $89/mo or $890/yr — no trial
- ProAgent: $149/mo or $1,490/yr — no trial
- `profiles.plan` values: `starter`, `growth`, `proagent`

### Trial enforcement
- Trial detected by checking `stripe.subscriptions.retrieve(stripe_subscription_id).status === 'trialing'`
- Brand Kit page checks trial server-side and renders locked state
- AI Toolkit run-prompt checks trial and counts total lifetime runs (not monthly) — cap is 5
- Trial badge shown on Starter card only on pricing page — green, prominent

### AI Toolkit plan gating
- Starter (paid): 15 runs/mo from `platform_settings.starter_ai_limit` (dynamic, no redeploy)
- Starter (trial): 5 total runs ever
- Growth/ProAgent: unlimited
- Category gates: `social/email/seo` = Starter+, `ads/brand` = Growth+, `operations` = ProAgent

### Brand voice in AI Toolkit
- `useBrandVoice` toggle in runner modal — on by default if Brand Kit complete
- Fetches `voice`, `positioning`, `persona` docs and injects into Claude system prompt
- Brand Kit locked during trial — shows upgrade CTA

### Admin Settings — full control center
6 tabs, all changes take effect without redeploy:
1. **Notifications** — admin email + Starter AI limit
2. **Platform Banner** — global announcement to all clients
3. **User Management** — search, change role/status inline
4. **Billing Overrides** — manually set plan (DB only, not Stripe)
5. **Prompt Library** — toggle prompts on/off by category
6. **Service Catalogue** — toggle services visible/hidden

### Notification email routing
`lib/getNotifyEmail.ts` — all notification routes use this helper. Reads `notify_email` from `platform_settings`, falls back to `NOTIFY_EMAIL` env var. Changeable from admin panel instantly.

### Deliverables storage
- Supabase Storage bucket: `deliverables` — private
- File path structure: `{user_id}/{project_name}/{timestamp}_{filename}`
- Download via signed URLs (60 second expiry)
- Ownership enforced: clients can only download their own files, admins can access all

### Support — threaded tickets
- `support_tickets` + `support_messages` tables
- Priorities: `low`, `medium`, `urgent`
- Email flows: new ticket → admin, admin reply → client, ticket closed → client
- Admin can change priority and status inline

### Lucide icons
`Instagram` icon doesn't exist — use `Hash`. Brand logos: `/public/google_analytics_icon.png`, `/instagram-logo.png`, `/MetaLogo.png`.

---

## Marketing Site (`~/agent7even`) — Current State

**Repo:** `github.com/rovaneD/agent7even` · **Branch:** `master` (not `main`)
**Live:** `agent7even.com` · **Vercel:** auto-deploys from `master`

### Copy & content (current)
- **Hero heading:** "Your business, operating at full force."
- **Hero CTA:** "Start your free trial" → `https://app.agent7even.com/sign-up`
- **Hero pill badge:** removed
- **Nav CTA:** "Sign up" → `https://app.agent7even.com/sign-up`
- **Nav links:** How it works · Services · Pricing (`app.agent7even.com/pricing`) · Blog · Free SEO Tool · Sign in
- **Footer CTA link:** "Sign up" → `https://app.agent7even.com/sign-up`
- **Bottom CTA section:** "Start your free trial →" → `https://app.agent7even.com/sign-up`
- **Packages section:** removed — pricing links to `app.agent7even.com/pricing`

### How it works section (current text)
- Heading: "Your marketing. Finally under control."
- Subheading: "Most small business owners spend more time thinking about marketing than actually doing it. Agent7even fixes that — starting day one."
- Step 01: "Sign up. You're in." — No sales calls. No onboarding forms…
- Step 02: "Tell us your brand once." — Complete your Brand Kit and Claude learns your voice…
- Step 03: "Create content in seconds. Get real work done." — Run AI prompts for captions, emails, and ad copy…
- Step 04: "See what's actually working." — Connect your Google Analytics and Meta Ads…

### Add-on services section (current)
- Heading: "Add exactly what you need."
- Subheading: "Available as add-ons inside your dashboard. Fulfilled by the Agent7even team."
- 8 cards: no prices, all tagged "Available as add-on"
- Bundle note: "Growth and ProAgent subscribers get 10–15% off all add-on services automatically."
- Website Building description: "New builds, page updates, and conversion-focused landing pages. Mobile-optimized and SEO-ready. Built on Webflow, Framer, or Shopify."

### ProofBar (current)
- Uses Lucide icons in `h-7 w-7 rounded-lg border border-gray-100 bg-gray-50` containers (matching Addons card icon style)
- Icons: `Clock`, `DollarSign`, `Zap`, `Fingerprint`, `MapPin`

### Chatbot
- System prompt updated to SaaS model — 3 tiers, correct prices, `app.agent7even.com` CTAs
- Auto-improvement cron (`improve-prompt/route.ts`) meta-prompt updated to preserve plan names, prices, trial, links

---

## CTA Copy Standard (both sites)

| Context | Copy |
|---|---|
| Nav button (marketing site + app) | "Sign up" |
| Footer nav link (marketing site) | "Sign up" |
| Hero primary CTA | "Start your free trial" |
| Bottom CTA section | "Start your free trial →" |
| Pricing — Starter card | "Start your free trial" |
| Pricing — Growth card | "Get started" |
| Pricing — ProAgent card | "Get started" |

---

## What's Fully Built and Live

- [x] Auth (Clerk), onboarding, dashboard
- [x] Welcome email (Resend on `user.created`)
- [x] Stripe billing — 3-tier subscriptions, monthly/annual, portal, invoices
- [x] Stripe trial — Starter only, 3 days, card required
- [x] Pricing page — trial badge on Starter, "Start your free trial" CTA, comparison table with Brand Kit row
- [x] Auto-checkout flow — `sign-up?plan=X` → onboarding → checkout-now → Stripe
- [x] Services module — browse, request, track orders
- [x] AI Toolkit — plan-gated, brand voice toggle, trial limit (5 runs), dynamic Starter limit
- [x] Brand Kit — 6-chapter flow, 4 Claude documents, version history, locked during trial
- [x] Brand voice in AI Toolkit — system prompt injection, toggle, nudge banner
- [x] Analytics tab — GA OAuth + Meta Ads OAuth + Instagram followers
- [x] Deliverables tab — client + admin upload, project grouping, signed URL download, delete
- [x] Support tab — threaded tickets, priority, email notifications both directions
- [x] Admin panel — command center, clients, orders, support, revenue, settings
- [x] Admin Settings — 6-tab control center, all dynamic (no redeploy needed)
- [x] Admin Revenue — MRR, plan breakdown, Stripe charges, paused clients
- [x] Admin Brand Kit viewer — read-only collapsible documents per client
- [x] Admin Deliverables — upload/download/delete per client
- [x] Client Settings — company name, website URL, Instagram handle
- [x] Platform Banner — global announcement toggle from admin
- [x] `getNotifyEmail` helper — dynamic notification routing from admin panel
- [x] `platform_settings` table — notify_email, starter_ai_limit, platform_banner
- [x] `services` table — seeded with 8 services, toggleable from admin
- [x] Privacy Policy + Terms of Service — public pages
- [x] Google OAuth verified + published
- [x] Deployment safeguards — pre-push hook, CI workflow, vercel.json, AGENTS.md rules
- [x] Marketing site — all copy, CTAs, HowItWorks, ProofBar icons, hero, add-ons updated

---

## What's NOT Built Yet (Priority Order)

### 1. Go live on Stripe — HIGH (when ready)
- Switch from test keys (`sk_test_`, `pk_test_`) to live keys (`sk_live_`, `pk_live_`)
- Recreate 3 subscription products × monthly + annual = 6 price IDs in Stripe live mode
- Update all Stripe env vars in Vercel

### 2. Meta App Review — HIGH (when ready)
- Complete Tech Provider verification (business + access verification)
- Submit `instagram_manage_insights` for app review with screen recordings
- Until approved: Instagram follower count shows, reach/impressions unavailable

### 3. Integrations — ROADMAP (build last)
Priority order for future sessions:

**Tier 1 — High value, build first:**
- **Zapier** — webhook endpoint when order status changes or deliverable is marked complete. One integration unlocks 6,000+ client automations.
- **Google Drive** — OAuth to save deliverables automatically to client's Drive folder
- **Slack** — Admin notifications for orders/tickets/leads in Slack instead of email only

**Tier 2 — Build after Tier 1:**
- **Klaviyo** — AI Toolkit generates copy, syncs to their Klaviyo account
- **Mailchimp** — Same as Klaviyo, broader SMB user base
- **Shopify** — Pull product data for AI-generated product descriptions
- **Notion** — Sync Brand Kit documents to client's Notion workspace
- **HubSpot** — Sync qualified chatbot leads to CRM
- **Canva** — Export Brand Kit colors/fonts to Canva brand kit
- **Airtable** — Sync orders and deliverables to project management

**Tier 3 — Enterprise, save for later:**
- Salesforce, Monday.com, Asana, WhatsApp Business, ActiveCampaign

### 4. Brand Kit — Enterprise Offering — FUTURE
- Standalone product for enterprise clients
- White-label or premium tier
- Revisit after platform is proven with existing clients

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
| Trial badge | `bg-emerald-500 text-white` |
| Trial CTA button | `bg-emerald-500 hover:bg-emerald-400 text-white` |
| Billing note — trial | `text-emerald-400` |
| Billing note — paid | `text-white/30` or `text-white/60` (on orange) |
