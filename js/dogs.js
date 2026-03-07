/* ─── dogs.js ─── load & render dog cards from public/dogs/*.md ─── */

/** Row unit must match grid-auto-rows in CSS (px) */
const GRID_ROW_UNIT = 4;

/** Set a card's grid-row-end span to match its actual rendered height + margins */
function setCardSpan(card) {
  // Measure BEFORE writing — clearing gridRowEnd first causes a reflow that
  // collapses the card to its minimum height, corrupting the measurement.
  const h = card.getBoundingClientRect().height;
  if (!h) return;
  const style = getComputedStyle(card);
  const vMargin = parseFloat(style.marginTop) + parseFloat(style.marginBottom);
  const span = Math.ceil((h + vMargin) / GRID_ROW_UNIT);
  card.style.gridRowEnd = `span ${span}`;
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

/** Extract location from breed string (text after 📍 and before first ·) */
function parseLocation(breed) {
  if (!breed) return '';
  const m = breed.match(/📍\s*(.+?)\s*·/);
  return m ? m[1].trim() : '';
}

/** Map specific campus locations to general area groups for filtering */
const LOCATION_GROUP_MAP = {
  'Gate 1': 'Gate 1',
  'Gate 1/Gate 2': 'Gate 1',
  'Gate 2': 'Gate 2',
  'Gate 2/Antil Dhaba': 'Gate 2',
  'Gate 2/WUD': 'Gate 2',
  'Opposite Gate 2': 'Gate 2',
  'Gate 3': 'Gate 3',
  'Gate 3 Construction': 'Gate 3',
  'Around Gate 3': 'Gate 3',
  'ASG': 'ASG',
  'Morriko/ASG': 'ASG',
  'Beyond Morriko/ASG': 'ASG',
  'Police Station/ASG': 'Police Station',
  'Tapri': 'Tapri',
  'Next to Roti Boti': 'Tapri',
  'Next to WUD': 'WUD',
  'Near WUD': 'WUD',
  'Commissioner\'s Office': 'Commissioner\'s Office',
  'Police Station': 'Police Station',
  'Shelter': 'Shelter',
};

function toGeneralLocation(specific) {
  if (!specific) return '';
  return LOCATION_GROUP_MAP[specific] || specific;
}

/** Extract gender from breed string: ♀ → 'female', ♂ → 'male' */
function parseGender(breed) {
  if (!breed) return '';
  if (breed.includes('♀')) return 'female';
  if (breed.includes('♂')) return 'male';
  return '';
}

/** Calculate age in total months (same logic as calcAge). Returns -1 if unknown. */
function calcAgeMonths(born) {
  if (!born) return -1;
  const year = parseInt(born, 10);
  if (isNaN(year)) return -1;
  const now = new Date();
  const birthDate = new Date(year, 6, 1);
  if (birthDate > now) return 0;
  const total =
    (now.getFullYear() - birthDate.getFullYear()) * 12 +
    (now.getMonth() - birthDate.getMonth());
  return Math.max(0, total);
}

/** Active filter state — updated by initDogFilters, read by applyFilters */
const filterState = {
  gender: 'all',
  sterilized: 'all',
  vaccinated: 'all',
  locations: new Set(),
  ageMin: 0,
  ageMax: 9999
};

/** Build compact tile HTML for a single dog */
function buildDogCard(meta, body) {
  // Auto-update age in the breed field using the born: year from frontmatter
  if (meta.breed) {
    meta.breed = meta.breed.replace(/~?\d+\s*(?:yrs?|months?)/, calcAge(meta.born));
  }
  const rawName = meta.name || 'Dog';
  const nameEmoji = meta.nameEmoji || '';
  const displayName = rawName.replace(nameEmoji, '').trim();

  const searchText = [rawName, meta.breed, meta.tags].join(' ').toLowerCase();
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
      data-bg-dark="${esc(meta.bgDark)}"
      data-sterilized="${esc(meta.sterilized || '')}"
      data-vaccinated="${esc(meta.vaccinated || '')}"
      data-location="${esc(toGeneralLocation(parseLocation(meta.breed)))}"
      data-gender="${esc(parseGender(meta.breed))}"
      data-age-months="${calcAgeMonths(meta.born)}">
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
    // Double-RAF: 1st frame commits the new aspectRatio style to layout,
    // 2nd frame measures the fully-settled height.
    requestAnimationFrame(() => requestAnimationFrame(() => setCardSpan(card)));
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
      img.addEventListener('error', () => { _cldImgError(img); });
    }
  });
}

/** Returns true if a card should be visible given the current query + filterState */
function computeVisibility(card, query) {
  if (query && !card.dataset.search.includes(query)) return false;
  if (filterState.locations.size > 0 && !filterState.locations.has(card.dataset.location)) return false;
  if (filterState.gender !== 'all' && card.dataset.gender !== filterState.gender) return false;
  const ageMonths = parseInt(card.dataset.ageMonths, 10);
  if (ageMonths >= 0 && (ageMonths < filterState.ageMin || ageMonths > filterState.ageMax)) return false;
  if (filterState.sterilized !== 'all') {
    const s = card.dataset.sterilized === 'true';
    if (filterState.sterilized === 'yes' && !s) return false;
    if (filterState.sterilized === 'no' && s) return false;
  }
  if (filterState.vaccinated !== 'all') {
    const v = card.dataset.vaccinated === 'true';
    if (filterState.vaccinated === 'yes' && !v) return false;
    if (filterState.vaccinated === 'no' && v) return false;
  }
  return true;
}

/** Apply search text + all active filters; update card visibility and count */
function applyFilters() {
  const input = document.getElementById('dogs-search');
  const countEl = document.getElementById('dogs-count');
  const grid = document.getElementById('dogs-grid');
  if (!grid) return;
  const q = input ? input.value.trim().toLowerCase() : '';
  const prev = grid.querySelector('.dogs-no-results');
  if (prev) prev.remove();
  let visible = 0;
  const total = grid.querySelectorAll('.dog-card').length;
  grid.querySelectorAll('.dog-card').forEach(card => {
    const show = computeVisibility(card, q);
    card.classList.toggle('dog-card-hidden', !show);
    if (show) visible++;
  });
  if (visible === 0) {
    const msg = document.createElement('div');
    msg.className = 'dogs-no-results';
    msg.textContent = 'no dogs match the current filters 🐾';
    grid.appendChild(msg);
  }
  if (countEl) countEl.textContent = visible === total ? `${total} dogs` : `${visible} of ${total}`;
  requestAnimationFrame(() => {
    grid.querySelectorAll('.dog-card:not(.dog-card-hidden)').forEach(setCardSpan);
  });
}

/** Wire up the search input to call the unified applyFilters */
function initDogSearch() {
  const input = document.getElementById('dogs-search');
  const countEl = document.getElementById('dogs-count');
  const grid = document.getElementById('dogs-grid');
  if (!input || !grid) return;
  const total = grid.querySelectorAll('.dog-card').length;
  if (countEl) countEl.textContent = `${total} dogs`;
  input.addEventListener('input', applyFilters);
  input.addEventListener('search', applyFilters); // Chrome fires 'search' when × is clicked
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
      ? `<div class="dog-modal-photo"><img src="${card.dataset.image}" alt="${card.dataset.name}" style="opacity:0;transition:opacity 0.3s" onload="this.style.opacity=1" onerror="_cldImgError(this)"></div>`
      : `<div class="dog-modal-emoji" style="background:${bg}"><span style="font-size:7rem">${card.dataset.emoji || '🐕'}</span></div>`;

    const statusBadges = [];
    if (card.dataset.sterilized === 'true') statusBadges.push('<span class="dog-status-badge dog-status-sterilized">✅ sterilized</span>');
    if (card.dataset.vaccinated === 'true') statusBadges.push('<span class="dog-status-badge dog-status-vaccinated">💉 vaccinated</span>');
    const statusHtml = statusBadges.length ? `<div class="dog-modal-status">${statusBadges.join('')}</div>` : '';

    const overlay = document.createElement('div');
    overlay.className = 'dog-modal-overlay';
    overlay.innerHTML = `
      <div class="dog-modal" role="dialog" aria-modal="true">
        <button class="dog-modal-close" aria-label="Close">✕</button>
        ${photoSection}
        <div class="dog-modal-body">
          <div class="dog-modal-name">${card.dataset.name} <span>${card.dataset.nameEmoji || ''}</span></div>
          <div class="dog-modal-breed">${card.dataset.breed || ''}</div>
          ${statusHtml}
          <p class="dog-modal-desc">${card.dataset.body || ''}</p>
          <div class="dog-modal-tags">${tags}</div>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    lockScroll();

    const ac = new AbortController();
    const close = () => { overlay.remove(); unlockScroll(); ac.abort(); };
    overlay.querySelector('.dog-modal-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    }, { signal: ac.signal });
  });
}

/** Build and wire the filter sidebar (called after dog cards are rendered) */
function initDogFilters() {
  const grid = document.getElementById('dogs-grid');
  const sidebarEl = document.getElementById('dogs-filter-sidebar');
  const filterBtn = document.getElementById('dogs-filter-btn');
  const badgeEl = document.getElementById('dogs-filter-badge');
  if (!grid || !sidebarEl || !filterBtn) return;

  // Collect unique locations and age range from loaded cards
  const cards = [...grid.querySelectorAll('.dog-card')];
  const locations = [...new Set(
    cards.map(c => c.dataset.location).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));

  const ageMthValues = cards
    .map(c => parseInt(c.dataset.ageMonths, 10))
    .filter(m => m >= 0);
  const dataMin = ageMthValues.length ? Math.min(...ageMthValues) : 0;
  const dataMax = ageMthValues.length ? Math.max(...ageMthValues) : 240;

  // Sync filterState age caps to actual data range
  filterState.ageMin = dataMin;
  filterState.ageMax = dataMax;

  const fmtAge = m => {
    if (m <= 0) return '< 1 month';
    if (m === 1) return '1 month';
    if (m < 12) return `${m} months`;
    const y = Math.floor(m / 12);
    return y === 1 ? '1 yr' : `${y} yrs`;
  };

  const locationChips = locations.map(loc =>
    `<label class="dogs-filter-chip">
      <input type="checkbox" value="${esc(loc)}">
      <span>${esc(loc)}</span>
    </label>`
  ).join('');

  sidebarEl.innerHTML = `
    <div class="dogs-filter-backdrop" id="dogs-filter-backdrop"></div>
    <aside class="dogs-filter-panel" id="dogs-filter-panel" aria-label="Filter dogs">
      <div class="dogs-filter-header">
        <span class="dogs-filter-title">filters</span>
        <button class="dogs-filter-close" id="dogs-filter-close" aria-label="Close filters">✕</button>
      </div>
      <div class="dogs-filter-body">
        <div class="dogs-filter-section">
          <div class="dogs-filter-label">location</div>
          <div class="dogs-filter-chips" id="filter-locations">${locationChips}</div>
        </div>
        <div class="dogs-filter-section">
          <div class="dogs-filter-label">gender</div>
          <div class="dogs-filter-toggle-group" id="filter-gender">
            <button class="dogs-filter-toggle active" data-val="all">all</button>
            <button class="dogs-filter-toggle" data-val="female">♀ female</button>
            <button class="dogs-filter-toggle" data-val="male">♂ male</button>
          </div>
        </div>
        <div class="dogs-filter-section">
          <div class="dogs-filter-label">age</div>
          <div class="dogs-age-slider-wrap">
            <div class="dogs-age-track"><div class="dogs-age-fill" id="dogs-age-fill"></div></div>
            <input type="range" id="age-min" class="dogs-age-range" min="${dataMin}" max="${dataMax}" value="${dataMin}" step="1">
            <input type="range" id="age-max" class="dogs-age-range" min="${dataMin}" max="${dataMax}" value="${dataMax}" step="1">
          </div>
          <div class="dogs-age-label" id="dogs-age-label">${fmtAge(dataMin)} → ${fmtAge(dataMax)}</div>
        </div>
        <div class="dogs-filter-section">
          <div class="dogs-filter-label">sterilisation</div>
          <div class="dogs-filter-toggle-group" id="filter-sterilized">
            <button class="dogs-filter-toggle active" data-val="all">all (confirmed &amp; unconfirmed)</button>
            <button class="dogs-filter-toggle" data-val="yes">yes</button>
            <button class="dogs-filter-toggle" data-val="no">not confirmed</button>
          </div>
        </div>
        <div class="dogs-filter-section">
          <div class="dogs-filter-label">vaccination</div>
          <div class="dogs-filter-toggle-group" id="filter-vaccinated">
            <button class="dogs-filter-toggle active" data-val="all">all (confirmed &amp; unconfirmed)</button>
            <button class="dogs-filter-toggle" data-val="yes">yes</button>
            <button class="dogs-filter-toggle" data-val="no">not confirmed</button>
          </div>
        </div>
      </div>
      <div class="dogs-filter-footer">
        <button class="dogs-filter-clear" id="dogs-filter-clear">clear all filters</button>
      </div>
    </aside>`;

  // ── helpers ──────────────────────────────────────────────────────────────
  const getPanel    = () => document.getElementById('dogs-filter-panel');
  const getBackdrop = () => document.getElementById('dogs-filter-backdrop');

  const openSidebar = () => {
    getPanel().classList.add('open');
    getBackdrop().classList.add('open');
    lockScroll();
  };

  const closeSidebar = () => {
    getPanel().classList.remove('open');
    getBackdrop().classList.remove('open');
    unlockScroll();
  };

  const countActiveFilters = () => {
    let n = 0;
    if (filterState.gender !== 'all') n++;
    if (filterState.sterilized !== 'all') n++;
    if (filterState.vaccinated !== 'all') n++;
    if (filterState.locations.size > 0) n++;
    if (filterState.ageMin > dataMin || filterState.ageMax < dataMax) n++;
    return n;
  };

  const updateBadge = () => {
    const n = countActiveFilters();
    if (badgeEl) { badgeEl.textContent = n || ''; badgeEl.hidden = n === 0; }
    filterBtn.classList.toggle('filters-active', n > 0);
  };

  const updateAgeLabel = () => {
    const el = document.getElementById('dogs-age-label');
    if (el) el.textContent = `${fmtAge(filterState.ageMin)} → ${fmtAge(filterState.ageMax)}`;
  };

  const updateSliderTrack = () => {
    const fill = document.getElementById('dogs-age-fill');
    if (!fill) return;
    const range = dataMax - dataMin || 1;
    const lo = ((filterState.ageMin - dataMin) / range) * 100;
    const hi = ((filterState.ageMax - dataMin) / range) * 100;
    fill.style.left  = lo + '%';
    fill.style.width = (hi - lo) + '%';
  };

  // ── open / close ──────────────────────────────────────────────────────────
  filterBtn.addEventListener('click', openSidebar);
  document.getElementById('dogs-filter-close').addEventListener('click', closeSidebar);
  getBackdrop().addEventListener('click', closeSidebar);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && getPanel().classList.contains('open')) closeSidebar();
  });

  // ── location checkboxes ───────────────────────────────────────────────────
  document.getElementById('filter-locations').addEventListener('change', e => {
    const cb = e.target;
    if (!cb.matches('input[type="checkbox"]')) return;
    if (cb.checked) filterState.locations.add(cb.value);
    else filterState.locations.delete(cb.value);
    updateBadge();
    applyFilters();
  });

  // ── toggle groups (gender, sterilized, vaccinated) ────────────────────────
  const wireToggle = (groupId, stateKey) => {
    document.getElementById(groupId).addEventListener('click', e => {
      const btn = e.target.closest('.dogs-filter-toggle');
      if (!btn) return;
      document.getElementById(groupId).querySelectorAll('.dogs-filter-toggle')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterState[stateKey] = btn.dataset.val;
      updateBadge();
      applyFilters();
    });
  };
  wireToggle('filter-gender', 'gender');
  wireToggle('filter-sterilized', 'sterilized');
  wireToggle('filter-vaccinated', 'vaccinated');

  // ── age dual range slider ─────────────────────────────────────────────────
  const ageMinEl = document.getElementById('age-min');
  const ageMaxEl = document.getElementById('age-max');

  ageMinEl.addEventListener('input', () => {
    const v = Math.min(parseInt(ageMinEl.value, 10), filterState.ageMax);
    ageMinEl.value = v;
    filterState.ageMin = v;
    updateAgeLabel();
    updateSliderTrack();
    updateBadge();
    applyFilters();
  });

  ageMaxEl.addEventListener('input', () => {
    const v = Math.max(parseInt(ageMaxEl.value, 10), filterState.ageMin);
    ageMaxEl.value = v;
    filterState.ageMax = v;
    updateAgeLabel();
    updateSliderTrack();
    updateBadge();
    applyFilters();
  });

  // ── clear all ─────────────────────────────────────────────────────────────
  document.getElementById('dogs-filter-clear').addEventListener('click', () => {
    filterState.gender    = 'all';
    filterState.sterilized = 'all';
    filterState.vaccinated = 'all';
    filterState.locations  = new Set();
    filterState.ageMin = dataMin;
    filterState.ageMax = dataMax;

    document.getElementById('filter-locations')
      .querySelectorAll('input[type="checkbox"]')
      .forEach(cb => { cb.checked = false; });

    ['filter-gender', 'filter-sterilized', 'filter-vaccinated'].forEach(id => {
      document.getElementById(id).querySelectorAll('.dogs-filter-toggle')
        .forEach(b => b.classList.toggle('active', b.dataset.val === 'all'));
    });

    ageMinEl.value = dataMin;
    ageMaxEl.value = dataMax;
    updateAgeLabel();
    updateSliderTrack();
    updateBadge();
    applyFilters();
  });

  // Initial slider track fill
  updateSliderTrack();
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
    initDogFilters();

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
