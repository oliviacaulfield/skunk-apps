# Fraud Triage

A small internal tool for reviewing flagged transactions and managing fraud cases. Built in 2 days as a learning project to document the MongoDB Atlas developer experience from zero to a working Vector Search app.

## What it does

- **Transaction queue** — lists flagged transactions with filters by status, risk level, and merchant category
- **Case detail** — shows transaction details, linked fraud case summary, and an analyst notes form
- **Similar cases** — semantic search powered by MongoDB Atlas Vector Search; finds prior fraud cases similar to the one you're reviewing
- **Dashboard** — summary of queue volume and case outcomes

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- MongoDB Atlas (free tier M0)
- MongoDB Node.js driver — no ORM
- Atlas Vector Search with Automated Embedding (voyage-4)

## Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster with the `fraud-triage` database seeded (see below)
- A `.env.local` file in `dev/` with your connection string

## Setup

**1. Clone and install**

```bash
cd fraud-triage/dev
npm install
```

**2. Create `.env.local` in `fraud-triage/dev/`**

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=<appName>
MONGODB_DB_NAME=fraud-triage
```

**3. Seed the database**

```bash
npm run seed
```

This creates `transactions` (75 docs), `fraudCases` (25 docs), and `analysts` (3 docs).

**4. Create the Vector Search index**

In Atlas UI → your cluster → Atlas Search → Create Search Index:
- Type: **Vector Search**
- Method: **Automated Embedding**
- Collection: `fraud-triage.fraudCases`
- AutoEmbed field: `searchableText`
- Model: `voyage-4`
- Filter fields: `disposition`, `merchantCategory`, `country`, `status`
- Index name: `autoembed_index`

Wait for the index status to show **Active** before using the similar cases feature.

> **Note:** Without a payment method on file in Atlas, the Voyage AI embedding model is rate-limited to 3 requests per minute. The app handles this gracefully but you'll see a rate-limit warning if you switch filters quickly.

**5. Run the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
fraud-triage/
├── dev/                        # Next.js app
│   ├── app/
│   │   ├── page.tsx            # Transaction queue
│   │   ├── dashboard/          # Dashboard page
│   │   ├── transactions/[id]/  # Case detail page
│   │   └── api/
│   │       ├── transactions/   # Queue + detail endpoints
│   │       ├── cases/          # Save analyst notes; similar cases search
│   │       └── dashboard/      # Dashboard stats
│   └── lib/mongodb.ts          # Shared MongoDB client
├── CLAUDE.md                   # Project brief for Claude
├── PROGRESS.md                 # Build checklist
├── FRICTION_LOG.md             # DX friction log (the real deliverable)
└── README.md                   # This file
```
