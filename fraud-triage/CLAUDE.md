# CLAUDE.md

Persistent project brief for Claude in VS Code. Read this and `PROGRESS.md` at the start of every session before acting.

## What this project is

A 2-day learning build: a small **fraud triage web app** backed by MongoDB Atlas, with semantic similar-case lookup powered by MongoDB Vector Search.

The real deliverable is not the app — it's the **friction log** (`FRICTION_LOG.md`) documenting how a developer experiences MongoDB's docs, tooling, and DX while building something real with AI assistance.

This project lives in the `fraud-triage/` subdirectory of the `skunk-apps` repo.

## Who I am

- Developer comfortable working with AI tools
- Limited MongoDB experience — don't assume prior knowledge of Atlas, Vector Search, or aggregation pipelines
- Solo contributor

## How to work with me: checkpoint mode

Work in **checkpoints**, not single steps. A checkpoint is a self-contained unit of progress that ends at a natural verification point.

Examples of good checkpoints:
- "Atlas cluster created, connection string in `.env.local`, verified with a ping"
- "Next.js + TypeScript + Tailwind scaffolded with one working API route that reads from Atlas"
- "Both collections seeded with realistic data, verified via VS Code extension"
- "Queue view rendering transactions with filters working"

At the start of each checkpoint:
1. State the goal in one sentence
2. Briefly outline what you'll do (3-5 bullets, not a wall of text)
3. Start working — don't wait for approval on the plan

At the end of each checkpoint:
1. Tell me what you did in 3-5 bullets
2. Update `PROGRESS.md`
3. Tell me how to verify it worked
4. Suggest a commit message and whether to merge the branch or keep going
5. Continue to the next checkpoint unless a stop condition is hit

## When to stop and wait for me

Only stop when one of these is true:

- You need credentials, an API key, or me to do something in a browser (Atlas UI, Vercel, etc.)
- A command failed and the cause isn't clear from output
- You're about to make an architectural decision that's expensive to reverse (data model shape, embedding provider, auth strategy)
- You're about to install a new dependency or run a destructive command for the first time in this session
- You're about to modify `CLAUDE.md` or `FRICTION_LOG.md` structurally (appending friction entries is fine)
- Something surprised you, looked stale in your training data, or felt like friction — pause and flag it

Don't stop for routine "did that work?" check-ins. Assume things worked unless they didn't, and I'll tell you if I see something off.

## Friction log behavior

The friction log is the actual deliverable. Help me maintain it actively:

- When you hit something that confused you, was outdated, or required guessing — draft a `FRICTION_LOG.md` entry and append it
- When you reach for a doc that didn't help or sent you in circles — log it
- When the MongoDB VS Code extension or MCP server did something useful, log it as a win
- When you generated MongoDB code that turned out to be wrong, log it under `claude` category
- Don't ask permission to log — just draft the entry and append it, then mention it briefly in your checkpoint summary

I'll also be logging things from my side. If I report friction, help me write a clean entry.

## Tech stack (locked in)

- **Frontend + API**: Next.js (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB Atlas (free tier M0)
- **DB access**: Official MongoDB Node.js driver (`mongodb` package), no ORM, no Mongoose
- **Vector Search**: MongoDB Atlas Vector Search
  - Try **Automated Embedding first**
  - Fall back to manual embeddings only if blocked
  - I don't have an embedding-provider API key yet — only get one if we need the fallback
- **AI tooling**: Claude in VS Code + MongoDB MCP server + MongoDB for VS Code extension
- **Auth**: none, fake analyst identity is fine
- **Deployment**: local only, optional Vercel at end

## Conventions

- **Env vars**: `MONGODB_URI` for connection string, `MONGODB_DB_NAME` for database name. Stay consistent across sessions.
- **MongoDB client**: one shared client instance, reused across API routes (don't open new connections per request)
- **Git**: feature branches, no direct commits to `main`. Conventional commit messages (`feat:`, `fix:`, `docs:`, `chore:`). Suggest commits at natural breakpoints, suggest merges when a feature is complete.
- **Branch names**: `setup/...`, `feature/...`, `fix/...`
- **File location**: app code lives in `fraud-triage/`. The three `.md` files stay at repo root.

## Data model

### `transactions`
`amount, merchant, merchantCategory, cardPresent, country, timestamp, riskScore, anomalyReasons, status`

### `fraudCases`
`transactionId, caseSummary, analystNotes, disposition, tags, createdAt, embedding, searchableText`

`searchableText` is the input to Vector Search. `embedding` only matters if we fall back from Automated Embedding.

### `analysts`
`name, team, role`

## Things to flag as you go

Specifically watch for and log:
- Atlas UI flows that don't match your training data
- MongoDB MCP server setup steps that look stale
- Docs pages that send you in circles or are missing key info
- Vector Search index quirks (filterable field requirements, `$vectorSearch` must be first stage, ANN vs ENN, embedding dimension mismatches)
- Anything where you had to guess instead of read a doc

## Build phases

**Day 1** — Atlas setup → MCP server + VS Code extension → Next.js scaffold → DB connection → seed data → queue view → case detail view

**Day 2** — `searchableText` field → Vector Search index → similar-cases query → wire to UI → metadata filters → polish → write-up

Current phase tracked in `PROGRESS.md`.

## How to behave when I push back

If I say something feels wrong or off, don't double down. Stop, ask what I'm seeing, and decide whether it's a real issue worth logging or a misunderstanding worth clearing up.

If I report a mistake you made, log it neutrally under the `claude` category in `FRICTION_LOG.md`, fix it, move on. No over-apologizing.