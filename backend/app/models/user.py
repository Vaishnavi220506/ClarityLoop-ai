"""
ClarityLoop – User, UserPreference, ResourceProfile ORM Models
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


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True)
    display_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    preferences: Mapped[Optional["UserPreference"]] = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    resource_profile: Mapped[Optional["ResourceProfile"]] = relationship("ResourceProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    projects: Mapped[list] = relationship("Project", back_populates="user", cascade="all, delete-orphan")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    answer_depth: Mapped[str] = mapped_column(String(20), default="adaptive")  # quick, simple, detailed, step_by_step, technical, adaptive
    preferred_language: Mapped[str] = mapped_column(String(50), default="Python")
    skill_level: Mapped[str] = mapped_column(String(20), default="intermediate")  # beginner, intermediate, advanced
    explanation_style: Mapped[str] = mapped_column(String(20), default="balanced")  # concise, balanced, verbose
    focus_mode_preference: Mapped[bool] = mapped_column(Boolean, default=False)
    theme: Mapped[str] = mapped_column(String(20), default="dark")
    animation_reduced: Mapped[bool] = mapped_column(Boolean, default=False)
    memory_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    budget_preference: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="preferences")


class ResourceProfile(Base):
    __tablename__ = "resource_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    cpu_cores: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    ram_gb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    gpu_model: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    gpu_vram_gb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    storage_gb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    operating_system: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    internet_speed_mbps: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    monthly_budget_usd: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="resource_profile")
