/* ─── reviews.js ─── team review dashboard for submissions ─── */
(function () {
  const SUPABASE_URL = window.PAWSITIVE_SUPABASE_URL || '';
  const SUPABASE_ANON_KEY = window.PAWSITIVE_SUPABASE_ANON_KEY || '';
  const SUPABASE_TABLE = window.PAWSITIVE_SUPABASE_TABLE || 'submissions';
  const PAGE_SIZE = 6;

  let client = null;
  let currentStatus = 'pending';
  let currentPage = 1;
  let searchQuery = '';
  let totalPages = 1;

  function initClient() {
    if (client) return client;
    if (!window.supabase || !window.supabase.createClient) return null;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return client;
  }

  function showAuthError(message) {
    const el = document.getElementById('rv-auth-error');
    if (!el) return;
    el.style.display = 'block';
    el.textContent = message;
  }

  function showAuthSuccess(message) {
    const el = document.getElementById('rv-auth-success');
    if (!el) return;
    el.style.display = 'block';
    el.textContent = message;
  }

  function clearAuthMessages() {
    const err = document.getElementById('rv-auth-error');
    const ok = document.getElementById('rv-auth-success');
    if (err) {
      err.style.display = 'none';
      err.textContent = '';
    }
    if (ok) {
      ok.style.display = 'none';
      ok.textContent = '';
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderMedia(media) {
    if (!Array.isArray(media) || media.length === 0) {
      return '<p class="rv-empty">No media files attached.</p>';
    }

    return media.map((item) => {
      const url = item?.public_url || '';
      const type = item?.file_type || '';
      if (!url) return '';

      if (type.startsWith('video/')) {
        return `<video class="rv-media" controls preload="metadata" src="${escapeHtml(url)}"></video>`;
      }

      return `<img class="rv-media" loading="lazy" src="${escapeHtml(url)}" alt="Submission media">`;
    }).join('');
  }

  function renderSubmission(item) {
    const id = escapeHtml(item.id);
    const mediaHtml = renderMedia(item.media_urls);
    const social = item.social_media ? `<p><strong>social:</strong> ${escapeHtml(item.social_media)}</p>` : '';

    return `
      <article class="rv-card" data-id="${id}">
        <div class="rv-card-head">
          <h3>${escapeHtml(item.dog_name)} <span class="rv-status rv-status-${escapeHtml(item.status)}">${escapeHtml(item.status)}</span></h3>
          <p><strong>submitted:</strong> ${new Date(item.created_at).toLocaleString()}</p>
          <p><strong>owner:</strong> ${escapeHtml(item.user_name)} (${escapeHtml(item.user_email)})</p>
          <p><strong>location:</strong> ${escapeHtml(item.location)}</p>
          ${social}
        </div>
        <p class="rv-story">${escapeHtml(item.story)}</p>
        <div class="rv-media-grid">${mediaHtml}</div>
        <div class="rv-row-actions">
          <button class="chip rv-action" data-action="approved" type="button">approve</button>
          <button class="chip rv-action" data-action="rejected" type="button">reject</button>
          <button class="chip rv-action" data-action="pending" type="button">mark pending</button>
        </div>
      </article>`;
  }

  async function loadSubmissions() {
    const list = document.getElementById('rv-list');
    const pagination = document.getElementById('rv-pagination');
    const pageIndicator = document.getElementById('rv-page-indicator');
    const prevBtn = document.getElementById('rv-prev-btn');
    const nextBtn = document.getElementById('rv-next-btn');
    if (!list) return;

    list.innerHTML = '<div class="dogs-loading">loading submissions...</div>';

    const c = initClient();
    if (!c) {
      list.innerHTML = '<div class="dogs-error">Supabase is not configured.</div>';
      return;
    }

    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let query = c
      .from(SUPABASE_TABLE)
      .select('*', { count: 'exact' })
      .eq('status', currentStatus)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (searchQuery) {
      const q = searchQuery.replace(/[,%]/g, '');
      query = query.or(`dog_name.ilike.%${q}%,user_name.ilike.%${q}%,user_email.ilike.%${q}%,location.ilike.%${q}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      list.innerHTML = '<div class="dogs-error">Could not load submissions.</div>';
      if (pagination) pagination.style.display = 'none';
      return;
    }

    totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));
    if (currentPage > totalPages) {
      currentPage = totalPages;
      await loadSubmissions();
      return;
    }

    if (!data || data.length === 0) {
      list.innerHTML = '<div class="dogs-loading">No submissions in this state yet.</div>';
      if (pagination) pagination.style.display = 'none';
      return;
    }

    list.innerHTML = data.map(renderSubmission).join('');

    if (pagination && pageIndicator && prevBtn && nextBtn) {
      pagination.style.display = totalPages > 1 ? 'flex' : 'none';
      pageIndicator.textContent = `page ${currentPage} of ${totalPages}`;
      prevBtn.disabled = currentPage <= 1;
      nextBtn.disabled = currentPage >= totalPages;
    }
  }

  async function updateStatus(id, status) {
    const c = initClient();
    if (!c) return;

    const { error } = await c
      .from(SUPABASE_TABLE)
      .update({ status })
      .eq('id', id);

    if (error) {
      alert('Could not update status. Check RLS policies for authenticated users.');
      return;
    }

    await loadSubmissions();
  }

  async function toggleViewBySession() {
    const authCard = document.getElementById('reviews-auth-card');
    const board = document.getElementById('reviews-board');
    const c = initClient();
    if (!authCard || !board || !c) return;

    const { data } = await c.auth.getSession();
    const hasSession = Boolean(data?.session);

    authCard.style.display = hasSession ? 'none' : 'block';
    board.style.display = hasSession ? 'block' : 'none';

    if (hasSession) {
      await loadSubmissions();
    }
  }

  async function onLogin(event) {
    event.preventDefault();
    clearAuthMessages();

    const email = document.getElementById('rv-email')?.value.trim();
    const password = document.getElementById('rv-password')?.value;
    const btn = document.getElementById('rv-login-btn');
    const c = initClient();

    if (!c) {
      showAuthError('Supabase config is missing.');
      return;
    }

    if (!email || !password) {
      showAuthError('Please enter email and password.');
      return;
    }

    const originalText = btn?.textContent || 'log in';
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'logging in...';
    }

    try {
      const { error } = await c.auth.signInWithPassword({ email, password });
      if (error) {
        showAuthError('Login failed. Check credentials and allowed users.');
        return;
      }
      showAuthSuccess('Logged in successfully.');
      await toggleViewBySession();
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    }
  }

  async function onLogout() {
    const c = initClient();
    if (!c) return;
    await c.auth.signOut();
    await toggleViewBySession();
  }

  function setupFilters() {
    const buttons = document.querySelectorAll('.rv-filter');
    buttons.forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.addEventListener('click', async () => {
        currentStatus = btn.dataset.status || 'pending';
        currentPage = 1;
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        await loadSubmissions();
      });
      btn.dataset.bound = '1';
    });
  }

  function setupCardActions() {
    const list = document.getElementById('rv-list');
    if (!list || list.dataset.bound) return;

    list.addEventListener('click', async (event) => {
      const actionBtn = event.target.closest('.rv-action');
      if (!actionBtn) return;

      const card = actionBtn.closest('.rv-card');
      const id = card?.dataset.id;
      const status = actionBtn.dataset.action;
      if (!id || !status) return;

      await updateStatus(id, status);
    });
    list.dataset.bound = '1';
  }

  function setupSearch() {
    const input = document.getElementById('rv-search');
    if (!input || input.dataset.bound) return;

    let timer = null;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        searchQuery = input.value.trim();
        currentPage = 1;
        await loadSubmissions();
      }, 250);
    });

    input.dataset.bound = '1';
  }

  function setupPagination() {
    const prevBtn = document.getElementById('rv-prev-btn');
    const nextBtn = document.getElementById('rv-next-btn');
    if (prevBtn && !prevBtn.dataset.bound) {
      prevBtn.addEventListener('click', async () => {
        if (currentPage <= 1) return;
        currentPage -= 1;
        await loadSubmissions();
      });
      prevBtn.dataset.bound = '1';
    }
    if (nextBtn && !nextBtn.dataset.bound) {
      nextBtn.addEventListener('click', async () => {
        if (currentPage >= totalPages) return;
        currentPage += 1;
        await loadSubmissions();
      });
      nextBtn.dataset.bound = '1';
    }
  }

  window.initReviewsPage = async function initReviewsPage() {
    const c = initClient();
    const authError = document.getElementById('rv-auth-error');

    if (!c && authError) {
      authError.style.display = 'block';
      authError.textContent = 'Setup needed: configure Supabase in js/supabase-config.js.';
      return;
    }

    const loginForm = document.getElementById('reviews-login-form');
    const refreshBtn = document.getElementById('rv-refresh-btn');
    const logoutBtn = document.getElementById('rv-logout-btn');

    if (loginForm && !loginForm.dataset.bound) {
      loginForm.addEventListener('submit', onLogin);
      loginForm.dataset.bound = '1';
    }

    if (refreshBtn && !refreshBtn.dataset.bound) {
      refreshBtn.addEventListener('click', async () => {
        currentPage = 1;
        await loadSubmissions();
      });
      refreshBtn.dataset.bound = '1';
    }

    if (logoutBtn && !logoutBtn.dataset.bound) {
      logoutBtn.addEventListener('click', onLogout);
      logoutBtn.dataset.bound = '1';
    }

    setupFilters();
    setupCardActions();
    setupSearch();
    setupPagination();
    await toggleViewBySession();
  };
})();
