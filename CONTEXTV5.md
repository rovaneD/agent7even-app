# CONTEXT.md Versioning Rule

Every time there is a significant shift in concept, architecture, or product direction — create a new version.
Name files sequentially: CONTEXT.md → CONTEXTV2.md → CONTEXTV3.md → CONTEXTV4.md → CONTEXTV5.md etc.
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
| V4 | May 2026 | Deliverables tab, Support tab (threaded), Admin Revenue, Admin Settings (full control center), Client Settings, Brand Kit in Admin, Trial strategy (Starter only, 3 days, 5 AI runs, Brand Kit locked), Marketing site updated (new copy, pricing, chatbot system prompt), Platform settings table, Services table seeded, Integrations roadmap added. Deployment safeguards. Pricing page hardened. CTA copy standardised. Blog fully updated. |
| V5 | May 2026 | Notification system (bell, notification center, real-time, 6 event triggers). Design & Development inquiry flow. Team management system (invite, permissions, seat billing). Marketing site service pages (10 pages + shared layout + 404). LogoStrip. Dashboard PlanBanner (dismissible, correct plan labels). Analytics renamed Website → Google Analytics with Property ID subtitle. |

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
| Payments | Stripe (test mode — 3-tier subscription + per-seat add-on) |
| Email | Resend (order notifications + welcome email + support emails + team invites) |
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
- **V5 addition:** `user.created` webhook now checks for a pending `team_members` invite matching the new user's email and auto-activates the membership

### Supabase
- Project URL: `https://jianzyolobriaqpttamt.supabase.co`
- No RLS enforced — service role key used for all server-side writes
- Storage bucket: `deliverables` — private, signed URLs, 50MB max per file
- **Realtime enabled on `notifications` table** — `alter publication supabase_realtime add table notifications`

### Stripe (Test Mode — switch to live when ready)
- API version: `2026-04-22.dahlia`
- Always cast: `{ apiVersion: '2026-04-22.dahlia' as any }` — SDK types may not recognise this string
- **NEVER use `'2025-04-30.basil'`** — wrong version, causes build failure
- Webhook endpoint: `https://app.agent7even.com/api/webhooks/stripe`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- All plans: `mode: 'subscription'`
- Trial: **Starter only — 3 days** — `trial_period_days: 3` in `subscription_data`
- Growth and ProAgent: no trial, charged immediately
- **Seat billing (V5):** `STRIPE_SEAT_PRICE_ID = price_1TbBQ6CjXyyqncdvakHy4jce` — $15/mo per extra seat, added/removed as subscription line item when team members are invited/removed

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
STRIPE_SEAT_PRICE_ID                 price_1TbBQ6CjXyyqncdvakHy4jce   # $15/mo extra seat
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
  .github/workflows/ci.yml
  vercel.json
  AGENTS.md
  proxy.ts                                          # Public routes — includes /api/team/accept
  app/
    layout.tsx
    page.tsx
    globals.css
    privacy/page.tsx
    terms/page.tsx
    sign-in/[[...sign-in]]/page.tsx
    sign-up/[[...sign-up]]/page.tsx
    onboarding/page.tsx
    checkout-now/page.tsx
    pricing/page.tsx
    dashboard/
      layout.tsx                                    # Server component — fetches profile + notifications
      DashboardShell.tsx                            # Client component — sidebar, mobile nav, NotificationBell
      PlanBanner.tsx                                # Client component — dismissible team msg, plan label
      page.tsx
      notifications/
        page.tsx                                    # Server component — initial notifications fetch
        NotificationsClient.tsx                     # Client — filter read/unread, mark as read
      team/
        page.tsx                                    # Owner only — fetches members, seat counts
        TeamClient.tsx                              # Invite modal, permissions editor, remove member
      services/
        page.tsx
        ServicesClient.tsx                          # Design & Dev → routes to /inquiry
        inquiry/
          page.tsx
          InquiryForm.tsx                           # 3-step multi-part inquiry form
      ai-toolkit/
        page.tsx
        AIToolkitClient.tsx
      billing/
        page.tsx
        BillingClient.tsx
      analytics/
        page.tsx
        AnalyticsClient.tsx                         # GA section renamed Google Analytics, property ID subtitle
      brand-kit/
        page.tsx
        BrandKitClient.tsx
        BrandFlow.tsx
        BrandDocument.tsx
        questions.ts
      deliverables/
        page.tsx
        DeliverablesClient.tsx
      support/
        page.tsx
        SupportClient.tsx
      settings/
        page.tsx
        SettingsClient.tsx
    admin/
      layout.tsx
      page.tsx
      clients/
        page.tsx
        [id]/
          page.tsx
          AdminNotes.tsx
          OrderStatusUpdater.tsx
          AdminDeliverables.tsx
          AdminBrandKit.tsx
      orders/page.tsx
      support/
        page.tsx
        [id]/
          page.tsx
          AdminSupportThread.tsx
      inquiries/
        page.tsx                                    # All inquiries split by active/closed
        [id]/
          page.tsx
          AdminInquiryDetail.tsx                    # Status, notes, proposal URL, client notification
      revenue/page.tsx
      settings/
        page.tsx
        AdminSettingsClient.tsx
    api/
      webhooks/
        clerk/route.ts                              # V5: activates pending team invite on user.created
        stripe/route.ts
      onboarding/complete/route.ts
      orders/create/route.ts
      stripe/
        checkout/route.ts
        portal/route.ts
      admin/
        notes/route.ts
        orders/update-status/route.ts
        settings/
          update/route.ts
          update-user/route.ts
          update-prompt/route.ts
          update-service/route.ts
        inquiries/
          update/route.ts                           # Status, notes, proposal URL — notifies client
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
        run-prompt/route.ts
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
      notifications/
        mark-read/route.ts                          # Mark single or all notifications read
      services/
        inquiry/route.ts                            # Save inquiry + email admin + create notification
      team/
        invite/route.ts                             # Send invite email, create team_members record, Stripe seat
        accept/route.ts                             # PUBLIC — link existing profile or redirect to sign-up
        update/route.ts                             # Save permissions + role
        remove/route.ts                             # Remove member, decrement Stripe seat

  emails/
    welcome.ts

  lib/
    supabase/server.ts
    supabase/client.ts
    requireAdmin.ts
    getNotifyEmail.ts
    createNotification.ts                           # Centralised notification helper (DB insert + optional email)
    teamPermissions.ts                              # getTeamPermissions() + hasPermission() helpers

  components/
    NotificationBell.tsx                            # Bell icon, unread count, dropdown preview, real-time
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
| `is_account_owner` | boolean | `true` for plan owners, `false` for team members |
| `account_id` | uuid | FK → profiles.id (the owner's profile) — null for owners |
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
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles.id |
| `title`, `body`, `type`, `link` | text | |
| `read` | boolean | |
| `created_at` | timestamptz | |

Realtime enabled: `alter publication supabase_realtime add table notifications`

Notification types in use: `order_status`, `order_delivered`, `support_reply`, `deliverable_uploaded`, `brand_kit_generated`, `plan_activated`, `inquiry_update`

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

### `project_inquiries` (V5)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles.id |
| `project_type` | text | |
| `description` | text | |
| `has_assets` | boolean | |
| `asset_notes` | text | |
| `timeline` | text | |
| `budget` | text | |
| `status` | text | `submitted`, `reviewing`, `proposal_sent`, `accepted`, `declined`, `closed` |
| `admin_notes` | text | |
| `proposal_url` | text | |
| `created_at` / `updated_at` | timestamptz | |

### `team_members` (V5)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `account_id` | uuid | FK → profiles.id (the owner) |
| `member_profile_id` | uuid | FK → profiles.id (the member) — null until invite accepted |
| `role` | text | `member` or `admin` |
| `permissions` | jsonb | `{ billing, services, ai_toolkit, analytics, brand_kit, deliverables, support }` — all boolean |
| `status` | text | `pending`, `active`, `removed` |
| `invited_email` | text | |
| `invite_token` | uuid | One-time token for the invite link |
| `created_at` / `updated_at` | timestamptz | |

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

### Notification system (V5)
- `lib/createNotification.ts` — centralized helper: inserts into `notifications` table, optionally sends email via Resend
- `components/NotificationBell.tsx` — client component: bell icon, unread count badge, dropdown preview of last 5, real-time via Supabase websocket
- `app/dashboard/notifications/page.tsx` + `NotificationsClient.tsx` — full notification center with read/unread filter
- `app/api/notifications/mark-read/route.ts` — mark single or all notifications read (ownership enforced)
- Realtime subscription: `supabase.channel('notifications').on('postgres_changes', ...)` in `NotificationBell`
- Events that trigger notifications:
  - New order submitted → admin notified
  - Order status updated → client notified (email on `delivered`)
  - Support reply posted → other party notified
  - Admin uploads deliverable → client notified (email)
  - Brand Kit generated → client notified
  - Stripe checkout completed → client notified (plan activated)
  - Inquiry status updated → client notified

### Dashboard layout split (V5)
- `app/dashboard/layout.tsx` — **server component** — fetches `profileId` and initial `notifications` from Supabase, passes as props to `DashboardShell`
- `app/dashboard/DashboardShell.tsx` — **client component** — sidebar state, mobile nav, renders `NotificationBell` in the header
- This pattern keeps initial notifications server-fetched (no loading flicker) while sidebar/bell remain interactive

### PlanBanner (V5)
- `app/dashboard/PlanBanner.tsx` — client component
- Permanent part: "You're on the [Plan] plan." + "Manage →" link — always visible
- Dismissible part: "The Agent7even team has been notified..." pill with ✕ — stored in `localStorage('team_notified_dismissed')`, shown only once
- Plan label mapping: `starter → Starter`, `growth → Growth`, `proagent → ProAgent`

### Team management system (V5)
- Only account owners (`is_account_owner = true`) can access `/dashboard/team` and manage members
- Team members (`is_account_owner = false`) have `account_id` pointing to the owner's profile
- `lib/teamPermissions.ts` — `getTeamPermissions(profileId)` reads `profiles.is_account_owner` and `team_members.permissions`, returns `{ isOwner, permissions, accountId }`
- `hasPermission(teamPerms, key)` — returns true for owners unconditionally; for members checks their permission map
- Permission keys: `billing`, `services`, `ai_toolkit`, `analytics`, `brand_kit`, `deliverables`, `support` (support always true)
- **Permission gates added** to these dashboard pages: `billing`, `ai-toolkit`, `analytics`, `brand-kit`, `deliverables`, `services` — each calls `getTeamPermissions` server-side, redirects to `/dashboard` if denied
- **Invite flow:** Owner invites email → `team_members` record created with `status: pending` + `invite_token` → invite email sent → invitee clicks link → `/api/team/accept` (public route) links existing profile or redirects to `/sign-up?invite_token=...` → Clerk webhook on `user.created` finds pending invite by email and activates it
- **Seat billing:** Starter includes 1 seat, Growth 3, ProAgent 5. Extra seats add `STRIPE_SEAT_PRICE_ID` line item at $15/mo. Removing a member decrements the quantity or deletes the line item
- `/api/team/accept` added to public routes in `proxy.ts`

### Design & Development inquiry flow (V5)
- `ServicesClient.tsx` — Design & Development card routes to `/dashboard/services/inquiry` instead of the standard order modal
- `InquiryForm.tsx` — 3-step client form: (1) project type + description, (2) existing assets, (3) timeline + budget
- `api/services/inquiry/route.ts` — saves to `project_inquiries`, emails admin, creates admin in-app notification
- Admin views at `/admin/inquiries` (list, split active/closed) and `/admin/inquiries/[id]` (detail, status update, notes, proposal URL)
- `api/admin/inquiries/update/route.ts` — updates status/notes/proposal, notifies client on key status changes
- Admin sidebar includes "Inquiries" link (between Orders and Support)

### Analytics — Google Analytics naming (V5)
- `AnalyticsClient.tsx` section header renamed from "Website Analytics" to "Google Analytics"
- Stat card label renamed from "Website sessions" to "GA sessions"
- Connected state shows subtitle: `GA4 · Property {propertyId}` — consistent with Meta Ads showing `Account {metaAdAccountId}` and Instagram showing `@{igHandle}`
- `gaOAuthEmail` still used in `PropertySelectorModal` ("Signed in as...") but not shown in the connected view

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

### Client Settings — save + refresh pattern
- `app/api/settings/update/route.ts` calls `revalidatePath('/dashboard/settings')` and `revalidatePath('/dashboard/analytics')` after a successful Supabase update
- `SettingsClient.tsx` calls `router.refresh()` immediately after `setSaved(true)` — forces Next.js to re-fetch server data without a full page reload
- "Account settings" link opens the Clerk `openUserProfile()` modal inline (not a link to clerk.com)
- Error state appears inline below the Instagram handle field with red border, not at the bottom of the form

### Instagram handle — source of truth
- Manually set in `/dashboard/settings` — stored as `profiles.instagram_handle`
- Meta OAuth callback preserves manually-entered handle if OAuth returns no IG username
- Instagram insights empty state shows "Instagram insights coming soon" — not an error message

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
- **Nav links:** How it works · Services (`/services`) · Pricing (`app.agent7even.com/pricing`) · Blog · Free SEO Tool · Sign in
- **Footer CTA link:** "Sign up" → `https://app.agent7even.com/sign-up`
- **Bottom CTA section:** "Start your free trial →" → `https://app.agent7even.com/sign-up`
- **Packages section:** removed — pricing links to `app.agent7even.com/pricing`

### LogoStrip (V5)
- `src/components/LogoStrip.tsx` — renders `public/logos-validation.png` with `filter: invert(1) brightness(2)` and `opacity-30`
- Placed directly below `<Hero />`, before `<HowItWorks />` in `page.tsx`
- Heading: "Trusted by brands you know"

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
- Uses Lucide icons in `h-7 w-7 rounded-lg border border-gray-100 bg-gray-50` containers
- Icons: `Clock`, `DollarSign`, `Zap`, `Fingerprint`, `MapPin`

### Service pages (V5)
All live under `src/app/services/`. Shared layout at `src/app/services/ServicePageLayout.tsx`.

| Route | Page |
|---|---|
| `/services` | Services index — 10 cards with Lucide icons in styled containers |
| `/services/website-building` | Website Building |
| `/services/social-media-management` | Social Media Management |
| `/services/brand-identity` | Brand Identity |
| `/services/video-reels` | Video & Reels Editing |
| `/services/packaging` | Packaging Design |
| `/services/design-development` | Design & Development |
| `/services/product-photography` | Product Photography |
| `/services/email-marketing` | Email Marketing Setup |
| `/services/ad-management` | Ad Management |
| `/services/seo` | SEO Basics |

- All CTAs on service pages link to `https://app.agent7even.com/pricing`
- Nav "Services" link updated from `#services` anchor to `/services`
- `src/app/not-found.tsx` — branded 404 page with links back to home, /services, and /pricing

### Chatbot
- System prompt updated to SaaS model — 3 tiers, correct prices, `app.agent7even.com` CTAs
- Auto-improvement cron (`improve-prompt/route.ts`) meta-prompt updated to preserve plan names, prices, trial, links

---

## GA4 Tracking

**Property ID:** `G-8913QV8Z1M` — shared across both sites (marketing + app)

### Marketing site (`~/agent7even`)
- Script in `src/app/layout.tsx` (inline `<script>` in `<head>`)
- Helper: `src/lib/gtag.ts` — exports `trackEvent({ action, category, label, value })`
- Type declaration: `src/types/gtag.d.ts` — `window.gtag` and `window.dataLayer`

### App (`app.agent7even.com`)
- Script in `app/layout.tsx` via `next/script strategy="afterInteractive"`
- Type declaration: `types/gtag.d.ts`
- Inline `trackEvent` helper in `app/pricing/page.tsx`

### Key events wired

| Event | Site | Fires when | Params |
|---|---|---|---|
| `sign_up_click` | Marketing hero | "Start your free trial" clicked | `category: 'hero'` |
| `sign_up_click` | Marketing CTA section | "Start your free trial →" clicked | `category: 'cta_section'` |
| `pricing_view` | Marketing hero | "See what's included" clicked | `category: 'hero'` |
| `pricing_view` | App pricing page | Page loads | `page: 'pricing'` |
| `plan_selected` | App pricing page | Any plan CTA clicked | `plan`, `billing` (monthly/annual) |

---

## Blog (`~/agent7even`)

Blog lives at `agent7even.com/blog` — 9 published posts, content in `src/content/blog/*.mdx`.

### Nav (`src/components/blog/BlogNav.tsx`)
- All CTA buttons: "Sign up" → `https://app.agent7even.com/sign-up`
- Pricing nav link: `https://app.agent7even.com/pricing`

### Blog index (`src/app/blog/page.tsx`)
- Bottom CTA: "Start your free trial →" → `app.agent7even.com/sign-up`

### Blog article (`src/app/blog/[slug]/page.tsx`)
- Service card CTA: "Start your free trial →" → `app.agent7even.com/sign-up`
- Service card body: "Available as an add-on inside your Agent7even dashboard…"
- No prices shown anywhere in the article template

### MDX frontmatter rules
- `service:` field: name only — no prices
- Never reference "AI Sprint", "Growth package", or "Done For You retainer" — old model names
- Service names must match the 8 add-on services: `AI Toolkit`, `Website Building`, `Social Media Management`, `Product Photography`, `Email Marketing Setup`, `SEO Basics`, `Brand Identity & Logo`, `Ad Management`

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
- [x] Settings page — Clerk modal, inline error, revalidatePath + router.refresh after save
- [x] Meta callback — preserves manually-entered instagram_handle if OAuth returns no IG username
- [x] Instagram empty state — "Instagram insights coming soon" message
- [x] GA4 on app — `G-8913QV8Z1M` via next/script afterInteractive
- [x] GA4 key events — sign_up_click, pricing_view, plan_selected
- [x] Blog — all CTAs updated, book-a-call removed, service card prices stripped from all 9 posts
- [x] **Notification system** — bell, notification center, real-time, 6 event types, mark-read API
- [x] **Design & Development inquiry flow** — 3-step form, admin management, client notifications
- [x] **Team management system** — invite, accept, permissions, remove, seat billing, Clerk webhook integration
- [x] **Permission gates** — 6 dashboard pages gated by `teamPermissions` lib
- [x] **PlanBanner** — dismissible team message, correct plan label capitalisation (ProAgent)
- [x] **Analytics renamed** — "Website Analytics" → "Google Analytics", Property ID subtitle
- [x] **LogoStrip** — "Trusted by brands you know" below hero on marketing site
- [x] **10 service pages** — `/services` index + 9 individual pages + `ServicePageLayout` + 404 page
- [x] **STRIPE_SEAT_PRICE_ID** — added to Vercel env (all 3 environments)

---

## What's NOT Built Yet (Priority Order)

### 1. Go live on Stripe — HIGH (when ready)
- Switch from test keys (`sk_test_`, `pk_test_`) to live keys (`sk_live_`, `pk_live_`)
- Recreate 3 subscription products × monthly + annual = 6 price IDs in Stripe live mode
- Recreate seat add-on price in live mode, update `STRIPE_SEAT_PRICE_ID`
- Update all Stripe env vars in Vercel

### 2. Meta App Review — HIGH (when ready)
- Complete Tech Provider verification (business + access verification)
- Submit `instagram_manage_insights` for app review with screen recordings
- Until approved: Instagram follower count shows, reach/impressions unavailable

### 3. Supabase migrations for V5 tables — REQUIRED before team features work
Run these in Supabase SQL Editor if not already done:
```sql
-- Add team columns to profiles
alter table profiles add column if not exists is_account_owner boolean default true;
alter table profiles add column if not exists account_id uuid references profiles(id);

-- Create team_members table
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references profiles(id) not null,
  member_profile_id uuid references profiles(id),
  role text default 'member',
  permissions jsonb default '{}',
  status text default 'pending',
  invited_email text not null,
  invite_token uuid default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create project_inquiries table
create table if not exists project_inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  project_type text,
  description text,
  has_assets boolean default false,
  asset_notes text,
  timeline text,
  budget text,
  status text default 'submitted',
  admin_notes text,
  proposal_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable realtime on notifications (if not already done)
alter publication supabase_realtime add table notifications;
```

### 4. Integrations — ROADMAP (build last)
**Tier 1 — High value, build first:**
- **Zapier** — webhook endpoint when order status changes or deliverable is marked complete
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

### 5. Brand Kit — Enterprise Offering — FUTURE
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
| Plan banner | `bg-[#c8522a]/5 border-[#c8522a]/20` |
| Dismissible pill | `bg-white border border-gray-100 rounded-xl` |
