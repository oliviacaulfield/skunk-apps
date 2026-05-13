# skunk-apps

A collection of small apps built to explore MongoDB Atlas features and developer experience.

---

## fraud-triage

A fraud analyst triage tool built in 2 days as a learning project. The real deliverable is [`fraud-triage/FRICTION_LOG.md`](fraud-triage/FRICTION_LOG.md) — a structured log of the developer experience building a real app with MongoDB Atlas from scratch, using AI assistance.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS · MongoDB Atlas · MongoDB Node.js driver

**Features:**
- Transaction queue with filters (status, risk level, merchant category)
- Case detail view with analyst notes form
- Atlas Vector Search for similar prior fraud cases *(Day 2)*

**App lives in:** `fraud-triage/dev/`

### Running locally

```bash
cd fraud-triage/dev
npm install
# add .env.local with MONGODB_URI and MONGODB_DB_NAME
npm run dev
```

To reseed the database:

```bash
npm run seed
```
