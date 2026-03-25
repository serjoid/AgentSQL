"""
Build the Python backend as a PyInstaller sidecar for Tauri production bundles.

Usage:
    python scripts/build_sidecar.py

Output:
    ../frontend/src-tauri/binaries/backend-{target-triple}[.exe]

The Tauri bundler expects external binaries to follow the naming convention:
    <name>-<target-triple>[.exe]
e.g. backend-x86_64-pc-windows-msvc.exe on Windows x64.
"""

import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
BACKEND_DIR = SCRIPT_DIR.parent
BINARIES_DIR = BACKEND_DIR.parent / "frontend" / "src-tauri" / "binaries"

# Tauri target-triple map (platform → Rust target triple)
TARGET_TRIPLES = {
    ("Windows", "AMD64"): "x86_64-pc-windows-msvc",
    ("Windows", "ARM64"): "aarch64-pc-windows-msvc",
    ("Linux", "x86_64"): "x86_64-unknown-linux-gnu",
    ("Linux", "aarch64"): "aarch64-unknown-linux-gnu",
    ("Darwin", "x86_64"): "x86_64-apple-darwin",
    ("Darwin", "arm64"): "aarch64-apple-darwin",
}

HIDDEN_IMPORTS = [
    "asyncpg",
    "aiosqlite",
    "uvicorn.logging",
    "uvicorn.loops",
    "uvicorn.loops.auto",
    "uvicorn.protocols",
    "uvicorn.protocols.http",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.websockets",
    "uvicorn.protocols.websockets.auto",
    "uvicorn.lifespan",
    "uvicorn.lifespan.on",
    "litellm",
    "cryptography",
]


def get_target_triple() -> str:
    key = (platform.system(), platform.machine())
    triple = TARGET_TRIPLES.get(key)
    if not triple:
        sys.exit(f"Unsupported platform: {key}. Add it to TARGET_TRIPLES in this script.")
    return triple


def build():
    triple = get_target_triple()
    ext = ".exe" if platform.system() == "Windows" else ""
    output_name = f"backend-{triple}{ext}"

    BINARIES_DIR.mkdir(parents=True, exist_ok=True)

    hidden = []
    for imp in HIDDEN_IMPORTS:
        hidden += ["--hidden-import", imp]

    entry = BACKEND_DIR / "run.py"

    cmd = [
        sys.executable,
        "-m", "PyInstaller",
        "--onefile",
        "--name", "backend",
        "--distpath", str(BINARIES_DIR),
        "--workpath", str(BACKEND_DIR / "build"),
        "--specpath", str(BACKEND_DIR / "build"),
        "--collect-all", "litellm",
        *hidden,
        str(entry),
    ]

    print(f"Building sidecar: {output_name}")
    print(f"Command: {' '.join(cmd)}\n")

    result = subprocess.run(cmd, cwd=str(BACKEND_DIR))
    if result.returncode != 0:
        sys.exit("PyInstaller build failed.")

    # Rename to match Tauri's expected triple-suffixed convention
    built = BINARIES_DIR / f"backend{ext}"
    target = BINARIES_DIR / output_name
    if built.exists():
        shutil.move(str(built), str(target))
        print(f"\nSidecar ready: {target}")
    else:
        sys.exit(f"Expected binary not found at {built}")


if __name__ == "__main__":
    build()
