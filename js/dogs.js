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

/** Build the HTML for a single dog card */
function buildDogCard(meta, body) {
  const tags = (meta.tags || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
    .map(t => `<span class="dog-tag">${t}</span>`)
    .join('');

  const bg = getIllustrationBg(meta);

  return `
    <div class="dog-card">
      <div class="dog-illustration" style="background:${bg}">
        <span class="dog-emoji-big">${meta.emoji || '🐕'}</span>
      </div>
      <div class="dog-info">
        <div class="dog-name">${meta.name || 'Dog'} <span>${meta.nameEmoji || ''}</span></div>
        <div class="dog-breed">${meta.breed || ''}</div>
        <p class="dog-desc">${body}</p>
        <div class="dog-tags">${tags}</div>
      </div>
    </div>`;
}

/** Fetch a single dog markdown file and return parsed data */
async function fetchDog(filename) {
  const res = await fetch('public/dogs/' + filename);
  if (!res.ok) throw new Error('Could not load ' + filename);
  const text = await res.text();
  return parseDogMd(text);
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
