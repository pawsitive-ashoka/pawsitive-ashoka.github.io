/* ─── team.js ─── load & render cinematic team showcase ─── */

const PASTEL_COLORS = ['#fde8d8','#fdf0c0','#d8f0e8','#d8e8fd','#fde8f0','#f0d8fd'];

function parseTeamMd(raw) {
  const lines = raw.trim().split('\n');
  const meta = {};
  let i = 0;
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
  i++;
  const body = lines.slice(i).join('\n').trim();
  return { meta, body };
}

function esc(s) { return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function imageExists(meta) {
  return meta.image && meta.image.trim().length > 0;
}

/* ── Cinema avatar helpers ── */
function cinemaAvatarHtml(meta, idx, hasImage) {
  const color = PASTEL_COLORS[idx % PASTEL_COLORS.length];
  if (hasImage) {
    return `<div class="cinema-avatar" style="--ph-color:${color};">
      <img class="cinema-avatar-img" src="${esc(meta.image)}" alt="${esc(meta.name)}" loading="lazy" onerror="this.remove();this.parentNode.querySelector('.cinema-avatar-fallback').style.display=''">
      <span class="cinema-avatar-fallback" style="display:none">🐾</span>
    </div>`;
  }
  return `<div class="cinema-avatar" style="--ph-color:${color};">
    <span class="cinema-avatar-fallback">🐾</span>
  </div>`;
}

function coreAvatarHtml(meta, idx, hasImage) {
  const color = PASTEL_COLORS[idx % PASTEL_COLORS.length];
  const noFallbackNames = ['Pia Rattan', 'Ishaan Sen Dave', 'Rutupurna Debalina Malik'];
  if (hasImage) {
    return `<div class="core-avatar" style="--ph-color:${color};">
      <img class="core-avatar-img" src="${esc(meta.image)}" alt="${esc(meta.name)}" loading="lazy" onerror="this.remove();this.parentNode.querySelector('.core-avatar-fallback').style.display=''">
      <span class="core-avatar-fallback" style="display:none">🐾</span>
    </div>`;
  }
  const fallback = noFallbackNames.includes(meta.name) ? '' : '🐾';
  return `<div class="core-avatar" style="--ph-color:${color};">
    <span class="core-avatar-fallback">${fallback}</span>
  </div>`;
}

/* ── Leadership Carousel ── */
function renderLeadershipCinema(sections, container) {
  const flat = [];
  for (const section of sections) {
    for (const member of section.members) {
      flat.push({ ...member, sectionLabel: section.label });
    }
  }

  let cardsHtml = '';
  let dotsHtml = '';
  flat.forEach((member, idx) => {
    const m = member.meta;
    const bio = member.body || 'Bio coming soon...';
    const hasImg = imageExists(m);
    const activeClass = idx === 0 ? ' active' : '';
    const images = [m.image, m.image2, m.image3, m.image4].filter(x => x && x.trim());
    cardsHtml += `<div class="cinema-card${activeClass}" data-idx="${idx}"
      data-name="${esc(m.name)}" data-role="${esc(m.role)}"
      data-batch="${esc(m.batch)}" data-bio="${esc(bio)}"
      data-spirit-dog="${esc(m.spirit_dog || '')}"
      data-images="${esc(images.join('|'))}" data-section-label="${esc(member.sectionLabel)}">
      ${cinemaAvatarHtml(m, idx, hasImg)}
      <div class="cinema-info">
        <h3 class="cinema-name">${esc(m.name)}</h3>
        <span class="cinema-role">${esc(m.role)}</span>
        ${m.spirit_dog ? `<span class="cinema-spirit-dog">🐾 ${esc(m.spirit_dog)}</span>` : ''}
      </div>
    </div>`;
    dotsHtml += `<button class="cinema-dot${idx === 0 ? ' active' : ''}" data-idx="${idx}" aria-label="Go to ${esc(m.name)}"></button>`;
  });

  const firstLabel = flat.length > 0 ? esc(flat[0].sectionLabel) : '';
  container.innerHTML = `
    <div class="cinema-carousel">
      <span class="cinema-section-label">${firstLabel}</span>
      <div class="cinema-card-wrap">${cardsHtml}</div>
      <div class="cinema-nav">
        <button class="cinema-nav-arrow" data-dir="prev" aria-label="Previous">&#8249;</button>
        <div class="cinema-dots">${dotsHtml}</div>
        <button class="cinema-nav-arrow" data-dir="next" aria-label="Next">&#8250;</button>
      </div>
      <div class="cinema-progress-wrap"><div class="cinema-progress-bar"></div></div>
    </div>`;
}

/* ── Core Grid ── */
function renderCoreGrid(members, container) {
  let html = '';
  members.forEach((member, idx) => {
    const m = member.meta;
    const hasImg = imageExists(m);
    const coreBio = member.body ? member.body.trim() : '';
    const coreSDog = m.spirit_dog || '';
    const hasPopup = coreBio || coreSDog;
    const coreImages = [m.image, m.image2, m.image3, m.image4].filter(x => x && x.trim());
    html += `<div class="core-grid-item${hasPopup ? ' core-grid-item--has-popup' : ''}" style="--i:${idx}"
      data-name="${esc(m.name)}" data-role="${esc(m.department || 'Core Team')}"
      data-batch="${esc(m.batch || '')}" data-bio="${esc(coreBio)}"
      data-spirit-dog="${esc(coreSDog)}" data-images="${esc(coreImages.join('|'))}">
      ${coreAvatarHtml(m, idx, hasImg)}
      <span class="core-name">${esc(m.name)}</span>
      ${coreSDog ? `<span class="core-spirit-dog">🐾 ${esc(coreSDog)}</span>` : ''}
    </div>`;
  });
  container.innerHTML = `<div class="core-grid">${html}</div>`;
}

/* ── Members Wall ── */
function renderMembersWall(names, container) {
  let html = '';
  names.forEach((name, idx) => {
    html += `<span class="member-pill" style="--i:${idx}">${esc(name)}</span>`;
  });
  container.innerHTML = `<div class="members-wall">${html}</div>`;
}

/* ── Carousel Controller ── */
function initLeaderCarousel() {
  const carousel = document.querySelector('.cinema-carousel');
  if (!carousel) return;

  const cards = carousel.querySelectorAll('.cinema-card');
  const dots = carousel.querySelectorAll('.cinema-dot');
  const label = carousel.querySelector('.cinema-section-label');
  const progressBar = carousel.querySelector('.cinema-progress-bar');
  const INTERVAL = 5000;
  let currentIdx = 0;
  let autoTimer = null;

  function show(idx) {
    currentIdx = ((idx % cards.length) + cards.length) % cards.length;
    cards.forEach((c, i) => c.classList.toggle('active', i === currentIdx));
    dots.forEach((d, i) => d.classList.toggle('active', i === currentIdx));
    const sectionLabel = cards[currentIdx].dataset.sectionLabel;
    if (label && sectionLabel) label.textContent = sectionLabel;
    if (typeof window.__syncTeamPopupFromLeaderCard === 'function') {
      window.__syncTeamPopupFromLeaderCard(cards[currentIdx]);
    }
    resetProgress();
  }

  function resetProgress() {
    if (!progressBar) return;
    progressBar.style.animation = 'none';
    // force reflow
    void progressBar.offsetWidth;
    progressBar.style.animation = `cinemaProgress ${INTERVAL}ms linear forwards`;
  }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(() => show(currentIdx + 1), INTERVAL);
    resetProgress();
  }

  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }

  // Arrow handlers
  carousel.addEventListener('click', e => {
    const arrow = e.target.closest('.cinema-nav-arrow');
    if (arrow) {
      show(arrow.dataset.dir === 'next' ? currentIdx + 1 : currentIdx - 1);
      startAuto();
      return;
    }
    const dot = e.target.closest('.cinema-dot');
    if (dot) {
      show(Number(dot.dataset.idx));
      startAuto();
    }
  });

  // Pause on hover
  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', startAuto);

  // Keyboard
  document.addEventListener('keydown', e => {
    const leaderSection = document.querySelector('[data-section="leadership"]');
    if (!leaderSection || leaderSection.style.display === 'none') return;
    if (e.key === 'ArrowRight') { show(currentIdx + 1); startAuto(); }
    if (e.key === 'ArrowLeft') { show(currentIdx - 1); startAuto(); }
  });

  startAuto();
}

/* ── Popup ── */
function initTeamPopup() {
  const overlay = document.getElementById('team-popup-overlay');
  if (!overlay) return;
  const prevBtn = overlay.querySelector('.team-popup-nav-prev');
  const nextBtn = overlay.querySelector('.team-popup-nav-next');

  const closePopup = () => {
    overlay.classList.remove('active');
    overlay.dataset.popupSource = '';
    overlay.dataset.currentName = '';
  };
  overlay.querySelector('.team-popup-close').addEventListener('click', closePopup);
  overlay.addEventListener('click', e => { if (e.target === overlay) closePopup(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopup(); });

  function openPopup(name, role, batch, bio, images, spiritDog, source = '') {
    const popupCard = overlay.querySelector('.team-popup-card');
    const avatarEl = popupCard.querySelector('.team-popup-avatar');
    const stripEl = popupCard.querySelector('.team-popup-img-strip');
    let activeImageIndex = 0;

    function setMain(src) {
      avatarEl.innerHTML = `<img class="team-popup-avatar-img" src="${esc(src)}" alt="${esc(name)}"
        onerror="this.remove();this.parentNode.innerHTML='<span class=\\'team-popup-emoji\\'>🐾</span>'">`;
    }

    if (images.length) {
      activeImageIndex = 0;
      setMain(images[0]);
      avatarEl.classList.add('team-popup-avatar--zoomable');
      avatarEl.title = 'Click to enlarge';
      avatarEl.onclick = () => {
        if (typeof openDeptLightbox === 'function') {
          openDeptLightbox(images, activeImageIndex);
        }
      };
    } else {
      avatarEl.innerHTML = `<span class="team-popup-emoji">🐾</span>`;
      avatarEl.classList.remove('team-popup-avatar--zoomable');
      avatarEl.title = '';
      avatarEl.onclick = null;
    }

    if (images.length > 1) {
      stripEl.classList.add('has-thumbs');
      stripEl.innerHTML = images.map((src, i) =>
        `<button class="popup-thumb${i === 0 ? ' active' : ''}" data-src="${esc(src)}" data-idx="${i}">
          <img src="${esc(src)}" alt="" loading="lazy">
        </button>`
      ).join('');
      stripEl.querySelectorAll('.popup-thumb').forEach(btn => {
        btn.addEventListener('click', () => {
          stripEl.querySelectorAll('.popup-thumb').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeImageIndex = Number(btn.dataset.idx || 0);
          setMain(btn.dataset.src);
        });
      });
    } else {
      stripEl.classList.remove('has-thumbs');
      stripEl.innerHTML = '';
    }

    popupCard.querySelector('.team-popup-name').textContent = name;
    popupCard.querySelector('.team-popup-role').textContent = role;
    popupCard.querySelector('.team-popup-batch').textContent = batch;
      const sdEl = popupCard.querySelector('.team-popup-spirit-dog');
      sdEl.innerHTML = '';
      if (spiritDog) {
        const lbl = document.createElement('span');
        lbl.className = 'team-popup-spirit-dog-label';
        lbl.textContent = 'spirit dog: ';
        sdEl.appendChild(lbl);

        const dogNames = spiritDog
          .split('/')
          .map(s => s.trim())
          .filter(Boolean);

        dogNames.forEach((dogName, idx) => {
          const a = document.createElement('a');
          a.className = 'team-popup-spirit-dog-link';
          a.textContent = dogName;
          a.href = '#';
          a.addEventListener('click', async e => {
            e.preventDefault();
            closePopup();
            await showPage('dogs');

            // Wait until dog cards are rendered, then open the matched dog card directly.
            function tryOpenDog() {
              const input = document.getElementById('dogs-search');
              const grid = document.getElementById('dogs-grid');
              if (input && grid && grid.querySelector('.dog-card')) {
                input.value = '';
                input.dispatchEvent(new Event('input'));

                const cards = [...grid.querySelectorAll('.dog-card')];
                const target = dogName.trim().toLowerCase();
                const exact = cards.find(c => (c.dataset.name || '').trim().toLowerCase() === target);
                const starts = cards.find(c => (c.dataset.name || '').trim().toLowerCase().startsWith(target));
                const partial = cards.find(c => (c.dataset.name || '').trim().toLowerCase().includes(target));
                const match = exact || starts || partial;
                if (match) {
                  match.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  setTimeout(() => match.click(), 120);
                }
              } else {
                setTimeout(tryOpenDog, 80);
              }
            }

            setTimeout(tryOpenDog, 0);
          });

          sdEl.appendChild(a);
          if (idx < dogNames.length - 1) {
            sdEl.appendChild(document.createTextNode(' / '));
          }
        });
      }
      popupCard.querySelector('.team-popup-bio').textContent = bio;
    overlay.dataset.popupSource = source;
    overlay.dataset.currentName = name;
    overlay.classList.add('active');

    if (prevBtn) prevBtn.disabled = false;
    if (nextBtn) nextBtn.disabled = false;
  }

  function openPopupFromCard(card, source = 'leadership') {
    if (!card) return;
    openPopup(
      card.dataset.name,
      card.dataset.role,
      card.dataset.batch,
      card.dataset.bio,
      (card.dataset.images || '').split('|').filter(Boolean),
      card.dataset.spiritDog || '',
      source
    );
  }

  // Used by the leadership carousel so an open leadership popup tracks auto/manual slide changes.
  window.__syncTeamPopupFromLeaderCard = card => {
    if (!overlay.classList.contains('active')) return;
    if (overlay.dataset.popupSource !== 'leadership') return;
    openPopupFromCard(card, 'leadership');
  };

  function stepCorePopup(dir) {
    const coreItems = [...document.querySelectorAll('[data-section="core"] .core-grid-item--has-popup')];
    if (!coreItems.length) return;
    const currentName = (overlay.dataset.currentName || '').trim();
    let idx = coreItems.findIndex(item => (item.dataset.name || '').trim() === currentName);
    if (idx < 0) idx = 0;
    const nextIdx = (idx + dir + coreItems.length) % coreItems.length;
    const item = coreItems[nextIdx];
    openPopup(
      item.dataset.name,
      item.dataset.role,
      item.dataset.batch,
      item.dataset.bio,
      (item.dataset.images || '').split('|').filter(Boolean),
      item.dataset.spiritDog || '',
      'core'
    );
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (!overlay.classList.contains('active')) return;
      if (overlay.dataset.popupSource === 'leadership') {
        const arrow = document.querySelector('.cinema-carousel .cinema-nav-arrow[data-dir="prev"]');
        if (arrow) arrow.click();
      } else if (overlay.dataset.popupSource === 'core') {
        stepCorePopup(-1);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (!overlay.classList.contains('active')) return;
      if (overlay.dataset.popupSource === 'leadership') {
        const arrow = document.querySelector('.cinema-carousel .cinema-nav-arrow[data-dir="next"]');
        if (arrow) arrow.click();
      } else if (overlay.dataset.popupSource === 'core') {
        stepCorePopup(1);
      }
    });
  }

  const leadershipSection = document.querySelector('[data-section="leadership"]');
  if (leadershipSection) {
    leadershipSection.addEventListener('click', e => {
      const card = e.target.closest('.cinema-card');
      if (!card) return;
      openPopupFromCard(card, 'leadership');
    });
  }

  const coreSection = document.querySelector('[data-section="core"]');
  if (coreSection) {
    coreSection.addEventListener('click', e => {
      const item = e.target.closest('.core-grid-item--has-popup');
      if (!item) return;
      openPopup(
        item.dataset.name,
        item.dataset.role,
        item.dataset.batch,
        item.dataset.bio,
        (item.dataset.images || '').split('|').filter(Boolean),
        item.dataset.spiritDog || '',
        'core'
      );
    });
  }
}

/* ── Main loader ── */
async function loadTeam() {
  const leadershipContainer = document.getElementById('team-leadership');
  const coreContainer = document.getElementById('team-core');
  const membersContainer = document.getElementById('team-members');

  if (!leadershipContainer) return;

  const isDev = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
  const bust = isDev ? `?v=${Date.now()}` : '';

  try {
    // Fetch leadership
    const leaderManifest = await fetch('public/team/leadership/manifest.json' + bust).then(r => r.json());
    const leaderSections = [];
    for (const section of leaderManifest.sections) {
      const results = await Promise.allSettled(
        section.members.map(async f => {
          const res = await fetch('public/team/leadership/content/' + f + bust);
          if (!res.ok) throw new Error(res.status);
          return parseTeamMd(await res.text());
        })
      );
      leaderSections.push({
        label: section.label,
        members: results.filter(r => r.status === 'fulfilled').map(r => r.value)
      });
    }
    renderLeadershipCinema(leaderSections, leadershipContainer);

    // Fetch core
    const coreManifest = await fetch('public/team/core/manifest.json' + bust).then(r => r.json());
    const coreResults = await Promise.allSettled(
      coreManifest.members.map(async f => {
        const res = await fetch('public/team/core/content/' + f + bust);
        if (!res.ok) throw new Error(res.status);
        return parseTeamMd(await res.text());
      })
    );
    const coreMembers = coreResults.filter(r => r.status === 'fulfilled').map(r => r.value);
    renderCoreGrid(coreMembers, coreContainer);

    // Fetch members
    const membersRes = await fetch('public/team/members/members.md' + bust);
    const membersTxt = await membersRes.text();
    const memberNames = membersTxt.trim().split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean);
    renderMembersWall(memberNames, membersContainer);

    // Init popup & carousel
    initTeamPopup();
    initLeaderCarousel();

  } catch (e) {
    leadershipContainer.innerHTML = `<div style="text-align:center;padding:2rem;font-family:'Caveat',cursive;color:var(--accent);">
      ⚠️ couldn't load team data. try refreshing.</div>`;
  }
}
