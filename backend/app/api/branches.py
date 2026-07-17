"""ClarityLoop – Branches API"""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.conversation import Branch, Message
from app.schemas import BranchCreate, BranchOut, MessageOut

router = APIRouter()

@router.get("/", response_model=list[BranchOut])
async def list_branches(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Branch).where(Branch.project_id == project_id).order_by(Branch.created_at))
    return result.scalars().all()

@router.post("/", response_model=BranchOut, status_code=201)
async def create_branch(project_id: str, body: BranchCreate, db: AsyncSession = Depends(get_db)):
    # Determine depth
    depth = 0
    if body.parent_branch_id:
        result = await db.execute(select(Branch).where(Branch.id == body.parent_branch_id))
        parent = result.scalar_one_or_none()
        if parent:
            depth = parent.depth + 1
    branch = Branch(project_id=project_id, depth=depth, **body.model_dump())
    db.add(branch)
    await db.flush()
    await db.refresh(branch)
    return branch

@router.get("/{branch_id}", response_model=BranchOut)
async def get_branch(branch_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Branch).where(Branch.id == branch_id))
    branch = result.scalar_one_or_none()
    if not branch:
        raise HTTPException(404, "Branch not found")
    return branch

@router.get("/{branch_id}/messages", response_model=list[MessageOut])
async def get_branch_messages(branch_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Message).where(Message.branch_id == branch_id).order_by(Message.created_at)
    )
    return result.scalars().all()

@router.patch("/{branch_id}/status")
async def update_branch_status(branch_id: str, body: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Branch).where(Branch.id == branch_id))
    branch = result.scalar_one_or_none()
    if not branch:
        raise HTTPException(404, "Branch not found")
    if "status" in body:
        branch.status = body["status"]
    if "local_summary" in body:
        branch.local_summary = body["local_summary"]
    await db.flush()
    return {"message": "Branch updated", "id": branch_id}

@router.get("/{branch_id}/breadcrumb")
async def get_breadcrumb(branch_id: str, db: AsyncSession = Depends(get_db)):
    """Return the full ancestor chain for breadcrumb navigation."""
    crumbs = []
    current_id = branch_id
    visited = set()
    while current_id and current_id not in visited:
        visited.add(current_id)
        result = await db.execute(select(Branch).where(Branch.id == current_id))
        branch = result.scalar_one_or_none()
        if not branch:
            break
        crumbs.append({"id": branch.id, "title": branch.title, "status": branch.status})
        current_id = branch.parent_branch_id
    crumbs.reverse()
    return crumbs
