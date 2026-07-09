# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development commands

```bash
# Local dev server (serves the static site on :4321)
npm run dev

# Direct static server
python3 -m http.server 8765
```

**Local dev setup:**
```bash
npm run dev                         # serves the static site locally
```
`npm run dev` serves the site locally with the same static assets as GitHub Pages.

## Deploy pipeline

Push to `main` → `.github/workflows/deploy.yml`:
1. `rebuild-manifests.js` — regenerates `public/*/manifest.json` files (all gitignored)
2. `sync-images.js` — downloads Cloudinary images as local fallbacks (non-fatal, 4-min timeout)
3. Uploads artifact to GitHub Pages (Actions-based deployment — NOT branch deploy)

**Critical:** GitHub Pages must be set to **"GitHub Actions"** source (not "Deploy from a branch") in repo Settings → Pages.

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

**Image hosting:** Cloudinary (primary). Local fallbacks in `public/*/images/` downloaded by `sync-images.js` at deploy time.

## Key constraints
