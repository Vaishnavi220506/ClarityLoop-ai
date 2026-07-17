"""ClarityLoop – Decision ORM Model"""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

def _uuid() -> str: return str(uuid.uuid4())

class Decision(Base):
    __tablename__ = "decisions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    decision_made: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rationale: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    alternatives_considered: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    status: Mapped[str] = mapped_column(String(30), default="pending")  # pending, approved, rejected, superseded
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    project: Mapped["Project"] = relationship("Project", back_populates="decisions")  # type: ignore[name-defined]
