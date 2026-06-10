#!/usr/bin/env node
/**
 * generate-config.js — run by GitHub Actions before deploy.
 * Reads credentials from env vars, writes:
 *   admin/config.js   — CMS admin panel config
 *   js/site-config.js — public site config (Cloudinary cloud name only)
 */

const fs   = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');

function require_env(name) {
  const v = process.env[name];
  if (!v) { console.error(`ERROR: ${name} is not set`); process.exit(1); }
  return v;
}

const SUPABASE_URL      = require_env('SUPABASE_URL');
const SUPABASE_ANON_KEY = require_env('SUPABASE_ANON_KEY');
const CLOUD_NAME        = process.env.CLOUDINARY_CLOUD_NAME    || '';
const API_KEY           = process.env.CLOUDINARY_API_KEY       || '';
const UPLOAD_PRESET     = process.env.CLOUDINARY_UPLOAD_PRESET || '';
const BUILD_TS          = Date.now();

// admin/config.js — loaded by admin/index.html
fs.writeFileSync(
  path.join(ROOT, 'admin', 'config.js'),
  `window.__PAWSITIVE_CONFIG__ = {\n` +
  `  supabaseUrl:            "${SUPABASE_URL}",\n` +
  `  supabaseAnonKey:        "${SUPABASE_ANON_KEY}",\n` +
  `  cloudinaryCloudName:    "${CLOUD_NAME}",\n` +
  `  cloudinaryApiKey:       "${API_KEY}",\n` +
  `  cloudinaryUploadPreset: "${UPLOAD_PRESET}",\n` +
  `};\n`
);

// js/site-config.js — loaded by the main site for gallery etc.
fs.writeFileSync(
  path.join(ROOT, 'js', 'site-config.js'),
  `window.__PAWSITIVE_CONFIG__ = window.__PAWSITIVE_CONFIG__ || {};\n` +
  `window.__PAWSITIVE_CONFIG__.cloudinaryCloudName = "${CLOUD_NAME}";\n`
);

// Stamp the cache-buster in admin/index.html
const indexPath = path.join(ROOT, 'admin', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8').replace(/__BUILD_TS__/g, String(BUILD_TS));
fs.writeFileSync(indexPath, html);

console.log(`admin/config.js       written`);
console.log(`js/site-config.js     written`);
console.log(`admin/index.html      cache-busted (${BUILD_TS})`);
