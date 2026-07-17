"""ClarityLoop – Canvas API"""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.db.session import get_db
from app.models.canvas import WorkflowNode, WorkflowEdge
from app.schemas import WorkflowNodeCreate, WorkflowNodeUpdate, WorkflowNodeOut, WorkflowEdgeCreate, WorkflowEdgeOut

router = APIRouter()

@router.get("/nodes/{project_id}", response_model=list[WorkflowNodeOut])
async def list_nodes(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkflowNode).where(WorkflowNode.project_id == project_id))
    return result.scalars().all()

@router.post("/nodes/{project_id}", response_model=WorkflowNodeOut, status_code=201)
async def create_node(project_id: str, body: WorkflowNodeCreate, db: AsyncSession = Depends(get_db)):
    node = WorkflowNode(project_id=project_id, **body.model_dump())
    db.add(node)
    await db.flush()
    await db.refresh(node)
    return node

@router.patch("/nodes/{node_id}", response_model=WorkflowNodeOut)
async def update_node(node_id: str, body: WorkflowNodeUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkflowNode).where(WorkflowNode.id == node_id))
    node = result.scalar_one_or_none()
    if not node:
        raise HTTPException(404, "Node not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(node, k, v)
    await db.flush()
    await db.refresh(node)
    return node

@router.delete("/nodes/{node_id}")
async def delete_node(node_id: str, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(WorkflowNode).where(WorkflowNode.id == node_id))
    return {"message": "Node deleted"}

@router.get("/edges/{project_id}", response_model=list[WorkflowEdgeOut])
async def list_edges(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkflowEdge).where(WorkflowEdge.project_id == project_id))
    return result.scalars().all()

@router.post("/edges/{project_id}", response_model=WorkflowEdgeOut, status_code=201)
async def create_edge(project_id: str, body: WorkflowEdgeCreate, db: AsyncSession = Depends(get_db)):
    edge = WorkflowEdge(project_id=project_id, **body.model_dump())
    db.add(edge)
    await db.flush()
    await db.refresh(edge)
    return edge

@router.delete("/edges/{edge_id}")
async def delete_edge(edge_id: str, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(WorkflowEdge).where(WorkflowEdge.id == edge_id))
    return {"message": "Edge deleted"}

@router.post("/layout/reset/{project_id}")
async def reset_layout(project_id: str, db: AsyncSession = Depends(get_db)):
    """Auto-layout all nodes in a project using a simple grid."""
    result = await db.execute(select(WorkflowNode).where(WorkflowNode.project_id == project_id))
    nodes = result.scalars().all()
    for i, node in enumerate(nodes):
        node.pos_x = (i % 5) * 300.0
        node.pos_y = (i // 5) * 200.0
    await db.flush()
    return {"message": f"Layout reset for {len(nodes)} nodes"}
