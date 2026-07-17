"""
ClarityLoop – Conversation, Branch, Message ORM Models
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    mode: Mapped[str] = mapped_column(String(30), default="direct_answer")
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    project: Mapped[Optional["Project"]] = relationship("Project", back_populates="conversations")  # type: ignore[name-defined]
    branches: Mapped[list] = relationship("Branch", back_populates="conversation", cascade="all, delete-orphan")
    messages: Mapped[list] = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")


class Branch(Base):
    __tablename__ = "branches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    conversation_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=True, index=True)
    parent_branch_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("branches.id", ondelete="CASCADE"), nullable=True, index=True)
    source_message_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    purpose: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # explore, work_on, challenge, compare, etc.
    local_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    inherited_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="active")  # active, blocked, completed, archived
    depth: Mapped[int] = mapped_column(Integer, default=0)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    project: Mapped["Project"] = relationship("Project", back_populates="branches")  # type: ignore[name-defined]
    conversation: Mapped[Optional["Conversation"]] = relationship("Conversation", back_populates="branches")
    parent: Mapped[Optional["Branch"]] = relationship("Branch", remote_side="Branch.id", back_populates="children")
    children: Mapped[list] = relationship("Branch", back_populates="parent", cascade="all, delete-orphan")
    messages: Mapped[list] = relationship("Message", back_populates="branch", cascade="all, delete-orphan", foreign_keys="Message.branch_id", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    conversation_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=True, index=True)
    branch_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("branches.id", ondelete="CASCADE"), nullable=True, index=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # user, assistant, system
    content: Mapped[str] = mapped_column(Text, nullable=False)
    mode: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    routing_mode: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    confidence_score: Mapped[Optional[float]] = mapped_column(nullable=True)
    has_citations: Mapped[bool] = mapped_column(Boolean, default=False)
    has_feasibility: Mapped[bool] = mapped_column(Boolean, default=False)
    token_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    conversation: Mapped[Optional["Conversation"]] = relationship("Conversation", back_populates="messages")
    branch: Mapped[Optional["Branch"]] = relationship("Branch", back_populates="messages", foreign_keys=[branch_id])
    citations: Mapped[list] = relationship("Citation", back_populates="message", cascade="all, delete-orphan")
