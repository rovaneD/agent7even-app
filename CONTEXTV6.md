# CONTEXT.md Versioning Rule

Every time there is a significant shift in concept, architecture, or product direction — create a new version.
Name files sequentially: CONTEXT.md → CONTEXTV2.md → CONTEXTV3.md → CONTEXTV4.md → CONTEXTV5.md etc.
Each version is never edited retroactively — it's a snapshot of where the product stood at that moment.

---

# CONTEXTV6 — Repo Separation + v2 Experimental Project
*Snapshot: May 27, 2026*

## What Changed in This Version
A second repo (`agent7even-v2`) was created as an experimental branch of the platform. Work on the AI Agent Command Center and Maya interface was developed locally in `~/agent7even-v2/` and was accidentally pushed to this production repo (`agent7even-app`). It was reverted cleanly and separated into its own GitHub repo and Vercel project.

## Repo Identity (CRITICAL)
This file lives in the **PRODUCTION** repo.

| | Production | Experimental v2 |
|---|---|---|
| Local | `~/agent7even-app/` | `~/agent7even-v2-clean/` |
| GitHub | `rovaneD/agent7even-app` | `rovaneD/agent7even-v2` |
| Vercel | `app.agent7even.com` | `agent7even-v2.vercel.app` |
| Branch | `main` | `main` |

**Never push v2 work into this repo. Never push production work into the v2 repo.**

## Production State as of May 27, 2026
- Reverted to commit `15c3f01` — last clean production commit before v2 work began
- All CONTEXTV5 features are live and stable
- Maya interface and Agent Command Center do NOT exist in production — they are v2-only

## What v2 Is Building
The experimental v2 project (`agent7even-v2`) is testing:
- **Maya** — AI marketing agent chat interface
- **Agent Command Center** — 9-agent system with task queue, approvals, cron scheduling
- **Agent registry** — competitor_watcher, content_writer, campaign_builder, analytics_reader, trend_spotter, email_sequence_builder, ad_copy_generator, seo_scanner, brand_voice_guardian
- Supabase tables: `agent_tasks`, `agent_outputs`, `agent_schedules`
- Cron: `/api/cron/run-scheduled-agents` fires hourly via Vercel cron

When v2 is validated, migration to production will be a deliberate, planned process — not an automatic push.

## Deployment Safeguards Added
- `AGENTS.md` in both repos now has `## REPO IDENTITY — READ FIRST` at the top
- `CURSOR_RULES.md` added to `~/agent7even-v2-clean/` with pre-push checklist
- `~/agent7even-v2/` (old contaminated folder) should be deleted or ignored

## Everything from CONTEXTV5 Still Applies
All features, tables, Stripe config, Meta config, and conventions documented in CONTEXTV5.md remain current for this production repo.
