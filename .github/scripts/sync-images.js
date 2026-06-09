#!/usr/bin/env node
/**
 * sync-images.js
 *
 * Scans all content files (markdown + JSON) for Cloudinary image URLs,
 * extracts the embedded local path, and downloads any missing copies
 * to the repo so they serve as fallbacks when Cloudinary is unavailable.
 *
 * This mirrors the logic in app.js _cldImgError():
 *   Cloudinary URL contains /public/...  → local path is /public/...
 *
 * Run locally:  node .github/scripts/sync-images.js
 * Run in CI:    wired into .github/workflows/deploy.yml
 */

const fs   = require('fs');
const path = require('path');

/* ── Config ──────────────────────────────────────────────────────────── */

const CONTENT_DIRS = [
  'public/dogs/content',
  'public/dogs/memoriam',
  'public/memorial/content',
  'public/team/core/content',
  'public/team/leadership/content',
];

const JSON_FILES = [
  'public/departments/events.json',
  'public/departments/finance.json',
  'public/departments/ground.json',
  'public/departments/social.json',
];

const DOWNLOAD_TIMEOUT_MS = 30_000;   // 30 s per file — stalls won't hang CI

/* ── Regex helpers ───────────────────────────────────────────────────── */

// Match any Cloudinary image/video URL
const CLD_RE  = /https:\/\/res\.cloudinary\.com\/[^\s"'<>]+/g;
// Extract the /public/... portion (same logic as _cldImgError in app.js)
const PATH_RE = /\/public\/[^\s"'<>?#]+/;

function localPath(url) {
  const m = url.match(PATH_RE);
  if (!m) return null;
  return m[0].replace(/^\//, ''); // strip leading slash → relative path
}

/**
 * Strip Cloudinary transformation parameters from a URL so we download
 * the original file rather than a transformed version.
 *
 * Input:  https://res.cloudinary.com/xxx/image/upload/f_auto,q_auto/public/dogs/images/foo.jpg
 * Output: https://res.cloudinary.com/xxx/image/upload/public/dogs/images/foo.jpg
 */
function rawUrl(url) {
  return url.replace(
    /\/(image|video|raw)\/upload\/[^/]+\/(public\/)/,
    '/$1/upload/$2'
  );
}

/* ── Download ─────────────────────────────────────────────────────────── */

/**
 * Download a single URL to dest with a hard timeout.
 * Uses the global fetch available in Node 18+.
 */
async function download(url, dest) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const buf = await res.arrayBuffer();
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, Buffer.from(buf));
  } finally {
    clearTimeout(timer);
  }
}

/* ── Main ─────────────────────────────────────────────────────────────── */

async function main() {
  // Collect all files to scan
  const files = [...JSON_FILES.filter(f => fs.existsSync(f))];

  for (const dir of CONTENT_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.md') || f.endsWith('.json')) {
        files.push(path.join(dir, f));
      }
    }
  }

  // Extract all unique Cloudinary URLs across all files
  const seen = new Set();
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const url of text.match(CLD_RE) || []) {
      seen.add(url);
    }
  }

  console.log(`Found ${seen.size} unique Cloudinary URLs across ${files.length} files\n`);

  let downloaded = 0;
  let skipped    = 0;
  let failed     = 0;

  for (const url of seen) {
    const dest = localPath(url);
    if (!dest) continue;                       // no /public/ path in URL — skip
    if (fs.existsSync(dest)) { skipped++; continue; } // already have it locally

    const src = rawUrl(url);
    process.stdout.write(`↓ ${dest} … `);
    try {
      await download(src, dest);
      console.log('✓');
      downloaded++;
    } catch (e) {
      console.log(`✗ (${e.message})`);
      failed++;
    }
  }

  console.log('\n─────────────────────────────────────');
  console.log(`Downloaded      : ${downloaded}`);
  console.log(`Already existed : ${skipped}`);
  console.log(`Failed          : ${failed}`);

  if (failed > 0) {
    console.warn('\nSome images could not be downloaded — site will use Cloudinary URLs directly.');
    // Non-fatal: Cloudinary is the primary source; missing fallbacks are acceptable.
  }
}

main().catch(err => { console.error(err); process.exit(1); });
