"""
Upload gallery videos to Cloudinary.
Run once: python3 upload_videos_to_cloudinary.py

Requirements:
  pip install cloudinary

Credentials:
  Set environment variables before running:
    export CLOUDINARY_API_KEY=your_api_key
    export CLOUDINARY_API_SECRET=your_api_secret
  Cloud name is already hardcoded as 'duij1lw6u'.

After this runs, all 7 videos will be at:
  https://res.cloudinary.com/duij1lw6u/video/upload/q_auto,f_auto/gallery/<name_no_ext>
"""

import os
import sys
import cloudinary
import cloudinary.uploader

CLOUD_NAME = "duij1lw6u"
API_KEY     = os.environ.get("CLOUDINARY_API_KEY")
API_SECRET  = os.environ.get("CLOUDINARY_API_SECRET")

if not API_KEY or not API_SECRET:
    print("ERROR: Set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET environment variables first.")
    print("  export CLOUDINARY_API_KEY=your_key")
    print("  export CLOUDINARY_API_SECRET=your_secret")
    sys.exit(1)

cloudinary.config(
    cloud_name=CLOUD_NAME,
    api_key=API_KEY,
    api_secret=API_SECRET,
    secure=True,
)

GALLERY_DIR = os.path.join(os.path.dirname(__file__),
                           "pawsitive-ashoka.github.io", "public", "gallery")

VIDEO_EXTENSIONS = {".mp4", ".MP4", ".mov", ".MOV"}

videos = [f for f in os.listdir(GALLERY_DIR)
          if os.path.splitext(f)[1] in VIDEO_EXTENSIONS]

if not videos:
    print("No video files found in", GALLERY_DIR)
    sys.exit(0)

print(f"Found {len(videos)} videos to upload:\n")

for filename in sorted(videos):
    path = os.path.join(GALLERY_DIR, filename)
    public_id = "gallery/" + os.path.splitext(filename)[0]   # e.g. gallery/IMG_2249
    file_size_mb = os.path.getsize(path) / (1024 * 1024)

    print(f"  Uploading: {filename}  ({file_size_mb:.1f} MB) → {public_id} ...", end=" ", flush=True)
    try:
        result = cloudinary.uploader.upload_large(
            path,
            resource_type="video",
            public_id=public_id,
            overwrite=True,
            invalidate=True,
            chunk_size=6 * 1024 * 1024,  # 6 MB chunks for large files
        )
        print(f"OK  ({result['duration']:.1f}s  {result.get('format','?')})")
    except Exception as e:
        print(f"FAILED: {e}")

print("\nDone. Deliverable CDN URLs:")
for filename in sorted(videos):
    name = os.path.splitext(filename)[0]
    print(f"  https://res.cloudinary.com/{CLOUD_NAME}/video/upload/q_auto,f_auto/gallery/{name}")
