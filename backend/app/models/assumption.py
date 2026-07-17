"""
ClarityLoop – Assumption ORM Model
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class Assumption(Base):
    __tablename__ = "assumptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    statement: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # hardware, budget, time, skills, data, team, etc.
    current_value: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    previous_value: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    impact: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # what changes if this assumption changes
    affected_conclusions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON list of affected conclusion IDs
    is_user_provided: Mapped[bool] = mapped_column(Boolean, default=True)
    needs_reanalysis: Mapped[bool] = mapped_column(Boolean, default=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    project: Mapped["Project"] = relationship("Project", back_populates="assumptions")  # type: ignore[name-defined]
