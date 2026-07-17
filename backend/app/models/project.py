"""
ClarityLoop – Project ORM Model
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


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    objective: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    current_verdict: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # feasible, feasible_with_conditions, not_feasible, insufficient_evidence
    progress_pct: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(30), default="active")  # active, completed, archived, paused
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="projects")  # type: ignore[name-defined]
    conversations: Mapped[list] = relationship("Conversation", back_populates="project", cascade="all, delete-orphan")
    branches: Mapped[list] = relationship("Branch", back_populates="project", cascade="all, delete-orphan")
    tasks: Mapped[list] = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    assumptions: Mapped[list] = relationship("Assumption", back_populates="project", cascade="all, delete-orphan")
    evidence: Mapped[list] = relationship("Evidence", back_populates="project", cascade="all, delete-orphan")
    decisions: Mapped[list] = relationship("Decision", back_populates="project", cascade="all, delete-orphan")
    assessments: Mapped[list] = relationship("FeasibilityAssessment", back_populates="project", cascade="all, delete-orphan")
    files: Mapped[list] = relationship("UploadedFile", back_populates="project", cascade="all, delete-orphan")
    workflow_nodes: Mapped[list] = relationship("WorkflowNode", back_populates="project", cascade="all, delete-orphan")
    workflow_edges: Mapped[list] = relationship("WorkflowEdge", back_populates="project", cascade="all, delete-orphan")
