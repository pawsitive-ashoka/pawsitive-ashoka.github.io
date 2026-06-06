#!/usr/bin/env node
// Rebuilds all manifest.json files from the markdown content folders.
// Run automatically by .github/workflows/rebuild-manifests.yml on every
// push that touches a content folder. Can also be run locally:
//   node .github/scripts/rebuild-manifests.js

const fs   = require('fs');
const path = require('path');

function parseFrontmatter(content) {
  const lines = content.trim().split('\n');
  const meta  = {};
  let i = 0;
  if (lines[0] && lines[0].trim() === '---') i++;
  while (i < lines.length && lines[i].trim() !== '---') {
    const colon = lines[i].indexOf(':');
    if (colon !== -1) {
      meta[lines[i].slice(0, colon).trim()] = lines[i].slice(colon + 1).trim();
    }
    i++;
  }
  return meta;
}

function mdFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort();
}

function write(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  console.log(`  wrote ${filePath}`);
}

// ── Dogs ────────────────────────────────────────────────────────────────────
function rebuildDogs() {
  const dir   = 'public/dogs/content';
  const files = mdFiles(dir);
  const sorted = files
    .map(f => {
      const meta = parseFrontmatter(fs.readFileSync(path.join(dir, f), 'utf8'));
      return { f, order: parseInt(meta.order || '999', 10), name: (meta.name || f).toLowerCase() };
    })
    .sort((a, b) => a.order !== b.order ? a.order - b.order : a.name.localeCompare(b.name));

  write('public/dogs/manifest.json', { dogs: sorted.map(d => d.f) });
  console.log(`  dogs: ${sorted.length} entries`);
}

// ── Memorial ─────────────────────────────────────────────────────────────────
function rebuildMemorial() {
  const dir   = 'public/memorial/content';
  const files = mdFiles(dir);
  const sorted = files
    .map(f => {
      const meta = parseFrontmatter(fs.readFileSync(path.join(dir, f), 'utf8'));
      return { f, order: parseInt(meta.order || '999', 10), name: (meta.name || f).toLowerCase() };
    })
    .sort((a, b) => a.order !== b.order ? a.order - b.order : a.name.localeCompare(b.name));

  write('public/memorial/manifest.json', { dogs: sorted.map(d => d.f) });
  console.log(`  memorial: ${sorted.length} entries`);
}

// ── Core Team ────────────────────────────────────────────────────────────────
function rebuildCore() {
  const dir   = 'public/team/core/content';
  const files = mdFiles(dir);
  const sorted = files
    .map(f => {
      const meta = parseFrontmatter(fs.readFileSync(path.join(dir, f), 'utf8'));
      return { f, order: parseInt(meta.order || '999', 10) };
    })
    .sort((a, b) => a.order - b.order);

  write('public/team/core/manifest.json', { members: sorted.map(m => m.f) });
  console.log(`  core team: ${sorted.length} entries`);
}

// ── Leadership ───────────────────────────────────────────────────────────────
function rebuildLeadership() {
  const dir      = 'public/team/leadership/content';
  const files    = mdFiles(dir);
  const SECTIONS = ['presidents & secretaries', 'department heads'];
  const buckets  = Object.fromEntries(SECTIONS.map(s => [s, []]));

  files.forEach(f => {
    const meta    = parseFrontmatter(fs.readFileSync(path.join(dir, f), 'utf8'));
    const section = (meta.section || '').toLowerCase().trim();
    const order   = parseInt(meta.order || '999', 10);
    // Fall back to 'department heads' if section is unrecognised
    const bucket  = buckets[section] ?? buckets['department heads'];
    bucket.push({ f, order });
  });

  const sections = SECTIONS
    .map(label => ({
      label,
      members: buckets[label].sort((a, b) => a.order - b.order).map(m => m.f)
    }))
    .filter(s => s.members.length > 0);

  write('public/team/leadership/manifest.json', { sections });
  console.log(`  leadership: ${sections.flatMap(s => s.members).length} entries`);
}

console.log('Rebuilding manifests…');
rebuildDogs();
rebuildMemorial();
rebuildCore();
rebuildLeadership();
console.log('Done.');
