"""Built-in doctor identities exposed through the existing avatar session flow."""

import uuid
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
        "specialty": "Metabolic Health, Lab Diagnostics & Wellness",
    },
    "dr_arjun": {
        "name": "Dr. Arjun",
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
    if avatar:
        return _avatar_payload(avatar)

    image_path: Path = profile["image"]
    if not image_path.is_file():
        raise HTTPException(status_code=503, detail="Doctor reference photo is missing")

    key = f"avatars/{avatar_id}/image.jpg"
    image_url = await storage_service.upload_file(
        image_path.read_bytes(), key, content_type="image/jpeg"
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
            "system_prompt": (
                f"You are {profile['name']}, a compassionate medical professional specializing in "
                f"{profile['specialty']}. Give concise, careful responses suitable for speech. "
                "Use the patient's selected language. Do not claim a diagnosis; explain uncertainty "
                "and recommend urgent care for emergency symptoms."
            ),
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
