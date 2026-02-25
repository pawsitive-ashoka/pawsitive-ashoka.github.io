/* ─── app.js ─── page navigation, page loading, theme ─── */

const PAGES = ['home','about','dogs','departments','team','gallery','donate','contact'];
const DEPT_SLUGS = ['events','finance','ground','social'];
const _loaded = {};
let _currentDept = null;

async function loadPage(name) {
  if (_loaded[name]) return;
  const container = document.getElementById('page-' + name);
  if (!container) return;
  try {
    const res = await fetch('pages/' + name + '.html');
    if (!res.ok) throw new Error(res.status);
    const html = await res.text();
    container.innerHTML = html;
    _loaded[name] = true;
    // After loading dogs page, trigger dog rendering
    if (name === 'dogs') loadDogs();
    if (name === 'departments') setupDeptCards();
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
  // Hide all main pages
  PAGES.forEach(p => {
    document.getElementById('page-' + p).classList.remove('active');
    const btn = document.getElementById('nav-' + p);
    if (btn) btn.classList.remove('active');
  });
  // Mark departments nav as active (we're a sub-page)
  const deptBtn = document.getElementById('nav-departments');
  if (deptBtn) deptBtn.classList.add('active');
  // Always load the requested dept page (replace whatever is currently showing)
  const detailContainer = document.getElementById('page-dept-detail');
  try {
    if (_currentDept !== slug) {
      const res = await fetch('pages/dept-' + slug + '.html');
      if (!res.ok) throw new Error(res.status);
      detailContainer.innerHTML = await res.text();
      _currentDept = slug;
    }
  } catch (e) {
    detailContainer.innerHTML = `<div style="text-align:center;padding:4rem 2rem;font-family:'Caveat',cursive;font-size:1.3rem;color:var(--accent);">⚠️ couldn't load this page right now. try refreshing.</div>`;
    _currentDept = null;
  }
  detailContainer.classList.add('active');
  closeNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToDepartments() {
  document.getElementById('page-dept-detail').classList.remove('active');
  showPage('departments');
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
}

function closeNav() {
  const links = document.getElementById('nav-links');
  const btn = document.getElementById('hamburger');
  links.classList.remove('open');
  btn.classList.remove('open');
  btn.setAttribute('aria-expanded', 'false');
}

function toggleTheme() {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
}

document.addEventListener('DOMContentLoaded', () => showPage('home'));
