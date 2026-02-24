/* ─── app.js ─── page navigation, page loading, theme ─── */

const PAGES = ['home','about','dogs','departments','team','gallery','donate','contact'];
const _loaded = {};

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
  await loadPage(name);
  document.getElementById('page-' + name).classList.add('active');
  const activeBtn = document.getElementById('nav-' + name);
  if (activeBtn) activeBtn.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleTheme() {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
}

document.addEventListener('DOMContentLoaded', () => showPage('home'));
