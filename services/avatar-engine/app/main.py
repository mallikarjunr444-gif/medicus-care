"""MediCare avatar-engine discovery API.

The checked-in adapters currently inspect paths but do not execute inference.
This API reports that limitation explicitly instead of returning simulated
model success or performance telemetry.
"""

from pathlib import Path
import logging
from typing import Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.pipeline.animation_pipeline import avatar_animation_pipeline

MODEL_ROOT = Path(__file__).resolve().parents[1]

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medicus_care.avatar_service")

app = FastAPI(
    title="MediCare Avatar Engine",
    description="Avatar model readiness API",
    version="2.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnimationRequest(BaseModel):
    doctor_id: str
    target_state: str
    audio_path: Optional[str] = None
    language: Optional[str] = "en"


@app.on_event("startup")
async def startup_event():
    logger.info("Starting avatar readiness API; inference adapters are not installed.")


@app.get("/health")
async def health_check():
    model_paths = {
        "LivePortrait": [
            "models/LivePortrait/pretrained_weights/liveportrait/base_models/appearance_feature_extractor.pth",
            "models/LivePortrait/pretrained_weights/liveportrait/base_models/motion_extractor.pth",
            "models/LivePortrait/pretrained_weights/liveportrait/base_models/spade_generator.pth",
            "models/LivePortrait/pretrained_weights/liveportrait/base_models/warping_module.pth",
        ],
        "MuseTalk": [
            "models/MuseTalk/models/musetalkV15/unet.pth",
            "models/MuseTalk/models/musetalkV15/musetalk.json",
            "models/MuseTalk/models/whisper",
            "models/MuseTalk/models/sd-vae",
        ],
        "EchoMimicV3": [
            "models/echomimic_v3/models/Wan2.1-Fun-V1.1-1.3B-InP",
            "models/echomimic_v3/models/transformer/diffusion_pytorch_model.safetensors",
        ],
        "EchoMimic": ["models/echomimic/pretrained_weights/denoising_unet.pth"],
        "AniPortrait": ["models/AniPortrait/pretrained_model/denoising_unet.pth"],
    }
    return {
        "status": "degraded",
        "service": "medicare-avatar-engine",
        "inference_available": False,
        "reason": "No executable model inference adapters are implemented in this service.",
        "models": {
            name: {
                "repository_present": (MODEL_ROOT / Path(paths[0]).parts[0] / Path(paths[0]).parts[1]).exists(),
                "required_paths_present": all((MODEL_ROOT / path).exists() for path in paths),
                "inference_adapter": "metadata_only",
            }
            for name, paths in model_paths.items()
        },
    }


@app.get("/doctors/{doctor_id}")
async def get_doctor_profile(doctor_id: str):
    if doctor_id not in ("dr_arjun", "dr_ananya"):
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return avatar_animation_pipeline.get_doctor_profile(doctor_id)


@app.post("/animate")
async def trigger_animation(req: AnimationRequest):
    raise HTTPException(
        status_code=503,
        detail="Avatar inference is unavailable: no executable model adapter and checkpoints are installed.",
    )


@app.websocket("/ws/stream")
async def stream_avatar_ws(websocket: WebSocket):
    await websocket.accept()
    logger.info("Avatar streaming client connected.")
    try:
        while True:
            data = await websocket.receive_json()
            await websocket.send_json({
                "type": "error",
                "doctor_id": data.get("doctor_id", "dr_arjun"),
                "message": "Avatar inference is unavailable on this service.",
            })
    except WebSocketDisconnect:
        logger.info("Avatar streaming client disconnected.")
