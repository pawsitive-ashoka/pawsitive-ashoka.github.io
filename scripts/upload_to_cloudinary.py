"""
Upload all gallery media (images + videos) to Cloudinary.
Automatically compresses files that exceed Cloudinary free-tier limits:
  - Images > 9.5 MB: recompresses JPEG quality iteratively until small enough
  - Videos > 95 MB:  transcodes with ffmpeg to H.264 at reduced bitrate

Run once: python3 upload_to_cloudinary.py

Requirements:
  pip install cloudinary Pillow
  brew install ffmpeg        (needed only for large videos)

Credentials (from Cloudinary Dashboard -> API Keys):
  export CLOUDINARY_API_KEY=your_api_key
  export CLOUDINARY_API_SECRET=your_api_secret
"""

import os, sys, io, subprocess, tempfile
import cloudinary, cloudinary.uploader
from PIL import Image

CLOUD_NAME    = "duij1lw6u"
API_KEY       = os.environ.get("CLOUDINARY_API_KEY")
API_SECRET    = os.environ.get("CLOUDINARY_API_SECRET")
IMG_MAX_BYTES = 9_500_000   # 9.5 MB  (free tier limit: 10 MB)
VID_MAX_BYTES = 95_000_000  # 95 MB   (free tier limit: 100 MB)

if not API_KEY or not API_SECRET:
    print("ERROR: Set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET first.")
    sys.exit(1)

cloudinary.config(cloud_name=CLOUD_NAME, api_key=API_KEY, api_secret=API_SECRET, secure=True)

GALLERY_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           "pawsitive-ashoka.github.io", "public", "gallery")

IMG_EXTS = {".jpg", ".jpeg", ".JPG", ".JPEG"}
VID_EXTS = {".mp4", ".MP4", ".mov", ".MOV"}

all_files = os.listdir(GALLERY_DIR)
images = sorted(f for f in all_files if os.path.splitext(f)[1] in IMG_EXTS)
videos = sorted(f for f in all_files if os.path.splitext(f)[1] in VID_EXTS)
print(f"Found {len(images)} images + {len(videos)} videos\n")

errors = []

def compress_image(path):
    """Return a BytesIO of the image recompressed to fit under IMG_MAX_BYTES."""
    img = Image.open(path).convert("RGB")
    for quality in range(88, 30, -8):
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality, optimize=True)
        if buf.tell() <= IMG_MAX_BYTES:
            buf.seek(0)
            print(f"(q={quality}, {buf.tell()/1e6:.1f} MB) ", end="", flush=True)
            return buf
    # Still too large — scale down 75% then compress
    w, h = img.size
    img = img.resize((int(w * 0.75), int(h * 0.75)), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=75, optimize=True)
    buf.seek(0)
    print(f"(downscaled {buf.tell()/1e6:.1f} MB) ", end="", flush=True)
    return buf

def compress_video(path):
    """Transcode with ffmpeg to fit under VID_MAX_BYTES. Returns temp file path."""
    duration_s = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        stderr=subprocess.DEVNULL
    ).strip())
    target_kbps = max(400, int((VID_MAX_BYTES * 8) / (duration_s * 1024)))
    print(f"(ffmpeg {duration_s:.0f}s → {target_kbps}kbps) ", end="", flush=True)
    tmp = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
    tmp.close()
    subprocess.run([
        "ffmpeg", "-y", "-i", path,
        "-c:v", "libx264", "-preset", "fast", "-crf", "28",
        "-b:v", f"{target_kbps}k", "-maxrate", f"{target_kbps*2}k",
        "-bufsize", f"{target_kbps*4}k",
        "-c:a", "aac", "-b:a", "96k",
        "-movflags", "+faststart",
        tmp.name
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    actual_mb = os.path.getsize(tmp.name) / 1e6
    print(f"→ {actual_mb:.1f} MB ", end="", flush=True)
    return tmp.name

def upload_image(filename):
    path      = os.path.join(GALLERY_DIR, filename)
    public_id = "gallery/" + os.path.splitext(filename)[0]
    size_mb   = os.path.getsize(path) / 1e6
    print(f"  [IMG] {filename}  ({size_mb:.1f} MB) ... ", end="", flush=True)
    try:
        src = compress_image(path) if os.path.getsize(path) > IMG_MAX_BYTES else path
        cloudinary.uploader.upload(src, resource_type="image",
                                   public_id=public_id, overwrite=True, invalidate=True)
        print("OK")
    except Exception as e:
        print(f"FAILED: {e}")
        errors.append((filename, str(e)))

def upload_video(filename):
    path      = os.path.join(GALLERY_DIR, filename)
    public_id = "gallery/" + os.path.splitext(filename)[0]
    size_mb   = os.path.getsize(path) / 1e6
    print(f"  [VID] {filename}  ({size_mb:.1f} MB) ... ", end="", flush=True)
    tmp_path = None
    try:
        if os.path.getsize(path) > VID_MAX_BYTES:
            tmp_path = compress_video(path)
            src = tmp_path
        else:
            src = path
        cloudinary.uploader.upload_large(src, resource_type="video",
                                         public_id=public_id, overwrite=True,
                                         invalidate=True, chunk_size=6*1024*1024)
        print("OK")
    except Exception as e:
        print(f"FAILED: {e}")
        errors.append((filename, str(e)))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)

# Only retry the two that previously failed; otherwise upload everything
FAILED = {"IMG_6730.JPG", "IMG_2252.MOV"}
retry_images = [f for f in images if f in FAILED]
retry_videos = [f for f in videos if f in FAILED]

if retry_images or retry_videos:
    print("── Retrying failed files ────────────")
    for f in retry_images: upload_image(f)
    for f in retry_videos: upload_video(f)
else:
    print("── Images ──────────────────────────")
    for f in images: upload_image(f)
    print("\n── Videos ──────────────────────────")
    for f in videos: upload_video(f)

print(f"\n{'Done — all uploaded.' if not errors else f'Done with {len(errors)} error(s):'}")
for f, e in errors:
    print(f"  {f}: {e}")
