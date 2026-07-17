"""ClarityLoop – Assumptions API"""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.assumption import Assumption
from app.schemas import AssumptionCreate, AssumptionUpdate, AssumptionOut

router = APIRouter()

@router.get("/", response_model=list[AssumptionOut])
async def list_assumptions(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assumption).where(Assumption.project_id == project_id).order_by(Assumption.created_at))
    return result.scalars().all()

@router.post("/", response_model=AssumptionOut, status_code=201)
async def create_assumption(project_id: str, body: AssumptionCreate, db: AsyncSession = Depends(get_db)):
    assumption = Assumption(project_id=project_id, **body.model_dump())
    db.add(assumption)
    await db.flush()
    await db.refresh(assumption)
    return assumption

@router.patch("/{assumption_id}", response_model=AssumptionOut)
async def update_assumption(assumption_id: str, body: AssumptionUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assumption).where(Assumption.id == assumption_id))
    assumption = result.scalar_one_or_none()
    if not assumption:
        raise HTTPException(404, "Assumption not found")
    # Track previous value
    if body.current_value and body.current_value != assumption.current_value:
        assumption.previous_value = assumption.current_value
        assumption.needs_reanalysis = True
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(assumption, k, v)
    await db.flush()
    await db.refresh(assumption)
    return assumption

@router.delete("/{assumption_id}")
async def delete_assumption(assumption_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assumption).where(Assumption.id == assumption_id))
    assumption = result.scalar_one_or_none()
    if not assumption:
        raise HTTPException(404, "Assumption not found")
    await db.delete(assumption)
    return {"message": "Assumption deleted"}
