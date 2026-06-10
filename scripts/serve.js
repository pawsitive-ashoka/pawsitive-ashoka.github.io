#!/usr/bin/env node
/**
 * Local dev server — mirrors the GitHub Actions generate-config step.
 * Reads .env.local, writes admin/config.js + js/site-config.js, serves the site.
 *
 * Usage: node scripts/serve.js [port]
 *        npm run dev
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const PORT = parseInt(process.argv[2]) || 4321;
const ROOT = path.resolve(__dirname, '..');

/* ── Load .env.local ──────────────────────────────────────────────────── */
const envPath = path.join(ROOT, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('\n  ERROR: .env.local not found.');
  console.error('  Copy the example file and fill in your values:\n');
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

/* ── Write config files (same as deploy workflow) ─────────────────────── */
const adminConfig = `window.__PAWSITIVE_CONFIG__ = {
  supabaseUrl:             "${env.SUPABASE_URL}",
  supabaseAnonKey:         "${env.SUPABASE_ANON_KEY}",
  cloudinaryCloudName:     "${env.CLOUDINARY_CLOUD_NAME    || ''}",
  cloudinaryApiKey:        "${env.CLOUDINARY_API_KEY       || ''}",
  cloudinaryUploadPreset:  "${env.CLOUDINARY_UPLOAD_PRESET || ''}",
};
`;

const siteConfig = `window.__PAWSITIVE_CONFIG__ = window.__PAWSITIVE_CONFIG__ || {};
window.__PAWSITIVE_CONFIG__.cloudinaryCloudName = "${env.CLOUDINARY_CLOUD_NAME || ''}";
`;

fs.writeFileSync(path.join(ROOT, 'admin', 'config.js'), adminConfig);
fs.writeFileSync(path.join(ROOT, 'js', 'site-config.js'), siteConfig);
console.log('  ✓ admin/config.js written');
console.log('  ✓ js/site-config.js written');

/* ── MIME types ──────────────────────────────────────────────────────── */
const MIME = {
  '.html': 'text/html; charset=utf-8',
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

/* ── Server ──────────────────────────────────────────────────────────── */
const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  const filePath = path.join(ROOT, urlPath);
  const ext      = path.extname(filePath).toLowerCase();

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    // index.html handles client-side routing
    if (!ext) {
      const idx = path.join(ROOT, 'index.html');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(fs.readFileSync(idx));
      return;
    }
    res.writeHead(404); res.end('Not found: ' + urlPath); return;
  }

  const mime = MIME[ext] || 'application/octet-stream';
  const headers = { 'Content-Type': mime };
  // Never cache HTML or JS locally
  if (ext === '.html' || ext === '.js') headers['Cache-Control'] = 'no-store';

  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`\n  Pawsitive dev server`);
  console.log(`  http://localhost:${PORT}/`);
  console.log(`  http://localhost:${PORT}/admin/\n`);
});
