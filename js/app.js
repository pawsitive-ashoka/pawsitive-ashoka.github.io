/* ─── app.js ─── page navigation, page loading, theme ─── */

/* ── Cloudinary image fallback — falls back to local /public/... copy ── */
function _cldImgError(img) {
  img.onerror = null; // prevent infinite loop
  const src = img.src;
  const m = src.match(/\/public\/.+/);
  if (m) { img.src = m[0]; return; }
  if (img.dataset.fallback) { img.src = img.dataset.fallback; delete img.dataset.fallback; }
}

/* ── Favicon fallback — <link rel="icon"> has no onerror, so probe via Image ── */
(function () {
  const link = document.querySelector('link[rel="icon"]');
  if (!link) return;
  const probe = new Image();
  probe.onerror = function () { link.href = '/public/logo/Paws Logo.jpg'; };
  probe.src = link.href;
}());

/* ── Shared scroll-lock utility (used by all modals) ── */
function lockScroll() {
  document.body.style.overflow = 'hidden';
}
function unlockScroll() {
  document.body.style.overflow = '';
  document.body.classList.add('scroll-unlocked');
  setTimeout(() => document.body.classList.remove('scroll-unlocked'), 200);
}

const PAGES = ['home','about','dogs','memoriam','departments','team','gallery','donate','contact'];
const DEPT_SLUGS = ['events','finance','ground','social'];
const _loaded = {};
let _currentDept = null;

/* ── Dept content — loaded from public/departments/{slug}.json ── */
const DEPT_CACHE = {};

/** Minimal markdown → HTML renderer for dept entry content */
function renderMd(text) {
  if (!text) return '';
  // Inline: bold then italic
  const inlined = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>');

  return inlined.split(/\n\n+/).map(block => {
    block = block.trim();
    if (!block) return '';
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    // Unordered list
    if (lines.length && lines.every(l => /^[-*] /.test(l))) {
      return '<ul>' + lines.map(l => `<li>${l.replace(/^[-*] /, '')}</li>`).join('') + '</ul>';
    }
    // Ordered list
    if (lines.length && lines.every(l => /^\d+\. /.test(l))) {
      return '<ol>' + lines.map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('') + '</ol>';
    }
    return '<p>' + lines.join(' ') + '</p>';
  }).join('');
}

/** Build the HTML for a single entry card (with inline <template> for the modal) */
function buildEntryCard(entry) {
  const photos  = entry.photos || [];
  const photoList = photos.map(u => `'${u.replace(/'/g, "\\'")}'`).join(',');

  const thumbHtml = entry.thumbnail
    ? `<img src="${entry.thumbnail}" alt="${entry.title}" onerror="_cldImgError(this)">`
    : '';

  const photosHtml = photos.length
    ? `<div class="dept-event-photos">
        ${photos.map((url, i) => `<img class="dept-photo-img" src="${url}"
          onclick="openDeptLightbox([${photoList}],${i})"
          onerror="_cldImgError(this)">`).join('')}
      </div>`
    : '';

  const amountHtml = entry.amountRaised
    ? `<div class="dept-amount-raised">💰 Amount Raised: ${entry.amountRaised}</div>`
    : '';

  return `
    <div class="dept-entry-card" onclick="openEntryModal(this)">
      <div class="dept-entry-thumb">${thumbHtml}</div>
      <div class="dept-entry-body">
        <h3>${entry.title}</h3>
        <p class="dept-entry-preview">${entry.preview || ''}</p>
        <button class="dept-entry-btn"
          onclick="event.stopPropagation();openEntryModal(this.closest('.dept-entry-card'))">view more →</button>
      </div>
      <template class="dept-entry-full">
        <h3>${entry.title}</h3>
        ${renderMd(entry.content)}
        ${photosHtml}
        ${amountHtml}
      </template>
    </div>`;
}

/** Build dept-specific extra sections (Finance donate CTA, Social connect) */
function buildExtraSection(slug, d) {
  if (slug === 'finance' && d.donateText) {
    return `
      <div class="dept-detail-section">
        <h2>support our work</h2>
        <div class="dept-donate-cta">
          <p>${d.donateText}</p>
          <button class="dept-donate-btn" onclick="showPage('donate')">❤️ donate now</button>
        </div>
      </div>`;
  }
  if (slug === 'social' && d.socialLinks) {
    const sl = d.socialLinks;
    return `
      <div class="dept-detail-section">
        <h2>connect with us</h2>
        <p style="font-size:0.97rem;color:var(--ink-soft);line-height:1.72;margin-bottom:1.2rem;">${d.connectText || ''}</p>
        <div class="social-connect-grid">
          <a class="social-connect-item" href="mailto:${sl.email}">
            <span class="social-connect-icon">✉️</span>
            <div>
              <div class="social-connect-label">Email Us</div>
              <div class="social-connect-sub">${sl.email}</div>
            </div>
          </a>
          <a class="social-connect-item inactive" href="${sl.instagram}" target="_blank" rel="noopener noreferrer">
            <span class="social-connect-icon">📸</span>
            <div>
              <div class="social-connect-label">Instagram — ${sl.instagramHandle || sl.instagram}</div>
              <div class="social-connect-sub">${sl.instagramStatus || ''}</div>
            </div>
          </a>
          <a class="social-connect-item" href="${sl.linkedin}" target="_blank" rel="noopener noreferrer">
            <span class="social-connect-icon">💼</span>
            <div>
              <div class="social-connect-label">LinkedIn</div>
              <div class="social-connect-sub">${sl.linkedinHandle || sl.linkedin}</div>
            </div>
          </a>
        </div>
      </div>`;
  }
  return '';
}

async function loadPage(name) {
  // Environment detection: only cache in production
  const isDevelopment = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' || 
                       window.location.hostname.includes('localhost');
  
  // Skip cache check in development mode
  if (!isDevelopment && _loaded[name]) {
    if (name === 'memoriam') loadMemorial();
    return;
  }
  
  const container = document.getElementById('page-' + name);
  if (!container) return;
  try {
    // Add cache busting in development
    const url = isDevelopment ? 
      `pages/${name}.html?v=${Date.now()}` : 
      `pages/${name}.html`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    const html = await res.text();
    container.innerHTML = html;
    
    // Only mark as loaded in production
    if (!isDevelopment) {
      _loaded[name] = true;
    }
    
    if (name === 'dogs') loadDogs();
    if (name === 'memoriam') loadMemorial();
    if (name === 'departments') setupDeptCards();
    if (name === 'gallery') renderMediaGrid();
    if (name === 'team') loadTeam();
  } catch (e) {
    container.innerHTML = `<div style="text-align:center;padding:4rem 2rem;font-family:'Caveat',cursive;font-size:1.3rem;color:var(--accent);">
      ⚠️ couldn't load this page right now. try refreshing.
    </div>`;
  }
}

async function showPage(name) {
  PAGES.forEach(p => {
    document.getElementById('page-' + p).classList.remove('active');
    const btn = document.getElementById('nav-' + p);
    if (btn) btn.classList.remove('active');
  });
  // Also hide dept detail page
  const deptDetail = document.getElementById('page-dept-detail');
  if (deptDetail) deptDetail.classList.remove('active');
  await loadPage(name);
  document.getElementById('page-' + name).classList.add('active');
  const activeBtn = document.getElementById('nav-' + name);
  if (activeBtn) activeBtn.classList.add('active');
  closeNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function showDeptDetail(slug) {
  // Hide all main pages, mark departments nav active
  PAGES.forEach(p => {
    document.getElementById('page-' + p).classList.remove('active');
    const btn = document.getElementById('nav-' + p);
    if (btn) btn.classList.remove('active');
  });
  const deptBtn = document.getElementById('nav-departments');
  if (deptBtn) deptBtn.classList.add('active');

  const detailContainer = document.getElementById('page-dept-detail');
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  try {
    // Fetch JSON (skip cache in dev so edits show immediately)
    if (isDev || !DEPT_CACHE[slug]) {
      const url = `public/departments/${slug}.json${isDev ? '?v=' + Date.now() : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status);
      DEPT_CACHE[slug] = await res.json();
    }

    const d = DEPT_CACHE[slug];
    const respItems  = (d.resp    || []).map(r => `<li>${r}</li>`).join('');
    const entryCards = (d.entries || []).map(buildEntryCard).join('');

    detailContainer.innerHTML = `
      <div class="dept-detail-page">
        <div class="dept-detail-back">
          <button class="dept-back-btn" onclick="backToDepartments()">← back to departments</button>
        </div>
        <div class="dept-detail-hero ${d.heroClass}">
          <div class="dept-detail-num">${d.num}</div>
          <span class="dept-detail-icon">${d.icon}</span>
          <h1 class="dept-detail-title">${d.title}</h1>
          <p class="dept-detail-tagline">${d.tagline}</p>
        </div>
        <div class="dept-detail-content">
          <div class="dept-detail-section">
            <h2>what we do</h2>
            <p>${d.what}</p>
          </div>
          <div class="dept-detail-section">
            <h2>responsibilities</h2>
            <ul class="dept-resp">${respItems}</ul>
          </div>
          <div class="dept-detail-section">
            <h2>past highlights</h2>
            <div class="dept-entries">${entryCards}</div>
          </div>
          <div class="dept-detail-section">
            <h2>who thrives here</h2>
            <p>${d.who}</p>
          </div>
          ${buildExtraSection(slug, d)}
        </div>
        <footer>made with <span class="heart">❤️</span> by pawsitive · ashoka university · 🐾</footer>
      </div>`;

  } catch (e) {
    detailContainer.innerHTML = `<div style="text-align:center;padding:4rem 2rem;font-family:'Caveat',cursive;font-size:1.3rem;color:var(--accent);">⚠️ couldn't load this page right now. try refreshing.</div>`;
  }

  detailContainer.classList.add('active');
  closeNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToDepartments() {
  document.getElementById('page-dept-detail').classList.remove('active');
  showPage('departments');
}

function toggleEventCard(card) {
  card.classList.toggle('open');
}

function setupDeptCards() {
  // Ensure keyboard accessibility works after dynamic load
  document.querySelectorAll('.dept-card-link').forEach(card => {
    card.style.cursor = 'pointer';
  });
}

function toggleNav() {
  const links = document.getElementById('nav-links');
  const btn = document.getElementById('hamburger');
  const open = links.classList.toggle('open');
  btn.classList.toggle('open', open);
  btn.setAttribute('aria-expanded', open);
  if (open) lockScroll(); else unlockScroll();
}

function closeNav() {
  const links = document.getElementById('nav-links');
  const btn = document.getElementById('hamburger');
  links.classList.remove('open');
  btn.classList.remove('open');
  btn.setAttribute('aria-expanded', 'false');
  unlockScroll();
}

/* Close hamburger on outside click or Escape */
document.addEventListener('click', e => {
  const links = document.getElementById('nav-links');
  if (!links || !links.classList.contains('open')) return;
  const nav = document.querySelector('nav');
  if (!nav.contains(e.target)) closeNav();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const links = document.getElementById('nav-links');
    if (links && links.classList.contains('open')) closeNav();
    const entryModal = document.getElementById('deptEntryModal');
    if (entryModal && entryModal.classList.contains('open')) closeDeptEntryModal({ closeForced: true });
  }
});

/* Dept entry detail modal */
function openEntryModal(card) {
  const tpl = card.querySelector('template.dept-entry-full');
  if (!tpl) return;
  const content = document.getElementById('deptEntryModalContent');
  content.innerHTML = '';
  content.appendChild(tpl.content.cloneNode(true));
  document.getElementById('deptEntryModal').classList.add('open');
  lockScroll();
}

function closeDeptEntryModal(e) {
  const modal = document.getElementById('deptEntryModal');
  if (!modal) return;
  if (e && (e.target === modal || e.closeForced)) {
    modal.classList.remove('open');
    unlockScroll();
  }
}

function toggleTheme() {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
}

document.addEventListener('DOMContentLoaded', () => showPage('home'));
