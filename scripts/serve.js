#!/usr/bin/env node
/**
 * Local dev server for the static site.
 *
 * Usage: node scripts/serve.js [port]
 *        npm run dev
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = parseInt(process.argv[2]) || 4321;
const ROOT = path.resolve(__dirname, '..');

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
  console.log(`\n`);
});
