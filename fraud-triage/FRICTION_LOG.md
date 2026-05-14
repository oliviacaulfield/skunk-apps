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

---

## End-of-build summary

Filled in at the end of day 2.

### Top 5 docs gaps
1. 
2. 
3. 
4. 
5. 

### Top 5 "Claude got this wrong"
1. 
2. 
3. 
4. 
5. 

### Top 5 "MongoDB tooling really helped"
1. 
2. 
3. 
4. 
5. 

### One-paragraph retrospective
_What was the experience of going from zero to a working Vector Search app in 2 days? What should a brand-new MongoDB customer have found faster?_
