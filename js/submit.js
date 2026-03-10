/* ─── submit.js ─── dog media submission with Supabase ─── */
(function () {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file
  const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100 MB per submission

  const SUPABASE_URL = window.PAWSITIVE_SUPABASE_URL || '';
  const SUPABASE_ANON_KEY = window.PAWSITIVE_SUPABASE_ANON_KEY || '';
  const SUPABASE_BUCKET = window.PAWSITIVE_SUPABASE_BUCKET || 'dog-media';
  const SUPABASE_TABLE = window.PAWSITIVE_SUPABASE_TABLE || 'submissions';

  let supabaseClient = null;

  function initClient() {
    if (supabaseClient) return supabaseClient;
    if (!window.supabase || !window.supabase.createClient) return null;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });
    return supabaseClient;
  }

  function bytesToReadable(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function clearMessages() {
    const successEl = document.getElementById('sd-success');
    const errorEl = document.getElementById('sd-error');
    if (successEl) {
      successEl.style.display = 'none';
      successEl.textContent = '';
    }
    if (errorEl) {
      errorEl.style.display = 'none';
      errorEl.textContent = '';
    }
  }

  function showError(message) {
    const errorEl = document.getElementById('sd-error');
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }

  function showSuccess(message) {
    const successEl = document.getElementById('sd-success');
    if (!successEl) return;
    successEl.textContent = message;
    successEl.style.display = 'block';
  }

  function validateFiles(files) {
    if (!files || files.length === 0) {
      return 'Please upload at least one file.';
    }

    let totalSize = 0;
    for (const file of files) {
      totalSize += file.size;

      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) {
        return 'Only image and video files are supported.';
      }

      if (file.size > MAX_FILE_SIZE) {
        return 'Each file must be 10 MB or smaller.';
      }
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      return 'Total upload size must be 100 MB or less.';
    }

    return '';
  }

  function renderFileList(files) {
    const listEl = document.getElementById('sd-file-list');
    if (!listEl) return;

    if (!files || files.length === 0) {
      listEl.innerHTML = '';
      return;
    }

    const rows = Array.from(files).map((file) => {
      const kind = file.type.startsWith('video/') ? 'video' : 'image/art';
      return `<div class="sd-file-item"><span>${file.name}</span><span>${kind} · ${bytesToReadable(file.size)}</span></div>`;
    }).join('');

    listEl.innerHTML = rows;
  }

  function buildStoragePath(file, email) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const safeExt = ext ? '.' + ext.replace(/[^a-z0-9]/g, '') : '';
    const safeBase = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'file';
    const slugEmail = email.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return `submissions/${Date.now()}-${slugEmail}/${safeBase}-${Math.random().toString(36).slice(2, 8)}${safeExt}`;
  }

  async function uploadFiles(client, files, email) {
    const uploaded = [];

    for (const file of files) {
      const path = buildStoragePath(file, email);
      const { error: uploadErr } = await client.storage
        .from(SUPABASE_BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type });

      if (uploadErr) throw new Error(uploadErr.message || 'Upload failed.');

      const { data: publicData } = client.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
      uploaded.push({
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: path,
        public_url: publicData?.publicUrl || ''
      });
    }

    return uploaded;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearMessages();

    const client = initClient();
    if (!client) {
      showError('Submissions are temporarily unavailable. Supabase credentials are not configured yet.');
      return;
    }

    const dogName = document.getElementById('sd-dog-name')?.value.trim();
    const userName = document.getElementById('sd-user-name')?.value.trim();
    const email = document.getElementById('sd-email')?.value.trim();
    const location = document.getElementById('sd-location')?.value.trim();
    const social = document.getElementById('sd-social')?.value.trim() || null;
    const story = document.getElementById('sd-story')?.value.trim();
    const files = document.getElementById('sd-media')?.files;

    if (!dogName || !userName || !email || !location || !story) {
      showError('Please fill in all required fields.');
      return;
    }

    const fileError = validateFiles(files);
    if (fileError) {
      showError(fileError);
      return;
    }

    const submitBtn = document.getElementById('sd-submit-btn');
    const originalText = submitBtn?.textContent || 'submit entry → 🐾';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Uploading...';
    }

    try {
      const media = await uploadFiles(client, files, email);

      const { data, error: insertErr } = await client
        .from(SUPABASE_TABLE)
        .insert({
          dog_name: dogName,
          user_name: userName,
          user_email: email,
          location: location,
          story: story,
          social_media: social,
          media_urls: media,
          status: 'pending'
        })
        .select('id')
        .single();

      if (insertErr) throw new Error(insertErr.message || 'Could not save submission.');

      showSuccess(`Entry submitted successfully. Submission ID: ${data?.id || 'created'}. Our team will review it soon.`);
      document.getElementById('dog-submit-form')?.reset();
      renderFileList([]);
    } catch (err) {
      console.error('Submission error:', err);
      showError('Something went wrong while submitting. Please try again in a moment.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  }

  window.initSubmitPage = function initSubmitPage() {
    const form = document.getElementById('dog-submit-form');
    const fileInput = document.getElementById('sd-media');
    const configError = document.getElementById('submitConfigError');

    if (!form || !fileInput) return;

    form.removeEventListener('submit', handleSubmit);
    form.addEventListener('submit', handleSubmit);

    const onFileChange = (event) => {
      const selected = event.target.files;
      renderFileList(selected);
      const fileError = validateFiles(selected);
      if (fileError) showError(fileError);
      else clearMessages();
    };

    if (fileInput._submitChangeHandler) {
      fileInput.removeEventListener('change', fileInput._submitChangeHandler);
    }
    fileInput._submitChangeHandler = onFileChange;
    fileInput.addEventListener('change', onFileChange);

    const client = initClient();
    if (!client && configError) {
      configError.style.display = 'block';
      configError.textContent = 'Setup needed: add window.PAWSITIVE_SUPABASE_URL and window.PAWSITIVE_SUPABASE_ANON_KEY before production use.';
    } else if (configError) {
      configError.style.display = 'none';
      configError.textContent = '';
    }
  };
})();
