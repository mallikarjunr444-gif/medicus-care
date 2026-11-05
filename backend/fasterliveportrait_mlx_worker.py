"""Persistent JSON-lines worker for FasterLivePortrait-MLX.

MLX's native runtime is kept in a separate process and virtualenv from the
backend's PyTorch stack. The backend writes one initialization line, waits for
READY, then submits {image, audio, output} jobs. All model diagnostics go to
stderr so stdout remains a machine-readable protocol.
"""

from __future__ import annotations

import contextlib
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
import time
import traceback


_PROTOCOL_STDOUT = sys.stdout


def _reply(payload: str | dict) -> None:
    if isinstance(payload, str):
        line = payload
    else:
        line = json.dumps(payload, separators=(",", ":"))
    _PROTOCOL_STDOUT.write(line + "\n")
    _PROTOCOL_STDOUT.flush()


def _load_pipeline(repo_dir: Path, profile: str):
    if str(repo_dir) not in sys.path:
        sys.path.insert(0, str(repo_dir))

    # The upstream application has progress and status prints. Keep all of
    # them off the line-oriented stdout channel used by the backend.
    with contextlib.redirect_stdout(sys.stderr):
        from omegaconf import OmegaConf

        from src.pipelines.gradio_live_portrait_pipeline import GradioLivePortraitPipeline
        from src.runtime_assets import ensure_runtime_assets

        cfg = OmegaConf.load(repo_dir / "configs" / "mlx_infer.yaml")
        ensure_runtime_assets(cfg)
        cfg.infer_params.flag_pasteback = True

        pipeline = GradioLivePortraitPipeline(cfg, is_animal=False)
        pipeline.set_mlx_profile(profile)
        pipeline._ensure_models_loaded(is_animal=False)
    return pipeline


def _run_job(pipeline, repo_dir: Path, job: dict) -> dict:
    image_path = Path(job["image"]).expanduser().resolve()
    audio_path = Path(job["audio"]).expanduser().resolve()
    output_path = Path(job["output"]).expanduser().resolve()
    if not image_path.is_file():
        raise FileNotFoundError(f"Avatar image not found: {image_path}")
    if not audio_path.is_file():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    results_root = repo_dir / "results"
    results_root.mkdir(parents=True, exist_ok=True)
    started = time.monotonic()

    with tempfile.TemporaryDirectory(prefix="medicus-mlx-", dir=results_root) as work_dir:
        with contextlib.redirect_stdout(sys.stderr):
            video_path, _crop_path, _pipeline_seconds = pipeline.run_audio_driving(
                str(audio_path),
                str(image_path),
                save_dir=work_dir,
            )
            generated = Path(video_path)
            if not generated.is_file():
                raise RuntimeError(f"MLX pipeline reported success without output: {generated}")

            # Publish atomically: the backend must never upload a half-written
            # file if a worker is interrupted while copying the final MP4.
            partial = output_path.with_name(output_path.name + ".partial")
            try:
                shutil.copyfile(generated, partial)
                os.replace(partial, output_path)
            finally:
                partial.unlink(missing_ok=True)

            # Retain loaded weights for subsequent sentence chunks, but clear
            # per-generation MLX caches to reduce unified-memory pressure.
            pipeline._release_mlx_memory()

    elapsed = time.monotonic() - started
    return {
        "status": "ok",
        "output": str(output_path),
        "render_seconds": round(elapsed, 3),
    }


def main() -> int:
    init_line = sys.stdin.readline()
    if not init_line:
        return 2

    try:
        init = json.loads(init_line)
        repo_dir = Path(init["repo_dir"]).expanduser().resolve()
        profile = str(init.get("profile", "ultra"))
        if profile not in {"quality", "speed", "turbo", "ultra", "reference", "custom"}:
            raise ValueError(f"Unsupported MLX profile: {profile}")
        if not (repo_dir / "configs" / "mlx_infer.yaml").is_file():
            raise FileNotFoundError(f"MLX configuration not found under {repo_dir}")
        pipeline = _load_pipeline(repo_dir, profile)
    except Exception as exc:
        traceback.print_exc(file=sys.stderr)
        _reply(f"ERROR: {type(exc).__name__}: {exc}")
        return 1

    _reply("READY")

    for raw in sys.stdin:
        raw = raw.strip()
        if not raw:
            continue
        try:
            job = json.loads(raw)
            with contextlib.redirect_stdout(sys.stderr):
                result = _run_job(pipeline, repo_dir, job)
            _reply(result)
        except Exception as exc:
            traceback.print_exc(file=sys.stderr)
            _reply({"status": "error", "msg": f"{type(exc).__name__}: {exc}"})

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
