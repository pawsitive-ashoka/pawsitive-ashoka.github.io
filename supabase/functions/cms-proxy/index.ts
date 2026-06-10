/**
 * cms-proxy — Supabase Edge Function
 *
 * Acts as a git-gateway replacement. Verifies the caller's Supabase JWT,
 * checks their email against admin/allowed-users.json (read from GitHub at
 * cold start), then proxies GitHub API calls using a stored PAT.
 *
 * Required secrets (set via `supabase secrets set` or the dashboard):
 *   GITHUB_TOKEN     — a GitHub PAT with repo:contents read+write scope
 *
 * To add/remove CMS users: edit admin/allowed-users.json and push — no CLI needed.
 *
 * These are injected automatically by Supabase:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve }         from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient }  from 'https://esm.sh/@supabase/supabase-js@2.39.0';

/* ── Config ────────────────────────────────────────────────────────── */
const GITHUB_TOKEN     = Deno.env.get('GITHUB_TOKEN')!;
const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SVC_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const REPO    = 'pawsitive-ashoka/pawsitive-ashoka.github.io';
const BRANCH  = 'main';
const GH_BASE = 'https://api.github.com';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/* ── Allowed emails — read from admin/allowed-users.json at cold start ─ */
async function loadAllowedEmails(): Promise<string[]> {
  try {
    const res = await fetch(
      `${GH_BASE}/repos/${REPO}/contents/admin/allowed-users.json?ref=${BRANCH}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept:        'application/vnd.github.v3.raw',
          'User-Agent':  'Pawsitive-CMS',
        },
      }
    );
    if (!res.ok) {
      console.error(`[cms-proxy] Failed to load allowed-users.json: HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data.emails) ? data.emails : [];
  } catch (err) {
    console.error('[cms-proxy] Error loading allowed-users.json:', err);
    return [];
  }
}

const allowedEmails = await loadAllowedEmails();
console.log(`[cms-proxy] Loaded ${allowedEmails.length} allowed email(s)`);

/* ── Auth ──────────────────────────────────────────────────────────── */
async function getAuthorisedUser(req: Request): Promise<string | null> {
  const header = req.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7);
  const admin = createClient(SUPABASE_URL, SUPABASE_SVC_KEY);
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user?.email) return null;
  if (!allowedEmails.includes(user.email)) return null;
  return user.email;
}

/* ── GitHub helpers ────────────────────────────────────────────────── */
const ghHeaders = () => ({
  'Authorization': `token ${GITHUB_TOKEN}`,
  'Accept':        'application/vnd.github.v3+json',
  'User-Agent':    'Pawsitive-CMS',
  'Content-Type':  'application/json',
});

async function gh(path: string, options: RequestInit = {}) {
  const url = path.startsWith('http') ? path : `${GH_BASE}${path}`;
  const res = await fetch(url, { ...options, headers: { ...ghHeaders(), ...(options.headers ?? {}) } });
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

/* ── Router ────────────────────────────────────────────────────────── */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const email = await getAuthorisedUser(req);
  if (!email) return new Response('Unauthorized', { status: 401, headers: CORS });

  const url    = new URL(req.url);
  const action = url.searchParams.get('action');
  const path   = url.searchParams.get('path') ?? '';

  /* ── List all repo files (for folder browsing) ── */
  if (action === 'tree') {
    return gh(`/repos/${REPO}/git/trees/${BRANCH}?recursive=1`);
  }

  /* ── Read a single file ── */
  if (action === 'file' && req.method === 'GET') {
    return gh(`/repos/${REPO}/contents/${path}?ref=${BRANCH}`);
  }

  /* ── Create or update a file ── */
  if (action === 'file' && req.method === 'PUT') {
    const { content, message, sha, binary } = await req.json();
    const encoded = binary
      ? content                                           // already base64
      : btoa(unescape(encodeURIComponent(content)));     // UTF-8-safe base64
    return gh(`/repos/${REPO}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: message ?? `chore: update ${path} via CMS`,
        content: encoded,
        branch:  BRANCH,
        ...(sha && { sha }),
        committer: { name: email, email },
      }),
    });
  }

  /* ── Delete a file ── */
  if (action === 'file' && req.method === 'DELETE') {
    const { sha, message } = await req.json();
    return gh(`/repos/${REPO}/contents/${path}`, {
      method: 'DELETE',
      body: JSON.stringify({
        message: message ?? `chore: delete ${path} via CMS`,
        sha,
        branch:  BRANCH,
        committer: { name: email, email },
      }),
    });
  }

  return new Response('Not found', { status: 404, headers: CORS });
});
