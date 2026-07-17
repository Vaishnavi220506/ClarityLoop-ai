"""
ClarityLoop – Database Setup
SQLAlchemy async session management.
Designed to support both SQLite (dev) and PostgreSQL (prod) without core rewrites.
"""
from __future__ import annotations

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings


def _get_async_url(url: str) -> str:
    """Convert sync DB URL to async-compatible URL."""
    if url.startswith("sqlite:///"):
        return url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql+psycopg2://"):
        return url.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
    return url


settings = get_settings()
_async_url = _get_async_url(settings.database_url)

engine = create_async_engine(
    _async_url,
    echo=settings.log_level == "DEBUG",
    connect_args={"check_same_thread": False} if settings.is_sqlite else {},
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: provides a database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create all tables (used in tests and initial setup)."""
    async with engine.begin() as conn:
        from app.models import all_models  # noqa: F401 – triggers model registration
        await conn.run_sync(Base.metadata.create_all)
