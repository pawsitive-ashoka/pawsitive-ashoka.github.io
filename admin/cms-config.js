/**
 * Pawsitive CMS — runtime configuration & preview templates
 *
 * Environment detection:
 *   localhost / 127.0.0.1  → local_backend: true  (talks to `npx decap-server`)
 *   everything else         → Supabase Google OAuth via cms-backend.js
 *
 * Credentials are injected at deploy time from GitHub Actions variables.
 * No secrets are committed to the repo.
 *
 * To run locally:
 *   Terminal 1:  npx decap-server
 *   Terminal 2:  python3 -m http.server 8765
 *   Browser:     http://localhost:8765/admin/
 */

(function () {
  'use strict';

  /* ─── Environment ────────────────────────────────────────────────────── */
  const IS_LOCAL = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  /* ─── React ─────────────────────────────────────────────────────────── */
  // Decap CMS v3 bundles React internally. Grab it from the global it exposes,
  // falling back to window.React if it happens to be there.
  const React = window.React || (window.DecapCmsApp && window.DecapCmsApp.React);
  if (!React) {
    console.error('[Pawsitive CMS] React not found on window — previews disabled.');
  }
  const h = React ? React.createElement : () => null;

  /* ─── Preview styles ─────────────────────────────────────────────────── */
  CMS.registerPreviewStyle(
    'https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Klee+One&display=swap'
  );

  CMS.registerPreviewStyle(`
    *, *::before, *::after { box-sizing: border-box; }

    body {
      margin: 0;
      padding: 1.5rem;
      background: #f5f3ef;
      font-family: 'Klee One', 'Georgia', serif;
      color: #2a1f14;
    }

    /* ── Dog / Memorial card ── */
    .pw-card {
      max-width: 360px;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 6px 28px rgba(0,0,0,0.13);
    }
    .pw-card-photo {
      width: 100%;
      display: block;
      max-height: 260px;
      object-fit: cover;
    }
    .pw-card-emoji-bg {
      width: 100%;
      height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 5rem;
    }
    .pw-card-body {
      padding: 1.1rem 1.25rem 1.4rem;
    }
    .pw-card-name {
      font-family: 'Caveat', cursive;
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 0.2rem;
      line-height: 1.1;
    }
    .pw-card-breed {
      font-size: 0.82rem;
      opacity: 0.65;
      margin: 0 0 0.75rem;
      line-height: 1.4;
    }
    .pw-card-dates {
      font-size: 0.88rem;
      opacity: 0.7;
      margin-bottom: 0.6rem;
    }
    .pw-card-desc {
      font-size: 0.93rem;
      line-height: 1.65;
      margin: 0 0 0.9rem;
      opacity: 0.85;
    }
    .pw-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 0.75rem;
    }
    .pw-badge {
      background: rgba(255,255,255,0.55);
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 999px;
      padding: 0.15rem 0.6rem;
      font-size: 0.78rem;
    }
    .pw-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }
    .pw-tag {
      background: rgba(255,255,255,0.5);
      border-radius: 999px;
      padding: 0.18rem 0.7rem;
      font-size: 0.82rem;
      border: 1px solid rgba(0,0,0,0.07);
    }

    /* ── Team member card ── */
    .pw-member {
      max-width: 300px;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 6px 28px rgba(0,0,0,0.13);
      background: #fff;
    }
    .pw-member-photo {
      width: 100%;
      aspect-ratio: 1 / 1;
      object-fit: cover;
      display: block;
    }
    .pw-member-emoji-bg {
      width: 100%;
      aspect-ratio: 1 / 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 4.5rem;
      background: linear-gradient(135deg, #fde8d8, #fdd5b8);
    }
    .pw-member-body {
      padding: 1.1rem 1.2rem 1.4rem;
    }
    .pw-member-name {
      font-family: 'Caveat', cursive;
      font-size: 1.9rem;
      font-weight: 700;
      margin: 0 0 0.15rem;
    }
    .pw-member-role {
      font-size: 0.85rem;
      opacity: 0.65;
      margin: 0 0 0.5rem;
    }
    .pw-member-pill {
      display: inline-block;
      background: #fde8d8;
      border-radius: 999px;
      padding: 0.18rem 0.75rem;
      font-size: 0.8rem;
      margin-bottom: 0.75rem;
    }
    .pw-member-spirit {
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
      opacity: 0.75;
    }
    .pw-member-bio {
      font-size: 0.9rem;
      line-height: 1.6;
      opacity: 0.8;
    }

    /* ── Memorial tint ── */
    .pw-memorial { filter: saturate(0.4); }
  `, { raw: true });

  /* ─── Preview: Dog ───────────────────────────────────────────────────── */
  function DogPreview({ entry }) {
    const get   = (k)  => entry.getIn(['data', k]);
    const name  = get('name')      || 'Dog Name';
    const emoji = get('nameEmoji') || '';
    const tags  = (get('tags') || '').split(',').map(t => t.trim()).filter(Boolean);
    const bg    = get('bgLight')   || 'linear-gradient(135deg,#f0e0c8,#e8d0a8)';

    return h('div', { className: 'pw-card', style: { background: bg } },
      get('image')
        ? h('img', { className: 'pw-card-photo', src: get('image'), alt: name })
        : h('div', { className: 'pw-card-emoji-bg' }, get('emoji') || '🐕'),

      h('div', { className: 'pw-card-body' },
        h('div', { className: 'pw-card-name' }, `${name} ${emoji}`),
        h('div', { className: 'pw-card-breed' }, get('breed') || ''),

        (get('sterilized') || get('vaccinated'))
          ? h('div', { className: 'pw-badges' },
              get('sterilized') && h('span', { className: 'pw-badge' }, '✅ sterilised'),
              get('vaccinated') && h('span', { className: 'pw-badge' }, '💉 vaccinated'),
            )
          : null,

        h('p', { className: 'pw-card-desc' }, get('body') || ''),

        tags.length
          ? h('div', { className: 'pw-tags' },
              ...tags.map((t, i) => h('span', { className: 'pw-tag', key: i }, t))
            )
          : null,
      ),
    );
  }

  /* ─── Preview: Memorial Dog ──────────────────────────────────────────── */
  function MemorialPreview({ entry }) {
    const get   = (k) => entry.getIn(['data', k]);
    const name  = get('name')      || 'Dog Name';
    const emoji = get('nameEmoji') || '🌟';
    const tags  = (get('tags') || '').split(',').map(t => t.trim()).filter(Boolean);
    const bg    = get('bgLight')   || 'linear-gradient(135deg,#e8e8e8,#d0d0d0)';

    return h('div', { className: 'pw-card pw-memorial', style: { background: bg } },
      get('image')
        ? h('img', { className: 'pw-card-photo', src: get('image'), alt: name })
        : h('div', { className: 'pw-card-emoji-bg' }, '🕯️'),

      h('div', { className: 'pw-card-body' },
        h('div', { className: 'pw-card-name' }, `${name} ${emoji}`),
        h('div', { className: 'pw-card-breed' }, get('breed') || ''),
        get('dates') && h('div', { className: 'pw-card-dates' }, `🌱 ${get('dates')} 🕯️`),
        h('p', { className: 'pw-card-desc' }, get('body') || ''),
        tags.length
          ? h('div', { className: 'pw-tags' },
              ...tags.map((t, i) => h('span', { className: 'pw-tag', key: i }, t))
            )
          : null,
      ),
    );
  }

  /* ─── Preview: Core Team Member ──────────────────────────────────────── */
  function CoreTeamPreview({ entry }) {
    const get = (k) => entry.getIn(['data', k]);

    return h('div', { className: 'pw-member' },
      get('image')
        ? h('img', { className: 'pw-member-photo', src: get('image'), alt: get('name') })
        : h('div', { className: 'pw-member-emoji-bg' }, '🐾'),

      h('div', { className: 'pw-member-body' },
        h('div', { className: 'pw-member-name' }, get('name') || 'Team Member'),
        get('department') && h('div', { className: 'pw-member-pill' }, get('department')),
        get('batch')      && h('div', { className: 'pw-member-role' }, `Batch: ${get('batch')}`),
        get('spirit_dog') && h('div', { className: 'pw-member-spirit' }, `🐾 spirit dog: ${get('spirit_dog')}`),
        h('p', { className: 'pw-member-bio' }, get('body') || ''),
      ),
    );
  }

  /* ─── Preview: Leadership Member ─────────────────────────────────────── */
  function LeadershipPreview({ entry }) {
    const get = (k) => entry.getIn(['data', k]);

    return h('div', { className: 'pw-member' },
      get('image')
        ? h('img', { className: 'pw-member-photo', src: get('image'), alt: get('name') })
        : h('div', { className: 'pw-member-emoji-bg' }, '🐾'),

      h('div', { className: 'pw-member-body' },
        h('div', { className: 'pw-member-name' }, get('name') || 'Leader'),
        get('role')    && h('div', { className: 'pw-member-role' }, get('role')),
        get('section') && h('div', { className: 'pw-member-pill' }, get('section')),
        get('batch')   && h('div', { className: 'pw-member-role' }, `Batch: ${get('batch')}`),
        h('p', { className: 'pw-member-bio' }, get('body') || ''),
      ),
    );
  }

  /* ─── Full CMS config ─────────────────────────────────────────────────── */
  const config = {

    /* Environment — auto-detected, no manual editing needed */
    local_backend: IS_LOCAL,

    backend: IS_LOCAL
      ? { name: 'proxy', proxy_url: 'http://localhost:8081/api/v1' }
      : { name: 'supabase-proxy', branch: 'main' },

    /* Default media folder (gallery uploads — local fallback) */
    media_folder:  'public/gallery',
    public_folder: 'public/gallery',

    /*
     * Cloudinary media library — primary image source.
     *
     * SETUP REQUIRED (one-time):
     * 1. Go to Cloudinary Dashboard → Settings → Upload → Upload presets
     * 2. Create a new preset, set signing mode to "Unsigned", note the preset name
     * 3. Replace YOUR_UPLOAD_PRESET below with that name
     *
     * The api_key below is your PUBLIC key (safe to commit — not the API secret).
     * Editors upload directly to Cloudinary; the site falls back to local copies
     * which are downloaded automatically at deploy time by sync-images.js.
     */
    media_library: {
      name: 'cloudinary',
      config: {
        cloud_name:     '__CLOUDINARY_CLOUD_NAME__',
        api_key:        '__CLOUDINARY_API_KEY__',
        upload_preset:  '__CLOUDINARY_UPLOAD_PRESET__',
      },
    },

    collections: [

      /* ── Dogs ─────────────────────────────────────────────────────────── */
      {
        name:           'dogs',
        label:          'Dogs',
        label_singular: 'Dog',
        folder:         'public/dogs/content',
        create:         true,
        delete:         true,
        slug:           '{{slug}}',
        extension:      'md',
        format:         'frontmatter',
        summary:        '{{name}} — {{breed}}',

        sortable_fields: ['name', 'born', 'order'],

        view_filters: [
          { label: 'Sterilised ✅',    field: 'sterilized', pattern: true  },
          { label: 'Not Sterilised',   field: 'sterilized', pattern: false },
          { label: 'Vaccinated 💉',    field: 'vaccinated', pattern: true  },
          { label: 'Not Vaccinated',   field: 'vaccinated', pattern: false },
        ],

        view_groups: [
          { label: 'Birth Year', field: 'born'       },
          { label: 'Vaccinated', field: 'vaccinated'  },
          { label: 'Sterilised', field: 'sterilized'  },
        ],

        fields: [
          { label: 'Name',       name: 'name',      widget: 'string' },
          { label: 'Name Emoji', name: 'nameEmoji', widget: 'string',
            hint: 'e.g. 👑 — shown next to the name in the detail modal' },
          { label: 'Dog Emoji',  name: 'emoji',     widget: 'string', default: '🐕',
            hint: 'Displayed as a fallback when no photo is uploaded' },

          { label: 'Breed / Location Line', name: 'breed', widget: 'string',
            hint: 'e.g. 📍 Next to Roti Boti · ♂ · 6 yrs · Brown, Black & Fluffy' },

          { label: 'Birth Year', name: 'born', widget: 'number', value_type: 'int',
            hint: 'Used to auto-calculate the displayed age on the site' },

          {
            label:         'Photo',
            name:          'image',
            widget:        'image',
            required:      false,
            media_folder:  '/public/dogs/images',
            public_folder: 'public/dogs/images',
            media_library: { config: { folder: 'public/dogs/images' } },
            hint:          'Uploads to Cloudinary (primary) — local copy saved automatically as fallback',
          },

          { label: 'Tags', name: 'tags', widget: 'string', required: false,
            hint: 'Comma-separated with emojis — e.g. 👑 pack leader, 🥰 big baby at heart' },

          { label: 'Card Background (Light Mode)', name: 'bgLight', widget: 'string',
            hint: 'CSS gradient — e.g. linear-gradient(135deg,#f0e0c8,#e8d0a8)' },
          { label: 'Card Background (Dark Mode)', name: 'bgDark', widget: 'string',
            hint: 'CSS gradient used when the visitor switches to dark mode' },

          { label: 'Sterilised', name: 'sterilized', widget: 'boolean', default: false, required: false },
          { label: 'Vaccinated', name: 'vaccinated', widget: 'boolean', default: false, required: false },

          { label: 'Display Order', name: 'order', widget: 'number', value_type: 'int', default: 999,
            hint: 'Lower = appears earlier. 999 adds the dog to the end of the list.' },

          { label: 'Bio', name: 'body', widget: 'markdown' },
        ],
      },

      /* ── Memorial Dogs ────────────────────────────────────────────────── */
      {
        name:           'memorial',
        label:          'Memorial Dogs',
        label_singular: 'Memorial Dog',
        folder:         'public/memorial/content',
        create:         true,
        delete:         true,
        slug:           '{{slug}}',
        extension:      'md',
        format:         'frontmatter',
        summary:        '{{name}} — {{dates}}',

        sortable_fields: ['name', 'born', 'order'],

        view_groups: [
          { label: 'Birth Year', field: 'born' },
        ],

        fields: [
          { label: 'Name',       name: 'name',      widget: 'string' },
          { label: 'Name Emoji', name: 'nameEmoji', widget: 'string',
            hint: 'e.g. ⚡ — shown in the memorial modal header' },
          { label: 'Dog Emoji',  name: 'emoji',     widget: 'string', default: '🐕' },

          { label: 'Breed / Location Line', name: 'breed', widget: 'string',
            hint: 'e.g. 📍 Gate 3 · ♀ · 4 months · Black' },

          { label: 'Birth Year', name: 'born',  widget: 'number', value_type: 'int' },
          { label: 'Dates',      name: 'dates', widget: 'string',
            hint: 'e.g. July 2025 – October 2025' },

          {
            label:         'Photo',
            name:          'image',
            widget:        'image',
            required:      false,
            media_folder:  '/public/memorial/images',
            public_folder: 'public/memorial/images',
            media_library: { config: { folder: 'public/memorial/images' } },
            hint:          'Uploads to Cloudinary (primary) — local copy saved automatically as fallback',
          },

          { label: 'Tags', name: 'tags', widget: 'string', required: false,
            hint: 'Comma-separated with emojis' },

          { label: 'Card Background (Light Mode)', name: 'bgLight', widget: 'string' },
          { label: 'Card Background (Dark Mode)',  name: 'bgDark',  widget: 'string' },

          { label: 'Display Order', name: 'order', widget: 'number', value_type: 'int', default: 999,
            hint: 'Lower = appears earlier in the memorial grid.' },

          { label: 'Bio', name: 'body', widget: 'markdown' },
        ],
      },

      /* ── Core Team ────────────────────────────────────────────────────── */
      {
        name:           'core-team',
        label:          'Core Team',
        label_singular: 'Core Team Member',
        folder:         'public/team/core/content',
        create:         true,
        delete:         true,
        slug:           '{{slug}}',
        extension:      'md',
        format:         'frontmatter',
        summary:        '{{name}} — {{department}}',

        sortable_fields: ['name', 'order', 'department', 'batch'],

        view_filters: [
          { label: 'Events & Logistics',       field: 'department', pattern: 'Events & Logistics'       },
          { label: 'Finance & Outreach',        field: 'department', pattern: 'Finance & Outreach'        },
          { label: 'On-Ground & Feeding',       field: 'department', pattern: 'On-Ground & Feeding'       },
          { label: 'Social Media & Marketing',  field: 'department', pattern: 'Social Media & Marketing'  },
          { label: 'Core Team',                 field: 'department', pattern: 'Core Team'                 },
        ],

        view_groups: [
          { label: 'Department', field: 'department' },
          { label: 'Batch',      field: 'batch'      },
        ],

        fields: [
          { label: 'Name',  name: 'name',  widget: 'string' },
          { label: 'Batch', name: 'batch', widget: 'string', default: 'Core' },

          { label: 'Department', name: 'department', widget: 'select',
            options: [
              'Events & Logistics',
              'Finance & Outreach',
              'On-Ground & Feeding',
              'Social Media & Marketing',
              'Core Team',
            ],
          },

          { label: 'Spirit Dog', name: 'spirit_dog', widget: 'string', required: false,
            hint: 'Their favourite campus dog — links to the dog profile when clicked in the popup' },

          {
            label:         'Photo',
            name:          'image',
            widget:        'image',
            required:      false,
            media_folder:  '/public/team/core/images',
            public_folder: 'public/team/core/images',
            media_library: { config: { folder: 'public/team/core/images' } },
            hint:          'Uploads to Cloudinary (primary) — local copy saved automatically as fallback',
          },

          { label: 'Display Order', name: 'order', widget: 'number', value_type: 'int', default: 999,
            hint: 'Members with bios are promoted to the front of the grid automatically by the site' },

          { label: 'Bio', name: 'body', widget: 'markdown' },
        ],
      },

      /* ── Leadership Team ──────────────────────────────────────────────── */
      {
        name:           'leadership',
        label:          'Leadership Team',
        label_singular: 'Leadership Member',
        folder:         'public/team/leadership/content',
        create:         true,
        delete:         true,
        slug:           '{{slug}}',
        extension:      'md',
        format:         'frontmatter',
        summary:        '{{name}} — {{role}}',

        sortable_fields: ['name', 'order', 'role', 'batch'],

        view_filters: [
          { label: 'Presidents & Secretaries', field: 'section', pattern: 'presidents & secretaries' },
          { label: 'Department Heads',         field: 'section', pattern: 'department heads'         },
        ],

        view_groups: [
          { label: 'Section', field: 'section' },
          { label: 'Batch',   field: 'batch'   },
        ],

        fields: [
          { label: 'Name',        name: 'name', widget: 'string' },
          { label: 'Role / Title', name: 'role', widget: 'string',
            hint: 'e.g. Chief Technology Officer' },

          { label: 'Section', name: 'section', widget: 'select',
            options: [
              { label: 'Presidents & Secretaries', value: 'presidents & secretaries' },
              { label: 'Department Heads',         value: 'department heads'         },
            ],
          },

          { label: 'Batch', name: 'batch', widget: 'string', hint: "e.g. UG'2025" },

          {
            label:         'Photo',
            name:          'image',
            widget:        'image',
            required:      false,
            media_folder:  '/public/team/leadership/images',
            public_folder: 'public/team/leadership/images',
            media_library: { config: { folder: 'public/team/leadership/images' } },
            hint:          'Uploads to Cloudinary (primary) — local copy saved automatically as fallback',
          },

          { label: 'Display Order', name: 'order', widget: 'number', value_type: 'int', default: 999,
            hint: 'Controls position within the section. Lower = earlier in the carousel.' },

          { label: 'Bio', name: 'body', widget: 'markdown' },
        ],
      },

      /* ── Departments ──────────────────────────────────────────────────── */
      // Fixed set of 4 files — editors cannot add/delete, only edit content.
      {
        name:   'departments',
        label:  'Departments',
        format: 'json',
        files: [

          // Shared field schema for all four departments
          ...[
            { label: 'Events & Logistics',      name: 'events',  file: 'public/departments/events.json',  mediaDir: '/public/departments/events'  },
            { label: 'Finance & Outreach',       name: 'finance', file: 'public/departments/finance.json', mediaDir: '/public/departments/finance' },
            { label: 'On-Ground & Feeding',      name: 'ground',  file: 'public/departments/ground.json',  mediaDir: '/public/departments/ground'  },
            { label: 'Social Media & Marketing', name: 'social',  file: 'public/departments/social.json',  mediaDir: '/public/departments/social'  },
          ].map(({ label, name, file, mediaDir }) => ({
            label, name, file,
            fields: [
              { label: 'Vertical Number', name: 'num',      widget: 'string', hint: 'e.g. VERTICAL 01' },
              { label: 'Icon',            name: 'icon',     widget: 'string', hint: 'Emoji shown in the hero section' },
              { label: 'Title',           name: 'title',    widget: 'string' },
              { label: 'Tagline',         name: 'tagline',  widget: 'string' },
              { label: 'What We Do',      name: 'what',     widget: 'text',   hint: 'Short description shown at the top of the department page' },

              { label: 'Responsibilities', name: 'resp', widget: 'list',
                hint: 'One bullet point per item — shown as a bulleted list on the page' },

              {
                label: 'Entries / Highlights',
                name:  'entries',
                widget: 'list',
                summary: '{{fields.title}}',
                fields: [
                  { label: 'Title',        name: 'title',   widget: 'string' },
                  { label: 'Preview Text', name: 'preview', widget: 'text',
                    hint: 'Short teaser shown on the card before the user clicks "view more"' },
                  {
                    label:         'Thumbnail',
                    name:          'thumbnail',
                    widget:        'image',
                    required:      false,
                    media_folder:  mediaDir,
                    public_folder: mediaDir.replace(/^\//, ''),
                    media_library: { config: { folder: mediaDir.replace(/^\//, '') } },
                    hint:          'Uploads to Cloudinary (primary) — local copy saved automatically as fallback',
                  },
                  { label: 'Full Content', name: 'content', widget: 'markdown',
                    hint: 'Full text shown in the expanded modal — supports **bold**, *italic*, and bullet lists' },
                  { label: 'Amount Raised (optional)', name: 'amountRaised', widget: 'string',
                    required: false, hint: 'e.g. Rs. 40,000/- — leave blank if not a fundraiser' },
                  {
                    label:  'Photo Gallery',
                    name:   'photos',
                    widget: 'list',
                    required: false,
                    hint:   'Photos shown in the lightbox inside the expanded modal',
                    field:  {
                      label:         'Photo',
                      name:          'photo',
                      widget:        'image',
                      media_folder:  mediaDir,
                      public_folder: mediaDir.replace(/^\//, ''),
                      media_library: { config: { folder: mediaDir.replace(/^\//, '') } },
                    },
                  },
                ],
              },

              { label: 'Who Thrives Here', name: 'who', widget: 'text',
                hint: 'Personality description at the bottom of the page' },

              // Finance-only
              { label: 'Donate CTA Text (Finance only)', name: 'donateText', widget: 'text',
                required: false, hint: 'Shown in the "support our work" section. Leave blank for other departments.' },

              // Social-only
              { label: 'Connect Intro Text (Social only)', name: 'connectText', widget: 'text',
                required: false },
              { label: 'Social Links (Social only)', name: 'socialLinks', widget: 'object',
                required: false,
                fields: [
                  { label: 'Email',              name: 'email',            widget: 'string', required: false },
                  { label: 'Instagram URL',      name: 'instagram',        widget: 'string', required: false },
                  { label: 'Instagram Handle',   name: 'instagramHandle',  widget: 'string', required: false },
                  { label: 'Instagram Status',   name: 'instagramStatus',  widget: 'string', required: false },
                  { label: 'LinkedIn URL',       name: 'linkedin',         widget: 'string', required: false },
                  { label: 'LinkedIn Handle',    name: 'linkedinHandle',   widget: 'string', required: false },
                ],
              },
            ],
          })),

        ],
      },

    ], // end collections
  }; // end config

  /* ─── Register custom backend ────────────────────────────────────────── */
  if (!IS_LOCAL) {
    CMS.registerBackend('supabase-proxy', window.SupabaseProxyBackend);
  }

  /* ─── Register preview templates ─────────────────────────────────────── */
  CMS.registerPreviewTemplate('dogs',       DogPreview);
  CMS.registerPreviewTemplate('memorial',   MemorialPreview);
  CMS.registerPreviewTemplate('core-team',  CoreTeamPreview);
  CMS.registerPreviewTemplate('leadership', LeadershipPreview);

  /* ─── Boot ───────────────────────────────────────────────────────────── */
  CMS.init({ config });

})();
