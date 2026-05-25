<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:agent7even-product-rules -->
# Agent7even — Product & Workspace Rules

## Two related projects
- `~/agent7even/` — marketing site (agent7even.com)
- `~/agent7even-app/` — client portal SaaS app (app.agent7even.com) — **this project**

## Ground rules
1. Never revert changes without being told to. If unsure whether a change was intentional, ask before reverting.
2. Always check both projects before making changes. Pricing, CTAs, auth links, and the chatbot system prompt all have counterparts in both codebases.
3. Before any significant change, remind the user to commit what's working. After completing a feature, remind them to commit again.
4. Source of truth: instructions in chat > code in agent7even-app/ > code in agent7even/

## Current product direction (do not revert)
Agent7even is a SaaS subscription platform — not a one-time project agency.

**3 subscription tiers:**
- Starter — $49/mo ($490/yr)
- Growth — $89/mo ($890/yr) — most popular
- ProAgent — $149/mo ($1,490/yr)

**Trial:** 7-day free trial — card collected upfront, no charge for 7 days. Messaging: "7-day free trial — cancel anytime before being charged."

**All CTAs** point to https://app.agent7even.com/sign-up or https://app.agent7even.com/pricing. No "Book a free call" as primary CTA.

**Add-on services** are available inside the platform. No prices shown on marketing site.

## This app (agent7even-app/) — stable, do not touch unless asked
Changes are made deliberately and committed before moving on.

## Deployment rules — READ BEFORE ANY DEPLOY

**How production works:**
- `app.agent7even.com` is served by the Vercel project `agent7even-app`
- Vercel auto-deploys from GitHub on every push to `main`
- GitHub's auto-deploy ALWAYS wins the production alias — it will overwrite anything deployed via `vercel --prod` CLI if a new push arrives after

**Never do this:**
- Run `vercel --prod` with uncommitted local changes. Vercel would deploy the correct local state, but the next GitHub push would revert production to the last committed state.
- Push to `main` without first committing all in-progress changes.

**Always do this:**
1. Finish a feature
2. `git add -A && git commit -m "..."` — commit everything
3. `git push` — GitHub auto-deploy takes it from here
4. Only run `vercel --prod` if the GitHub integration is broken AND all local changes are committed

**Safeguards in place:**
- `.git/hooks/pre-push` — blocks the push if there are uncommitted changes
- `.github/workflows/ci.yml` — runs TypeScript check + build on every push to main
<!-- END:agent7even-product-rules -->
