# CONTEXT.md Versioning Rule

Every time there is a significant shift in concept, architecture, or product direction — create a new version.
Name files sequentially: CONTEXT.md → CONTEXTV2.md → CONTEXTV3.md etc.
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

---

# Agent7even App — Full Implementation Context

Feed this entire document to Claude before continuing development. It is the source of truth for what has been built, how it works, and what comes next.

---

## What This Product Is

**Agent7even App** (`app.agent7even.com`) is a SaaS client portal for Agent7even — a full-service marketing agency for small businesses. Clients sign up, complete onboarding, choose a plan, and manage their services, AI tools, billing, analytics, and brand assets from a single dashboard.

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
| Payments | Stripe (test mode — 3-tier subscription) |
| Email | Resend (order notifications + welcome email) |
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
- Google SSO enabled on production instance (dedicated Google OAuth client)
- Webhook: `https://app.agent7even.com/api/webhooks/clerk` (events: `user.created`, `user.updated`, `user.deleted`)

### Supabase
- Project URL: `https://jianzyolobriaqpttamt.supabase.co`
- No RLS enforced — service role key used for all server-side writes
- No foreign key from `profiles.id` to `auth.users` (dropped — app uses Clerk, not Supabase Auth)

### Stripe (Test Mode — switch to live when ready)
- API version: `2026-04-22.dahlia`
- Webhook endpoint: `https://app.agent7even.com/api/webhooks/stripe`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- All plans are subscriptions (`mode: 'subscription'`) — no one-time payments
- 3 tiers × monthly + annual = 6 active price IDs

### Cross-Site Links
- **Sign up CTA** → `https://app.agent7even.com/sign-up`
- **Log in / Sign in CTA** → `https://app.agent7even.com/sign-in`
- These are `href` updates on the marketing site (`~/agent7even`) only — not yet deployed

### Google OAuth (Analytics)
- GCP Project: `agent7even-analytics` (project number `98873543191`)
- OAuth 2.0 Client ID: `98873543191-tr84f0b2218cac6u7e9v95sfpogohmie.apps.googleusercontent.com`
- Authorized redirect URI: `https://app.agent7even.com/api/analytics/ga-callback`
- Scope: `https://www.googleapis.com/auth/analytics.readonly`
- APIs enabled: **Google Analytics Data API** + **Google Analytics Admin API**
- Service account: `agent7even-analytics@agent7even-analytics.iam.gserviceaccount.com`
- OAuth consent screen: **External, published** ✅ — no "unverified app" warning
- Authorized domain: `agent7even.com` (verified via Google Search Console)

### Meta OAuth (Analytics)
- **Marketing API App:** Agent7even (App ID: `992647829846107`)
- **Instagram API App:** Agent7even-IG (App ID: `1323722066356909`)
- Authorized redirect URI: `https://app.agent7even.com/api/analytics/meta-callback`
- Also registered in Facebook Login for Business → Settings → Valid OAuth Redirect URIs
- Scopes live (Marketing API): `ads_read`, `ads_management`, `business_management`, `pages_read_engagement`, `pages_show_list`, `public_profile`
- Scopes pending (Instagram Graph API — requires separate Meta app review): `instagram_basic`, `instagram_manage_insights`
- Business ID: `738598814681808`
- Token strategy: short-lived → long-lived token (60 days) exchanged on callback

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

## File Structure

```
app/
  layout.tsx                              # ClerkProvider, Geist font, global styles
  page.tsx                                # Homepage/landing (dark, on-brand) + footer
  globals.css                             # Tailwind v4 + tailwindcss-animate
  privacy/page.tsx                        # Privacy Policy (public, no auth)
  terms/page.tsx                          # Terms of Service (public, no auth)
  sign-in/[[...sign-in]]/page.tsx         # Branded split-screen + Clerk + legal links
  sign-up/[[...sign-up]]/page.tsx         # Branded split-screen + Clerk + legal links
  onboarding/page.tsx                     # Conversational onboarding (client component)
  pricing/page.tsx                        # 3-tier subscription pricing + monthly/annual toggle
  dashboard/
    layout.tsx                            # Sidebar nav layout — Privacy/Terms in sidebar bottom
    page.tsx                              # Dashboard home — redirects admin→/admin, ungated→/onboarding
    services/
      page.tsx                            # Server: fetches profile + orders
      ServicesClient.tsx                  # Client: browse/request/track services
    ai-toolkit/
      page.tsx                            # Server: fetches prompts, usage stats, brand docs, plan
      AIToolkitClient.tsx                 # Client: plan-gated prompts, brand voice toggle, nudge banner
    billing/
      page.tsx                            # Server: fetches Stripe invoices + subscription + portal URL
      BillingClient.tsx                   # Client: plan card, invoices, portal, upgrade toggle
    analytics/
      page.tsx                            # Server: fetches GA + Meta connection state from profiles
      AnalyticsClient.tsx                 # Client: GA OAuth + Meta OAuth + live charts + brand logos
    brand-kit/
      page.tsx                            # Server: fetches brand answers + documents
      BrandKitClient.tsx                  # Client: orchestrates flow vs documents home view
      BrandFlow.tsx                       # 6-chapter conversational question flow
      BrandDocument.tsx                   # Inline editable document with version history
      questions.ts                        # BRAND_CHAPTERS + DOCUMENT_TYPES definitions
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
      stripe/route.ts                     # subscription lifecycle → plan/status/customer ID in profiles
    onboarding/
      complete/route.ts                   # Saves onboarding data, sets onboarding_complete=true
    orders/
      create/route.ts                     # Creates order in Supabase + notifies melissa@ via Resend
    stripe/
      checkout/route.ts                   # Creates Stripe Checkout session (subscription mode, 6 price IDs)
      portal/route.ts                     # Opens Stripe Customer Portal
    admin/
      notes/route.ts                      # Creates admin_notes row
      orders/update-status/route.ts       # Updates order status + emails client on "delivered"
    analytics/
      ga-connect/route.ts                 # Redirects to Google OAuth consent screen
      ga-callback/route.ts                # Exchanges OAuth code → stores refresh token + email
      ga-properties/route.ts              # Lists user's GA4 properties via accountSummaries API
      ga-data/route.ts                    # Fetches GA4 report data (OAuth first, SA fallback)
      connect/route.ts                    # Saves GA property ID to profiles
      disconnect/route.ts                 # Clears GA OAuth tokens + property ID from profiles
      meta-connect/route.ts               # Redirects to Facebook OAuth (Marketing API scopes)
      meta-callback/route.ts              # Exchanges code → long-lived token → stores ad account + IG ID
      meta-data/route.ts                  # Fetches Instagram insights + Meta Ads data for date range
      meta-disconnect/route.ts            # Clears Meta tokens + connection state from profiles
    ai/
      run-prompt/route.ts                 # Plan-gated Claude generation — enforces tier + run limit + brand voice
      save-prompt/route.ts                # Saves prompt to saved_prompts
    brand/
      save-answers/route.ts               # Upserts brand_answers for user
      generate/route.ts                   # Runs 4 Claude prompts in parallel → saves brand_documents
      save-document/route.ts              # Saves edited document content + archives previous version

emails/
  welcome.ts                              # welcomeEmailHtml() + welcomeEmailText() — sent on user.created

lib/
  supabase/
    server.ts                             # createClient() (anon) + createServiceClient() (service role)
    client.ts                             # Browser Supabase client
  requireAdmin.ts                         # Checks role = 'admin'|'owner', redirects otherwise

proxy.ts                                  # Clerk middleware — public routes:
                                          #   /, /sign-in, /sign-up, /pricing, /privacy, /terms,
                                          #   /api/webhooks/*, /api/analytics/ga-callback,
                                          #   /api/analytics/meta-callback
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
| `plan` | text | `starter`, `growth`, `proagent` — set by Stripe webhook |
| `status` | text | `onboarding`, `active`, `paused`, `churned` |
| `stripe_customer_id` | text | |
| `stripe_subscription_id` | text | All paid tiers are subscriptions |
| `onboarding_complete` | boolean | |
| `business_type` | text | Set during onboarding |
| `business_goals` | text[] | Multi-select from onboarding |
| `website_url` | text | |
| `instagram_handle` | text | Set via Analytics connect |
| `ga_measurement_id` | text | GA4 Property ID (numeric) |
| `ga_refresh_token` | text | Google OAuth refresh token |
| `ga_oauth_email` | text | Google account email used for OAuth |
| `ga_connected` | boolean | True once OAuth + property confirmed |
| `meta_access_token` | text | Long-lived Meta access token (60 days) |
| `meta_ad_account_id` | text | Meta Ads account ID (e.g. `act_XXXXXXXXX`) |
| `meta_ig_account_id` | text | Instagram Business account ID (via Pages) |
| `meta_connected` | boolean | True once Meta OAuth completes |
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
| `delivered_at` | timestamptz | |
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
| `time_saved_mins` | int | |
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
| `time_saved_mins` | int | |
| `created_at` | timestamptz | |

### `brand_answers`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles.id, unique index |
| `answers` | jsonb | All 24 question responses keyed by question ID |
| `completed` | boolean | True once all 6 chapters submitted |
| `created_at` / `updated_at` | timestamptz | |

### `brand_documents`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles.id |
| `type` | text | `voice`, `story`, `persona`, `positioning` — unique per user |
| `title` | text | Display name |
| `content` | text | Full document text — editable by client |
| `version` | int | Increments on every save or regeneration |
| `created_at` / `updated_at` | timestamptz | |

### `brand_document_versions`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `document_id` | uuid | FK → brand_documents.id |
| `content` | text | Archived version content |
| `version` | int | Version number being archived |
| `created_at` | timestamptz | |

---

## Key Architectural Decisions

### Middleware filename
Next.js 16 renamed `middleware.ts` → `proxy.ts`. Same Clerk `clerkMiddleware` API, different filename.

### Admin access
`lib/requireAdmin.ts` — called at the top of every admin page. Checks `profiles.role` is `admin` or `owner`. Redirects to `/dashboard` otherwise. The `dashboard/page.tsx` also auto-redirects admins/owners to `/admin` on login.

### Stripe plans (current)
- **3 subscription tiers:** Starter ($49/mo), Growth ($89/mo), ProAgent ($149/mo)
- **Annual option:** 2 months free — $490/yr, $890/yr, $1,490/yr
- All plans: `mode: 'subscription'`
- `profiles.plan` values: `starter`, `growth`, `proagent`
- Stripe API version: `2026-04-22.dahlia` — note: `invoice.subscription` is now `invoice.parent.subscription_details.subscription`

### Stripe client instantiation
Always use `'2026-04-22.dahlia'` as the `apiVersion`. The SDK type system may not recognise this string yet — cast with `as any` to suppress the type error:
```ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' as any })
```
**Never use `'2025-04-30.basil'`** — that was a wrong version introduced by an AI-generated file and causes a build failure.

### AI Toolkit plan gating
- `STARTER_LIMIT = 15` runs/month enforced server-side in `/api/ai/run-prompt`
- Categories locked by tier: `social/email/seo` = Starter+, `ads/brand` = Growth+, `operations` = ProAgent only
- Server-side checks: active plan required → category access → monthly run limit (Starter)
- Client-side: plan banner, usage meter, lock icons, tier filter toggle

### Brand voice in AI Toolkit
- `useBrandVoice` boolean sent with every prompt generation request
- When true: fetches `voice`, `positioning`, `persona` brand documents and injects into Claude system prompt
- Toggle in runner modal — on by default when Brand Kit is complete, disabled when not
- Nudge banner on AI Toolkit page when Brand Kit is incomplete — links to `/dashboard/brand-kit`
- When false: generic marketing copywriter system prompt

### Brand Kit flow
- 6 chapters, 24 questions total — conversational format with typing animation
- Re-enterable: saved answers pre-fill on return, can update and regenerate anytime
- Generates 4 documents in parallel via Claude: Brand Voice Statement, Brand Story, Ideal Client Profile, Brand Positioning Statement
- Each document is inline editable — saves with version history (previous version archived to `brand_document_versions`)
- Regenerating increments version and archives current content before overwriting
- Admin can view brand documents in client detail panel (not yet built)

### Analytics — dual OAuth flows
- **Google Analytics:** OAuth → `ga-callback` stores refresh token + email → user selects property → `profiles.ga_connected = true`
- **Meta:** OAuth → `meta-callback` exchanges code for long-lived token (60 days) → stores ad account ID + IG account ID → `profiles.meta_connected = true`
- Instagram insight scopes (`instagram_basic`, `instagram_manage_insights`) removed from Marketing API app — require separate Instagram Graph API app (Agent7even-IG) and Meta app review before they work

### Lucide icons note
`Instagram` icon does not exist in the installed version of `lucide-react`. Use `Hash` as a substitute. Brand logos use `<img>` via `BrandIcon` component: `/google_analytics_icon.png`, `/instagram-logo.png`, `/MetaLogo.png` — all in `/public`.

### Sign-in / Sign-up pages
Branded split-screen layout: dark left panel with branding + feature list (hidden on mobile), Clerk component on right. `appearance` prop uses `colorPrimary: '#c8522a'`.

---

## What's Fully Built and Live

- [x] Homepage with sign-in/sign-up CTAs + footer
- [x] Clerk auth (production instance, custom domain DNS, Google SSO)
- [x] Clerk webhook → Supabase `profiles` sync
- [x] Welcome email — Resend triggered on `user.created` (`emails/welcome.ts`)
- [x] Conversational onboarding (5 steps, typing animation)
- [x] Dashboard gated behind onboarding
- [x] Dashboard sidebar layout with nav items + Privacy/Terms links
- [x] **Stripe billing** — 3-tier subscription pricing page, monthly/annual toggle, checkout, customer portal, invoice history, upgrade cards
- [x] **Services module** — browse 8 services, request modal, orders tracking, admin email notification
- [x] **AI Toolkit** — plan-gated prompts, variable system, Claude generation, usage meter, brand voice toggle, nudge banner, server-side plan enforcement
- [x] **Brand Kit** — 6-chapter conversational flow, 24 questions, 4 Claude-generated documents (Brand Voice, Brand Story, Ideal Client Profile, Brand Positioning), inline editing, version history, re-enterable, progress saving
- [x] **Brand voice in AI Toolkit** — toggle in every prompt modal, brand context injected into Claude system prompt when enabled
- [x] **Admin panel** — command center, clients table, client detail, order status updater, internal notes
- [x] Admin auto-redirect on login (role = owner/admin → /admin)
- [x] Order delivered → client email via Resend
- [x] **Analytics tab** — GA OAuth flow (connect, property selector, live chart), Meta OAuth flow (ad account + IG account connected), brand logos, disconnect, 7D/30D/90D range toggle
- [x] **Privacy Policy** (`/privacy`) and **Terms of Service** (`/terms`) — public, no auth
- [x] Legal links on sign-in, sign-up, homepage, dashboard sidebar
- [x] **Google OAuth verified and published** — clean consent screen, no unverified warning
- [x] `agent7even.com` verified in Google Search Console
- [x] **Sign-in/sign-up redesigned** — branded split-screen layout, Google SSO

---

## What's NOT Built Yet (Priority Order)

### 1. Deliverables tab — MEDIUM
- Admin uploads files (PDFs, brand guides, images, video) per client — grouped by project
- Client views, previews, and downloads from `/dashboard/deliverables`
- Client can also upload briefs and assets
- Needs Supabase Storage bucket (`deliverables`) — private, signed URLs, 100MB max
- Database table needed: `deliverables` (id, user_id, uploaded_by, project_name, file_name, file_path, file_size, file_type, notes, uploaded_by_role, created_at)

### 2. Support tab — MEDIUM
- Client submits a ticket from `/dashboard/support`
- Admin sees open tickets in `/admin/support`
- `support_tickets` table already exists

### 3. Admin Revenue tab — MEDIUM
- Pull MRR, total revenue, plan breakdown from Stripe
- Show in `/admin/revenue`

### 4. Brand Kit in Admin panel — MEDIUM
- Admin can view client's brand documents in `/admin/clients/[id]`
- Read-only view with option to leave notes

### 5. Settings tab — LOW
- Client can update `company_name`, `website_url`, `instagram_handle`
- At `/dashboard/settings`

### 6. Marketing site auth links — WHEN READY
- Update sign up and log in CTAs on `agent7even.com` → `app.agent7even.com/sign-up` and `/sign-in`
- Changes in `~/agent7even/src/components/` (Nav.tsx, Hero.tsx, CTA.tsx) — simple `href` swaps only

### 7. Go live on Stripe — WHEN READY
- Switch from test keys (`sk_test_`, `pk_test_`) to live keys (`sk_live_`, `pk_live_`)
- Recreate 3 subscription products × monthly + annual = 6 price IDs in Stripe live mode
- Update all Stripe env vars in Vercel

### 8. Brand Kit — Enterprise Offering — FUTURE CONSIDERATION
- The Brand Kit (6-chapter flow + 4 Claude-generated documents) has potential as a standalone enterprise product
- Could be offered as a white-label or premium service for larger clients at a higher price point
- Scope and pricing TBD — revisit after Brand Kit is fully built, tested, and proven with existing clients
- No code changes needed now — purely a business model consideration for a later date

### 9. Meta App Review — WHEN READY
- Complete Tech Provider verification (business + access verification)
- Submit `instagram_manage_insights` for app review with screen recordings
- Requires: platform complete, live clients, Stripe live mode
- Until approved: Instagram follower count shows (via Pages connection), reach/impressions unavailable

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
