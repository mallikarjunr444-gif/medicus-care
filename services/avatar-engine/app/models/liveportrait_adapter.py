"""
LivePortrait Model Adapter for subtle, natural portrait micro-motion and listening behavior.
Official Repo: https://github.com/KlingAIResearch/LivePortrait
"""

import logging
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional
from .base_adapter import BaseAvatarAdapter

logger = logging.getLogger("medicus_care.avatar_engine.liveportrait")

class LivePortraitAdapter(BaseAvatarAdapter):
    """
    Adapter for LivePortrait: Implicit Keypoint-based Portrait Animation.
    Excels at zero-shot subtle listening, eye blinks, gaze redirection, and natural head motion.
    """

    def __init__(self, repo_dir: Optional[str] = None):
        super().__init__("LivePortrait")
        self.repo_dir = Path(repo_dir) if repo_dir else Path(__file__).resolve().parents[2] / "models" / "LivePortrait"
        self.weights_dir = self.repo_dir / "pretrained_weights"
        self.is_ready = False

    async def initialize(self) -> bool:
        """Check for repository existence and model checkpoints."""
        if not self.repo_dir.exists():
            logger.warning(f"LivePortrait repository not cloned at {self.repo_dir}")
            return False

        required = (
            "liveportrait/base_models/appearance_feature_extractor.pth",
            "liveportrait/base_models/motion_extractor.pth",
            "liveportrait/base_models/spade_generator.pth",
            "liveportrait/base_models/warping_module.pth",
        )
        if all((self.weights_dir / path).is_file() for path in required):
            self.is_ready = True
            logger.info("LivePortrait model weights verified.")
        else:
            logger.info("LivePortrait code present. Pretrained weights required for native inference.")
            self.is_ready = False

        self.is_initialized = True
        return self.is_ready

    async def generate_idle_frames(
        self,
        reference_image_path: str,
        duration_seconds: float = 3.0,
        doctor_state: str = "listening"
    ) -> Dict[str, Any]:
        """Generate listening video chunk using driving motion trajectory."""
        raise self.inference_unavailable()

    async def generate_speech_video(
        self,
        reference_image_path: str,
        audio_path: str,
        output_video_path: str,
        doctor_state: str = "speaking"
    ) -> Dict[str, Any]:
        """LivePortrait focuses primarily on video/expression-driven motion."""
        raise self.inference_unavailable()

    async def cleanup(self):
        logger.info("Cleaning up LivePortrait resources.")

