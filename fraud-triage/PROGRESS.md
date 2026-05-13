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
- [ ] Shared MongoDB client helper written (one connection, reused)
- [ ] First API route successfully connects to Atlas

### Data
- [ ] `transactions` collection seeded (~50-100 docs)
- [ ] `fraudCases` collection seeded (~20-30 docs)
- [ ] `analysts` collection seeded (a handful)
- [ ] Seed script committed and re-runnable

### App screens
- [ ] Queue view: lists suspicious transactions
- [ ] Queue view: filter by status
- [ ] Queue view: filter by risk score bucket
- [ ] Queue view: filter by merchant category
- [ ] Case detail view: shows transaction details
- [ ] Case detail view: shows linked fraud case if present
- [ ] Case detail view: analyst notes form (saves to `fraudCases`)
- [ ] `searchableText` field populated on `fraudCases`

### Indexes
- [ ] Regular index on `transactions.status`
- [ ] Regular index on `transactions.riskScore`
- [ ] Regular index on `transactions.createdAt`

### End-of-day-1 checkpoint
- [ ] Working Atlas-backed app running locally
- [ ] Queue and case detail screens both functional
- [ ] Notes form persists data
- [ ] Friction log has at least 5 entries

---

## Day 2 — Vector Search

### Vector Search setup
- [ ] Decided which embedding path is being used (Automated vs manual)
- [ ] Vector Search index created on `fraudCases`
- [ ] Index includes filterable metadata fields (country, merchantCategory, disposition, status)
- [ ] First successful `$vectorSearch` query run from VS Code extension or shell
- [ ] First successful `$vectorSearch` query run from app code

### Similar cases feature
- [ ] "Find similar prior fraud cases" button on case detail page
- [ ] Similar cases panel renders results
- [ ] Results show: similarity score, case summary, disposition, key note snippet
- [ ] Metadata pre-filter applied (e.g., same country or same merchant category)

### Polish
- [ ] Small dashboard page (open cases, fraud cases by merchant category, avg risk score)
- [ ] UI cleaned up to demo-ready
- [ ] README in `fraud-triage/` explains how to run it

### Deliverables
- [ ] `FRICTION_LOG.md` filled out with concrete entries throughout build
- [ ] Top 5 docs gaps written up
- [ ] Top 5 "Claude got this wrong" notes written up
- [ ] Top 5 "MongoDB tooling really helped here" notes written up
- [ ] 1-page build retrospective

### Stretch (only if time)
- [ ] Hybrid search (vector + keyword)
- [ ] Analyst note semantic search (not just case summaries)
- [ ] Feedback loop: mark a suggested similar case as helpful
- [ ] Separate search nodes experiment

---

## Session log

A running list of what we did each session. Append a new entry at the end of each session.

### Session 1 — [date]
- Started: [time]
- Branch: 
- Did:
- Stuck on:
- Next:
