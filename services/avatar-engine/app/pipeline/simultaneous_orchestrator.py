"""Truthful model readiness report for the optional avatar-engine service.

The application backend currently executes MuseTalk through its persistent
worker. The other checked-out repositories are evaluation candidates; this
module must not label their presence as running inference or invent FPS and
latency figures.
"""

from pathlib import Path
from typing import Any

from ..models.aniportrait_adapter import AniPortraitAdapter
from ..models.echomimic_adapter import EchoMimicV1Adapter, EchoMimicV3Adapter
from ..models.liveportrait_adapter import LivePortraitAdapter
from ..models.musetalk_adapter import MuseTalkAdapter


class SimultaneousAvatarOrchestrator:
    """Expose per-model repository/weight readiness without fake execution."""

    def __init__(self) -> None:
        self.adapters = {
            "LivePortrait": LivePortraitAdapter(),
            "MuseTalk": MuseTalkAdapter(),
            "EchoMimic": EchoMimicV1Adapter(),
            "EchoMimicV3": EchoMimicV3Adapter(),
            "AniPortrait": AniPortraitAdapter(),
        }
        self.model_root = Path(__file__).resolve().parents[2] / "models"

    async def initialize_all_simultaneously(self) -> dict[str, Any]:
        """Return actual checkpoint readiness, not an inference success claim."""
        model_status: dict[str, Any] = {}
        for name, adapter in self.adapters.items():
            weights_present = await adapter.initialize()
            model_status[name] = {
                "repository_present": adapter.repo_dir.is_dir(),
                "weights_present": weights_present,
                "inference_executed": False,
            }

        model_status["LiveTalking"] = {
            "repository_present": (self.model_root / "LiveTalking").is_dir(),
            "weights_present": False,
            "inference_executed": False,
            "role": "WebRTC runtime; not an animation model",
        }
        return {"status": "readiness_report", "models": model_status}

    async def process_simultaneous_turn(
        self,
        doctor_id: str,
        doctor_state: str,
        reference_image_path: str,
        audio_path: str | None = None,
    ) -> dict[str, Any]:
        raise NotImplementedError(
            "The multi-model ensemble is not implemented. The MediCare backend's "
            "persistent MuseTalk worker is the only currently executable avatar path."
        )


simultaneous_orchestrator = SimultaneousAvatarOrchestrator()
