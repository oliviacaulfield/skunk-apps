# PROGRESS.md

State tracker for the fraud triage build. Claude should read this at the start of every session to know where we are. I update it as I go; Claude can suggest updates when a step is completed.

**Current phase:** Day 1 — Foundation, in progress
**Current branch:** `setup/atlas-connection`
**Last session ended:** N/A

---

## Day 1 — Foundation

### Setup
- [x] Atlas account created
- [x] Atlas project created
- [x] Atlas cluster created (free tier M0)
- [x] Database user created
- [x] IP access list configured
- [x] Connection string saved locally (not committed)
- [x] MongoDB for VS Code extension installed
- [x] MongoDB MCP server set up and connected to Claude in VS Code
- [x] MCP server verified — Claude can query my Atlas cluster

### Repo scaffolding
- [x] `fraud-triage/` subdirectory created
- [x] Next.js + TypeScript + Tailwind scaffolded (lives in `fraud-triage/dev/`)
- [x] `.env.local` set up with connection string (in `fraud-triage/dev/`)
- [x] `.gitignore` excludes `.env.local`, `node_modules`, `.next`
- [x] `mongodb` driver package installed
- [x] Shared MongoDB client helper written (one connection, reused)
- [x] First API route successfully connects to Atlas

### Data
- [x] `transactions` collection seeded (75 docs)
- [x] `fraudCases` collection seeded (25 docs)
- [x] `analysts` collection seeded (3 docs)
- [x] Seed script committed and re-runnable (`npm run seed`)

### App screens
- [x] Queue view: lists suspicious transactions
- [x] Queue view: filter by status
- [x] Queue view: filter by risk score bucket
- [x] Queue view: filter by merchant category
- [x] Case detail view: shows transaction details
- [x] Case detail view: shows linked fraud case if present
- [x] Case detail view: analyst notes form (saves to `fraudCases`)
- [x] `searchableText` field populated on `fraudCases`

### Indexes
- [x] Regular index on `transactions.status`
- [x] Regular index on `transactions.riskScore`
- [x] Regular index on `transactions.createdAt`

### End-of-day-1 checkpoint
- [x] Working Atlas-backed app running locally
- [x] Queue and case detail screens both functional
- [x] Notes form persists data
- [ ] Friction log has at least 5 entries (2 so far — add more as Day 2 proceeds)

---

## Day 2 — Vector Search

### Vector Search setup
- [x] Decided which embedding path is being used (Automated Embedding, voyage-4)
- [x] Vector Search index created on `fraudCases` (index: `autoembed_index`)
- [x] Index includes filterable metadata fields (disposition indexed; country/merchantCategory not on fraudCases — disposition filter used instead)
- [x] First successful `$vectorSearch` query run via MCP
- [x] First successful `$vectorSearch` query run from app code

### Similar cases feature
- [x] "Find similar prior fraud cases" button on case detail page
- [x] Similar cases panel renders results
- [x] Results show: similarity score, case summary, disposition, key note snippet
- [x] Metadata pre-filter applied (disposition filter wired to `$vectorSearch` filter param)
- [x] Client-side cache (per case+filter) to stay within 3 RPM free-tier rate limit

### Polish
- [x] Small dashboard page (transaction queue stats + cases opened + fraud by merchant category)
- [x] UI cleaned up to demo-ready
- [ ] README in `fraud-triage/` explains how to run it

### Deliverables
- [x] `FRICTION_LOG.md` filled out with concrete entries throughout build (7 friction entries, 4 wins)
- [x] Top 5 docs gaps written up
- [x] Top 5 "Claude got this wrong" notes written up
- [x] Top 5 "MongoDB tooling really helped here" notes written up
- [x] 1-page build retrospective

### Stretch (only if time)
- [ ] Hybrid search (vector + keyword)
- [ ] Analyst note semantic search (not just case summaries)
- [ ] Feedback loop: mark a suggested similar case as helpful
- [ ] Separate search nodes experiment

---

## Session log

A running list of what we did each session. Append a new entry at the end of each session.

### Session 2 — 2026-05-14
- Branch: `feature/vector-search`
- Did: Vector Search index (autoembed_index, voyage-4) → first $vectorSearch query via MCP → similar cases API + UI panel with disposition filter + client-side cache → dashboard page → README → FRICTION_LOG.md end-of-build summary
- Friction: Automated Embedding rate limit (3 RPM without payment method) hit during testing; $vectorSearch query parameter was `query` not `queryText`; numCandidates too low for pre-filtered small collection
- Next: merge branch, optional Vercel deploy

### Session 1 — 2026-05-13
- Branch: `setup/atlas-connection`
- Did: Atlas cluster + MCP server + VS Code extension + Next.js scaffold in `fraud-triage/dev/` + MongoDB client + seed data (75 tx, 25 cases, 3 analysts) + queue view with filters + case detail page + analyst notes form + 3 transaction indexes
- Stuck on: create-next-app refusing to scaffold into non-empty directory (worked around with `dev/` subdirectory); write permissions for `fraud-triage/dev/` required manual `.env.local` creation
- Next: Day 2 — Vector Search index, similar-cases query, wire to UI
