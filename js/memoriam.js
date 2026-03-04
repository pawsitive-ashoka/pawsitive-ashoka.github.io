/* ─── memoriam.js ─── load & render memorial dog cards ─── */

/** Random float between min and max */
function randBetween(min, max) {
  return Math.random() * (max - min) + min;
}

/** Build a memorial tile card for a single dog */
function buildMemorialCard(meta, body) {
  // Do NOT recalculate age — memorial dogs show the age at time of passing,
  // exactly as written in their .md file.

  const rawName    = meta.name     || 'Dog';
  const nameEmoji  = meta.nameEmoji || '';
  const displayName = rawName.replace(nameEmoji, '').trim();
  const passed     = meta.passed   || '';
  const born       = meta.born     || '';

  const searchText = [rawName, meta.breed, meta.tags].join(' ').toLowerCase();
  const candleDelay = randBetween(0, 2.5).toFixed(2);

  const photoArea = meta.image
    ? `<div class="dog-tile-photo">
         <img src="${meta.image}" alt="${esc(rawName)}" class="dog-photo memorial-photo" loading="lazy">
       </div>`
    : `<div class="dog-tile-emoji" style="background:${meta.bgLight || ''}">
         <span class="dog-emoji-big">${meta.emoji || '🐕'}</span>
       </div>`;

  const datesBadge = (born || passed)
    ? `<div class="memorial-tile-dates">${born || '?'} – ${passed || '?'}</div>`
    : '';

  return `<div class="dog-card memorial-card"
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
      data-born="${esc(born)}"
      data-passed="${esc(passed)}">
    ${photoArea}
    <div class="dog-tile-name">${esc(displayName)}</div>
    ${datesBadge}
    <span class="memorial-candle" style="animation-delay:${candleDelay}s" aria-hidden="true">🕯️</span>
  </div>`;
}

/** Apply natural aspect-ratio to memorial photo containers */
function applyMemorialOrientation(img) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) return;
  const container = img.closest('.dog-tile-photo');
  const card      = img.closest('.dog-card');
  if (container) container.style.aspectRatio = `${w} / ${h}`;
  if (card) {
    card.dataset.orientation = w >= h ? 'landscape' : 'portrait';
    requestAnimationFrame(() => requestAnimationFrame(() => setCardSpan(card)));
  }
}

/** Attach load/error listeners to all memorial photos */
function initMemorialPhotos() {
  document.querySelectorAll('.memorial-photo').forEach(img => {
    if (img.complete && img.naturalWidth > 0) {
      applyMemorialOrientation(img);
      img.classList.add('loaded');
    } else {
      img.addEventListener('load', () => {
        applyMemorialOrientation(img);
        img.classList.add('loaded');
      });
      img.addEventListener('error', () => { img.style.display = 'none'; });
    }
  });
}

/** Watch grid for width changes and recalculate spans */
function initMemorialMasonryResize() {
  const grid = document.getElementById('memoriam-grid');
  if (!grid || !window.ResizeObserver) return;
  const ro = new ResizeObserver(() => {
    grid.querySelectorAll('.dog-card').forEach(setCardSpan);
  });
  ro.observe(grid);
}

/** Open a full-colour memorial modal when a card is clicked */
function initMemorialModals() {
  const grid = document.getElementById('memoriam-grid');
  if (!grid) return;

  grid.addEventListener('click', e => {
    const card = e.target.closest('.dog-card');
    if (!card) return;

    const dark = document.documentElement.dataset.theme === 'dark';
    const bg   = dark ? (card.dataset.bgDark || '') : (card.dataset.bgLight || '');

    const born   = card.dataset.born   || '';
    const passed = card.dataset.passed || '';
    const datesLine = (born || passed)
      ? `<div class="memorial-modal-dates">🌱 ${born || '?'} &nbsp;→&nbsp; 🕯️ ${passed || '?'}</div>`
      : '';

    const tags = (card.dataset.tags || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
      .map(t => `<span class="dog-modal-tag">${t}</span>`)
      .join('');

    /* Modal photo — rendered WITHOUT the grayscale filter because the overlay
       is appended directly to <body>, outside .memoriam-page-wrap */
    const photoSection = card.dataset.image
      ? `<div class="dog-modal-photo memorial-modal-photo-wrap">
           <img src="${card.dataset.image}" alt="${card.dataset.name}" style="opacity:0;transition:opacity 0.3s" onload="this.style.opacity=1">
         </div>`
      : `<div class="dog-modal-emoji" style="background:${bg}">
           <span style="font-size:7rem">${card.dataset.emoji || '🐕'}</span>
         </div>`;

    const overlay = document.createElement('div');
    overlay.className = 'dog-modal-overlay memorial-modal-overlay';
    overlay.innerHTML = `
      <div class="dog-modal" role="dialog" aria-modal="true" aria-label="Memorial for ${card.dataset.name}">
        <button class="dog-modal-close" aria-label="Close">✕</button>
        ${photoSection}
        <div class="dog-modal-body">
          <div class="dog-modal-name">${card.dataset.name} <span>${card.dataset.nameEmoji || '🌟'}</span></div>
          <div class="dog-modal-breed">${card.dataset.breed || ''}</div>
          ${datesLine}
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

/** Main entry: fetch manifest, load all memorial dogs, render to grid */
async function loadMemorial() {
  const grid = document.getElementById('memoriam-grid');
  if (!grid) return;

  grid.innerHTML = '<div class="dogs-loading">🕯️ loading…</div>';

  try {
    const manifestRes = await fetch('public/memorial/manifest.json');
    if (!manifestRes.ok) throw new Error('memorial manifest not found');
    const { dogs: files } = await manifestRes.json();

    const results = await Promise.allSettled(
      files.map(async filename => {
        const res = await fetch('public/memorial/content/' + filename);
        if (!res.ok) throw new Error('Could not load ' + filename);
        return parseDogMd(await res.text());
      })
    );

    const cards = results
      .filter(r => r.status === 'fulfilled')
      .map(r => buildMemorialCard(r.value.meta, r.value.body));

    if (cards.length === 0) {
      grid.innerHTML = '<div class="dogs-loading" style="opacity:0.6">no entries yet 🕯️</div>';
      return;
    }

    grid.innerHTML = cards.join('');
    initMemorialPhotos();
    initMemorialModals();
    initMemorialMasonryResize();

    // Initial span calculation after a brief paint delay
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        grid.querySelectorAll('.dog-card').forEach(setCardSpan);
      });
    });

  } catch (err) {
    console.error('[memoriam]', err);
    grid.innerHTML = `<div class="dogs-loading" style="color:var(--accent)">⚠️ couldn't load memorial data.</div>`;
  }
}
