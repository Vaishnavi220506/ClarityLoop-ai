"""
ClarityLoop – Core Request Router
Classifies each user request into one of 9 operational modes.
Uses lightweight keyword + pattern detection before invoking any LLM.
Falls back to a fast LLM classification call for ambiguous cases.
"""
from __future__ import annotations

import re
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class RouterMode(str, Enum):
    DIRECT_ANSWER = "direct_answer"
    TEACHING = "teaching"
    RESEARCH = "research"
    FEASIBILITY = "feasibility"
    BUILD_WITH_ME = "build_with_me"
    DEBUGGING = "debugging"
    FILE_ANALYSIS = "file_analysis"
    DECISION_SUPPORT = "decision_support"
    FOCUS_GUIDANCE = "focus_guidance"


class WorkflowCost(str, Enum):
    NEGLIGIBLE = "negligible"   # single pass
    LOW = "low"                 # one agent
    MEDIUM = "medium"           # 2-3 agents
    HIGH = "high"               # full multi-agent


class AnswerDepth(str, Enum):
    QUICK = "quick"
    SIMPLE = "simple"
    DETAILED = "detailed"
    STEP_BY_STEP = "step_by_step"
    TECHNICAL = "technical"
    ADAPTIVE = "adaptive"


class RouterResult(BaseModel):
    mode: RouterMode
    confidence: float = Field(ge=0.0, le=1.0)
    complexity: str  # low | medium | high
    required_tools: list[str] = Field(default_factory=list)
    needs_web_search: bool = False
    needs_file_context: bool = False
    needs_feasibility_analysis: bool = False
    needs_critic_review: bool = False
    recommended_depth: AnswerDepth = AnswerDepth.ADAPTIVE
    workflow_cost: WorkflowCost = WorkflowCost.LOW
    routing_reason: str = ""


# ── Keyword/Pattern Sets ────────────────────────────────────────────────────────

SIMPLE_PATTERNS = [
    r"^\s*hi\b", r"^\s*hello\b", r"^\s*hey\b", r"^\s*thanks?\b",
    r"^\s*ok\b", r"^\s*okay\b", r"^\s*yes\b", r"^\s*no\b",
    r"what is \w+\??$", r"define \w+", r"translate .+",
    r"what does \w+ mean", r"how do you spell",
    r"^\d[\d\s+\-*/()]+[=?]?\s*$",  # arithmetic
]

TEACHING_KEYWORDS = [
    "explain", "teach me", "how does", "why does", "what is the difference",
    "compare", "contrast", "clarify", "what are the pros and cons",
    "overview of", "introduction to", "beginner guide", "eli5",
    "walk me through", "help me understand",
]

RESEARCH_KEYWORDS = [
    "latest", "current", "recent", "2024", "2025", "2026", "what changed",
    "is there a paper", "find research", "look up", "search for",
    "dataset available", "api exists", "license of", "price of",
    "how much does", "is it legal", "regulation",
]

FEASIBILITY_KEYWORDS = [
    "can i build", "is it feasible", "is it possible", "can we create",
    "could i train", "is it realistic", "how hard would it be",
    "feasibility of", "assess", "viable", "achievable", "doable",
    "can i make", "would it work", "is this possible", "can we do",
    "build a model", "train a model", "create an ai", "develop an app",
    "can i achieve", "is it worth", "reality check",
]

BUILD_KEYWORDS = [
    "help me build", "step by step", "guide me", "let's build",
    "create a plan", "break this down", "make a roadmap",
    "plan for building", "phases of", "implementation plan",
    "where do i start", "how to start", "first steps",
]

DEBUGGING_KEYWORDS = [
    "error", "exception", "traceback", "bug", "not working", "broken",
    "fails", "crash", "debug", "fix this", "why is this wrong",
    "stack trace", "syntax error", "runtime error", "typeerror",
    "undefined", "null pointer", "segfault", "import error",
]

FILE_KEYWORDS = [
    "this file", "the uploaded", "analyze this", "look at the attachment",
    "from the csv", "from the pdf", "from the document", "in the spreadsheet",
    "screenshot shows", "error in the image", "the code file",
]

DECISION_KEYWORDS = [
    "should i choose", "which is better", "help me decide", "pros and cons",
    "trade-offs", "recommend", "which approach", "option a or b",
    "make a decision", "advise me", "what would you recommend",
]

STUCK_KEYWORDS = [
    "i am stuck", "i'm stuck", "i don't know what to do", "confused",
    "help me get unstuck", "what do i do next", "where do i click",
    "what should i do", "i don't understand what to do next",
]


def _matches_any(text: str, patterns: list[str], use_regex: bool = False) -> bool:
    lower = text.lower()
    if use_regex:
        return any(re.search(p, lower) for p in patterns)
    return any(kw in lower for kw in patterns)


def _is_simple(text: str) -> bool:
    """Return True for greetings, simple definitions, arithmetic, short casual queries."""
    lower = text.strip().lower()
    if len(lower) < 15:
        return True
    for pat in SIMPLE_PATTERNS:
        if re.search(pat, lower):
            return True
    return False


def classify_request(
    user_message: str,
    has_files: bool = False,
    user_depth_override: Optional[AnswerDepth] = None,
) -> RouterResult:
    """
    Deterministic request classifier.
    Returns RouterResult without invoking the LLM.
    For borderline cases the caller may optionally pass the result
    to an LLM classifier for a second opinion, but this function
    alone is used for simple/cheap requests.
    """
    text = user_message.strip()
    lower = text.lower()

    # ── 0. File context always overrides if short message ─────────────────────
    if has_files:
        return RouterResult(
            mode=RouterMode.FILE_ANALYSIS,
            confidence=0.90,
            complexity="medium",
            required_tools=["file_parser"],
            needs_file_context=True,
            recommended_depth=user_depth_override or AnswerDepth.DETAILED,
            workflow_cost=WorkflowCost.LOW,
            routing_reason="File(s) uploaded; activating file analysis.",
        )

    # ── 1. Simple / trivial ───────────────────────────────────────────────────
    if _is_simple(text):
        return RouterResult(
            mode=RouterMode.DIRECT_ANSWER,
            confidence=0.97,
            complexity="low",
            required_tools=[],
            recommended_depth=user_depth_override or AnswerDepth.QUICK,
            workflow_cost=WorkflowCost.NEGLIGIBLE,
            routing_reason="Short or trivial query; direct answer is sufficient.",
        )

    # ── 2. Stuck / Focus ─────────────────────────────────────────────────────
    if _matches_any(lower, STUCK_KEYWORDS):
        return RouterResult(
            mode=RouterMode.FOCUS_GUIDANCE,
            confidence=0.88,
            complexity="low",
            required_tools=["task_context"],
            recommended_depth=user_depth_override or AnswerDepth.SIMPLE,
            workflow_cost=WorkflowCost.LOW,
            routing_reason="User appears stuck or confused; activating focus guidance.",
        )

    # ── 3. Debugging ─────────────────────────────────────────────────────────
    if _matches_any(lower, DEBUGGING_KEYWORDS):
        return RouterResult(
            mode=RouterMode.DEBUGGING,
            confidence=0.85,
            complexity="medium",
            required_tools=["code_inspector"],
            needs_file_context=has_files,
            recommended_depth=user_depth_override or AnswerDepth.STEP_BY_STEP,
            workflow_cost=WorkflowCost.LOW,
            routing_reason="Error/debugging keywords detected.",
        )

    # ── 4. Feasibility ────────────────────────────────────────────────────────
    if _matches_any(lower, FEASIBILITY_KEYWORDS):
        return RouterResult(
            mode=RouterMode.FEASIBILITY,
            confidence=0.87,
            complexity="high",
            required_tools=["requirement_analyst", "evidence_researcher", "resource_assessor", "skeptic", "scope_agent", "final_judge"],
            needs_web_search=True,
            needs_feasibility_analysis=True,
            needs_critic_review=True,
            recommended_depth=user_depth_override or AnswerDepth.DETAILED,
            workflow_cost=WorkflowCost.HIGH,
            routing_reason="Feasibility-related keywords detected; full multi-agent workflow required.",
        )

    # ── 5. Build With Me ──────────────────────────────────────────────────────
    if _matches_any(lower, BUILD_KEYWORDS):
        return RouterResult(
            mode=RouterMode.BUILD_WITH_ME,
            confidence=0.82,
            complexity="high",
            required_tools=["task_planner"],
            needs_critic_review=True,
            recommended_depth=user_depth_override or AnswerDepth.STEP_BY_STEP,
            workflow_cost=WorkflowCost.MEDIUM,
            routing_reason="Build/planning keywords detected; creating interactive task plan.",
        )

    # ── 6. Research ───────────────────────────────────────────────────────────
    if _matches_any(lower, RESEARCH_KEYWORDS):
        return RouterResult(
            mode=RouterMode.RESEARCH,
            confidence=0.83,
            complexity="medium",
            required_tools=["web_search", "citation_store"],
            needs_web_search=True,
            recommended_depth=user_depth_override or AnswerDepth.DETAILED,
            workflow_cost=WorkflowCost.MEDIUM,
            routing_reason="Research/current-info keywords detected; web search will be used.",
        )

    # ── 7. Decision Support ───────────────────────────────────────────────────
    if _matches_any(lower, DECISION_KEYWORDS):
        return RouterResult(
            mode=RouterMode.DECISION_SUPPORT,
            confidence=0.80,
            complexity="medium",
            required_tools=[],
            needs_critic_review=True,
            recommended_depth=user_depth_override or AnswerDepth.DETAILED,
            workflow_cost=WorkflowCost.MEDIUM,
            routing_reason="Decision/comparison keywords detected.",
        )

    # ── 8. Teaching ───────────────────────────────────────────────────────────
    if _matches_any(lower, TEACHING_KEYWORDS):
        return RouterResult(
            mode=RouterMode.TEACHING,
            confidence=0.80,
            complexity="medium",
            required_tools=[],
            recommended_depth=user_depth_override or AnswerDepth.ADAPTIVE,
            workflow_cost=WorkflowCost.LOW,
            routing_reason="Explanation/teaching keywords detected.",
        )

    # ── 9. Default: Direct Answer ─────────────────────────────────────────────
    return RouterResult(
        mode=RouterMode.DIRECT_ANSWER,
        confidence=0.65,
        complexity="low",
        required_tools=[],
        recommended_depth=user_depth_override or AnswerDepth.ADAPTIVE,
        workflow_cost=WorkflowCost.LOW,
        routing_reason="No specific pattern matched; defaulting to direct answer.",
    )
