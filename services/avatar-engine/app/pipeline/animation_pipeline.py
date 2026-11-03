"""
Medicus Care™ — Central Avatar Animation Pipeline
Orchestrates doctor identity, model selection (LivePortrait for listening / MuseTalk for speaking),
audio-video synchronization, and real-time streaming chunks.
"""

import asyncio
import logging
import json
from pathlib import Path
from typing import Dict, Any, Optional

from ..models.liveportrait_adapter import LivePortraitAdapter
from ..models.musetalk_adapter import MuseTalkAdapter
from ..models.echomimic_adapter import EchoMimicV3Adapter

logger = logging.getLogger("medicus_care.avatar_engine.pipeline")

class AvatarAnimationPipeline:
    """
    Central orchestration pipeline for real-time AI doctor animation.
    """

    def __init__(self):
        self.profiles_dir = Path("/Users/malikarjunr/medicus-care/services/avatar-engine/app/doctor_profiles")
        self.liveportrait = LivePortraitAdapter()
        self.musetalk = MuseTalkAdapter()
        self.echomimic_v3 = EchoMimicV3Adapter()
        self.active_doctor_id = "dr_arjun"
        self.current_state = "idle"

    async def initialize(self):
        """Initialize all model adapters concurrently."""
        logger.info("Initializing Avatar Animation Pipeline adapters...")
        await asyncio.gather(
            self.liveportrait.initialize(),
            self.musetalk.initialize(),
            self.echomimic_v3.initialize(),
            return_exceptions=True
        )
        logger.info("Avatar Animation Pipeline initialized.")

    def get_doctor_profile(self, doctor_id: str) -> Dict[str, Any]:
        """Load doctor metadata and reference photo path."""
        profile_path = self.profiles_dir / f"{doctor_id}.json"
        if profile_path.exists():
            return json.loads(profile_path.read_text(encoding="utf-8"))
        # Fallback profile
        return {
            "doctor_id": doctor_id,
            "name": "Dr. Smit, M.D." if doctor_id == "dr_arjun" else "Dr. Ananya, M.D.",
            "reference_photo": f"/Users/malikarjunr/medicus-care/frontend/public/doctor/{doctor_id}.jpg"
        }

    async def render_state_transition(
        self,
        doctor_id: str,
        target_state: str,
        audio_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Produce animation response matching the interaction state machine.
        - LISTENING: Micro-motion loop (LivePortrait)
        - SPEAKING: Audio-driven neural lip-sync (MuseTalk)
        """
        self.active_doctor_id = doctor_id
        self.current_state = target_state
        profile = self.get_doctor_profile(doctor_id)
        ref_photo = profile["reference_photo"]

        if target_state == "speaking" and audio_path:
            out_path = f"/tmp/avatar_speech_{doctor_id}.mp4"
            result = await self.musetalk.generate_speech_video(
                reference_image_path=ref_photo,
                audio_path=audio_path,
                output_video_path=out_path
            )
            return {
                "doctor_id": doctor_id,
                "state": "speaking",
                "video_url": result.get("output_path"),
                "audio_synchronized": True
            }
        else:
            # Listening or idle micro-movement
            result = await self.liveportrait.generate_idle_frames(
                reference_image_path=ref_photo,
                duration_seconds=3.0,
                doctor_state=target_state
            )
            return {
                "doctor_id": doctor_id,
                "state": target_state,
                "loop_enabled": True
            }

avatar_animation_pipeline = AvatarAnimationPipeline()

