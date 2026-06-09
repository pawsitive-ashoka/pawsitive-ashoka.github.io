/**
 * cms-backend.js — Custom Decap CMS backend
 *
 * Authenticates editors via Supabase Google OAuth, then proxies all
 * GitHub operations through the Supabase Edge Function cms-proxy.
 *
 * Registered in cms-config.js via:
 *   CMS.registerBackend('supabase-proxy', SupabaseProxyBackend)
 *
 * Usage (in cms-config.js config object):
 *   backend: { name: 'supabase-proxy', branch: 'main' }
 */

/* ── Supabase client (loaded via CDN in index.html) ─────────────────── */
const _supabase = window._supabaseClient;
const PROXY_URL = window._cmsProxyUrl;  // set in index.html before this loads
const REPO      = 'pawsitive-ashoka/pawsitive-ashoka.github.io';
const RAW_BASE  = `https://raw.githubusercontent.com/${REPO}/main`;

/* ── Auth component (React UI) ──────────────────────────────────────── */
function AuthComponent({ onLogin }) {
  const h = React;

  React.useEffect(() => {
    // Handle OAuth redirect callback
    _supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        onLogin({ token: session.access_token, email: session.user.email });
      }
    });

    const { data: { subscription } } = _supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) onLogin({ token: session.access_token, email: session.user.email });
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const signIn = () =>
    _supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/admin/' },
    });

  return React.createElement(
    'div',
    {
      style: {
        minHeight:      '100vh',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        background:     '#1a1208',
        color:          '#f0e8d8',
        fontFamily:     "'Caveat', cursive",
        textAlign:      'center',
        padding:        '2rem',
      },
    },
    React.createElement('div', { style: { fontSize: '3.5rem', marginBottom: '0.5rem' } }, '🐾'),
    React.createElement('h1', { style: { fontSize: '2.2rem', margin: '0 0 0.4rem' } }, 'Pawsitive CMS'),
    React.createElement(
      'p',
      { style: { opacity: 0.65, margin: '0 0 2rem', fontSize: '1.05rem' } },
      'Sign in with your authorised university Google account'
    ),
    React.createElement(
      'button',
      {
        onClick: signIn,
        style: {
          background:    '#e8d0a8',
          color:         '#2a1f14',
          border:        'none',
          borderRadius:  '999px',
          padding:       '0.65rem 2.2rem',
          fontSize:      '1.1rem',
          fontFamily:    'inherit',
          cursor:        'pointer',
          fontWeight:    '600',
        },
      },
      'Sign in with Google'
    )
  );
}

/* ── Backend class ───────────────────────────────────────────────────── */
class SupabaseProxyBackend {
  constructor(config) {
    this.branch = config.getIn(['backend', 'branch']) || 'main';
    this.token  = null;
    this.email  = null;
    this._treeCache = null;
  }

  /* ── Auth ─────────────────────────────────────────────────────────── */
  authComponent() {
    return AuthComponent;
  }

  async authenticate(credentials) {
    this.token = credentials.token;
    this.email = credentials.email;
    return {
      id:    this.email,
      name:  this.email.split('@')[0],
      email: this.email,
      token: this.token,
    };
  }

  async restoreUser() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return null;
    this.token = session.access_token;
    this.email = session.user.email;
    return {
      id:    this.email,
      name:  this.email.split('@')[0],
      email: this.email,
      token: this.token,
    };
  }

  logout() {
    this.token = null;
    this.email = null;
    return _supabase.auth.signOut();
  }

  /* ── Proxy helper ─────────────────────────────────────────────────── */
  async _proxy(method, action, params = {}, body = null) {
    const qs    = new URLSearchParams({ action, ...params }).toString();
    const url   = `${PROXY_URL}?${qs}`;
    const opts  = {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type':  'application/json',
      },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`cms-proxy ${res.status}: ${txt}`);
    }
    return res.json();
  }

  /* ── File helpers ─────────────────────────────────────────────────── */
  async _getTree() {
    if (!this._treeCache) {
      const data = await this._proxy('GET', 'tree');
      this._treeCache = data.tree || [];
    }
    return this._treeCache;
  }

  _clearTreeCache() { this._treeCache = null; }

  async _readFile(path) {
    const data = await this._proxy('GET', 'file', { path });
    // GitHub returns content as base64 with newlines
    const raw  = data.content.replace(/\n/g, '');
    const text = decodeURIComponent(escape(atob(raw)));
    return { text, sha: data.sha };
  }

  async _writeFile(path, content, sha, message, binary = false) {
    this._clearTreeCache();
    return this._proxy('PUT', 'file', { path }, { content, sha, message, binary });
  }

  async _deleteFile(path, sha, message) {
    this._clearTreeCache();
    return this._proxy('DELETE', 'file', { path }, { sha, message });
  }

  /* ── CMS interface — content ──────────────────────────────────────── */
  async entriesByFolder(collection, extension) {
    const folder = collection.get('folder');
    const tree   = await this._getTree();
    const paths  = tree
      .filter(f => f.type === 'blob' && f.path.startsWith(folder + '/') && f.path.endsWith(extension))
      .map(f => f.path);

    return Promise.all(paths.map(async path => {
      const { text, sha } = await this._readFile(path);
      return { file: { path, id: sha }, data: text };
    }));
  }

  async allEntriesByFolder(collection, extension) {
    return this.entriesByFolder(collection, extension);
  }

  async entriesByFiles(collection) {
    const files = collection.get('files');
    return Promise.all(
      files.toArray().map(async f => {
        const path = f.get('file');
        const { text, sha } = await this._readFile(path);
        return { file: { path, id: sha }, data: text };
      })
    );
  }

  async getEntry(_collection, _slug, path) {
    const { text, sha } = await this._readFile(path);
    return { file: { path, id: sha }, data: text };
  }

  async persistEntry(entry, mediaFiles, options) {
    const { path, raw, slug } = entry;

    // Get existing SHA if updating
    let sha;
    try {
      const existing = await this._proxy('GET', 'file', { path });
      sha = existing.sha;
    } catch (_) { /* new file */ }

    const verb = options.newEntry ? 'create' : 'update';
    await this._writeFile(path, raw, sha, `${verb}: ${path} via CMS`);

    // Persist any associated media
    for (const mf of mediaFiles) {
      if (mf.fileObj) await this.persistMedia(mf);
    }

    return { collection: entry.collection, slug };
  }

  async deleteEntry(collection, slug) {
    const path = `${collection.get('folder')}/${slug}${collection.get('extension') ? '.' + collection.get('extension') : '.md'}`;
    const data = await this._proxy('GET', 'file', { path });
    await this._deleteFile(path, data.sha, `delete: ${path} via CMS`);
  }

  /* ── CMS interface — media ────────────────────────────────────────── */
  async getMedia(mediaFolder) {
    const folder = mediaFolder || 'public/gallery';
    const tree   = await this._getTree();
    const exts   = /\.(jpg|jpeg|png|gif|webp|svg|mp4|mov|pdf)$/i;
    return tree
      .filter(f => f.type === 'blob' && f.path.startsWith(folder) && exts.test(f.path))
      .map(f => ({
        id:         f.sha,
        name:       f.path.split('/').pop(),
        path:       '/' + f.path,
        url:        `${RAW_BASE}/${f.path}`,
        displayURL: `${RAW_BASE}/${f.path}`,
      }));
  }

  async getMediaFile(path) {
    const clean = path.replace(/^\//, '');
    const data  = await this._proxy('GET', 'file', { path: clean });
    return {
      id:         data.sha,
      name:       clean.split('/').pop(),
      path,
      url:        data.download_url,
      displayURL: data.download_url,
    };
  }

  async persistMedia(file) {
    const path  = (file.path || file.name).replace(/^\//, '');
    const b64   = await this._fileToBase64(file.fileObj);

    let sha;
    try {
      const existing = await this._proxy('GET', 'file', { path });
      sha = existing.sha;
    } catch (_) { /* new file */ }

    await this._writeFile(path, b64, sha, `upload: ${path} via CMS`, true);

    return {
      id:         path,
      name:       path.split('/').pop(),
      path:       '/' + path,
      url:        `${RAW_BASE}/${path}`,
      displayURL: `${RAW_BASE}/${path}`,
    };
  }

  async deleteMedia(path) {
    const clean = path.replace(/^\//, '');
    const data  = await this._proxy('GET', 'file', { path: clean });
    await this._deleteFile(clean, data.sha, `delete media: ${clean} via CMS`);
  }

  /* ── Helpers ──────────────────────────────────────────────────────── */
  _fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Called by Decap CMS to check if a user is already logged in
  async currentUser() {
    return this.restoreUser();
  }
}

window.SupabaseProxyBackend = SupabaseProxyBackend;
