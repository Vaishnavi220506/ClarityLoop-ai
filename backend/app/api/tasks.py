"""ClarityLoop – Tasks API"""
from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.db.session import get_db
from app.models.task import Task, TaskDependency
from app.schemas import TaskCreate, TaskUpdate, TaskOut

router = APIRouter()

@router.get("/", response_model=list[TaskOut])
async def list_tasks(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.project_id == project_id).order_by(Task.order_index))
    return result.scalars().all()

@router.post("/", response_model=TaskOut, status_code=201)
async def create_task(project_id: str, body: TaskCreate, db: AsyncSession = Depends(get_db)):
    task = Task(project_id=project_id, **body.model_dump())
    db.add(task)
    await db.flush()
    await db.refresh(task)
    return task

@router.get("/{task_id}", response_model=TaskOut)
async def get_task(task_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Task not found")
    return task

@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(task_id: str, body: TaskUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Task not found")
    updates = body.model_dump(exclude_none=True)
    for k, v in updates.items():
        setattr(task, k, v)
    if updates.get("status") == "completed" and not task.completed_at:
        task.completed_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(task)
    return task

@router.post("/{task_id}/complete", response_model=TaskOut)
async def complete_task(task_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Task not found")
    task.status = "completed"
    task.completed_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(task)
    return task

@router.post("/{task_id}/block")
async def block_task(task_id: str, body: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Task not found")
    task.status = "blocked"
    task.blocker_description = body.get("blocker_description", "Blocked")
    await db.flush()
    return {"message": "Task blocked", "id": task_id}

@router.post("/dependencies")
async def add_dependency(body: dict, db: AsyncSession = Depends(get_db)):
    dep = TaskDependency(
        task_id=body["task_id"],
        depends_on_id=body["depends_on_id"],
        dependency_type=body.get("dependency_type", "finish_to_start"),
    )
    db.add(dep)
    await db.flush()
    return {"message": "Dependency added"}
