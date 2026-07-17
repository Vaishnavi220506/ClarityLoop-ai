"""ClarityLoop – Conversations API"""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.conversation import Conversation, Message
from app.schemas import ConversationCreate, ConversationOut, MessageOut

router = APIRouter()
DEFAULT_USER = "default-user"

@router.get("/", response_model=list[ConversationOut])
async def list_conversations(project_id: str | None = None, db: AsyncSession = Depends(get_db)):
    q = select(Conversation).where(Conversation.user_id == DEFAULT_USER)
    if project_id:
        q = q.where(Conversation.project_id == project_id)
    result = await db.execute(q.order_by(Conversation.updated_at.desc()))
    return result.scalars().all()

@router.post("/", response_model=ConversationOut, status_code=201)
async def create_conversation(body: ConversationCreate, db: AsyncSession = Depends(get_db)):
    conv = Conversation(user_id=DEFAULT_USER, **body.model_dump())
    db.add(conv)
    await db.flush()
    await db.refresh(conv)
    return conv

@router.get("/{conv_id}", response_model=ConversationOut)
async def get_conversation(conv_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(404, "Conversation not found")
    return conv

@router.get("/{conv_id}/messages", response_model=list[MessageOut])
async def get_messages(conv_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Message).where(Message.conversation_id == conv_id).order_by(Message.created_at)
    )
    return result.scalars().all()

@router.delete("/{conv_id}", status_code=200)
async def delete_conversation(conv_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(404, "Conversation not found")
    # Delete messages first
    msgs = await db.execute(select(Message).where(Message.conversation_id == conv_id))
    for msg in msgs.scalars().all():
        await db.delete(msg)
    await db.delete(conv)
    await db.flush()
    return {"message": "Conversation deleted"}

@router.delete("/", status_code=200)
async def delete_all_conversations(db: AsyncSession = Depends(get_db)):
    convs = await db.execute(select(Conversation).where(Conversation.user_id == DEFAULT_USER))
    count = 0
    for conv in convs.scalars().all():
        msgs = await db.execute(select(Message).where(Message.conversation_id == conv.id))
        for msg in msgs.scalars().all():
            await db.delete(msg)
        await db.delete(conv)
        count += 1
    await db.flush()
    return {"message": f"Deleted {count} conversations"}

