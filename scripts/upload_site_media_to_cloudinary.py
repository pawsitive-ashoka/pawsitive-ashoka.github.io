"""Upload site media to Cloudinary, skipping assets that already exist.

This script scans pawsitive-ashoka.github.io/public for images and videos.

Public ID rules:
  - public/gallery/<file>    -> gallery/<basename>
  - everything else          -> public/.../<basename>

Credentials are loaded from environment variables first, then from
`pawsitive-ashoka.github.io/.env` if present.
"""

from __future__ import annotations

import io
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import cloudinary
import cloudinary.api
import cloudinary.exceptions
import cloudinary.uploader
from PIL import Image


CLOUD_NAME = "duij1lw6u"
IMG_MAX_BYTES = 9_500_000
VID_MAX_BYTES = 95_000_000

ROOT = Path(__file__).resolve().parent
SITE_ROOT = ROOT / "pawsitive-ashoka.github.io"
PUBLIC_ROOT = SITE_ROOT / "public"
DOTENV_PATH = SITE_ROOT / ".env"

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"}
VIDEO_EXTS = {".mp4", ".mov", ".m4v", ".avi", ".webm"}


def load_dotenv(path: Path) -> None:
    key_map = {
        "cloud-name": "CLOUDINARY_CLOUD_NAME",
        "api-key": "CLOUDINARY_API_KEY",
        "api-secret": "CLOUDINARY_API_SECRET",
    }
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env_key = key_map.get(key.strip(), key.strip().replace("-", "_").upper())
        os.environ.setdefault(env_key, value.strip())


def configure_cloudinary() -> None:
    load_dotenv(DOTENV_PATH)
    api_key = os.environ.get("CLOUDINARY_API_KEY")
    api_secret = os.environ.get("CLOUDINARY_API_SECRET")
    if not api_key or not api_secret:
        print("ERROR: Missing CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.")
        sys.exit(1)

    cloudinary.config(
        cloud_name=CLOUD_NAME,
        api_key=api_key,
        api_secret=api_secret,
        secure=True,
    )


def iter_media_files() -> list[Path]:
    files: list[Path] = []
    for path in PUBLIC_ROOT.rglob("*"):
        if not path.is_file():
            continue
        suffix = path.suffix.lower()
        if suffix in IMAGE_EXTS or suffix in VIDEO_EXTS:
            files.append(path)
    return sorted(files)


def resource_type_for(path: Path) -> str:
    if path.suffix.lower() in VIDEO_EXTS:
        return "video"
    return "image"


def public_id_for(path: Path) -> str:
    rel = path.relative_to(SITE_ROOT).as_posix()
    if rel.startswith("public/gallery/"):
        return "gallery/" + path.stem
    return Path(rel).with_suffix("").as_posix()


def asset_exists(public_id: str, resource_type: str) -> bool:
    try:
        cloudinary.api.resource(public_id, resource_type=resource_type, type="upload")
        return True
    except cloudinary.exceptions.NotFound:
        return False


def compress_jpeg(path: Path) -> io.BytesIO:
    image = Image.open(path).convert("RGB")
    for quality in range(88, 30, -8):
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=quality, optimize=True)
        if buffer.tell() <= IMG_MAX_BYTES:
            buffer.seek(0)
            return buffer

    width, height = image.size
    image = image.resize((int(width * 0.75), int(height * 0.75)), Image.LANCZOS)
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=75, optimize=True)
    buffer.seek(0)
    return buffer


def compress_video(path: Path) -> Path:
    duration_s = float(
        subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                str(path),
            ],
            stderr=subprocess.DEVNULL,
        ).strip()
    )
    target_kbps = max(400, int((VID_MAX_BYTES * 8) / (duration_s * 1024)))
    tmp = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
    tmp.close()
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(path),
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "28",
            "-b:v",
            f"{target_kbps}k",
            "-maxrate",
            f"{target_kbps * 2}k",
            "-bufsize",
            f"{target_kbps * 4}k",
            "-c:a",
            "aac",
            "-b:a",
            "96k",
            "-movflags",
            "+faststart",
            tmp.name,
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return Path(tmp.name)


def upload_image(path: Path, public_id: str) -> None:
    source: str | io.BytesIO = str(path)
    needs_cleanup = False
    if path.suffix.lower() in {".jpg", ".jpeg"} and path.stat().st_size > IMG_MAX_BYTES:
        source = compress_jpeg(path)

    try:
        cloudinary.uploader.upload(
            source,
            resource_type="image",
            public_id=public_id,
            overwrite=False,
            invalidate=True,
        )
    finally:
        if needs_cleanup and isinstance(source, str) and os.path.exists(source):
            os.unlink(source)


def upload_video(path: Path, public_id: str) -> None:
    source = path
    temp_path: Path | None = None
    if path.stat().st_size > VID_MAX_BYTES:
        temp_path = compress_video(path)
        source = temp_path

    try:
        cloudinary.uploader.upload_large(
            str(source),
            resource_type="video",
            public_id=public_id,
            overwrite=False,
            invalidate=True,
            chunk_size=6 * 1024 * 1024,
        )
    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink()


def main() -> int:
    configure_cloudinary()
    files = iter_media_files()
    if not files:
        print("No media files found.")
        return 0

    uploaded = 0
    skipped = 0
    failed = 0

    print(f"Found {len(files)} media files under {PUBLIC_ROOT}\n")

    for path in files:
        rel = path.relative_to(SITE_ROOT).as_posix()
        public_id = public_id_for(path)
        resource_type = resource_type_for(path)
        print(f"[{resource_type[:3].upper()}] {rel} -> {public_id} ... ", end="", flush=True)
        try:
            if asset_exists(public_id, resource_type):
                skipped += 1
                print("SKIP")
                continue

            if resource_type == "image":
                upload_image(path, public_id)
            else:
                upload_video(path, public_id)
            uploaded += 1
            print("UPLOADED")
        except Exception as exc:
            failed += 1
            print(f"FAILED: {exc}")

    print(
        f"\nDone. Uploaded: {uploaded} | Skipped: {skipped} | Failed: {failed}"
    )
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())