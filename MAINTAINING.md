# Maintaining Pawsitive

A practical reference for day-to-day maintenance. For architecture details, see `CLAUDE.md`.

---

## Quick Start

```bash
# Clone and serve locally
git clone https://github.com/pawsitive-ashoka/pawsitive-ashoka.github.io.git
cd pawsitive-ashoka.github.io
npm run dev

# Open http://localhost:4321 in your browser
```

---

## Team Page

The team page (`pages/team.html`) is a year-by-year archive. Each year lives in `public/team/YYYY-YY/`.

### Structure

```
public/team/
├── years.json                  # registry of available years
├── team.jpeg                   # hero photo
├── 2026-27/                    # current year
│   ├── manifest.json           # flat departments (core only, no leadership)
│   ├── leadership/
│   │   ├── manifest.json       # sections: presidents & secretaries + department heads
│   │   ├── content/*.md        # one markdown file per leader
│   │   └── images/             # leader photos
│   ├── core/
│   │   ├── manifest.json       # flat members list
│   │   ├── content/*.md        # one markdown file per core member
│   │   └── images/             # core member photos
│   └── images/                 # shared photos referenced by manifest
└── 2025-26/                    # archived year (same structure)
```

### Adding a Team Member

1. **Add their photo** to the appropriate `images/` folder (e.g., `public/team/2026-27/leadership/images/`)
2. **Create a markdown file** in `content/` with frontmatter:

```markdown
---
name: Jane Doe
role: HoD · Events
section: department heads
batch: UG'2025
spirit_dog: Coco
image: public/team/2026-27/leadership/images/jane-doe.jpg
order: 10
---
Jane's bio goes here...
```

**Frontmatter fields:**
| Field | Required | Notes |
|-------|----------|-------|
| `name` | Yes | Full name |
| `role` | Yes | e.g., "President", "HoD · Finance", "Secretary" |
| `section` | Yes | `"presidents & secretaries"` or `"department heads"` |
| `batch` | Yes | e.g., "UG'2025" |
| `spirit_dog` | No | Name of their Ashoka dog |
| `image` | Yes | Path relative to repo root |
| `image2`–`image4` | No | Additional photos for popup gallery |
| `order` | Yes | Sort order within the section |

3. **Run the manifest rebuild:**
```bash
node .github/scripts/rebuild-manifests.js
```

4. **Commit and push** — deploy happens automatically.

### Adding a New Year

1. **Create the folder structure:**
```bash
mkdir -p public/team/2027-28/leadership/{content,images}
mkdir -p public/team/2027-28/core/{content,images}
```

2. **Update `public/team/years.json`:**
```json
{
  "current": "2027-28",
  "years": [
    { "id": "2027-28", "label": "2027–28" },
    { "id": "2026-27", "label": "2026–27" },
    { "id": "2025-26", "label": "2025–26" }
  ]
}
```

3. **Add member content files** (see "Adding a Team Member" above)

4. **Rebuild manifests:**
```bash
node .github/scripts/rebuild-manifests.js
```

### Archiving the Current Year

When a new year starts:

1. Rename the current folder: `public/team/2026-27/` → `public/team/2027-28/`
2. Update `years.json` with the new current year
3. Create a fresh `public/team/2027-28/` with the new team data

### Image Guidelines

- **Format:** JPG preferred, WebP acceptable
- **Size:** 800–1200px wide is ideal
- **Naming:** lowercase, hyphenated (e.g., `shaurya-taneja.jpg`)
- **Location:** Put images in the year-specific folder, not shared across years
- **Cloudinary:** Images are synced automatically at deploy. Local copies serve as fallbacks.

---

## Dog Profiles

Dog profiles live in `public/dogs/content/*.md`.

### Adding a Dog

1. **Add the photo** to `public/dogs/images/`
2. **Create a markdown file:**

```markdown
---
name: Coco
breed: Indie
age: 3 months
location: Near Gate 2
status: Vaccinated, Sterilized
image: public/dogs/images/coco.jpg
order: 7
---
Coco is a playful indie who hangs around Gate 2...
```

3. **Rebuild the manifest:**
```bash
node .github/scripts/rebuild-manifests.js
```

---

## Memorial

Memorial entries live in `public/memorial/content/*.md`. Same format as dog profiles.

---

## Gallery

Gallery images go directly in `public/gallery/`.

- Images are auto-detected by the rebuild script
- Videos (MP4, MOV, WebM) are also supported
- The manifest is rebuilt at deploy time

---

## Deploy Pipeline

Push to `main` triggers `.github/workflows/deploy.yml`:

1. `rebuild-manifests.js` — regenerates all `manifest.json` files
2. `sync-images.js` — downloads Cloudinary images as local fallbacks (4-min timeout, non-fatal)
3. Uploads artifact to GitHub Pages

**Important:** GitHub Pages must be set to **"GitHub Actions"** source in Settings → Pages.

### Rebuilding Manifests Locally

```bash
node .github/scripts/rebuild-manifests.js
```

This regenerates:
- `public/dogs/manifest.json`
- `public/memorial/manifest.json`
- `public/team/*/leadership/manifest.json` (for each year)
- `public/team/*/core/manifest.json` (for each year)
- `public/gallery/manifest.json`

---

## Common Tasks

### Updating a Bio

Edit the `.md` file in the appropriate `content/` folder. No manifest change needed — the content is fetched at runtime.

### Swapping a Photo

Replace the image file in the `images/` folder. Keep the same filename to avoid updating frontmatter.

### Removing a Member

Delete their `.md` file and run `node .github/scripts/rebuild-manifests.js`.

### Fixing a Broken Image

1. Check the `image` path in the markdown frontmatter
2. Verify the file exists at that path
3. If using Cloudinary, check the URL is correct

---

## Troubleshooting

### "Couldn't load team data" error

- Check that `manifest.json` exists in the year folder
- Open browser DevTools → Network tab to see if fetch requests are failing
- Run `node .github/scripts/rebuild-manifests.js` to regenerate manifests

### Images not showing

- Verify the image path in frontmatter matches the actual file location
- Check that the image file isn't corrupted
- Cloudinary images: check the URL is accessible

### Deploy failed

- Check the Actions tab in GitHub for error logs
- Ensure `rebuild-manifests.js` runs without errors locally
- Verify GitHub Pages is set to "GitHub Actions" source

### Popup card not appearing

- Check that the member's `.md` file has valid frontmatter
- Ensure `spirit_dog` field is present if you want the popup to open on click

---

## File Reference

| File | Purpose |
|------|---------|
| `pages/team.html` | Team page HTML structure |
| `js/team.js` | All team rendering logic |
| `styles/main.css` | All styles (search for `.cinema-`, `.core-`, `.team-`) |
| `public/team/years.json` | Year registry |
| `.github/scripts/rebuild-manifests.js` | Manifest rebuild script |
| `.github/workflows/deploy.yml` | Deploy pipeline |
