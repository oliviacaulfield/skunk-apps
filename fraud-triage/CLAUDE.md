# CLAUDE.md

Persistent project brief for Claude in VS Code. Read this at the start of every session before suggesting anything.

## What this project is

A 2-day learning build: a small **fraud triage web app** backed by MongoDB Atlas, with semantic similar-case lookup powered by MongoDB Vector Search.

The real deliverable is not the app. It is the **friction log** (`FRICTION_LOG.md`) documenting how a novice developer experiences MongoDB's docs, tooling, and developer experience from zero to working app.

This project lives in the `fraud-triage/` subdirectory of the `skunk-apps` repo.

## Who I am (the user)

- Novice developer
- Limited MongoDB knowledge — assume nothing
- Can read code and learn fast, but needs concepts broken down incrementally the first time they appear
- Solo contributor on this repo

## How to help me

**One step at a time.** Do not give me 5 steps at once. Give me one step, let me confirm it worked, then move to the next. This is non-negotiable.

**Explain concepts before code.** When a new MongoDB concept appears (aggregation pipeline, `$vectorSearch`, indexes, etc.) explain it in 2-3 sentences before writing code that uses it.

**Be explicit about where work happens.** For every step, say whether I should be in:
- The Atlas UI (browser)
- The terminal
- A code file (which one)
- The MongoDB VS Code extension

**Stop and test.** After any meaningful change, tell me explicitly to stop, run it, and confirm before continuing.

**Don't guess about current Atlas UI or feature availability.** Atlas UI flows and feature names change. If you're not sure something is current, tell me to check the official docs at https://www.mongodb.com/docs/ rather than inventing menu paths.

**Prefer MongoDB-native patterns.** Aggregation pipelines, document model thinking, native driver methods. Do not suggest SQL-like workarounds or ORMs unless I ask.

**No Mongoose.** Use the official MongoDB Node.js driver directly.

**Help me maintain the friction log.** When something is confusing, surprising, or a clear win, prompt me to capture it in `FRICTION_LOG.md`. When I report something as friction, help me write a clear entry.

## Tech stack (locked in)

- **Frontend + API**: Next.js (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB Atlas (free tier M0 is fine)
- **DB access**: MongoDB Node.js driver (`mongodb` package), no ORM
- **Vector Search**: MongoDB Atlas Vector Search
  - Try **Automated Embedding first**
  - Fall back to manual embeddings only if Automated Embedding is unavailable or blocking
  - I don't have an embedding-provider API key yet; we'll get one only if we need the fallback
- **AI tooling**: Claude in VS Code, MongoDB MCP server (set up day 1 so Claude can query Atlas directly), MongoDB for VS Code extension
- **Auth**: none for now, fake analyst identity
- **Deployment**: local only, optional Vercel at the end

## Git workflow

- Solo developer, but **use feature branches**, do not commit directly to `main`
- Suggest a branch name when starting a new chunk of work, e.g.:
  - `setup/atlas-connection`
  - `feature/queue-view`
  - `feature/case-detail`
  - `feature/vector-search-index`
  - `feature/similar-cases-panel`
- Conventional commit messages (`feat:`, `fix:`, `docs:`, `chore:`)
- Suggest when it's a good moment to commit and push
- Suggest when it's a good moment to merge a branch back to `main`

## Build phases (high level)

**Day 1 — Foundation**
1. Atlas account + cluster + database user + IP access
2. MongoDB MCP server + VS Code extension installed and connected
3. Next.js + TypeScript + Tailwind scaffolded in `fraud-triage/`
4. First successful DB connection from a Next.js API route
5. Seed data: ~50-100 transactions, ~20-30 prior fraud cases
6. Queue view (filterable list of transactions)
7. Case detail view with analyst notes form

**Day 2 — Vector Search**
1. Prepare combined searchable text field on `fraudCases`
2. Create Atlas Vector Search index (try Automated Embedding first)
3. Wire "Find similar prior fraud cases" button on case detail page
4. Add metadata filters (e.g., country, merchantCategory)
5. Polish UI to demo-ready
6. Complete friction log writeup

Current phase is tracked in `PROGRESS.md`. Read it at the start of every session.

## Data model

### `transactions`
`amount, merchant, merchantCategory, cardPresent, country, timestamp, riskScore, anomalyReasons, status`

### `fraudCases`
`transactionId, caseSummary, analystNotes, disposition, tags, createdAt, embedding, searchableText`

The `searchableText` field will be the input to Vector Search. The `embedding` field is only populated if we fall back from Automated Embedding.

### `analysts`
`name, team, role`

## Things that will earn extra friction-log credit

- Confusing Atlas UI flows
- Docs that send me in circles
- Moments where Claude generates wrong or stale MongoDB code
- Vector Search behavior that surprises me (index requirements, query shape, ANN vs ENN, the `$vectorSearch` must-be-first-stage rule)
- Anything where I have to leave the docs to figure something out

## What "done" looks like after 2 days

- Working local app: queue → case detail → similar prior cases
- Atlas cluster with seeded data
- One Vector Search index returning useful results
- Filled-out `FRICTION_LOG.md` with concrete entries
- Top 5 docs gaps, top 5 "Claude got this wrong" notes, top 5 tooling wins

## How to behave when I push back

If I say something feels wrong or confusing, do not double down. Stop, ask what I'm seeing, help me decide whether it's a real issue worth logging or a misunderstanding worth clearing up.

If I report a Claude mistake, log it neutrally. Do not over-apologize. Just fix and move on.
