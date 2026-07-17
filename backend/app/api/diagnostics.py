"""ClarityLoop – Diagnostics API (dev-only agent observability)"""
from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.agent_run import AgentRun
from app.core.config import get_settings

router = APIRouter()
settings = get_settings()

@router.get("/agent-runs")
async def list_agent_runs(limit: int = 20, db: AsyncSession = Depends(get_db)):
    """Return recent agent run records for observability."""
    result = await db.execute(
        select(AgentRun).order_by(AgentRun.created_at.desc()).limit(limit)
    )
    runs = result.scalars().all()
    return [
        {
            "id": r.id,
            "workflow": r.workflow,
            "routing_mode": r.routing_mode,
            "routing_reason": r.routing_reason,
            "agents_invoked": r.agents_invoked,
            "review_rounds": r.review_rounds,
            "verdict": r.verdict,
            "latency_ms": r.latency_ms,
            "fallback_used": r.fallback_used,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            # Never expose: tools_called details, private reasoning, prompts
        }
        for r in runs
    ]

@router.get("/status")
async def system_status(db: AsyncSession = Depends(get_db)):
    """Return system status without exposing secrets."""
    total_runs = await db.execute(select(func.count()).select_from(AgentRun))
    count = total_runs.scalar()
    return {
        "demo_mode": settings.demo_mode,
        "provider": settings.active_provider,
        "model": settings.active_model,
        "has_api_key": settings.has_gemini_key or settings.has_openai_key,
        "web_search_enabled": settings.enable_web_search,
        "max_review_rounds": settings.max_agent_review_rounds,
        "max_upload_mb": settings.max_upload_size_mb,
        "total_agent_runs": count,
        # Never expose: api key, secret key, database credentials
    }
