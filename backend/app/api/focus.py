"""ClarityLoop – Focus Mode API"""
from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.focus import FocusSession
from app.models.task import Task
from app.schemas import FocusSessionOut

router = APIRouter()
DEFAULT_USER = "default-user"

@router.post("/start", response_model=FocusSessionOut, status_code=201)
async def start_focus(body: dict, db: AsyncSession = Depends(get_db)):
    project_id = body.get("project_id")
    task_id = body.get("task_id")
    if not project_id:
        raise HTTPException(400, "project_id required")

    # Deactivate any existing sessions
    result = await db.execute(
        select(FocusSession).where(FocusSession.user_id == DEFAULT_USER, FocusSession.is_active == True)
    )
    existing = result.scalars().all()
    for s in existing:
        s.is_active = False
        s.exited_at = datetime.now(timezone.utc)
        s.exit_reason = "new_session_started"

    # Build focus context from task
    current_action = body.get("current_action", "Complete the current task")
    why_it_matters = body.get("why_it_matters", "This is the recommended next step in your plan")
    expected_result = body.get("expected_result", "Task is marked as completed")

    if task_id:
        result = await db.execute(select(Task).where(Task.id == task_id))
        task = result.scalar_one_or_none()
        if task:
            current_action = current_action or task.title
            expected_result = expected_result or task.expected_output or "Task is completed"

    session = FocusSession(
        user_id=DEFAULT_USER,
        project_id=project_id,
        task_id=task_id,
        current_action=current_action,
        why_it_matters=why_it_matters,
        expected_result=expected_result,
        is_active=True,
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return session

@router.get("/active", response_model=FocusSessionOut | None)
async def get_active_focus(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(FocusSession).where(FocusSession.user_id == DEFAULT_USER, FocusSession.is_active == True)
    )
    return result.scalar_one_or_none()

@router.post("/{session_id}/exit")
async def exit_focus(session_id: str, body: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FocusSession).where(FocusSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Focus session not found")
    session.is_active = False
    session.exited_at = datetime.now(timezone.utc)
    session.exit_reason = body.get("reason", "user_exited")
    await db.flush()
    return {"message": "Focus mode exited. All progress saved."}

@router.post("/{session_id}/stuck")
async def report_stuck(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FocusSession).where(FocusSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Focus session not found")
    session.stuck_count += 1
    await db.flush()
    return {"stuck_count": session.stuck_count, "message": "Stuck recorded. Getting guidance..."}
