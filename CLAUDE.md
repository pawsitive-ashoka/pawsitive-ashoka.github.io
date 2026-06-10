# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development commands

```bash
# Local dev server (replaces credentials from .env.local, serves on :4321)
npm run dev

# Direct static server — no credential injection, no CMS auth
python3 -m http.server 8765

# Deploy Supabase Edge Function
supabase functions deploy cms-proxy --project-ref bktcitnijrjhwfjphhva

# Set Supabase secrets
supabase secrets set GITHUB_TOKEN=... ALLOWED_EMAILS='["..."]' --project-ref bktcitnijrjhwfjphhva
```

**Local dev setup:**
```bash
cp .env.local.example .env.local   # fill in real values
npm run dev                         # writes admin/config.js and js/site-config.js, then serves
```
`npm run dev` must be used (not Python) when testing the CMS admin, as it writes the credential files that `admin/index.html` requires.

## Credentials architecture

All credentials are **never committed**. Two files are generated at runtime:
- `admin/config.js` — CMS credentials (`window.__PAWSITIVE_CONFIG__`)
- `js/site-config.js` — public site Cloudinary config

**Locally:** `npm run dev` (via `scripts/serve.js`) reads `.env.local` and writes both files.  
**In CI:** `.github/scripts/generate-config.js` reads GitHub Actions variables/secrets and writes both files during deploy.  
**Placeholders:** `__BUILD_TS__` in `admin/index.html` is replaced at deploy time with a Unix timestamp for CDN cache-busting.

GitHub Actions variables (`vars.*`): `SUPABASE_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_UPLOAD_PRESET`  
GitHub Actions secrets (`secrets.*`): `SUPABASE_ANON_KEY`

## Deploy pipeline

Push to `main` → `.github/workflows/deploy.yml`:
1. `rebuild-manifests.js` — regenerates `public/*/manifest.json` files (all gitignored)
2. `sync-images.js` — downloads Cloudinary images as local fallbacks (non-fatal, 4-min timeout)
3. `generate-config.js` — writes `admin/config.js`, `js/site-config.js`, stamps `__BUILD_TS__`
4. Uploads artifact to GitHub Pages (Actions-based deployment — NOT branch deploy)

**Critical:** GitHub Pages must be set to **"GitHub Actions"** source (not "Deploy from a branch") in repo Settings → Pages. Branch-based deploy bypasses `generate-config.js` entirely and serves unreplaced placeholders.

## Architecture

**Static site** — vanilla JS, no build step, no framework. Each page is a separate HTML file in `pages/` that loads scripts from `js/`.

**Content data flow:**
- Dog profiles, team members, memorial entries: Markdown files with YAML frontmatter in `public/*/content/*.md`
- Department pages: JSON files in `public/departments/*.json`
- Gallery: images in `public/gallery/`, manifest at `public/gallery/manifest.json` (generated at deploy)
- The JS files (`dogs.js`, `team.js`, etc.) fetch these files at runtime via `fetch()`

**Shared utilities in `js/app.js`** (loaded on every page):
- `parseFrontmatter(raw)` — YAML frontmatter parser used by `dogs.js`, `team.js`, `memoriam.js`
- `esc(s)` — HTML attribute escaper
- `setCardSpan(card)` / `CARD_GRID_ROW_UNIT` — masonry grid row-span calculator

**CMS admin (`/admin/`):**
- `index.html` — loads `config.js`, initialises Supabase, shows login screen, then dynamically loads Decap CMS after auth
- `cms-backend.js` — custom Decap CMS backend (`SupabaseProxyBackend`) — proxies all GitHub API calls through the Supabase Edge Function. Handles both Immutable.js Maps and plain objects for Decap 3.x compatibility via `_col(collection, key)`
- `cms-config.js` — Decap CMS collection definitions and preview templates; reads credentials from `window.__PAWSITIVE_CONFIG__`
- `supabase/functions/cms-proxy/index.ts` — Deno Edge Function: validates Supabase JWT, checks `ALLOWED_EMAILS`, proxies GitHub Contents API using `GITHUB_TOKEN`

**Image hosting:** Cloudinary (primary). Local fallbacks in `public/*/images/` downloaded by `sync-images.js` at deploy time.

## Key constraints

- **`load_config_file: false`** must be set in the Decap CMS config — `admin/config.yml` was deleted; config is passed entirely via JS.
- **`CMS_MANUAL_INIT = true`** is set before Decap loads so it doesn't auto-init before the backend is registered.
- `authComponent()` must return a function component (not `null`) — Decap CMS 3.x registers it even when `restoreUser()` succeeds; returning `null` causes React error #130.
- Decap CMS 3.x passes collections as plain objects, not Immutable.js Maps — always use `this._col(collection, key)` not `collection.get(key)`.
- The `github-pages` environment in the workflow uses `vars.*` for non-secret variables and `secrets.*` for the anon key only.
