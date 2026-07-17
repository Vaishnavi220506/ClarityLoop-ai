"""ClarityLoop – Projects API"""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.db.session import get_db
from app.models.project import Project
from app.schemas import ProjectCreate, ProjectUpdate, ProjectOut, MessageResponse

router = APIRouter()
DEFAULT_USER = "default-user"

@router.get("/", response_model=list[ProjectOut])
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.user_id == DEFAULT_USER).order_by(Project.updated_at.desc()))
    return result.scalars().all()

@router.post("/", response_model=ProjectOut, status_code=201)
async def create_project(body: ProjectCreate, db: AsyncSession = Depends(get_db)):
    project = Project(user_id=DEFAULT_USER, **body.model_dump())
    db.add(project)
    await db.flush()
    await db.refresh(project)
    return project

@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(404, "Project not found")
    return project

@router.patch("/{project_id}", response_model=ProjectOut)
async def update_project(project_id: str, body: ProjectUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(404, "Project not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(project, k, v)
    await db.flush()
    await db.refresh(project)
    return project

@router.delete("/{project_id}", response_model=MessageResponse)
async def delete_project(project_id: str, confirmed: bool = False, db: AsyncSession = Depends(get_db)):
    if not confirmed:
        raise HTTPException(400, "Set confirmed=true to delete a project. This action is irreversible.")
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(404, "Project not found")
    await db.execute(delete(Project).where(Project.id == project_id))
    return MessageResponse(message="Project deleted successfully")
