"""Tests for the optional FasterLivePortrait-MLX worker integration.

These checks do not require MLX, a Mac, or model checkpoints. They cover
platform detection, opt-in configuration, and the important safety rule that a
required synchronized avatar must never be replaced with a static-image clip.
"""

import pytest

from app.config import settings
from app.services.animator import AvatarAnimator


def _pretend_apple_silicon(monkeypatch):
    monkeypatch.setattr("app.services.animator.platform.system", lambda: "Darwin")
    monkeypatch.setattr("app.services.animator.platform.machine", lambda: "arm64")


def test_mlx_engine_is_opt_in_and_default_is_unchanged():
    assert settings.AVATAR_ENGINE == "musetalk"


async def test_mlx_requires_apple_silicon(monkeypatch):
    monkeypatch.setattr(settings, "AVATAR_ENGINE", "mlx")
    monkeypatch.setattr("app.services.animator.platform.system", lambda: "Linux")

    animator = AvatarAnimator()
    await animator.initialize()

    assert animator.engine == "simple"


async def test_mlx_missing_checkout_falls_back_to_simple(monkeypatch):
    _pretend_apple_silicon(monkeypatch)
    monkeypatch.setattr(settings, "AVATAR_ENGINE", "mlx")
    animator = AvatarAnimator()
    monkeypatch.setattr(animator, "_find_dir", lambda *_args, **_kwargs: None)

    await animator.initialize()

    assert animator.engine == "simple"


async def test_mlx_uses_isolated_python_environment(monkeypatch, tmp_path):
    _pretend_apple_silicon(monkeypatch)
    monkeypatch.setattr(settings, "AVATAR_ENGINE", "mlx")
    monkeypatch.setattr(settings, "MLX_AVATAR_PYTHON", "")
    checkout = tmp_path / "FasterLivePortrait-MLX"
    python = checkout / ".venv" / "bin" / "python"
    python.parent.mkdir(parents=True)
    python.write_text("", encoding="utf-8")

    animator = AvatarAnimator()
    monkeypatch.setattr(animator, "_find_dir", lambda *_args, **_kwargs: checkout)
    await animator.initialize()

    assert animator.engine == "mlx"
    assert animator._mlx_dir == checkout
    assert animator._mlx_python == python.absolute()


async def test_mlx_worker_script_is_shipped():
    animator = AvatarAnimator()
    script = animator._resolve_mlx_worker_script()

    assert script.name == "fasterliveportrait_mlx_worker.py"
    assert script.is_file()


async def test_optional_mlx_failure_falls_back_to_simple(monkeypatch, tmp_path):
    animator = AvatarAnimator()
    animator._initialised = True
    animator.engine = "mlx"

    async def _boom(*_args, **_kwargs):
        raise RuntimeError("Metal worker failed")

    async def _simple(_avatar, _audio, output):
        return output

    monkeypatch.setattr(animator, "_animate_mlx", _boom)
    monkeypatch.setattr(animator, "_animate_simple", _simple)

    output = str(tmp_path / "animation.mp4")
    assert await animator.animate("/photo.jpg", "/speech.wav", output) == output


async def test_required_mlx_lipsync_never_falls_back_to_static(monkeypatch, tmp_path):
    animator = AvatarAnimator()
    animator._initialised = True
    animator.engine = "mlx"
    called = {"simple": False}

    async def _boom(*_args, **_kwargs):
        raise RuntimeError("Metal worker failed")

    async def _simple(_avatar, _audio, output):
        called["simple"] = True
        return output

    monkeypatch.setattr(animator, "_animate_mlx", _boom)
    monkeypatch.setattr(animator, "_animate_simple", _simple)

    with pytest.raises(RuntimeError, match="no unsynchronized fallback"):
        await animator.animate(
            "/photo.jpg",
            "/speech.wav",
            str(tmp_path / "animation.mp4"),
            require_lipsync=True,
        )

    assert called["simple"] is False
