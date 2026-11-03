"""
Medicus Care™ — Avatar Engine FastAPI Service
Provides REST endpoints and WebSocket channels for streaming real-time AI doctor animation
with ALL MODELS RUNNING SIMULTANEOUSLY.
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging

from app.pipeline.animation_pipeline import avatar_animation_pipeline
from app.pipeline.simultaneous_orchestrator import simultaneous_orchestrator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medicus_care.avatar_service")

app = FastAPI(
    title="MediCare Avatar Engine",
    description="Photorealistic Neural AI Doctor Animation Service (Simultaneous Multi-Model Ensemble)",
    version="2.0.0"
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
    target_state: str  # 'listening', 'thinking', 'speaking', 'interrupted', 'idle'
    audio_path: Optional[str] = None
    language: Optional[str] = "en"

@app.on_event("startup")
async def startup_event():
    logger.info("Starting MediCare Simultaneous Multi-Model Avatar Engine...")
    await simultaneous_orchestrator.initialize_all_simultaneously()
    await avatar_animation_pipeline.initialize()

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "medicare-avatar-engine",
        "mode": "SIMULTANEOUS_MULTI_MODEL_ENSEMBLE",
        "doctors": ["dr_arjun", "dr_ananya"],
        "active_models_simultaneous": [
            "LivePortrait (Gaze & Micro-Motion)",
            "MuseTalk (Real-Time Audio Lip-Sync)",
            "EchoMimic_V3 (Multimodal Expression Diffusion)",
            "EchoMimic (Landmark Audio Alignment)",
            "AniPortrait (Audio-Driven Pose Validation)"
        ],
        "fps": 60,
        "concurrency": "asyncio.gather_parallel"
    }

@app.get("/doctors/{doctor_id}")
async def get_doctor_profile(doctor_id: str):
    if doctor_id not in ("dr_arjun", "dr_ananya"):
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return avatar_animation_pipeline.get_doctor_profile(doctor_id)

@app.post("/animate")
async def trigger_animation(req: AnimationRequest):
    # Process through all models simultaneously
    profile = avatar_animation_pipeline.get_doctor_profile(req.doctor_id)
    ref_photo = profile.get("reference_photo", "")

    result = await simultaneous_orchestrator.process_simultaneous_turn(
        doctor_id=req.doctor_id,
        doctor_state=req.target_state,
        reference_image_path=ref_photo,
        audio_path=req.audio_path
    )
    return result

@app.websocket("/ws/stream")
async def stream_avatar_ws(websocket: WebSocket):
    await websocket.accept()
    logger.info("Avatar streaming client connected.")
    try:
        while True:
            data = await websocket.receive_json()
            doc_id = data.get("doctor_id", "dr_arjun")
            state = data.get("state", "listening")
            audio = data.get("audio_path")
            profile = avatar_animation_pipeline.get_doctor_profile(doc_id)

            response = await simultaneous_orchestrator.process_simultaneous_turn(
                doctor_id=doc_id,
                doctor_state=state,
                reference_image_path=profile.get("reference_photo", ""),
                audio_path=audio
            )
            await websocket.send_json(response)
    except WebSocketDisconnect:
        logger.info("Avatar streaming client disconnected.")
