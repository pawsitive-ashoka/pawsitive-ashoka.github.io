/* ─── team.js ─── load & render team timeline from public/team/*.md ─── */

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

function avatarHtml(meta, idx, hasImage) {
  const color = PASTEL_COLORS[idx % PASTEL_COLORS.length];
  if (hasImage) {
    return `<div class="timeline-avatar" style="--ph-color:${color};">
      <img class="timeline-avatar-img" src="${esc(meta.image)}" alt="${esc(meta.name)}" loading="lazy" onerror="this.remove();this.parentNode.querySelector('.timeline-avatar-fallback').style.display=''">
      <span class="timeline-avatar-fallback" style="display:none">🐾</span>
    </div>`;
  }
  return `<div class="timeline-avatar" style="--ph-color:${color};">
    <span class="timeline-avatar-fallback">🐾</span>
  </div>`;
}

function imageExists(meta) {
  return meta.image && meta.image.trim().length > 0;
}

/* ── Leadership ── */
function renderLeadershipTimeline(sections, container) {
  let html = '';
  let globalIdx = 0;

  for (const section of sections) {
    html += `<div class="timeline-divider"><span>${esc(section.label)}</span></div>`;
    for (const member of section.members) {
      const side = globalIdx % 2 === 0 ? 'timeline-left' : 'timeline-right';
      const m = member.meta;
      const bio = member.body || 'Bio coming soon...';
      const hasImg = imageExists(m);
      html += `<div class="timeline-item ${side}">
        <div class="timeline-dot"></div>
        <div class="timeline-content timeline-content-leadership"
          data-name="${esc(m.name)}" data-role="${esc(m.role)}"
          data-batch="${esc(m.batch)}" data-bio="${esc(bio)}"
          data-image="${esc(m.image)}">
          ${avatarHtml(m, globalIdx, hasImg)}
          <div class="timeline-info">
            <h4>${esc(m.name)}</h4>
            <span class="timeline-role">${esc(m.role)}</span>
          </div>
        </div>
      </div>`;
      globalIdx++;
    }
  }
  container.innerHTML = `<div class="timeline">${html}</div>`;
}

/* ── Core ── */
function renderCoreTimeline(members, container) {
  let html = '';
  members.forEach((member, idx) => {
    const side = idx % 2 === 0 ? 'timeline-left' : 'timeline-right';
    const m = member.meta;
    const hasImg = imageExists(m);
    html += `<div class="timeline-item ${side}">
      <div class="timeline-dot"></div>
      <div class="timeline-content timeline-content-core">
        ${avatarHtml(m, idx, hasImg)}
        <div class="timeline-info">
          <h4>${esc(m.name)}</h4>
        </div>
      </div>
    </div>`;
  });
  container.innerHTML = `<div class="timeline">${html}</div>`;
}

/* ── Members ── */
function renderMembersTimeline(names, container) {
  let html = '';
  names.forEach((name, idx) => {
    const side = idx % 2 === 0 ? 'timeline-left' : 'timeline-right';
    html += `<div class="timeline-item ${side}">
      <div class="timeline-dot timeline-dot-sm"></div>
      <div class="timeline-content timeline-content-member">
        <span class="timeline-member-name">${esc(name)}</span>
      </div>
    </div>`;
  });
  container.innerHTML = `<div class="timeline">${html}</div>`;
}

/* ── Popup ── */
function initTeamPopup() {
  const overlay = document.getElementById('team-popup-overlay');
  if (!overlay) return;

  const closePopup = () => overlay.classList.remove('active');
  overlay.querySelector('.team-popup-close').addEventListener('click', closePopup);
  overlay.addEventListener('click', e => { if (e.target === overlay) closePopup(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopup(); });

  const leadershipSection = document.querySelector('[data-section="leadership"]');
  if (!leadershipSection) return;

  leadershipSection.addEventListener('click', e => {
    const content = e.target.closest('.timeline-content-leadership');
    if (!content) return;

    const name = content.dataset.name;
    const role = content.dataset.role;
    const batch = content.dataset.batch;
    const bio = content.dataset.bio;
    const image = content.dataset.image;

    const card = overlay.querySelector('.team-popup-card');
    const avatarEl = card.querySelector('.team-popup-avatar');
    const imgPath = image && image.trim();

    if (imgPath) {
      avatarEl.innerHTML = `<img class="team-popup-avatar-img" src="${esc(imgPath)}" alt="${esc(name)}"
        onerror="this.remove();this.parentNode.innerHTML='<span class=\\'team-popup-emoji\\'>🐾</span>'">`;
    } else {
      avatarEl.innerHTML = `<span class="team-popup-emoji">🐾</span>`;
    }

    card.querySelector('.team-popup-name').textContent = name;
    card.querySelector('.team-popup-role').textContent = role;
    card.querySelector('.team-popup-batch').textContent = batch;
    card.querySelector('.team-popup-bio').textContent = bio;

    overlay.classList.add('active');
  });
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
    renderLeadershipTimeline(leaderSections, leadershipContainer);

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
    renderCoreTimeline(coreMembers, coreContainer);

    // Fetch members
    const membersRes = await fetch('public/team/members/members.md' + bust);
    const membersTxt = await membersRes.text();
    const memberNames = membersTxt.trim().split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean);
    renderMembersTimeline(memberNames, membersContainer);

    // Init popup
    initTeamPopup();

  } catch (e) {
    leadershipContainer.innerHTML = `<div style="text-align:center;padding:2rem;font-family:'Caveat',cursive;color:var(--accent);">
      ⚠️ couldn't load team data. try refreshing.</div>`;
  }
}
