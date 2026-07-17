"""ClarityLoop – AgentRun ORM Model"""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base

def _uuid() -> str: return str(uuid.uuid4())

class AgentRun(Base):
    __tablename__ = "agent_runs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)
    conversation_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=True)
    workflow: Mapped[str] = mapped_column(String(50), nullable=False)  # direct_answer, feasibility, etc.
    routing_mode: Mapped[str] = mapped_column(String(50), nullable=False)
    routing_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    agents_invoked: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON list
    tools_called: Mapped[Optional[str]] = mapped_column(Text, nullable=True)    # JSON list
    review_rounds: Mapped[int] = mapped_column(Integer, default=0)
    evidence_gathered: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    verdict: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    latency_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    tokens_used: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    fallback_used: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
