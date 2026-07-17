"""ClarityLoop – UploadedFile ORM Model"""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

def _uuid() -> str: return str(uuid.uuid4())

class UploadedFile(Base):
    __tablename__ = "uploaded_files"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    branch_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("branches.id", ondelete="SET NULL"), nullable=True)
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    safe_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(200), nullable=False)
    file_extension: Mapped[str] = mapped_column(String(20), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    parsed_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    parse_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_image: Mapped[bool] = mapped_column(Boolean, default=False)
    row_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    col_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    schema_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    project: Mapped["Project"] = relationship("Project", back_populates="files")  # type: ignore[name-defined]
