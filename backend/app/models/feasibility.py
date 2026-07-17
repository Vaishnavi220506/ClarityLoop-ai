"""
ClarityLoop – FeasibilityAssessment & AssessmentVersion ORM Models
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class FeasibilityAssessment(Base):
    __tablename__ = "feasibility_assessments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    conversation_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True)
    # Verdict: feasible | feasible_with_conditions | not_feasible | insufficient_evidence
    verdict: Mapped[str] = mapped_column(String(50), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0)
    confidence_explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Structured JSON fields stored as text
    verified_requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    partial_requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)   # JSON
    assumptions_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)       # JSON
    estimates_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)         # JSON
    unknowns_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)          # JSON
    contradictions_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)    # JSON
    blockers_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)          # JSON
    risks_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)             # JSON
    scope_changes_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)     # JSON
    realistic_alternative: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    what_would_make_feasible: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommended_next_action: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Agent execution metadata
    review_rounds: Mapped[int] = mapped_column(Integer, default=1)
    agents_used: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON list
    total_latency_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    tokens_used: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    # User approval
    scope_change_approved: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    project: Mapped["Project"] = relationship("Project", back_populates="assessments")  # type: ignore[name-defined]
    evidence: Mapped[list] = relationship("Evidence", foreign_keys="Evidence.assessment_id")
    versions: Mapped[list] = relationship("AssessmentVersion", back_populates="assessment", cascade="all, delete-orphan")


class AssessmentVersion(Base):
    __tablename__ = "assessment_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    assessment_id: Mapped[str] = mapped_column(String(36), ForeignKey("feasibility_assessments.id", ondelete="CASCADE"), index=True)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    verdict: Mapped[str] = mapped_column(String(50), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0)
    change_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    snapshot_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # full JSON snapshot
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    assessment: Mapped["FeasibilityAssessment"] = relationship("FeasibilityAssessment", back_populates="versions")
