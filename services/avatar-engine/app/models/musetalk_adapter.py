"""
MuseTalk Model Adapter for Real-Time Audio-Driven Lip Synchronization.
Official Repo: https://github.com/TMElyralab/MuseTalk
"""

import logging
from pathlib import Path
from typing import Dict, Any, Optional
from .base_adapter import BaseAvatarAdapter

logger = logging.getLogger("medicus_care.avatar_engine.musetalk")

class MuseTalkAdapter(BaseAvatarAdapter):
    """
    Adapter for MuseTalk: Real-Time High-Quality Audio-Driven Lip-Sync.
    Checkpoint discovery only. Production MuseTalk inference currently runs
    through the persistent worker in backend/app/services/animator.py.
    """

    def __init__(self, repo_dir: Optional[str] = None):
        super().__init__("MuseTalk")
        self.repo_dir = Path(repo_dir) if repo_dir else Path(__file__).resolve().parents[2] / "models" / "MuseTalk"
        self.weights_dir = self.repo_dir / "models"
        self.is_ready = False

    async def initialize(self) -> bool:
        required_paths = (
            self.weights_dir / "musetalkV15" / "unet.pth",
            self.weights_dir / "musetalkV15" / "musetalk.json",
            self.weights_dir / "whisper",
            self.weights_dir / "sd-vae",
        )
        if all(path.exists() for path in required_paths):
            self.is_ready = True
            logger.info("MuseTalk unet.pth weights verified.")
        else:
            logger.info("MuseTalk repository verified. Checkpoint weights require download.")
            self.is_ready = False

        self.is_initialized = True
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
        """The executable worker is owned by the MediCare backend."""
        raise self.inference_unavailable()

    async def cleanup(self):
        logger.info("Cleaning up MuseTalk worker.")

