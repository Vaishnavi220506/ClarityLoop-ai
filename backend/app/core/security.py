"""
ClarityLoop – Security Guardrails
Input sanitization, prompt injection protection, filename safety.
"""
from __future__ import annotations

import hashlib
import os
import re
import unicodedata
from pathlib import Path, PurePosixPath
from typing import Optional


# ── Allowed MIME types ────────────────────────────────────────────────────────
ALLOWED_MIME_TYPES: set[str] = {
    "application/pdf",
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
    "image/png",
    "image/jpeg",
    "image/webp",
    # Code files (all text/plain or specific)
    "text/x-python",
    "text/javascript",
    "text/typescript",
    "text/html",
    "text/css",
    "application/x-yaml",
    "text/yaml",
    "application/xml",
    "text/xml",
}

ALLOWED_EXTENSIONS: set[str] = {
    ".pdf", ".txt", ".md", ".csv", ".json", ".docx", ".xlsx", ".xls", ".pptx", ".ppt",
    ".png", ".jpg", ".jpeg", ".webp",
    ".py", ".js", ".ts", ".tsx", ".jsx", ".html", ".css", ".yaml",
    ".yml", ".xml", ".sh", ".go", ".rs", ".java", ".cpp", ".c", ".h",
    ".rb", ".php", ".r", ".sql", ".toml", ".ini", ".cfg",
}

# Patterns that might indicate prompt injection in uploaded content
INJECTION_PATTERNS = [
    r"ignore\s+(previous|all|above)\s+instructions",
    r"system\s+prompt\s*:",
    r"you\s+are\s+now",
    r"act\s+as\s+(a\s+)?different",
    r"forget\s+(your|all)\s+(previous\s+)?instructions",
    r"disregard\s+previous",
    r"new\s+instructions?\s*:",
    r"override\s+(your\s+)?(system|instructions?)",
    r"<\s*system\s*>",
    r"\[INST\]",
    r"### System",
]

_INJECTION_RE = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]


def sanitize_filename(filename: str) -> str:
    """
    Return a safe filename: no path traversal, no special chars, lowercase.
    Raises ValueError if the result is empty or unsafe.
    """
    # Strip directory components
    filename = os.path.basename(filename)
    # Normalize unicode
    filename = unicodedata.normalize("NFKD", filename)
    filename = filename.encode("ascii", "ignore").decode("ascii")
    # Keep only alphanumeric, dots, dashes, underscores
    stem, _, ext = filename.rpartition(".")
    ext = ext.lower()
    stem = re.sub(r"[^\w\-]", "_", stem)
    stem = stem[:100]  # max 100 chars for stem
    if not stem:
        stem = "file"
    safe = f"{stem}.{ext}" if ext else stem
    # Prevent hidden files, Windows reserved names
    if safe.startswith(".") or safe.upper() in {
        "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4",
        "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2",
        "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
    }:
        safe = f"upload_{safe}"
    return safe


def validate_file_upload(
    filename: str,
    mime_type: str,
    size_bytes: int,
    max_bytes: int,
) -> tuple[bool, str]:
    """
    Validate uploaded file. Returns (ok, error_message).
    """
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"File extension '{ext}' is not allowed."
    # Normalise MIME type (strip parameters like charset)
    base_mime = mime_type.split(";")[0].strip().lower()
    if base_mime not in ALLOWED_MIME_TYPES and not base_mime.startswith("text/"):
        return False, f"MIME type '{base_mime}' is not allowed."
    if size_bytes > max_bytes:
        mb = size_bytes / 1024 / 1024
        max_mb = max_bytes / 1024 / 1024
        return False, f"File is {mb:.1f} MB; maximum allowed is {max_mb:.0f} MB."
    return True, ""


def detect_prompt_injection(text: str) -> tuple[bool, Optional[str]]:
    """
    Check text for prompt injection patterns.
    Returns (detected, matched_pattern).
    The caller should treat the file contents as untrusted data, not instructions.
    """
    for pattern in _INJECTION_RE:
        m = pattern.search(text)
        if m:
            return True, m.group(0)
    return False, None


def unique_safe_filename(original: str, upload_dir: Path) -> str:
    """Generate a unique safe filename that doesn't conflict with existing files."""
    safe = sanitize_filename(original)
    stem, _, ext = safe.rpartition(".")
    ext = f".{ext}" if ext else ""
    candidate = safe
    counter = 1
    while (upload_dir / candidate).exists():
        candidate = f"{stem}_{counter}{ext}"
        counter += 1
    return candidate


def is_safe_path(base_dir: Path, user_path: str) -> bool:
    """Prevent path traversal: ensure resolved path is inside base_dir."""
    try:
        resolved = (base_dir / user_path).resolve()
        return resolved.is_relative_to(base_dir.resolve())
    except Exception:
        return False
