/* ─── team.js ─── year-by-year team archive ─── */
/* Shared utilities (parseFrontmatter, esc) are defined in app.js. */

const PASTEL_COLORS = ['#fde8d8','#fdf0c0','#d8f0e8','#d8e8fd','#fde8f0','#f0d8fd'];
const LEADERSHIP_DEPTS = ['Presidents', 'Secretaries'];

function imageExists(src) { return src && src.trim().length > 0; }

/* ═══════════════════════════════════════════════════════════════
   RENDER HELPERS — Cinema carousel + Core grid + Members wall
   ═══════════════════════════════════════════════════════════════ */

function cinemaAvatarHtml(meta, idx, hasImage) {
  const color = PASTEL_COLORS[idx % PASTEL_COLORS.length];
  if (hasImage) {
    return `<div class="cinema-avatar" style="--ph-color:${color};">
      <img class="cinema-avatar-img" src="${esc(meta.image)}" alt="${esc(meta.name)}" loading="lazy" onerror="this.remove();this.parentNode.querySelector('.cinema-avatar-fallback').style.display=''">
      <span class="cinema-avatar-fallback" style="display:none">🐾</span></div>`;
  }
  return `<div class="cinema-avatar" style="--ph-color:${color};"><span class="cinema-avatar-fallback">🐾</span></div>`;
}

function coreAvatarHtml(meta, idx, hasImage) {
  const color = PASTEL_COLORS[idx % PASTEL_COLORS.length];
  if (hasImage) {
    return `<div class="core-avatar" style="--ph-color:${color};">
      <img class="core-avatar-img" src="${esc(meta.image)}" alt="${esc(meta.name)}" loading="lazy" onerror="this.remove();this.parentNode.querySelector('.core-avatar-fallback').style.display=''">
      <span class="core-avatar-fallback" style="display:none">🐾</span></div>`;
  }
  return `<div class="core-avatar" style="--ph-color:${color};"><span class="core-avatar-fallback">🐾</span></div>`;
}

function renderLeadershipCinema(sections, container) {
  const flat = [];
  for (const section of sections) {
    for (const member of section.members) {
      flat.push({ ...member, sectionLabel: section.label });
    }
  }
  if (!flat.length) { container.innerHTML = '<p class="team-empty">no leadership data available.</p>'; return; }
  let cardsHtml = '', dotsHtml = '';
  flat.forEach((member, idx) => {
    const m = member.meta;
    const bio = member.body || 'Bio coming soon...';
    const hasImg = imageExists(m.image);
    const images = [m.image, m.image2, m.image3, m.image4].filter(x => x && x.trim());
    cardsHtml += `<div class="cinema-card${idx === 0 ? ' active' : ''}" data-idx="${idx}"
      data-name="${esc(m.name)}" data-role="${esc(m.role)}" data-batch="${esc(m.batch)}"
      data-bio="${esc(bio)}" data-spirit-dog="${esc(m.spirit_dog || '')}"
      data-images="${esc(images.join('|'))}" data-section-label="${esc(member.sectionLabel)}">
      ${cinemaAvatarHtml(m, idx, hasImg)}
      <div class="cinema-info">
        <h3 class="cinema-name">${esc(m.name)}</h3>
        <span class="cinema-role">${esc(m.role)}</span>
        ${m.spirit_dog ? `<span class="cinema-spirit-dog">🐾 ${esc(m.spirit_dog)}</span>` : ''}
      </div></div>`;
    dotsHtml += `<button class="cinema-dot${idx === 0 ? ' active' : ''}" data-idx="${idx}" aria-label="Go to ${esc(m.name)}"></button>`;
  });
  const firstLabel = esc(flat[0].sectionLabel);
  container.innerHTML = `<div class="cinema-carousel">
    <span class="cinema-section-label">${firstLabel}</span>
    <div class="cinema-card-wrap">${cardsHtml}</div>
    <div class="cinema-nav">
      <button class="cinema-nav-arrow" data-dir="prev" aria-label="Previous">&#8249;</button>
      <div class="cinema-dots">${dotsHtml}</div>
      <button class="cinema-nav-arrow" data-dir="next" aria-label="Next">&#8250;</button>
    </div>
    <div class="cinema-progress-wrap"><div class="cinema-progress-bar"></div></div></div>`;
}

function hasCorePopupData(member) {
  return Boolean((member.body || '').trim() || (member.meta.spirit_dog || '').trim());
}

function renderCoreGrid(members, container) {
  if (!members.length) { container.innerHTML = '<p class="team-empty">no core team data available.</p>'; return; }
  let html = '';
  members.forEach((member, idx) => {
    const m = member.meta;
    const hasImg = imageExists(m.image);
    const coreBio = member.body ? member.body.trim() : '';
    const coreSDog = m.spirit_dog || '';
    const hasPopup = hasCorePopupData(member);
    const coreImages = [m.image, m.image2, m.image3, m.image4].filter(x => x && x.trim());
    const batchLabel = (m.batch && m.batch !== 'Core') ? `<span class="core-batch">${esc(m.batch)}</span>` : '';
    html += `<div class="core-grid-item${hasPopup ? ' core-grid-item--has-popup' : ''}" style="--i:${idx}"
      data-name="${esc(m.name)}" data-role="" data-batch="${esc(m.batch || '')}"
      data-bio="${esc(coreBio)}" data-spirit-dog="${esc(coreSDog)}" data-images="${esc(coreImages.join('|'))}">
      ${coreAvatarHtml(m, idx, hasImg)}
      <span class="core-name">${esc(m.name)}</span>
      ${batchLabel}
      ${coreSDog ? `<span class="core-spirit-dog">🐾 ${esc(coreSDog)}</span>` : ''}
    </div>`;
  });
  container.innerHTML = `<div class="core-grid">${html}</div>`;
}

function renderMembersWall(names, container) {
  if (!names.length) { container.innerHTML = '<p class="team-empty">no members data available for this year.</p>'; return; }
  let html = '';
  names.forEach((name, idx) => {
    html += `<span class="member-pill" style="--i:${idx}">${esc(name)}</span>`;
  });
  container.innerHTML = `<div class="members-wall">${html}</div>`;
}

/* ═══════════════════════════════════════════════════════════════
   CAROUSEL CONTROLLER
   ═══════════════════════════════════════════════════════════════ */

function initLeaderCarousel() {
  const carousel = document.querySelector('#team-content .cinema-carousel');
  if (!carousel) return;
  const cards = carousel.querySelectorAll('.cinema-card');
  const dots = carousel.querySelectorAll('.cinema-dot');
  const label = carousel.querySelector('.cinema-section-label');
  const progressBar = carousel.querySelector('.cinema-progress-bar');
  const INTERVAL = 5000;
  let currentIdx = 0, autoTimer = null;

  function show(idx) {
    currentIdx = ((idx % cards.length) + cards.length) % cards.length;
    cards.forEach((c, i) => c.classList.toggle('active', i === currentIdx));
    dots.forEach((d, i) => d.classList.toggle('active', i === currentIdx));
    if (label && cards[currentIdx].dataset.sectionLabel) label.textContent = cards[currentIdx].dataset.sectionLabel;
    resetProgress();
  }
  function resetProgress() {
    if (!progressBar) return;
    progressBar.style.animation = 'none'; void progressBar.offsetWidth;
    progressBar.style.animation = `cinemaProgress ${INTERVAL}ms linear forwards`;
  }
  function startAuto() { stopAuto(); autoTimer = setInterval(() => show(currentIdx + 1), INTERVAL); resetProgress(); }
  function stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }

  carousel.addEventListener('click', e => {
    const arrow = e.target.closest('.cinema-nav-arrow');
    if (arrow) { show(arrow.dataset.dir === 'next' ? currentIdx + 1 : currentIdx - 1); startAuto(); return; }
    const dot = e.target.closest('.cinema-dot');
    if (dot) { show(Number(dot.dataset.idx)); startAuto(); }
  });
  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', startAuto);
  startAuto();
}

/* ═══════════════════════════════════════════════════════════════
   POPUP — initialized once
   ═══════════════════════════════════════════════════════════════ */

let popupInitialized = false;

function openTeamPopup(name, role, batch, bio, images, spiritDog, source) {
  const overlay = document.getElementById('team-popup-overlay');
  if (!overlay) return;
  const popupCard = overlay.querySelector('.team-popup-card');
  const avatarEl = popupCard.querySelector('.team-popup-avatar');
  const stripEl = popupCard.querySelector('.team-popup-img-strip');
  let activeImageIndex = 0;

  function setMain(src) {
    avatarEl.innerHTML = `<img class="team-popup-avatar-img" src="${esc(src)}" alt="${esc(name)}"
      onerror="this.remove();this.parentNode.innerHTML='<span class=\\'team-popup-emoji\\'>🐾</span>'">`;
  }
  if (images.length) {
    activeImageIndex = 0; setMain(images[0]);
    avatarEl.classList.add('team-popup-avatar--zoomable');
    avatarEl.title = 'Click to enlarge';
    avatarEl.onclick = () => { if (typeof openDeptLightbox === 'function') openDeptLightbox(images, activeImageIndex); };
  } else {
    avatarEl.innerHTML = '<span class="team-popup-emoji">🐾</span>';
    avatarEl.classList.remove('team-popup-avatar--zoomable'); avatarEl.title = ''; avatarEl.onclick = null;
  }
  if (images.length > 1) {
    stripEl.classList.add('has-thumbs');
    stripEl.innerHTML = images.map((src, i) =>
      `<button class="popup-thumb${i === 0 ? ' active' : ''}" data-src="${esc(src)}" data-idx="${i}"><img src="${esc(src)}" alt="" loading="lazy"></button>`
    ).join('');
    stripEl.querySelectorAll('.popup-thumb').forEach(btn => {
      btn.addEventListener('click', () => {
        stripEl.querySelectorAll('.popup-thumb').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); activeImageIndex = Number(btn.dataset.idx || 0); setMain(btn.dataset.src);
      });
    });
  } else { stripEl.classList.remove('has-thumbs'); stripEl.innerHTML = ''; }

  popupCard.querySelector('.team-popup-name').textContent = name;
  popupCard.querySelector('.team-popup-role').textContent = role;
  popupCard.querySelector('.team-popup-batch').textContent = batch;
  const sdEl = popupCard.querySelector('.team-popup-spirit-dog');
  sdEl.innerHTML = '';
  if (spiritDog) {
    const lbl = document.createElement('span');
    lbl.className = 'team-popup-spirit-dog-label'; lbl.textContent = 'spirit dog: ';
    sdEl.appendChild(lbl);
    spiritDog.split('/').map(s => s.trim()).filter(Boolean).forEach((dogName, idx, arr) => {
      const a = document.createElement('a');
      a.className = 'team-popup-spirit-dog-link'; a.textContent = dogName; a.href = '#';
      a.addEventListener('click', async e => {
        e.preventDefault(); closeTeamPopup(); await showPage('dogs');
        function tryOpenDog() {
          const input = document.getElementById('dogs-search');
          const grid = document.getElementById('dogs-grid');
          if (input && grid && grid.querySelector('.dog-card')) {
            input.value = ''; input.dispatchEvent(new Event('input'));
            const cards = [...grid.querySelectorAll('.dog-card')];
            const target = dogName.trim().toLowerCase();
            const match = cards.find(c => (c.dataset.name||'').trim().toLowerCase() === target)
              || cards.find(c => (c.dataset.name||'').trim().toLowerCase().startsWith(target))
              || cards.find(c => (c.dataset.name||'').trim().toLowerCase().includes(target));
            if (match) { match.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => match.click(), 120); }
          } else { setTimeout(tryOpenDog, 80); }
        }
        setTimeout(tryOpenDog, 0);
      });
      sdEl.appendChild(a);
      if (idx < arr.length - 1) sdEl.appendChild(document.createTextNode(' / '));
    });
  }
  popupCard.querySelector('.team-popup-bio').textContent = bio;
  overlay.dataset.popupSource = source || '';
  overlay.dataset.currentName = name;
  overlay.classList.add('active');
  overlay.querySelector('.team-popup-nav-prev').disabled = false;
  overlay.querySelector('.team-popup-nav-next').disabled = false;
}

function closeTeamPopup() {
  const overlay = document.getElementById('team-popup-overlay');
  if (!overlay) return;
  overlay.classList.remove('active'); overlay.dataset.popupSource = ''; overlay.dataset.currentName = '';
}

function initTeamPopup() {
  if (popupInitialized) return; popupInitialized = true;
  const overlay = document.getElementById('team-popup-overlay');
  if (!overlay) return;
  overlay.querySelector('.team-popup-close').addEventListener('click', closeTeamPopup);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeTeamPopup(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeTeamPopup(); });

  overlay.querySelector('.team-popup-nav-prev').addEventListener('click', () => {
    if (!overlay.classList.contains('active')) return;
    stepPopup(-1);
  });
  overlay.querySelector('.team-popup-nav-next').addEventListener('click', () => {
    if (!overlay.classList.contains('active')) return;
    stepPopup(1);
  });

  function stepPopup(dir) {
    const source = overlay.dataset.popupSource;
    const currentName = (overlay.dataset.currentName || '').trim();
    if (source === 'leadership') {
      const cards = [...document.querySelectorAll('#team-content .cinema-card')];
      if (!cards.length) return;
      let idx = cards.findIndex(c => (c.dataset.name||'').trim() === currentName);
      if (idx < 0) idx = 0;
      const next = cards[(idx + dir + cards.length) % cards.length];
      openTeamPopup(next.dataset.name, next.dataset.role, next.dataset.batch, next.dataset.bio,
        (next.dataset.images||'').split('|').filter(Boolean), next.dataset.spiritDog||'', 'leadership');
    } else if (source === 'core') {
      const items = [...document.querySelectorAll('#team-content [data-section="core"] .core-grid-item--has-popup')];
      if (!items.length) return;
      let idx = items.findIndex(i => (i.dataset.name||'').trim() === currentName);
      if (idx < 0) idx = 0;
      const next = items[(idx + dir + items.length) % items.length];
      openTeamPopup(next.dataset.name, next.dataset.role, next.dataset.batch, next.dataset.bio,
        (next.dataset.images || '').split('|').filter(Boolean), next.dataset.spiritDog || '', 'core');
    }
  }

  document.addEventListener('click', e => {
    const lc = e.target.closest('#team-content .cinema-card');
    if (lc) { openTeamPopup(lc.dataset.name, lc.dataset.role, lc.dataset.batch, lc.dataset.bio, (lc.dataset.images||'').split('|').filter(Boolean), lc.dataset.spiritDog||'', 'leadership'); return; }
    const cc = e.target.closest('#team-content .core-grid-item--has-popup');
    if (cc) { openTeamPopup(cc.dataset.name, cc.dataset.role, cc.dataset.batch, cc.dataset.bio, (cc.dataset.images||'').split('|').filter(Boolean), cc.dataset.spiritDog||'', 'core'); return; }
  });
}

/* ═══════════════════════════════════════════════════════════════
   TAB SWITCHING
   ═══════════════════════════════════════════════════════════════ */

function showTab(tabName) {
  document.querySelectorAll('#team-content .team-section').forEach(s => {
    s.style.display = s.dataset.section === tabName ? '' : 'none';
  });
  document.querySelectorAll('#team-tabs .team-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabName);
  });
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR — Year Chips
   ═══════════════════════════════════════════════════════════════ */

function renderSidebarChips(yearsData, container) {
  let html = '';
  yearsData.years.forEach(y => {
    if (y.id === yearsData.current) return;
    html += `<button class="year-chip" data-year="${esc(y.id)}">${esc(y.label)}</button>`;
  });
  container.innerHTML = html;
}

/* ═══════════════════════════════════════════════════════════════
   LOAD CURRENT YEAR (2026-27 format: flat departments manifest)
   ═══════════════════════════════════════════════════════════════ */

async function loadCurrentYear(yearId) {
  const leadershipEl = document.getElementById('team-leadership');
  const coreEl = document.getElementById('team-core');
  const membersEl = document.getElementById('team-members');
  const yearTitle = document.getElementById('team-year-title');

  yearTitle.textContent = yearId.replace('-', '\u2013');

  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const bust = isDev ? `?v=${Date.now()}` : '';

  try {
    const manifest = await fetch(`public/team/${yearId}/manifest.json${bust}`).then(r => r.json());

    const leadershipDepts = manifest.departments.filter(d => LEADERSHIP_DEPTS.includes(d.name));
    const coreDepts = manifest.departments.filter(d => !LEADERSHIP_DEPTS.includes(d.name));

    /* Transform leadership depts → cinema carousel sections format */
    const leaderSections = leadershipDepts.map(dept => ({
      label: dept.name.toLowerCase(),
      members: dept.members.map(m => ({
        meta: {
          name: m.name,
          role: dept.name === 'Presidents' ? 'President' : 'Secretary',
          image: m.image || '',
          batch: m.email || '',
          spirit_dog: ''
        },
        body: ''
      }))
    }));
    renderLeadershipCinema(leaderSections, leadershipEl);

    /* Transform core depts → flat core grid format */
    const coreMembers = [];
    coreDepts.forEach(dept => {
      dept.members.forEach(m => {
        coreMembers.push({
          meta: {
            name: m.name,
            image: m.image || '',
            batch: dept.name,
            spirit_dog: ''
          },
          body: m.role || ''
        });
      });
    });
    renderCoreGrid(coreMembers, coreEl);

    renderMembersWall([], membersEl);

    showTab('leadership');
    initLeaderCarousel();

  } catch (e) {
    console.error('[team] loadCurrentYear error:', e);
    leadershipEl.innerHTML = '<p class="team-empty">couldn\'t load team data.</p>';
  }
}

/* ═══════════════════════════════════════════════════════════════
   LOAD PAST YEAR (2025-26 format: leadership/core/members folders)
   ═══════════════════════════════════════════════════════════════ */

async function loadPastYear(yearId) {
  const leadershipEl = document.getElementById('team-leadership');
  const coreEl = document.getElementById('team-core');
  const membersEl = document.getElementById('team-members');
  const yearTitle = document.getElementById('team-year-title');

  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const bust = isDev ? `?v=${Date.now()}` : '';

  yearTitle.textContent = yearId.replace('-', '\u2013');

  leadershipEl.innerHTML = '<div style="text-align:center;padding:2rem;font-family:\'Caveat\',cursive;color:var(--ink-soft);">loading leadership...</div>';
  coreEl.innerHTML = '<div style="text-align:center;padding:2rem;font-family:\'Caveat\',cursive;color:var(--ink-soft);">loading core team...</div>';
  membersEl.innerHTML = '<div style="text-align:center;padding:2rem;font-family:\'Caveat\',cursive;color:var(--ink-soft);">loading members...</div>';

  try {
    /* Leadership */
    const leaderManifest = await fetch(`public/team/${yearId}/leadership/manifest.json${bust}`).then(r => r.json());
    const leaderSections = [];
    for (const section of leaderManifest.sections) {
      const results = await Promise.allSettled(
        section.members.map(async f => {
          const res = await fetch(`public/team/${yearId}/leadership/content/${f}${bust}`);
          if (!res.ok) throw new Error(res.status);
          return parseFrontmatter(await res.text());
        })
      );
      leaderSections.push({
        label: section.label,
        members: results.filter(r => r.status === 'fulfilled').map(r => r.value)
      });
    }
    renderLeadershipCinema(leaderSections, leadershipEl);

    /* Core */
    const coreManifest = await fetch(`public/team/${yearId}/core/manifest.json${bust}`).then(r => r.json());
    const coreResults = await Promise.allSettled(
      coreManifest.members.map(async (f, index) => {
        const res = await fetch(`public/team/${yearId}/core/content/${f}${bust}`);
        if (!res.ok) throw new Error(res.status);
        return { index, member: parseFrontmatter(await res.text()) };
      })
    );
    const coreMembers = coreResults
      .filter(r => r.status === 'fulfilled').map(r => r.value)
      .sort((a, b) => {
        const ap = hasCorePopupData(a.member) ? 1 : 0, bp = hasCorePopupData(b.member) ? 1 : 0;
        return ap !== bp ? bp - ap : a.index - b.index;
      })
      .map(e => e.member);
    renderCoreGrid(coreMembers, coreEl);

    /* Members */
    const membersRes = await fetch(`public/team/${yearId}/members/members.md${bust}`);
    const membersTxt = await membersRes.text();
    const memberNames = membersTxt.trim().split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
    renderMembersWall(memberNames, membersEl);

    showTab('leadership');
    initLeaderCarousel();

  } catch (e) {
    console.error('[team] loadPastYear error:', e);
    leadershipEl.innerHTML = `<p class="team-empty">couldn't load team data for ${yearId}. try refreshing.</p>`;
  }
}

/* ═══════════════════════════════════════════════════════════════
   MAIN LOADER
   ═══════════════════════════════════════════════════════════════ */

async function loadTeam() {
  const sidebarChips = document.getElementById('team-sidebar-chips');
  if (!sidebarChips) return;

  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const bust = isDev ? `?v=${Date.now()}` : '';

  try {
    const yearsData = await fetch('public/team/years.json' + bust).then(r => r.json());
    renderSidebarChips(yearsData, sidebarChips);

    const currentYearId = yearsData.current;
    await loadCurrentYear(currentYearId);

    sidebarChips.addEventListener('click', e => {
      const chip = e.target.closest('.year-chip:not(.year-chip--current)');
      if (!chip) return;
      document.querySelectorAll('.year-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      loadPastYear(chip.dataset.year);
    });

    const currentChip = document.createElement('button');
    currentChip.className = 'year-chip year-chip--current';
    currentChip.textContent = yearsData.years.find(y => y.id === currentYearId).label;
    currentChip.addEventListener('click', async () => {
      document.querySelectorAll('.year-chip').forEach(c => c.classList.remove('active'));
      await loadCurrentYear(currentYearId);
    });
    sidebarChips.insertBefore(currentChip, sidebarChips.firstChild);

    initTeamPopup();

  } catch (e) {
    console.error('[team] loadTeam error:', e);
    document.getElementById('team-leadership').innerHTML =
      '<p class="team-empty">couldn\'t load team data. try refreshing.</p>';
  }
}

function enableTouchGestures(carousel) {
  let startX;
  carousel.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
  carousel.addEventListener('touchmove', e => {
    if (!startX) return;
    const diffX = startX - e.touches[0].clientX;
    if (Math.abs(diffX) > 50) {
      const arrow = carousel.querySelector(`.cinema-nav-arrow[data-dir="${diffX > 0 ? 'next' : 'prev'}"]`);
      if (arrow) arrow.click();
      startX = null;
    }
  });
}
document.querySelectorAll('.cinema-carousel').forEach(enableTouchGestures);
