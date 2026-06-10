/**
 * cms-backend.js — Custom Decap CMS backend
 *
 * Auth is handled in index.html (pure HTML, no React).
 * By the time Decap loads, window._supabaseSession is always set.
 * restoreUser() hands that session to the CMS — authComponent() is never called.
 */

const _supabase = window._supabaseClient;
const PROXY_URL = window._cmsProxyUrl;
const REPO      = 'pawsitive-ashoka/pawsitive-ashoka.github.io';
const RAW_BASE  = `https://raw.githubusercontent.com/${REPO}/main`;

class SupabaseProxyBackend {
  constructor(config) {
    const branch = typeof config?.getIn === 'function'
      ? config.getIn(['backend', 'branch'])
      : config?.backend?.branch;
    this.branch = branch || 'main';
    this.token  = null;
    this.email  = null;
    this._treeCache = null;
  }

  /* ── Auth ─────────────────────────────────────────────────────────────── */

  // Decap CMS requires this to be a function component, not null.
  // In practice restoreUser() always returns a session (set by index.html before
  // CMS loads), so this component is never rendered. But if it is, it calls
  // onLogin with the stored session or redirects back to the login screen.
  authComponent() {
    return function SupabaseAuth({ onLogin }) {
      const session = window._supabaseSession;
      if (session) {
        setTimeout(() => onLogin({ token: session.access_token, email: session.user.email }), 0);
      } else {
        setTimeout(() => { window.location.href = window.location.pathname; }, 100);
      }
      return null;
    };
  }

  async restoreUser() {
    // Use the session stored by index.html before CMS was loaded.
    // Fall back to getSession() for robustness (e.g. page refresh).
    const session = window._supabaseSession
      || (await _supabase.auth.getSession()).data?.session;

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

  logout() {
    this.token = null;
    this.email = null;
    window._supabaseSession = null;
    return _supabase.auth.signOut();
  }

  /* ── Proxy helper ─────────────────────────────────────────────────────── */
  async _proxy(method, action, params = {}, body = null) {
    const qs  = new URLSearchParams({ action, ...params }).toString();
    const res = await fetch(`${PROXY_URL}?${qs}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type':  'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error(`cms-proxy ${res.status}: ${await res.text()}`);
    return res.json();
  }

  /* ── File helpers ─────────────────────────────────────────────────────── */
  async _getTree() {
    if (!this._treeCache) {
      const data = await this._proxy('GET', 'tree');
      this._treeCache = data.tree || [];
    }
    return this._treeCache;
  }

  _clearTreeCache() { this._treeCache = null; }

  async _readFile(path) {
    const data = await this._proxy('GET', 'file', { path: path.replace(/^\//, '') });
    const text = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
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

  // Decap CMS 3.x passes collections as plain objects; older versions use
  // Immutable.js Maps. This helper handles both transparently.
  _col(collection, key) {
    return typeof collection?.get === 'function'
      ? collection.get(key)
      : collection?.[key];
  }

  /* ── CMS interface — content ──────────────────────────────────────────── */

  // Decap CMS 3.x passes the folder path as a plain string to entriesByFolder.
  // Older versions passed a collection object — _colFolder handles both.
  _colFolder(collectionOrFolder) {
    if (typeof collectionOrFolder === 'string') return collectionOrFolder;
    return this._col(collectionOrFolder, 'folder');
  }

  async entriesByFolder(collectionOrFolder, extension) {
    const folder = this._colFolder(collectionOrFolder);
    const tree   = await this._getTree();
    const paths  = tree
      .filter(f => f.type === 'blob' && f.path.startsWith(folder + '/') && f.path.endsWith(extension))
      .map(f => f.path);

    return Promise.all(paths.map(async path => {
      const { text, sha } = await this._readFile(path);
      return { file: { path, id: sha }, data: text };
    }));
  }

  async allEntriesByFolder(collectionOrFolder, extension) {
    return this.entriesByFolder(collectionOrFolder, extension);
  }

  async entriesByFiles(collection) {
    // Decap 3.x may pass an array of file configs directly, or a collection object
    const raw  = Array.isArray(collection) ? collection : this._col(collection, 'files');
    const arr  = typeof raw?.toArray === 'function' ? raw.toArray() : (raw || []);
    return Promise.all(
      arr.map(async f => {
        const path = typeof f?.get === 'function' ? f.get('file') : (f?.file ?? f);
        const { text, sha } = await this._readFile(path);
        return { file: { path, id: sha }, data: text };
      })
    );
  }

  async getEntry(collection, slug, path) {
    // Decap CMS 3.x calls getEntry(collection, slug) — no path argument.
    // Construct it from the folder string + slug + extension.
    const folder = this._colFolder(collection);
    const ext    = (typeof collection === 'object' && this._col(collection, 'extension')) || 'md';
    const resolved = (path || `${folder}/${slug}.${ext}`).replace(/^\//, '');
    const { text, sha } = await this._readFile(resolved);
    return { file: { path: resolved, id: sha }, data: text };
  }

  async persistEntry(entry, mediaFiles, options) {
    const { path, raw, slug } = entry;
    let sha;
    try { sha = (await this._proxy('GET', 'file', { path })).sha; } catch (_) {}
    await this._writeFile(path, raw, sha, `${options.newEntry ? 'create' : 'update'}: ${path} via CMS`);
    for (const mf of mediaFiles) {
      if (mf.fileObj) await this.persistMedia(mf);
    }
    return { collection: entry.collection, slug };
  }

  async deleteEntry(collection, slug) {
    const folder = this._colFolder(collection);
    const ext    = this._col(collection, 'extension') || 'md';
    const path   = `${folder}/${slug}.${ext}`;
    const data   = await this._proxy('GET', 'file', { path });
    await this._deleteFile(path, data.sha, `delete: ${path} via CMS`);
  }

  /* ── CMS interface — media ────────────────────────────────────────────── */
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
    const path = (file.path || file.name).replace(/^\//, '');
    const b64  = await this._fileToBase64(file.fileObj);
    let sha;
    try { sha = (await this._proxy('GET', 'file', { path })).sha; } catch (_) {}
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

  _fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

window.SupabaseProxyBackend = SupabaseProxyBackend;
