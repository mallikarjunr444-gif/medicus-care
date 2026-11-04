"""
Base abstract adapter interface for photorealistic neural avatar engines.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pathlib import Path

class BaseAvatarAdapter(ABC):
    """
    Abstract interface for model inference adapters (LivePortrait, MuseTalk, EchoMimic, etc.).
    """

    def __init__(self, model_name: str):
        self.model_name = model_name
        self.is_initialized = False
        self.inference_implemented = False

    def inference_unavailable(self) -> RuntimeError:
        if not self.is_ready:
            return RuntimeError(f"{self.model_name} checkpoints are not installed.")
        return RuntimeError(
            f"{self.model_name} checkpoints are present, but this adapter does not execute inference."
        )

    @abstractmethod
    async def initialize(self) -> bool:
        """Load model weights into GPU / MPS / CPU memory."""
        pass

    @abstractmethod
    async def generate_idle_frames(
        self,
        reference_image_path: str,
        duration_seconds: float = 3.0,
        doctor_state: str = "listening"
    ) -> Dict[str, Any]:
        """Generate subtle natural listening / blinking / breathing head movement."""
        pass

    @abstractmethod
    async def generate_speech_video(
        self,
        reference_image_path: str,
        audio_path: str,
        output_video_path: str,
        doctor_state: str = "speaking"
    ) -> Dict[str, Any]:
        """Generate audio-driven lip-sync and facial kinematics."""
        pass

    @abstractmethod
    async def cleanup(self):
        """Free GPU VRAM and resources."""
        pass

