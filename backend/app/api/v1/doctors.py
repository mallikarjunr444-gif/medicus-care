"""Built-in doctor identities exposed through the existing avatar session flow."""

import uuid
import hashlib
import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.users import require_current_user
from app.database import get_db
from app.models import Avatar, User
from app.services.storage import storage_service

router = APIRouter()
REPO_ROOT = Path(__file__).resolve().parents[4]
DOCTORS = {
    "dr_ananya": {
        "name": "Dr. Ananya",
        "image": REPO_ROOT / "frontend/public/doctor/dr_ananya.jpg",
        "specialty": "AI Psychologist / Mental Wellness Consultant",
    },
    "dr_arjun": {
        "name": "Dr. Smit",
        "image": REPO_ROOT / "frontend/public/doctor/dr_arjun.jpg",
        "specialty": "General Physician",
    },
}


@router.post("/{doctor_id}/avatar")
async def get_or_create_doctor_avatar(
    doctor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    """Create an owned avatar row around the bundled, unmodified doctor photo.

    This lets the consultation use the existing session/WebSocket/LLM/TTS
    pipeline without re-uploading or face-restoring the identity photograph.
    """
    profile = DOCTORS.get(doctor_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    avatar_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"medicare:{current_user.id}:{doctor_id}"))
    result = await db.execute(select(Avatar).where(Avatar.id == avatar_id))
    avatar = result.scalar_one_or_none()

    image_path: Path = profile["image"]
    if not image_path.is_file():
        raise HTTPException(status_code=503, detail="Doctor reference photo is missing")

    key = f"avatars/{avatar_id}/image.jpg"
    image_bytes = image_path.read_bytes()
    reference_hash = hashlib.sha256(image_bytes).hexdigest()
    system_prompt = (
        f"You are MediCare's AI doctor persona named {profile['name']}, focused on "
        f"{profile['specialty']}. Be warm, concise, and conversational for speech. "
        "Respond promptly with a brief acknowledgement and one useful answer or one focused follow-up question. "
        "Use the conversation history so patients do not need to repeat themselves. Do not restart with greetings. "
        "Do not recommend a hospital, clinic, or in-person visit by default; provide practical general guidance "
        "when appropriate and suggest clinician review only when the reported symptoms, uncertainty, or need "
        "for examination makes it relevant. Give clear urgent-care instructions for possible emergencies, "
        "without delaying them for research. Never promise millisecond response times. "
        "Use the patient's selected language. Be transparent that you are an AI assistant, "
        "not a human clinician. Answer questions about your identity only from this profile; "
        "do not invent a biography, credentials, clinic, or personal experiences. Use provided "
        "reference excerpts as informational sources, explain uncertainty, and do not diagnose "
        "or prescribe. Never invent studies, citations, or web research. When a PubMed source is "
        "provided, cite its title and year in plain language when relevant; do not read URLs aloud. "
        "If no reliable information is available, say what is uncertain and ask a useful follow-up. "
        "Recommend urgent care for emergency symptoms. Reference material may be incomplete or "
        "outdated, so explain that limitation when it matters. "
        "Talk like a caring doctor in a real consultation: listen first, acknowledge what the "
        "patient just said, and ask ONE short follow-up question at a time. Never repeat a "
        "question the patient has already answered; use what they told you earlier in the "
        "conversation (symptoms, duration, severity, age, medicines). Keep replies to 1-3 "
        "short spoken sentences, no lists or markdown."
    )

    if avatar:
        metadata = avatar.avatar_metadata or {}
        if isinstance(metadata, str):
            try:
                metadata = json.loads(metadata)
            except json.JSONDecodeError:
                metadata = {}
        metadata = dict(metadata) if isinstance(metadata, dict) else {}

        if avatar.s3_key != key or metadata.get("reference_sha256") != reference_hash:
            image_url = await storage_service.upload_file(
                image_bytes, key, content_type="image/jpeg"
            )
            avatar.image_url = image_url
            avatar.thumbnail_url = image_url
            avatar.s3_key = key
        avatar.name = profile["name"]
        avatar.status = "ready"
        avatar.avatar_metadata = {
            **metadata,
            "doctor_id": doctor_id,
            "reference_sha256": reference_hash,
            "system_prompt": system_prompt,
        }
        await db.commit()
        await db.refresh(avatar)
        return _avatar_payload(avatar)

    image_url = await storage_service.upload_file(
        image_bytes, key, content_type="image/jpeg"
    )
    avatar = Avatar(
        id=avatar_id,
        user_id=current_user.id,
        name=profile["name"],
        image_url=image_url,
        thumbnail_url=image_url,
        s3_key=key,
        status="ready",
        avatar_metadata={
            "doctor_id": doctor_id,
            "reference_sha256": reference_hash,
            "system_prompt": system_prompt,
        },
    )
    db.add(avatar)
    try:
        await db.commit()
        await db.refresh(avatar)
    except Exception:
        await db.rollback()
        result = await db.execute(select(Avatar).where(Avatar.id == avatar_id))
        avatar = result.scalar_one_or_none()
        if avatar is None:
            raise
    return _avatar_payload(avatar)


def _avatar_payload(avatar: Avatar) -> dict:
    return {
        "id": avatar.id,
        "name": avatar.name,
        "image_url": avatar.image_url,
        "thumbnail_url": avatar.thumbnail_url,
        "s3_key": avatar.s3_key,
        "status": avatar.status,
        "avatar_metadata": avatar.avatar_metadata,
    }
