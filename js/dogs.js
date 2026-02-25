/* ─── dogs.js ─── load & render dog cards from public/dogs/*.md ─── */

/**
 * Parse simple YAML-style frontmatter from a markdown string.
 * Returns { meta, body } where meta is an object of key: value pairs
 * and body is the text below the closing --- delimiter.
 *
 * Frontmatter format:
 *   ---
 *   key: value
 *   tags: tag1, tag2, tag3
 *   ---
 *   Description text here.
 */
function parseDogMd(raw) {
  const lines = raw.trim().split('\n');
  const meta = {};
  let i = 0;

  // strip opening ---
  if (lines[0].trim() === '---') i++;

  while (i < lines.length && lines[i].trim() !== '---') {
    const colonIdx = lines[i].indexOf(':');
    if (colonIdx !== -1) {
      const key = lines[i].slice(0, colonIdx).trim();
      const val = lines[i].slice(colonIdx + 1).trim();
      meta[key] = val;
    }
    i++;
  }
  i++; // skip closing ---
  const body = lines.slice(i).join('\n').trim();
  return { meta, body };
}

/** Pick a background gradient for the card illustration area */
function getIllustrationBg(meta) {
  const dark = document.documentElement.dataset.theme === 'dark';
  return dark ? (meta.bgDark || '') : (meta.bgLight || '');
}

/** Escape a string for use in an HTML attribute value */
function esc(s) { return (s || '').replace(/"/g, '&quot;').replace(/\n/g, ' '); }

/** Build compact tile HTML for a single dog */
function buildDogCard(meta, body) {
  const searchText = [meta.name, meta.breed, meta.tags, body].join(' ').toLowerCase();
  const bg = getIllustrationBg(meta);

  const photoArea = meta.image
    ? `<div class="dog-tile-photo"><img src="${meta.image}" alt="${esc(meta.name)}" class="dog-photo" loading="lazy"></div>`
    : `<div class="dog-tile-emoji" style="background:${bg}"><span class="dog-emoji-big">${meta.emoji || '🐕'}</span></div>`;

  return `<div class="dog-card"
      data-search="${esc(searchText)}"
      data-name="${esc(meta.name || 'Dog')}"
      data-name-emoji="${esc(meta.nameEmoji)}"
      data-breed="${esc(meta.breed)}"
      data-body="${esc(body)}"
      data-tags="${esc(meta.tags)}"
      data-image="${esc(meta.image)}"
      data-emoji="${esc(meta.emoji || '🐕')}"
      data-bg-light="${esc(meta.bgLight)}"
      data-bg-dark="${esc(meta.bgDark)}">
    ${photoArea}
    <div class="dog-tile-name">${meta.name || 'Dog'} ${meta.nameEmoji || ''}</div>
  </div>`;
}

/** Fetch a single dog markdown file and return parsed data */
async function fetchDog(filename) {
  const res = await fetch('public/dogs/' + filename);
  if (!res.ok) throw new Error('Could not load ' + filename);
  const text = await res.text();
  return parseDogMd(text);
}

/** Attach load/error listeners to all .dog-photo images (handles cached images too) */
function initDogPhotos() {
  document.querySelectorAll('.dog-photo').forEach(img => {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('loaded');
    } else {
      img.addEventListener('load', () => img.classList.add('loaded'));
      img.addEventListener('error', () => { img.style.display = 'none'; });
    }
  });
}

/** Wire up the search input to filter tiles */
function initDogSearch() {
  const input = document.getElementById('dogs-search');
  const countEl = document.getElementById('dogs-count');
  const grid = document.getElementById('dogs-grid');
  if (!input || !grid) return;

  const updateCount = () => {
    const total = grid.querySelectorAll('.dog-card').length;
    const visible = grid.querySelectorAll('.dog-card:not(.dog-card-hidden)').length;
    if (countEl) countEl.textContent = visible === total ? `${total} dogs` : `${visible} of ${total}`;
  };
  updateCount();

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    const prev = grid.querySelector('.dogs-no-results');
    if (prev) prev.remove();
    let visible = 0;
    grid.querySelectorAll('.dog-card').forEach(card => {
      const match = !q || card.dataset.search.includes(q);
      card.classList.toggle('dog-card-hidden', !match);
      if (match) visible++;
    });
    if (visible === 0 && q) {
      const msg = document.createElement('div');
      msg.className = 'dogs-no-results';
      msg.textContent = `no dogs matching "${input.value}" 🐾`;
      grid.appendChild(msg);
    }
    updateCount();
  });
}

/** Open a full-detail modal when a tile is clicked */
function initDogModals() {
  const grid = document.getElementById('dogs-grid');
  if (!grid) return;

  grid.addEventListener('click', e => {
    const card = e.target.closest('.dog-card');
    if (!card) return;

    const dark = document.documentElement.dataset.theme === 'dark';
    const bg = dark ? (card.dataset.bgDark || '') : (card.dataset.bgLight || '');

    const tags = (card.dataset.tags || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
      .map(t => `<span class="dog-modal-tag">${t}</span>`)
      .join('');

    const photoSection = card.dataset.image
      ? `<div class="dog-modal-photo"><img src="${card.dataset.image}" alt="${card.dataset.name}" style="opacity:0;transition:opacity 0.3s" onload="this.style.opacity=1"></div>`
      : `<div class="dog-modal-emoji" style="background:${bg}"><span style="font-size:7rem">${card.dataset.emoji || '🐕'}</span></div>`;

    const overlay = document.createElement('div');
    overlay.className = 'dog-modal-overlay';
    overlay.innerHTML = `
      <div class="dog-modal" role="dialog" aria-modal="true">
        <button class="dog-modal-close" aria-label="Close">✕</button>
        ${photoSection}
        <div class="dog-modal-body">
          <div class="dog-modal-name">${card.dataset.name} <span>${card.dataset.nameEmoji || ''}</span></div>
          <div class="dog-modal-breed">${card.dataset.breed || ''}</div>
          <p class="dog-modal-desc">${card.dataset.body || ''}</p>
          <div class="dog-modal-tags">${tags}</div>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('.dog-modal-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
  });
}

/** Main entry: fetch manifest, load all dogs, render to grid */
async function loadDogs() {
  const grid = document.getElementById('dogs-grid');
  if (!grid) return;

  grid.innerHTML = '<div class="dogs-loading">🐾 loading the pack…</div>';

  try {
    const manifestRes = await fetch('public/dogs/manifest.json');
    if (!manifestRes.ok) throw new Error('manifest not found');
    const { dogs: files } = await manifestRes.json();

    const results = await Promise.allSettled(files.map(fetchDog));

    const cards = results
      .filter(r => r.status === 'fulfilled')
      .map(r => buildDogCard(r.value.meta, r.value.body));

    const errors = results.filter(r => r.status === 'rejected');

    grid.innerHTML = cards.join('');
    initDogPhotos();
    initDogSearch();
    initDogModals();

    if (errors.length) {
      const errDiv = document.createElement('div');
      errDiv.className = 'dogs-error';
      errDiv.textContent = `⚠️ ${errors.length} dog profile(s) couldn't be loaded.`;
      grid.appendChild(errDiv);
    }

    if (cards.length === 0) {
      grid.innerHTML = '<div class="dogs-loading">no dogs found — add .md files to public/dogs/ 🐾</div>';
    }
  } catch (e) {
    grid.innerHTML = `<div class="dogs-error">
      ⚠️ couldn't load dogs — make sure public/dogs/manifest.json exists and lists your .md files.<br>
      <small style="opacity:0.7;">${e.message}</small>
    </div>`;
  }
}
