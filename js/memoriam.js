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
  const dates      = meta.dates    || '';

  const datesBadge = meta.dates
    ? `<div class="memorial-tile-dates">${meta.dates}</div>`
    : '';

  const searchText = [rawName, meta.breed, meta.tags].join(' ').toLowerCase();
  const candleDelay = randBetween(0, 2.5).toFixed(2);

  const photoArea = meta.image
    ? `<div class="dog-tile-photo">
         <img src="${meta.image}" alt="${esc(rawName)}" class="dog-photo memorial-photo" loading="lazy">
       </div>`
    : `<div class="dog-tile-emoji" style="background:${meta.bgLight || ''}">
         <span class="dog-emoji-big">${meta.emoji || '🐕'}</span>
       </div>`;

  // Candle is a direct child of .memorial-card, NOT inside .memorial-card-inner.
  // .memorial-card-inner carries the grayscale filter; the candle is free of it
  // so it can gain colour and glow immediately on hover, before the card reveals.
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
      data-passed="${esc(passed)}"
      data-dates="${esc(dates)}">
    <span class="memorial-candle" style="animation-delay:${candleDelay}s" aria-hidden="true">🕯️</span>
    <div class="memorial-card-inner">
      ${photoArea}
      <div class="dog-tile-name">${esc(displayName)}</div>
      ${datesBadge}
    </div>
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
      img.addEventListener('error', () => { _cldImgError(img); });
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

  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const LONG_PRESS_MS = 500;
  const MOVE_THRESHOLD = 10; // px — cancel if finger moves too far

  /* ── Touch: long-press toggles .lit, quick tap opens modal ── */
  if (isTouch) {
    let pressTimer = null;
    let startX = 0, startY = 0;
    let didLongPress = false;
    let activeCard = null;

    // Show a one-time hint on first visit
    const hintKey = 'pawsitive-memoriam-hint-shown';
    if (!sessionStorage.getItem(hintKey)) {
      requestAnimationFrame(() => {
        const hint = document.createElement('div');
        hint.className = 'memoriam-hint';
        hint.textContent = 'hold a card to light a candle 🕯️';
        document.body.appendChild(hint);
        setTimeout(() => hint.classList.add('show'), 600);
        setTimeout(() => {
          hint.classList.remove('show');
          setTimeout(() => hint.remove(), 500);
        }, 4000);
        sessionStorage.setItem(hintKey, '1');
      });
    }

    grid.addEventListener('touchstart', e => {
      const card = e.target.closest('.dog-card');
      if (!card) return;
      activeCard = card;
      didLongPress = false;
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;

      pressTimer = setTimeout(() => {
        didLongPress = true;
        card.classList.add('lit');
        if (navigator.vibrate) navigator.vibrate(50);
      }, LONG_PRESS_MS);
    }, { passive: true });

    grid.addEventListener('touchmove', e => {
      if (!pressTimer) return;
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - startX);
      const dy = Math.abs(touch.clientY - startY);
      if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    }, { passive: true });

    grid.addEventListener('touchend', e => {
      clearTimeout(pressTimer);
      pressTimer = null;
      if (didLongPress) {
        didLongPress = false;
        if (activeCard) activeCard.classList.remove('lit');
        activeCard = null;
        return;
      }
      if (activeCard) openMemorialModal(activeCard);
      activeCard = null;
    });

    grid.addEventListener('touchcancel', () => {
      clearTimeout(pressTimer);
      pressTimer = null;
      if (activeCard) activeCard.classList.remove('lit');
      didLongPress = false;
      activeCard = null;
    });

    // Suppress native context menu on long press within the grid
    grid.addEventListener('contextmenu', e => {
      if (e.target.closest('.dog-card')) e.preventDefault();
    });
  }

  /* ── Desktop: click opens modal (hover handles candle/colour via CSS) ── */
  grid.addEventListener('click', e => {
    if (isTouch) return;
    const card = e.target.closest('.dog-card');
    if (!card) return;
    openMemorialModal(card);
  });
}

/** Build and show the memorial detail modal */
function openMemorialModal(card) {
    const dark = document.documentElement.dataset.theme === 'dark';
    const bg   = dark ? (card.dataset.bgDark || '') : (card.dataset.bgLight || '');

    const dates = card.dataset.dates || '';
    const datesLine = dates
      ? `<div class="memorial-modal-dates">🌱 ${dates} 🕯️</div>`
      : '';

    const tags = (card.dataset.tags || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
      .map(t => `<span class="dog-modal-tag">${t}</span>`)
      .join('');

    const photoSection = card.dataset.image
      ? `<div class="dog-modal-photo memorial-modal-photo-wrap">
           <img src="${card.dataset.image}" alt="${card.dataset.name}" style="opacity:0;transition:opacity 0.3s" onload="this.style.opacity=1" onerror="_cldImgError(this)">
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
