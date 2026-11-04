"""
EchoMimic & EchoMimic V3 Model Adapters for Audio-Driven Portrait Animation.
Official Repos:
- EchoMimic: https://github.com/antgroup/echomimic
- EchoMimic V3: https://github.com/antgroup/echomimic_v3
"""

import logging
from pathlib import Path
from typing import Dict, Any, Optional
from .base_adapter import BaseAvatarAdapter

logger = logging.getLogger("medicus_care.avatar_engine.echomimic")

class EchoMimicV3Adapter(BaseAvatarAdapter):
    """
    Adapter for EchoMimic V3: State-of-the-art audio-driven editable portrait animation.
    Combines facial landmarks, audio features, and diffusion-based portrait rendering.
    """

    def __init__(self, repo_dir: Optional[str] = None):
        super().__init__("EchoMimicV3")
        self.repo_dir = Path(repo_dir) if repo_dir else Path(__file__).resolve().parents[2] / "models" / "echomimic_v3"
        self.is_ready = False

    async def initialize(self) -> bool:
        required = (
            self.repo_dir / "models" / "Wan2.1-Fun-V1.1-1.3B-InP",
            self.repo_dir / "models" / "transformer" / "diffusion_pytorch_model.safetensors",
        )
        self.is_ready = self.repo_dir.is_dir() and all(path.exists() for path in required)
        self.is_initialized = True
        logger.info("EchoMimic V3 weights %s.", "verified" if self.is_ready else "not installed")
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


class EchoMimicV1Adapter(BaseAvatarAdapter):
    """Checkpoint discovery for the original EchoMimic portrait pipeline."""

    def __init__(self, repo_dir: Optional[str] = None):
        super().__init__("EchoMimic")
        self.repo_dir = Path(
            repo_dir or str(Path(__file__).resolve().parents[2] / "models" / "echomimic")
        )
        self.weights_dir = self.repo_dir / "pretrained_weights"
        self.is_ready = False

    async def initialize(self) -> bool:
        required = (
            "denoising_unet.pth",
            "reference_unet.pth",
            "motion_module.pth",
            "face_locator.pth",
        )
        self.is_ready = self.repo_dir.is_dir() and all(
            (self.weights_dir / filename).is_file() for filename in required
        )
        self.is_initialized = True
        return self.is_ready

    async def generate_idle_frames(
        self,
        reference_image_path: str,
        duration_seconds: float = 3.0,
        doctor_state: str = "listening",
    ) -> Dict[str, Any]:
        raise self.inference_unavailable()

    async def generate_speech_video(
        self,
        reference_image_path: str,
        audio_path: str,
        output_video_path: str,
        doctor_state: str = "speaking",
    ) -> Dict[str, Any]:
        raise self.inference_unavailable()

    async def cleanup(self):
        pass

