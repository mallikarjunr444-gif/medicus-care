"""Persist and fetch the end-of-call consultation report for a session."""

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.users import require_current_user
from app.database import get_db
from app.models import ConsultationReport, Session, User

router = APIRouter()


class ReportIn(BaseModel):
    doctor_id: Optional[str] = Field(default=None, max_length=64)
    language: Optional[str] = Field(default=None, max_length=16)
    triage_level: Optional[int] = Field(default=None, ge=1, le=4)
    duration_seconds: Optional[int] = Field(default=None, ge=0)
    report: dict[str, Any]


def _out(r: ConsultationReport) -> dict[str, Any]:
    return {
        "id": r.id,
        "session_id": r.session_id,
        "doctor_id": r.doctor_id,
        "language": r.language,
        "triage_level": r.triage_level,
        "duration_seconds": r.duration_seconds,
        "report": r.report,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


async def _owned_session(db: AsyncSession, session_id: str, user: User) -> Session:
    res = await db.execute(select(Session).where(Session.id == session_id))
    session = res.scalar_one_or_none()
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


@router.put("/{session_id}")
async def save_report(
    session_id: str,
    body: ReportIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    await _owned_session(db, session_id, current_user)
    res = await db.execute(
        select(ConsultationReport).where(ConsultationReport.session_id == session_id)
    )
    row = res.scalar_one_or_none()
    if row is None:
        row = ConsultationReport(session_id=session_id, user_id=current_user.id, report=body.report)
        db.add(row)
    row.doctor_id = body.doctor_id
    row.language = body.language
    row.triage_level = body.triage_level
    row.duration_seconds = body.duration_seconds
    row.report = body.report
    await db.commit()
    await db.refresh(row)
    return _out(row)


@router.get("/{session_id}")
async def get_report(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    await _owned_session(db, session_id, current_user)
    res = await db.execute(
        select(ConsultationReport).where(ConsultationReport.session_id == session_id)
    )
    row = res.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No report yet")
    return _out(row)
