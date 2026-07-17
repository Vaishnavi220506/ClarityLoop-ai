"""ClarityLoop – WorkflowNode & WorkflowEdge ORM Models"""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

def _uuid() -> str: return str(uuid.uuid4())

class WorkflowNode(Base):
    __tablename__ = "workflow_nodes"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    node_type: Mapped[str] = mapped_column(String(30), nullable=False)  # conversation, task, evidence, warning, blocker, decision, completed
    label: Mapped[str] = mapped_column(String(500), nullable=False)
    ref_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)  # ID of the referenced entity
    ref_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)  # task, branch, evidence, etc.
    pos_x: Mapped[float] = mapped_column(Float, default=0.0)
    pos_y: Mapped[float] = mapped_column(Float, default=0.0)
    data_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # extra node data
    is_collapsed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    project: Mapped["Project"] = relationship("Project", back_populates="workflow_nodes")  # type: ignore[name-defined]

class WorkflowEdge(Base):
    __tablename__ = "workflow_edges"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    source_node_id: Mapped[str] = mapped_column(String(36), ForeignKey("workflow_nodes.id", ondelete="CASCADE"), index=True)
    target_node_id: Mapped[str] = mapped_column(String(36), ForeignKey("workflow_nodes.id", ondelete="CASCADE"), index=True)
    edge_type: Mapped[str] = mapped_column(String(30), default="default")
    label: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    project: Mapped["Project"] = relationship("Project", back_populates="workflow_edges")  # type: ignore[name-defined]
