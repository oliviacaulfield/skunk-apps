# FRICTION_LOG.md

A running log of friction points, surprises, and wins encountered while building the fraud triage app as a novice developer. The audience is myself first, but this is structured so it could be shared with the MongoDB or Anthropic teams later.

**How to use this file:**
- Add entries as things happen — don't try to remember at the end
- Be specific: link the docs page, paste the error, name the menu item
- One entry per friction moment, even if small
- Tag each entry with a category so it's easy to summarize later
- Wins matter too — log them in the wins section

---

## Categories

- `setup` — Atlas account, cluster, IP allowlist, connection string, env vars
- `docs` — MongoDB documentation: missing, outdated, hard to find, confusing
- `driver` — Node.js driver behavior, error messages, API ergonomics
- `vector-search` — Indexes, `$vectorSearch`, Automated Embedding, filtering, query shape
- `vscode-extension` — MongoDB for VS Code extension
- `mcp` — MongoDB MCP server setup and behavior
- `claude` — Claude in VS Code: wrong code, hallucinated APIs, good catches, useful explanations
- `concept` — A MongoDB concept that took longer than expected to click

---

## Entry template

Copy this block when adding a new entry.

```
### [short title]
- **Category:** 
- **When:** Day _, [morning/midday/afternoon], during [task]
- **What happened:**
- **What I expected:**
- **What I tried:**
- **How I unstuck (or didn't):**
- **Time lost (rough):**
- **Suggested fix / what would have helped:**
```

---

## Friction entries

<!-- Add new entries below this line, newest at the top -->

### "START FREE" Automated Embedding has a 3 RPM rate limit with no payment method — not disclosed upfront
- **Category:** `vector-search`
- **When:** Day 2, morning, during similar-cases UI testing
- **What happened:** After 3-4 `$vectorSearch` queries with Automated Embedding, all subsequent queries returned HTTP 500. Server log: `EmbeddingProviderRateLimitException: Rate limit exceeded (HTTP 429)`. Root cause: without a payment method on file, Voyage AI rate limit is **3 requests per minute**. Switching the disposition filter twice and clicking the button once was enough to hit it.
- **What I expected:** "START FREE" to mean "free quota, full functionality." The billing warning mentioned billing but not rate limits. There was no indication during index setup that basic testing would be throttled.
- **What I tried:** Surfaced the 429 as a meaningful error in the UI; added client-side caching so the same case+filter combo doesn't re-fetch. This reduces unnecessary hits but doesn't fix the limit itself.
- **How I unstuck (or didn't):** Adding a payment method in Atlas unlocks standard rate limits; the 200M free token quota still applies. Still blocked until payment method is added.
- **Time lost (rough):** ~20 minutes debugging (the 500 surfaced as "No similar cases found" before error handling was improved)
- **Suggested fix / what would have helped:** The Atlas Vector Search index creation screen should display the rate limit tier table (3 RPM / 10K TPM without payment method) next to the billing checkbox. Developers will immediately test their feature after creating it — hitting a wall at 3 requests is a jarring first impression.

---

### $vectorSearch pre-filter + low numCandidates returns 0 results on small collections
- **Category:** `vector-search`
- **When:** Day 2, morning, during disposition pre-filter testing
- **What happened:** Adding a `filter: { disposition: { $eq: 'confirmed_fraud' } }` to `$vectorSearch` with `numCandidates: 15` returned 0 results on a collection of 25 documents, even though matching documents exist.
- **What I expected:** Pre-filter would narrow the candidate pool and the ANN search would return the top matches from that pool.
- **What I tried:** Increased `numCandidates` to 50 (2x the collection size) and `limit` to 10. Results appeared correctly.
- **How I unstuck (or didn't):** numCandidates must exceed the number of filtered documents to give the HNSW index enough room to find neighbors. On a small collection, set numCandidates >> collection size.
- **Time lost (rough):** ~10 minutes
- **Suggested fix / what would have helped:** MongoDB docs should call out that numCandidates interacts with pre-filter cardinality — on small filtered sets, low numCandidates silently returns 0 results rather than an error.

---

### Vector Search similarity scores cluster tightly — "% match" framing is misleading
- **Category:** `vector-search`
- **When:** Day 2, morning, during first UI test of similar cases panel
- **What happened:** All 5 similar cases showed scores between 0.5054 and 0.5057. Displaying these as "50.6% match" makes results look low-quality when they're actually well-ranked.
- **What I expected:** Scores that spread across a wider range so users can intuitively judge relevance from the number.
- **What I tried:** Changed display from "50.6% match" to raw cosine score (0.5057). Still narrow, but doesn't carry the implication of a school grade.
- **How I unstuck (or didn't):** The ranking order IS meaningful even when absolute scores cluster. Fixed the display framing; can't change the underlying math.
- **Time lost (rough):** ~5 minutes discussing + fixing display
- **Suggested fix / what would have helped:** Atlas docs or the Vector Search result UI should explain that cosine similarity scores from domain-specific corpora will cluster (all documents share vocabulary), and that rank order — not absolute score — is the signal to use.

---

### $vectorSearch query parameter is `query`, not `queryText`
- **Category:** `claude`
- **When:** Day 2, morning, during first $vectorSearch test
- **What happened:** I used `queryText` as the parameter name for passing a text string to `$vectorSearch` with Automated Embedding. The query failed with: "Exactly one and only one of query and queryVector can be present."
- **What I expected:** Either `queryText` (descriptive) or some other named field for the Automated Embedding text input.
- **What I tried:** Changed to `query` — worked immediately.
- **How I unstuck (or didn't):** Error message was clear enough to point directly at the fix.
- **Time lost (rough):** < 1 minute
- **Suggested fix / what would have helped:** The Atlas docs or index configuration screen should show an example `$vectorSearch` query with the correct parameter names for Automated Embedding specifically.

---

### Automated Embedding billing warning feels alarming for a free-tier feature
- **Category:** `vector-search`
- **When:** Day 2, morning, during Vector Search index creation
- **What happened:** After selecting "Automated Embedding (START FREE)", the UI shows a billing warning: "I understand that token usage will be billed to my account even if no payment method is on file. If the balance is not paid, my organization may be suspended." This appears before you can proceed.
- **What I expected:** A "START FREE" badge to mean the feature has a meaningful free tier with no scary warning, or at minimum a note explaining what the free tier covers and approximately how much 25 documents would cost.
- **What I tried:** Proceeded anyway — 25 documents with ~150-word searchableText fields is negligible token usage.
- **How I unstuck (or didn't):** Accepted the warning and continued. Not a blocker, but would make a novice hesitate.
- **Time lost (rough):** ~2 minutes of uncertainty
- **Suggested fix / what would have helped:** Show estimated cost for the current collection size next to the warning. Even "Est. cost for this collection: < $0.01" would eliminate the anxiety.

---

### Atlas wizard triggers npm install before project exists
- **Category:** `setup`
- **When:** Day 1, morning, during Atlas connection string setup
- **What happened:** After creating the cluster, the Atlas "Connect" wizard showed Node.js driver setup instructions and prompted me to run `npm install mongodb` — before any app framework was scaffolded.
- **What I expected:** Driver installation instructions to appear in context of an existing project, or at least a note that this step should wait until there's a package.json to install into.
- **What I tried:** Followed the Atlas instructions literally, running `npm install mongodb` in the app subdirectory.
- **How I unstuck (or didn't):** Not a blocker, but required a note to handle the premature package.json when scaffolding Next.js later.
- **Time lost (rough):** ~1 minute of confusion
- **Suggested fix / what would have helped:** Atlas wizard should either defer the install step or note "run this after initializing your project."

---

### Atlas onboarding order: IP allowlist before database user
- **Category:** `setup`
- **When:** Day 1, morning, during Atlas cluster setup
- **What happened:** The Atlas onboarding flow prompted me to add my IP to the access list before I had created a database user. This was the opposite of the order described in the setup walkthrough.
- **What I expected:** Create database user first, then configure IP access — matching the logical dependency (user must exist before you can test a connection).
- **What I tried:** Followed the UI flow as presented.
- **How I unstuck (or didn't):** Proceeded in the order Atlas presented; setup succeeded.
- **Time lost (rough):** ~2 minutes of confusion
- **Suggested fix / what would have helped:** Atlas onboarding should either match the documented order or make clear that order doesn't matter functionally.

---

## Wins

Things that worked better than expected. Same format, lighter touch.

```
### [short title]
- **Category:**
- **When:**
- **What happened:**
- **Why it helped:**
```

<!-- Add wins below this line -->

### MCP server let Claude query Atlas mid-conversation
- **Category:** `mcp`
- **When:** Day 2, morning, before writing any app code
- **What happened:** Used the MongoDB MCP server to run `$vectorSearch` directly from the conversation — verified the query syntax and checked that results were semantically correct before touching the Next.js codebase.
- **Why it helped:** Caught the `queryText` → `query` parameter mistake at the shell level rather than inside a React component. One iteration cycle instead of three.

### Automated Embedding — no external API key needed
- **Category:** `vector-search`
- **When:** Day 2, morning, during Vector Search index setup
- **What happened:** Atlas offered built-in Voyage AI models (voyage-4) with no external API key required. Expected to need an OpenAI key and a separate embedding pipeline.
- **Why it helped:** Removed an entire setup step and billing relationship. Index creation to first working query took under 10 minutes.

### Atlas Vector Search Visual Editor made index config approachable
- **Category:** `vector-search`
- **When:** Day 2, morning, during index creation
- **What happened:** The Visual Editor walked through field selection, model choice, and filter fields with dropdowns rather than requiring raw JSON. Never needed to look up the index definition schema.
- **Why it helped:** As a novice, writing a valid vector index JSON definition from scratch would have required a docs detour. The UI eliminated that entirely.

### MongoDB aggregation pipeline for dashboard was readable on first try
- **Category:** `driver`
- **When:** Day 2, afternoon, during dashboard build
- **What happened:** `$lookup` + `$unwind` + `$group` + `$sort` to get fraud cases by merchant category worked correctly on the first attempt.
- **Why it helped:** The pipeline stage model is intuitive to read and debug — each stage is one transformation. No ORM translation layer to reason about.

---

## End-of-build summary

Filled in at the end of day 2.

### Top 5 docs gaps

1. **$vectorSearch Automated Embedding query syntax** — no example in the docs shows the correct parameter name (`query`) for passing a text string when using Automated Embedding. `queryVector` is well-documented for manual embeddings; the text input equivalent is not.

2. **numCandidates + pre-filter interaction** — the docs don't explain that `numCandidates` must be set relative to the filtered candidate pool, not the full collection. On small or heavily filtered collections, a low `numCandidates` silently returns 0 results with no error.

3. **Voyage AI rate limits on the free tier** — the 3 RPM / 10K TPM limit for accounts without a payment method is not shown during index creation. The billing checkbox says "you may be charged" but doesn't say "you will be rate-limited to 3 requests per minute during development."

4. **Atlas setup order inconsistency** — the Atlas onboarding UI presents IP allowlist before database user creation, while the written setup guide describes the opposite order. Neither explains that the order doesn't matter functionally.

5. **How to construct searchableText for good semantic search** — there's no guidance on what to put in the field you're embedding. Should it be short or long? Structured or prose? Tags or sentences? This affects result quality significantly and is left entirely to the developer.

---

### Top 5 "Claude got this wrong"

1. **`queryText` instead of `query`** — used the wrong parameter name for the Automated Embedding text input in `$vectorSearch`. Error message from MongoDB was clear enough to self-correct in under a minute, but it shouldn't have been a guess.

2. **`numCandidates: 15` on a filtered small collection** — set a low value that caused the pre-filtered vector search to return 0 results. Needed to be set higher than the collection size.

3. **AbortController pattern introduced a re-click bug** — adding AbortController to prevent stale fetch results introduced a new bug where clicking the button a second time (after results loaded) showed empty results. The simpler version-counter pattern was correct; AbortController had edge cases in this specific React flow.

4. **Cosine similarity displayed as "% match"** — framed the raw cosine score as a percentage, which implies a 0–100 grading scale. `0.506` looks like a failing grade when it's actually a meaningful similarity signal. Should have used raw score or rank labels from the start.

5. **"Analyst-worked" UI label** — used internal jargon in a UI label that an actual user would see. Required two rounds of feedback to land on "Transactions reviewed by an analyst."

---

### Top 5 "MongoDB tooling really helped"

1. **MongoDB MCP server** — running `$vectorSearch` aggregations directly from the conversation before writing any app code caught the query syntax mistake early and confirmed semantic results were correct. This is the single most valuable tool in the workflow.

2. **Atlas Vector Search Visual Editor** — index creation without needing to know the raw JSON schema. Dropdowns for model selection and filter fields made a complex configuration approachable on first try.

3. **Automated Embedding with voyage-4** — no external API key, no separate embedding pipeline, no dimension math. Atlas handles generation at both index and query time.

4. **MongoDB aggregation pipeline** — `$lookup` + `$group` + `$sort` for the dashboard stats worked correctly first try and was readable without reference docs. The stage-by-stage mental model is easier to debug than a query builder or ORM.

5. **MongoDB for VS Code extension** — used throughout Day 1 to verify seed data visually. Browsing collections and documents in the sidebar is faster than writing find queries during development.

---

### One-paragraph retrospective

Going from zero to a working Vector Search app in 2 days was genuinely achievable — the core Atlas setup, data seeding, and UI took most of Day 1, and Vector Search was wired end-to-end by mid-Day 2. The technology itself was not the obstacle. Friction concentrated in two places: the billing and rate-limit communication around Automated Embedding, and gaps in the docs around `$vectorSearch` query syntax for the Automated Embedding path specifically. Both of these hit in the first 30 minutes of Day 2 and cost more time than any actual coding. A new MongoDB customer should find two things faster: (1) a worked example showing the exact `$vectorSearch` aggregation stage for Automated Embedding with `query:` instead of `queryVector:`, and (2) a clear rate limit disclosure during index setup so that hitting a 429 on the 4th test request doesn't feel like something broke.
