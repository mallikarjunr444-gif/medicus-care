#!/usr/bin/env bash
# Install the optional FasterLivePortrait-MLX engine for Apple Silicon.
# Run from the project root: bash scripts/setup_fasterliveportrait_mlx.sh
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
MLX_DIR="${FASTERLIVEPORTRAIT_MLX_DIR:-$BACKEND_DIR/models/FasterLivePortrait-MLX}"

if [[ "$(uname -s)" != "Darwin" || "$(uname -m)" != "arm64" ]]; then
  echo "FasterLivePortrait-MLX requires macOS on Apple Silicon (arm64)." >&2
  exit 1
fi

if ! command -v uv >/dev/null 2>&1; then
  echo "uv is required. Install it with: brew install uv" >&2
  exit 1
fi

mkdir -p "$(dirname "$MLX_DIR")"
if [[ -d "$MLX_DIR/.git" ]]; then
  echo "Using existing FasterLivePortrait-MLX checkout: $MLX_DIR"
elif [[ -e "$MLX_DIR" ]]; then
  echo "Refusing to replace non-git path: $MLX_DIR" >&2
  exit 1
else
  echo "Cloning FasterLivePortrait-MLX into $MLX_DIR"
  git clone --depth 1 https://github.com/ivanfioravanti/fasterliveportrait-mlx.git "$MLX_DIR"
fi

echo "Installing the isolated Apple MLX environment..."
uv sync --project "$MLX_DIR"

echo "Downloading the converted MLX runtime weights from Hugging Face..."
uv run --project "$MLX_DIR" python scripts/download_mlx_weights.py

echo "Verifying the isolated runtime..."
"$MLX_DIR/.venv/bin/python" -c 'import mlx.core as mx; print("MLX available; Metal backend:", mx.default_device())'

cat <<EOF

Setup complete. Opt in by setting these values in the project .env:
  AVATAR_ENGINE=mlx
  MLX_AVATAR_PATH=models/FasterLivePortrait-MLX
  MLX_AVATAR_PROFILE=ultra

Restart the backend after changing .env. Audio is still delivered immediately;
MLX renders the matching video in a background worker. This experimental path
does not promise real-time generation. Review model and dependency terms before
product redistribution; see services/avatar-engine/FASTERLIVEPORTRAIT_MLX.md.
EOF
