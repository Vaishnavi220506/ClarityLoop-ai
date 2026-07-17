"""
ClarityLoop – Evidence, Claim, Citation ORM Models
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


class Evidence(Base):
    __tablename__ = "evidence"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    assessment_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("feasibility_assessments.id", ondelete="CASCADE"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    url: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)
    source_org: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    source_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # official, government, peer_reviewed, documentation, repository, secondary, personal
    source_quality: Mapped[int] = mapped_column(Integer, default=5)  # 1=best, 7=worst (per spec hierarchy)
    source_quality_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    access_date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    supported_claim: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reliability: Mapped[str] = mapped_column(String(30), default="unknown")  # high, medium, low, unknown
    verification_status: Mapped[str] = mapped_column(String(30), default="unverified")  # verified, partial, unverified, contradicted
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    project: Mapped["Project"] = relationship("Project", back_populates="evidence")  # type: ignore[name-defined]
    claims: Mapped[list] = relationship("Claim", back_populates="evidence", cascade="all, delete-orphan")


class Claim(Base):
    __tablename__ = "claims"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    evidence_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("evidence.id", ondelete="CASCADE"), nullable=True, index=True)
    statement: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="unknown")  # verified, partially_verified, assumption, estimate, contradicted, unknown
    source: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    source_quality: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    affected_conclusion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    last_verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    evidence: Mapped[Optional["Evidence"]] = relationship("Evidence", back_populates="claims")


class Citation(Base):
    __tablename__ = "citations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    message_id: Mapped[str] = mapped_column(String(36), ForeignKey("messages.id", ondelete="CASCADE"), index=True)
    evidence_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("evidence.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    url: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)
    snippet: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    message: Mapped["Message"] = relationship("Message", back_populates="citations")  # type: ignore[name-defined]
