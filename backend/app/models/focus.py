"""ClarityLoop – FocusSession ORM Model"""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

def _uuid() -> str: return str(uuid.uuid4())

class FocusSession(Base):
    __tablename__ = "focus_sessions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    task_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True, index=True)
    current_action: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    why_it_matters: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expected_result: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    stuck_count: Mapped[int] = mapped_column(default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    exit_reason: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    exited_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    task: Mapped[Optional["Task"]] = relationship("Task", back_populates="focus_sessions")  # type: ignore[name-defined]
