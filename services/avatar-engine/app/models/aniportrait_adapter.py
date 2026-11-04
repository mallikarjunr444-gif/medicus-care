"""
AniPortrait Model Adapter for Audio-Driven Portrait Animation.
Official Repo: https://github.com/Zejun-Yang/AniPortrait
"""

import logging
from pathlib import Path
from typing import Dict, Any, Optional
from .base_adapter import BaseAvatarAdapter

logger = logging.getLogger("medicus_care.avatar_engine.aniportrait")

class AniPortraitAdapter(BaseAvatarAdapter):
    """
    Adapter for AniPortrait: Audio-Driven Synthesis of Photorealistic Portrait Animation.
    Uses intermediate 3D representation to generate landmark sequences, then renders via diffusion.
    """

    def __init__(self, repo_dir: Optional[str] = None):
        super().__init__("AniPortrait")
        self.repo_dir = Path(repo_dir) if repo_dir else Path(__file__).resolve().parents[2] / "models" / "AniPortrait"
        self.is_ready = False

    async def initialize(self) -> bool:
        weights = self.repo_dir / "pretrained_weights"
        required = (
            "denoising_unet.pth",
            "reference_unet.pth",
            "pose_guider.pth",
            "motion_module.pth",
            "audio2mesh.pt",
            "audio2pose.pt",
        )
        self.is_ready = self.repo_dir.is_dir() and all((weights / name).is_file() for name in required)
        self.is_initialized = True
        logger.info("AniPortrait weights %s.", "verified" if self.is_ready else "not installed")
        return self.is_ready

    async def generate_idle_frames(
        self,
        reference_image_path: str,
        duration_seconds: float = 3.0,
        doctor_state: str = "listening"
    ) -> Dict[str, Any]:
        raise self.inference_unavailable()

    async def generate_speech_video(
        self,
        reference_image_path: str,
        audio_path: str,
        output_video_path: str,
        doctor_state: str = "speaking"
    ) -> Dict[str, Any]:
        raise self.inference_unavailable()

    async def cleanup(self):
        pass

