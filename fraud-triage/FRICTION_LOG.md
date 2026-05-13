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
