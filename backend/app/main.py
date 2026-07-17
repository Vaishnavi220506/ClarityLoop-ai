"""
ClarityLoop – FastAPI Main Application
Mounts all routers, configures CORS, lifespan events.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.db.session import init_db

settings = get_settings()
logging.basicConfig(level=getattr(logging, settings.log_level))
logger = logging.getLogger("clarityloop")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("ClarityLoop backend starting...")
    settings.ensure_upload_dir()
    await init_db()
    logger.info(f"Database ready at: {settings.database_url}")
    logger.info(f"Demo mode: {settings.demo_mode}")
    logger.info(f"Provider: {settings.active_provider}")
    logger.info(f"Model: {settings.active_model}")

    # Seed demo data if enabled
    if settings.demo_mode:
        try:
            from app.core.demo import seed_demo_data
            await seed_demo_data()
            logger.info("Demo data seeded.")
        except Exception as e:
            logger.warning(f"Demo seed failed (non-fatal): {e}")

    yield
    logger.info("ClarityLoop backend shutting down.")


app = FastAPI(
    title="ClarityLoop API",
    description="AI assistant with multi-agent feasibility analysis, branching, and focus mode.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)


# ── Routers ───────────────────────────────────────────────────────────────────

from app.api import (
    chat,
    conversations,
    projects,
    branches,
    tasks,
    feasibility,
    assumptions,
    canvas,
    focus,
    preferences,
    files,
    diagnostics,
)

app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(conversations.router, prefix="/api/conversations", tags=["Conversations"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(branches.router, prefix="/api/branches", tags=["Branches"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(feasibility.router, prefix="/api/feasibility", tags=["Feasibility"])
app.include_router(assumptions.router, prefix="/api/assumptions", tags=["Assumptions"])
app.include_router(canvas.router, prefix="/api/canvas", tags=["Canvas"])
app.include_router(focus.router, prefix="/api/focus", tags=["Focus"])
app.include_router(preferences.router, prefix="/api/preferences", tags=["Preferences"])
app.include_router(files.router, prefix="/api/files", tags=["Files"])
app.include_router(diagnostics.router, prefix="/api/diagnostics", tags=["Diagnostics"])


# ── Health endpoints ──────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "ok",
        "demo_mode": settings.demo_mode,
        "provider": settings.active_provider,
        "model": settings.active_model,
        "has_api_key": settings.has_gemini_key or settings.has_openai_key,
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "name": "ClarityLoop API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


# ── Error Handlers ────────────────────────────────────────────────────────────

@app.exception_handler(404)
async def not_found(request, exc):
    return JSONResponse({"error": "Not found", "detail": str(exc)}, status_code=404)


@app.exception_handler(500)
async def server_error(request, exc):
    logger.error(f"Internal server error: {exc}")
    # Never expose stack traces or secrets
    return JSONResponse(
        {"error": "Internal server error", "detail": "Please check server logs."},
        status_code=500,
    )
