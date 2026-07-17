"""
ClarityLoop – LLM Provider Abstraction
Supports: Google Gemini (default free tier), OpenAI (optional).
Never exposes API keys; never reveals chain-of-thought.
"""
from __future__ import annotations

import asyncio
import json
import re
import time
from typing import Any, AsyncIterator, Optional

import httpx

from app.core.config import get_settings

settings = get_settings()


# ── Provider Selection ─────────────────────────────────────────────────────────

def _get_gemini_model():
    """Lazily create Google Gemini model."""
    import google.generativeai as genai
    genai.configure(api_key=settings.gemini_api_key)
    return genai.GenerativeModel(settings.gemini_model)


def _get_openai_client():
    """Lazily create OpenAI client."""
    from openai import AsyncOpenAI
    return AsyncOpenAI(api_key=settings.openai_api_key)


class ModelProvider:
    """
    Abstraction over LLM providers.
    Priority: Gemini (free) → OpenAI (paid) → Demo mode (mocked).
    """

    def __init__(self) -> None:
        self._gemini_model = None
        self._openai_client = None

    @property
    def _use_gemini(self) -> bool:
        return settings.has_gemini_key and not settings.demo_mode and not self._use_ollama

    @property
    def _use_ollama(self) -> bool:
        return settings.ollama_enabled and not settings.demo_mode

    @property
    def _use_openai(self) -> bool:
        return bool(settings.has_openai_key) and not settings.demo_mode and not self._use_gemini

    @property
    def _use_demo(self) -> bool:
        return settings.demo_mode or (not self._use_ollama and not settings.has_gemini_key and not settings.has_openai_key)

    def _gemini(self):
        if self._gemini_model is None:
            self._gemini_model = _get_gemini_model()
        return self._gemini_model

    def _openai(self):
        if self._openai_client is None:
            self._openai_client = _get_openai_client()
        return self._openai_client

    # ── Non-streaming completion ──────────────────────────────────────────────

    async def complete(
        self,
        messages: list[dict[str, str]],
        response_format: Optional[dict] = None,
        temperature: float = 0.3,
        max_tokens: int = 2000,
        tools: Optional[list] = None,
    ) -> str:
        if self._use_demo:
            return _demo_completion(messages)

        if self._use_ollama:
            return await self._ollama_complete(messages, temperature, max_tokens)

        if self._use_gemini:
            return await self._gemini_complete(messages, temperature, max_tokens)

        # OpenAI fallback
        kwargs: dict[str, Any] = {
            "model": settings.openai_model,
            "input": messages,
            "temperature": temperature,
            "max_output_tokens": max_tokens,
        }
        if response_format:
            kwargs["text"] = {"format": response_format}

        response = await self._openai().responses.create(**kwargs)
        return response.output_text

    async def _gemini_complete(
        self,
        messages: list[dict[str, str]],
        temperature: float,
        max_tokens: int,
    ) -> str:
        """Complete using Google Gemini."""
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)

        # Build Gemini-compatible content
        contents = _messages_to_gemini(messages)
        system_instruction = _extract_system(messages)

        model = genai.GenerativeModel(
            settings.gemini_model,
            system_instruction=system_instruction or None,
            generation_config=genai.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            ),
        )

        # Run synchronous Gemini call in thread pool
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(contents)
        )
        return response.text

    async def _ollama_complete(
        self, messages: list[dict[str, str]], temperature: float, max_tokens: int,
    ) -> str:
        """Complete with a locally running Ollama model."""
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{settings.ollama_base_url.rstrip('/')}/chat",
                json={
                    "model": settings.ollama_model,
                    "messages": messages,
                    "stream": False,
                    "options": {"temperature": temperature, "num_predict": max_tokens},
                },
            )
            response.raise_for_status()
        return response.json()["message"]["content"]

    # ── Streaming completion ──────────────────────────────────────────────────

    async def stream(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.5,
        max_tokens: int = 2000,
    ) -> AsyncIterator[str]:
        if self._use_demo:
            async for chunk in _demo_stream(messages):
                yield chunk
            return

        if self._use_ollama:
            async for chunk in self._ollama_stream(messages, temperature, max_tokens):
                yield chunk
            return

        if self._use_gemini:
            async for chunk in self._gemini_stream(messages, temperature, max_tokens):
                yield chunk
            return

        # OpenAI streaming
        stream = await self._openai().responses.create(
            model=settings.openai_model,
            input=messages,
            temperature=temperature,
            max_output_tokens=max_tokens,
            stream=True,
        )
        async for event in stream:
            if hasattr(event, "delta") and event.delta:
                yield event.delta
            elif hasattr(event, "text") and event.text:
                yield event.text

    async def _gemini_stream(
        self,
        messages: list[dict[str, str]],
        temperature: float,
        max_tokens: int,
    ) -> AsyncIterator[str]:
        """Stream using Google Gemini."""
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)

        contents = _messages_to_gemini(messages)
        system_instruction = _extract_system(messages)

        model = genai.GenerativeModel(
            settings.gemini_model,
            system_instruction=system_instruction or None,
            generation_config=genai.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            ),
        )

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(contents, stream=True)
        )

        for chunk in response:
            if hasattr(chunk, "text") and chunk.text:
                yield chunk.text
                await asyncio.sleep(0.01)  # small yield for SSE flush

    async def _ollama_stream(
        self, messages: list[dict[str, str]], temperature: float, max_tokens: int,
    ) -> AsyncIterator[str]:
        """Stream a response from a locally running Ollama model."""
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{settings.ollama_base_url.rstrip('/')}/chat",
                json={
                    "model": settings.ollama_model,
                    "messages": messages,
                    "stream": True,
                    "options": {"temperature": temperature, "num_predict": max_tokens},
                },
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    event = json.loads(line)
                    content = event.get("message", {}).get("content", "")
                    if content:
                        yield content

    # ── JSON completion ───────────────────────────────────────────────────────

    async def complete_json(
        self,
        messages: list[dict[str, str]],
        schema: Optional[dict] = None,
    ) -> dict:
        if self._use_demo:
            return _demo_json_completion(messages)

        if self._use_gemini:
            text = await self._gemini_complete(messages, 0.1, 2000)
        else:
            text = await self.complete(
                messages=messages,
                response_format={"type": "json_object"} if not schema else {
                    "type": "json_schema",
                    "json_schema": {"schema": schema, "strict": True},
                },
                temperature=0.1,
            )

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
            if match:
                return json.loads(match.group(1))
            return {"error": "Failed to parse JSON response", "raw": text[:500]}


# ── Gemini message helpers ─────────────────────────────────────────────────────

def _extract_system(messages: list[dict]) -> str:
    """Extract system message text for Gemini system_instruction."""
    for msg in messages:
        if msg.get("role") == "system":
            return msg["content"]
    return ""


def _messages_to_gemini(messages: list[dict]) -> list[dict]:
    """Convert OpenAI-style messages to Gemini Content format."""
    contents = []
    for msg in messages:
        role = msg.get("role", "user")
        if role == "system":
            continue  # handled via system_instruction
        gemini_role = "model" if role == "assistant" else "user"
        contents.append({"role": gemini_role, "parts": [msg["content"]]})
    return contents


# ── Demo Mode Responses ────────────────────────────────────────────────────────

DEMO_NOTICE = "\n\n---\n*⚠️ Demo responses are mocked and are not generated by a live AI model.*"

_DEMO_RESPONSES = [
    "I can help with that! In demo mode, I'm showing you how ClarityLoop works without a live API key. "
    "The real system would connect to your configured AI model and provide accurate, contextual responses.",
    "Great question! ClarityLoop's multi-agent system would analyze this carefully. "
    "In production mode with an API key, the system activates specialized agents based on your request type.",
    "This is a demonstration response. ClarityLoop classifies requests into 9 modes: Direct Answer, Teaching, "
    "Research, Feasibility Assessment, Build With Me, Debugging, File Analysis, Decision Support, and Focus Guidance.",
]

_demo_counter = 0


def _demo_completion(messages: list[dict]) -> str:
    global _demo_counter
    last_user = next((m["content"] for m in reversed(messages) if m.get("role") == "user"), "")
    if "feasib" in last_user.lower():
        response = (
            "**Feasibility Assessment (Demo)**\n\n"
            "**Verdict: Feasible with Conditions**\n\n"
            "**Confidence: 62%** (Medium)\n\n"
            "**Verified Requirements:**\n"
            "- Core technology stack is available ✓\n"
            "- Open-source frameworks exist ✓\n\n"
            "**Key Assumptions (unverified):**\n"
            "- Sufficient training data is available\n"
            "- Hardware meets minimum requirements\n\n"
            "**Blockers:**\n"
            "- Dataset licence not verified\n"
            "- Timeline may be optimistic\n\n"
            "**Recommended Next Action:** Verify dataset availability and licence before committing."
        )
    elif any(kw in last_user.lower() for kw in ["stuck", "confused", "help"]):
        response = (
            "I can see you need some guidance. Let's focus on one thing at a time.\n\n"
            "**Current Task:** Get your environment set up\n\n"
            "**One Action:** Run `python --version` in your terminal to confirm Python is installed.\n\n"
            "**Expected Result:** You should see `Python 3.x.x`\n\n"
            "Once you have that result, click 'I completed this' and we'll move to the next step."
        )
    else:
        idx = _demo_counter % len(_DEMO_RESPONSES)
        _demo_counter += 1
        response = _DEMO_RESPONSES[idx]

    return response + DEMO_NOTICE


async def _demo_stream(messages: list[dict]) -> AsyncIterator[str]:
    response = _demo_completion(messages)
    words = response.split(" ")
    for i, word in enumerate(words):
        yield word + (" " if i < len(words) - 1 else "")
        await asyncio.sleep(0.03)


def _demo_json_completion(messages: list[dict]) -> dict:
    last_user = next((m["content"] for m in reversed(messages) if m.get("role") == "user"), "")
    if "route" in last_user.lower() or "classify" in last_user.lower():
        return {
            "mode": "direct_answer",
            "confidence": 0.85,
            "routing_reason": "Demo mode: simulated routing result",
        }
    return {
        "result": "demo",
        "message": "Demo mode active. Configure an API key for live responses.",
        "demo": True,
    }


# Module-level singleton
provider = ModelProvider()
