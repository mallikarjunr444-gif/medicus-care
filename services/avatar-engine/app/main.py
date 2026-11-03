"""
Medicus Care™ — Avatar Engine FastAPI Service
Provides REST endpoints and WebSocket channels for streaming real-time AI doctor animation.
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging

from app.pipeline.animation_pipeline import avatar_animation_pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medicus_care.avatar_service")

app = FastAPI(
    title="MediCare Avatar Engine",
    description="Photorealistic Neural AI Doctor Animation Service",
    version="1.0.0"
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
    logger.info("Starting MediCare Avatar Engine...")
    await avatar_animation_pipeline.initialize()

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "medicare-avatar-engine",
        "doctors": ["dr_arjun", "dr_ananya"],
        "models": {
            "idle_animation": "LivePortrait",
            "lip_sync": "MuseTalk",
            "diffusion_portrait": "EchoMimicV3"
        }
    }

@app.get("/doctors/{doctor_id}")
async def get_doctor_profile(doctor_id: str):
    if doctor_id not in ("dr_arjun", "dr_ananya"):
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return avatar_animation_pipeline.get_doctor_profile(doctor_id)

@app.post("/animate")
async def trigger_animation(req: AnimationRequest):
    result = await avatar_animation_pipeline.render_state_transition(
        doctor_id=req.doctor_id,
        target_state=req.target_state,
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

            response = await avatar_animation_pipeline.render_state_transition(
                doctor_id=doc_id,
                target_state=state,
                audio_path=audio
            )
            await websocket.send_json(response)
    except WebSocketDisconnect:
        logger.info("Avatar streaming client disconnected.")

