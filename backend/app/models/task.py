"""
ClarityLoop – Task & TaskDependency ORM Models
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


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    branch_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("branches.id", ondelete="SET NULL"), nullable=True, index=True)
    parent_task_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    phase: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    expected_output: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    completion_condition: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    blocker_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="not_started")  # not_started, in_progress, blocked, waiting, needs_verification, completed, abandoned
    priority: Mapped[int] = mapped_column(Integer, default=0)  # 0 = normal, higher = more important
    is_primary_next: Mapped[bool] = mapped_column(Boolean, default=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    project: Mapped["Project"] = relationship("Project", back_populates="tasks")  # type: ignore[name-defined]
    parent: Mapped[Optional["Task"]] = relationship("Task", remote_side="Task.id", back_populates="children")
    children: Mapped[list] = relationship("Task", back_populates="parent", cascade="all, delete-orphan")
    dependencies: Mapped[list] = relationship("TaskDependency", foreign_keys="TaskDependency.task_id", back_populates="task", cascade="all, delete-orphan")
    dependents: Mapped[list] = relationship("TaskDependency", foreign_keys="TaskDependency.depends_on_id", back_populates="depends_on")
    focus_sessions: Mapped[list] = relationship("FocusSession", back_populates="task", cascade="all, delete-orphan")


class TaskDependency(Base):
    __tablename__ = "task_dependencies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), index=True)
    depends_on_id: Mapped[str] = mapped_column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), index=True)
    dependency_type: Mapped[str] = mapped_column(String(30), default="finish_to_start")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    task: Mapped["Task"] = relationship("Task", foreign_keys=[task_id], back_populates="dependencies")
    depends_on: Mapped["Task"] = relationship("Task", foreign_keys=[depends_on_id], back_populates="dependents")
