/* ─── dogs.js ─── load & render dog cards from public/dogs/*.md ─── */

/** Row unit must match grid-auto-rows in CSS (px) */
const GRID_ROW_UNIT = 4;

/** Set a card's grid-row-end span to match its actual rendered height */
function setCardSpan(card) {
  card.style.gridRowEnd = '';
  const h = card.getBoundingClientRect().height;
  if (!h) return;
  card.style.gridRowEnd = `span ${Math.ceil(h / GRID_ROW_UNIT)}`;
}

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

/**
 * Calculate a dog's age from a birth year (YYYY).
 * Assumes July 1 of the birth year as a mid-year estimate.
 * Returns "~X yrs", "X months", or "age unknown".
 */
function calcAge(born) {
  if (!born) return 'age unknown';
  const year = parseInt(born, 10);
  if (isNaN(year)) return 'age unknown';
  const now = new Date();
  const birthDate = new Date(year, 6, 1); // July 1 of birth year
  if (birthDate > now) return '< 1 month';
  const totalMonths =
    (now.getFullYear() - birthDate.getFullYear()) * 12 +
    (now.getMonth() - birthDate.getMonth());
  if (totalMonths < 1) return '< 1 month';
  if (totalMonths < 12) return totalMonths === 1 ? '1 month' : `${totalMonths} months`;
  const years = Math.floor(totalMonths / 12);
  return years === 1 ? '~1 yr' : `~${years} yrs`;
}

/** Build compact tile HTML for a single dog */
function buildDogCard(meta, body) {
  // Auto-update age in the breed field using the born: year from frontmatter
  if (meta.breed) {
    meta.breed = meta.breed.replace(/~?\d+\s*(?:yrs?|months?)/, calcAge(meta.born));
  }
  const rawName = meta.name || 'Dog';
  const nameEmoji = meta.nameEmoji || '';
  const displayName = rawName.replace(nameEmoji, '').trim();

  const searchText = [rawName, meta.breed, meta.tags, body].join(' ').toLowerCase();
  const bg = getIllustrationBg(meta);

  const photoArea = meta.image
    ? `<div class="dog-tile-photo"><img src="${meta.image}" alt="${esc(rawName)}" class="dog-photo" loading="lazy"></div>`
    : `<div class="dog-tile-emoji" style="background:${bg}"><span class="dog-emoji-big">${meta.emoji || '🐕'}</span></div>`;

  return `<div class="dog-card"
      data-search="${esc(searchText)}"
      data-name="${esc(displayName)}"
      data-name-emoji="${esc(nameEmoji)}"
      data-breed="${esc(meta.breed)}"
      data-body="${esc(body)}"
      data-tags="${esc(meta.tags)}"
      data-image="${esc(meta.image)}"
      data-emoji="${esc(meta.emoji || '🐕')}"
      data-bg-light="${esc(meta.bgLight)}"
      data-bg-dark="${esc(meta.bgDark)}">
    ${photoArea}
    <div class="dog-tile-name">${esc(displayName)}</div>
  </div>`;
}

/** Fetch a single dog markdown file and return parsed data */
async function fetchDog(filename) {
  const res = await fetch('public/dogs/content/' + filename);
  if (!res.ok) throw new Error('Could not load ' + filename);
  const text = await res.text();
  return parseDogMd(text);
}

/** Apply the image's natural aspect-ratio to its container, then recalc masonry span */
function applyDogOrientation(img) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) return;
  const container = img.closest('.dog-tile-photo');
  const card      = img.closest('.dog-card');
  if (container) container.style.aspectRatio = `${w} / ${h}`;
  if (card) {
    card.dataset.orientation = w >= h ? 'landscape' : 'portrait';
    requestAnimationFrame(() => setCardSpan(card));
  }
}

/** Watch the grid for width changes and recalculate all spans */
function initMasonryResize() {
  const grid = document.getElementById('dogs-grid');
  if (!grid || !window.ResizeObserver) return;
  const ro = new ResizeObserver(() => {
    grid.querySelectorAll('.dog-card').forEach(setCardSpan);
  });
  ro.observe(grid);
}

/** Attach load/error listeners to all .dog-photo images (handles cached images too) */
function initDogPhotos() {
  document.querySelectorAll('.dog-photo').forEach(img => {
    if (img.complete && img.naturalWidth > 0) {
      applyDogOrientation(img);
      img.classList.add('loaded');
    } else {
      img.addEventListener('load', () => {
        applyDogOrientation(img);
        img.classList.add('loaded');
      });
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
    initMasonryResize();

    if (errors.length) {
      const errDiv = document.createElement('div');
      errDiv.className = 'dogs-error';
      errDiv.textContent = `⚠️ ${errors.length} dog profile(s) couldn't be loaded.`;
      grid.appendChild(errDiv);
    }

    if (cards.length === 0) {
      grid.innerHTML = '<div class="dogs-loading">no dogs found — add .md files to public/dogs/content/ 🐾</div>';
    }
  } catch (e) {
    grid.innerHTML = `<div class="dogs-error">
      ⚠️ couldn't load dogs — make sure public/dogs/manifest.json exists and lists your .md files under content/.<br>
      <small style="opacity:0.7;">${e.message}</small>
    </div>`;
  }
}
