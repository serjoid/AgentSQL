"""
gen_icons.py — Generate production-quality Tauri icon set from a source PNG.

Usage (requires Pillow):
    pip install Pillow
    py -3 gen_icons.py [source_image.png]

If no source image is provided, a placeholder icon is generated.
Alternatively, use the Tauri CLI (recommended for real branding):
    npm run tauri icon -- path/to/icon.png   # generates all sizes automatically

Output files (written to this directory):
    32x32.png          — Windows taskbar / small icon
    128x128.png        — macOS Dock / Linux launcher
    128x128@2x.png     — Retina / HiDPI version
    icon.icns          — macOS app bundle icon
    icon.ico           — Windows installer icon
"""

import struct
import zlib
import os
import sys

THIS_DIR = os.path.dirname(os.path.abspath(__file__))

# SGBD brand color (dark navy)
BRAND_COLOR = (0x1E, 0x24, 0x33)


# ---------------------------------------------------------------------------
# Pure-stdlib fallback — creates a solid-color PNG without Pillow
# ---------------------------------------------------------------------------

def _make_plain_png(w: int, h: int, rgb: tuple[int, int, int]) -> bytes:
    r, g, b = rgb

    def chunk(t: bytes, d: bytes) -> bytes:
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)

    raw = (b"\x00" + bytes([r, g, b] * w)) * h
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw))
        + chunk(b"IEND", b"")
    )


def _make_ico(png32: bytes) -> bytes:
    data_offset = 6 + 16
    return (
        struct.pack("<HHH", 0, 1, 1)
        + struct.pack("<BBBBHHII", 32, 32, 0, 0, 1, 32, len(png32), data_offset)
        + png32
    )


def _make_icns(png128: bytes) -> bytes:
    chunk_size = 8 + len(png128)
    return b"icns" + struct.pack(">I", 8 + chunk_size) + b"ic07" + struct.pack(">I", chunk_size) + png128


def generate_plain():
    """Generate solid-color placeholder icons without Pillow."""
    sizes = {
        "32x32.png": (32, 32),
        "128x128.png": (128, 128),
        "128x128@2x.png": (256, 256),
    }
    for name, (w, h) in sizes.items():
        path = os.path.join(THIS_DIR, name)
        with open(path, "wb") as f:
            f.write(_make_plain_png(w, h, BRAND_COLOR))
        print(f"  {name} ({w}×{h})")

    png128 = _make_plain_png(128, 128, BRAND_COLOR)
    with open(os.path.join(THIS_DIR, "icon.icns"), "wb") as f:
        f.write(_make_icns(png128))
    print("  icon.icns")

    png32 = _make_plain_png(32, 32, BRAND_COLOR)
    with open(os.path.join(THIS_DIR, "icon.ico"), "wb") as f:
        f.write(_make_ico(png32))
    print("  icon.ico")


# ---------------------------------------------------------------------------
# Pillow path — resizes a real source image to all required sizes
# ---------------------------------------------------------------------------

def generate_from_source(source: str):
    try:
        from PIL import Image
    except ImportError:
        print("Pillow not found — falling back to plain-color placeholders.")
        generate_plain()
        return

    img = Image.open(source).convert("RGBA")

    sizes = {
        "32x32.png": (32, 32),
        "128x128.png": (128, 128),
        "128x128@2x.png": (256, 256),
    }
    for name, size in sizes.items():
        resized = img.resize(size, Image.LANCZOS)
        path = os.path.join(THIS_DIR, name)
        resized.save(path, "PNG")
        print(f"  {name} {size}")

    # macOS .icns
    img128 = img.resize((128, 128), Image.LANCZOS)
    icns_path = os.path.join(THIS_DIR, "icon.icns")
    img128.save(icns_path, format="icns")
    print("  icon.icns")

    # Windows .ico (multiple sizes in one file)
    ico_path = os.path.join(THIS_DIR, "icon.ico")
    ico_img = img.resize((256, 256), Image.LANCZOS)
    ico_img.save(ico_path, format="ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (256, 256)])
    print("  icon.ico")


if __name__ == "__main__":
    source = sys.argv[1] if len(sys.argv) > 1 else None
    print("Generating Tauri icons...")
    if source:
        print(f"  Source: {source}")
        generate_from_source(source)
    else:
        print("  No source image — generating solid-color placeholders.")
        generate_plain()
    print("Done.")
