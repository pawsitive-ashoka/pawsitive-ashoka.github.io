#!/usr/bin/env node
/**
 * Local dev server — mirrors the GitHub Actions inject step.
 * Reads .env.local, replaces __TOKEN__ placeholders in-memory, serves the site.
 *
 * Usage: node scripts/serve.js [port]
 */

const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const PORT  = parseInt(process.argv[2]) || 4321;
const ROOT  = path.resolve(__dirname, '..');

/* ── Load .env.local ──────────────────────────────────────────────────── */
const envPath = path.join(ROOT, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('\n  ERROR: .env.local not found.');
  console.error('  Copy .env.local.example and fill in your values:\n');
  console.error('    cp .env.local.example .env.local\n');
  process.exit(1);
}

const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eq = trimmed.indexOf('=');
  if (eq === -1) return;
  env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
});

const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missing  = required.filter(k => !env[k]);
if (missing.length) {
  console.error('\n  ERROR: missing required keys in .env.local:', missing.join(', '), '\n');
  process.exit(1);
}

/* ── Token replacement map (same as deploy.yml) ─────────────────────── */
const replacements = {
  '__SUPABASE_URL__':             env.SUPABASE_URL      || '',
  '__SUPABASE_ANON_KEY__':        env.SUPABASE_ANON_KEY || '',
  '__CLOUDINARY_CLOUD_NAME__':    env.CLOUDINARY_CLOUD_NAME   || '',
  '__CLOUDINARY_API_KEY__':       env.CLOUDINARY_API_KEY      || '',
  '__CLOUDINARY_UPLOAD_PRESET__': env.CLOUDINARY_UPLOAD_PRESET || '',
};

function inject(text) {
  return Object.entries(replacements).reduce(
    (s, [token, value]) => s.replaceAll(token, value),
    text
  );
}

/* ── MIME types ──────────────────────────────────────────────────────── */
const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.ttf':  'font/ttf',
};

const INJECT_EXTS = new Set(['.html', '.js']);

/* ── Server ──────────────────────────────────────────────────────────── */
const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  const filePath = path.join(ROOT, urlPath);
  const ext      = path.extname(filePath).toLowerCase();

  // Prevent path traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404); res.end('Not found: ' + urlPath); return;
  }

  const mime = MIME[ext] || 'application/octet-stream';

  if (INJECT_EXTS.has(ext)) {
    const text = inject(fs.readFileSync(filePath, 'utf8'));
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' });
    res.end(text);
  } else {
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
  }
});

server.listen(PORT, () => {
  console.log(`\n  Pawsitive dev server running`);
  console.log(`  http://localhost:${PORT}/`);
  console.log(`  http://localhost:${PORT}/admin/\n`);
});
