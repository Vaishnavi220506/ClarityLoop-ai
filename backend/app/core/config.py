"""
ClarityLoop Backend – Core Configuration
Loads all environment variables and validates them with Pydantic Settings.
"""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Google Gemini (primary, free tier) ─────────────────────────────────────
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    # ── OpenAI (optional paid fallback) ────────────────────────────────────────
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # Local Ollama (free, runs on the user's computer)
    ollama_enabled: bool = False
    ollama_base_url: str = "http://127.0.0.1:11434/api"
    ollama_model: str = "llama3.2:3b"

    # ── Database ───────────────────────────────────────────────────────────────
    database_url: str = "sqlite:///./clarityloop.db"

    # ── Features ───────────────────────────────────────────────────────────────
    enable_web_search: bool = True
    max_agent_review_rounds: int = 2
    max_upload_size_mb: int = 20
    demo_mode: bool = False

    # ── Frontend ───────────────────────────────────────────────────────────────
    next_public_api_url: str = "http://localhost:8000"

    # ── Server ─────────────────────────────────────────────────────────────────
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    secret_key: str = "change-me-generate-a-secure-random-key"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    # ── Upload storage ─────────────────────────────────────────────────────────
    upload_dir: Path = Path("uploads")

    @field_validator("max_agent_review_rounds")
    @classmethod
    def validate_rounds(cls, v: int) -> int:
        if v < 1 or v > 5:
            raise ValueError("MAX_AGENT_REVIEW_ROUNDS must be between 1 and 5")
        return v

    @field_validator("max_upload_size_mb")
    @classmethod
    def validate_upload_size(cls, v: int) -> int:
        if v < 1 or v > 100:
            raise ValueError("MAX_UPLOAD_SIZE_MB must be between 1 and 100")
        return v

    @model_validator(mode="after")
    def check_api_key_or_demo(self) -> "Settings":
        if not self.gemini_api_key and not self.openai_api_key and not self.demo_mode:
            # Auto-enable demo mode when no key is provided
            object.__setattr__(self, "demo_mode", True)
        return self

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    @property
    def has_openai_key(self) -> bool:
        return bool(self.openai_api_key and self.openai_api_key != "your-key-here")

    @property
    def has_gemini_key(self) -> bool:
        return bool(self.gemini_api_key and self.gemini_api_key != "your-key-here")

    @property
    def active_provider(self) -> str:
        if self.ollama_enabled and not self.demo_mode:
            return "ollama"
        if self.has_gemini_key and not self.demo_mode:
            return "gemini"
        if self.has_openai_key and not self.demo_mode:
            return "openai"
        return "demo"

    @property
    def active_model(self) -> str:
        if self.active_provider == "ollama":
            return self.ollama_model
        if self.active_provider == "gemini":
            return self.gemini_model
        if self.active_provider == "openai":
            return self.openai_model
        return "demo-mock"

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    def ensure_upload_dir(self) -> None:
        self.upload_dir.mkdir(parents=True, exist_ok=True)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()
