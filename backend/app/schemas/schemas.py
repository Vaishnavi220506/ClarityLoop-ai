"""
ClarityLoop – Pydantic Schemas
All request/response models for the API.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


# ── User Schemas ──────────────────────────────────────────────────────────────

class UserPreferenceSchema(BaseModel):
    answer_depth: str = "adaptive"
    preferred_language: str = "Python"
    skill_level: str = "intermediate"
    explanation_style: str = "balanced"
    focus_mode_preference: bool = False
    theme: str = "dark"
    animation_reduced: bool = False
    memory_enabled: bool = True
    budget_preference: Optional[str] = None


class ResourceProfileSchema(BaseModel):
    cpu_cores: Optional[int] = None
    ram_gb: Optional[float] = None
    gpu_model: Optional[str] = None
    gpu_vram_gb: Optional[float] = None
    storage_gb: Optional[float] = None
    operating_system: Optional[str] = None
    internet_speed_mbps: Optional[float] = None
    monthly_budget_usd: Optional[float] = None
    notes: Optional[str] = None


# ── Chat Schemas ───────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=32000)
    conversation_id: Optional[str] = None
    branch_id: Optional[str] = None
    project_id: Optional[str] = None
    depth: str = "adaptive"
    mode_override: Optional[str] = None
    file_ids: list[str] = Field(default_factory=list)


class ChatStreamChunk(BaseModel):
    type: str  # "token" | "routing" | "done" | "error"
    content: str = ""
    routing: Optional[dict] = None
    message_id: Optional[str] = None
    conversation_id: Optional[str] = None


class MessageOut(BaseModel):
    id: str
    conversation_id: Optional[str]
    branch_id: Optional[str]
    role: str
    content: str
    mode: Optional[str]
    routing_mode: Optional[str]
    confidence_score: Optional[float]
    has_citations: bool
    has_feasibility: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Conversation Schemas ───────────────────────────────────────────────────────

class ConversationCreate(BaseModel):
    title: Optional[str] = None
    project_id: Optional[str] = None


class ConversationOut(BaseModel):
    id: str
    project_id: Optional[str]
    title: Optional[str]
    summary: Optional[str]
    mode: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Project Schemas ────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    objective: Optional[str] = None


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    objective: Optional[str] = None
    summary: Optional[str] = None
    status: Optional[str] = None


class ProjectOut(BaseModel):
    id: str
    title: str
    description: Optional[str]
    objective: Optional[str]
    summary: Optional[str]
    current_verdict: Optional[str]
    progress_pct: int
    status: str
    is_demo: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Branch Schemas ─────────────────────────────────────────────────────────────

class BranchCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    purpose: Optional[str] = None
    parent_branch_id: Optional[str] = None
    source_message_id: Optional[str] = None
    inherited_summary: Optional[str] = None


class BranchOut(BaseModel):
    id: str
    project_id: str
    parent_branch_id: Optional[str]
    source_message_id: Optional[str]
    title: str
    purpose: Optional[str]
    local_summary: Optional[str]
    inherited_summary: Optional[str]
    status: str
    depth: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Task Schemas ───────────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    phase: Optional[str] = None
    expected_output: Optional[str] = None
    completion_condition: Optional[str] = None
    parent_task_id: Optional[str] = None
    branch_id: Optional[str] = None
    priority: int = 0
    order_index: int = 0


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    blocker_description: Optional[str] = None
    is_primary_next: Optional[bool] = None
    order_index: Optional[int] = None


class TaskOut(BaseModel):
    id: str
    project_id: str
    branch_id: Optional[str]
    parent_task_id: Optional[str]
    title: str
    description: Optional[str]
    phase: Optional[str]
    expected_output: Optional[str]
    completion_condition: Optional[str]
    blocker_description: Optional[str]
    status: str
    priority: int
    is_primary_next: bool
    order_index: int
    is_demo: bool
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Evidence Schemas ───────────────────────────────────────────────────────────

class EvidenceOut(BaseModel):
    id: str
    project_id: str
    title: str
    url: Optional[str]
    source_org: Optional[str]
    source_type: Optional[str]
    source_quality: int
    source_quality_reason: Optional[str]
    access_date: Optional[str]
    supported_claim: Optional[str]
    summary: Optional[str]
    reliability: str
    verification_status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Assumption Schemas ─────────────────────────────────────────────────────────

class AssumptionCreate(BaseModel):
    statement: str = Field(..., min_length=1)
    category: Optional[str] = None
    current_value: Optional[str] = None
    impact: Optional[str] = None


class AssumptionUpdate(BaseModel):
    statement: Optional[str] = None
    current_value: Optional[str] = None
    impact: Optional[str] = None
    category: Optional[str] = None


class AssumptionOut(BaseModel):
    id: str
    project_id: str
    statement: str
    category: Optional[str]
    current_value: Optional[str]
    previous_value: Optional[str]
    impact: Optional[str]
    needs_reanalysis: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Feasibility Schemas ────────────────────────────────────────────────────────

class FeasibilityRequest(BaseModel):
    project_id: str
    description: str = Field(..., min_length=10, max_length=10000)
    resource_profile: Optional[dict] = None


class FeasibilityOut(BaseModel):
    id: str
    project_id: str
    verdict: str
    confidence_score: float
    confidence_explanation: Optional[str]
    verified_requirements: Optional[str]
    blockers_json: Optional[str]
    risks_json: Optional[str]
    realistic_alternative: Optional[str]
    what_would_make_feasible: Optional[str]
    recommended_next_action: Optional[str]
    review_rounds: int
    agents_used: Optional[str]
    scope_change_approved: Optional[bool]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Confidence Schemas ─────────────────────────────────────────────────────────

class ConfidenceSignalOut(BaseModel):
    name: str
    present: bool
    weight: float
    is_positive: bool
    description: str


class ConfidenceResultOut(BaseModel):
    clamped_score: float
    as_percent: int
    label: str
    explanation: str
    positive_signals: list[ConfidenceSignalOut]
    negative_signals: list[ConfidenceSignalOut]


# ── Canvas Schemas ─────────────────────────────────────────────────────────────

class WorkflowNodeCreate(BaseModel):
    node_type: str
    label: str
    ref_id: Optional[str] = None
    ref_type: Optional[str] = None
    pos_x: float = 0.0
    pos_y: float = 0.0
    data_json: Optional[str] = None


class WorkflowNodeUpdate(BaseModel):
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None
    label: Optional[str] = None
    is_collapsed: Optional[bool] = None
    data_json: Optional[str] = None


class WorkflowNodeOut(BaseModel):
    id: str
    project_id: str
    node_type: str
    label: str
    ref_id: Optional[str]
    ref_type: Optional[str]
    pos_x: float
    pos_y: float
    data_json: Optional[str]
    is_collapsed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class WorkflowEdgeCreate(BaseModel):
    source_node_id: str
    target_node_id: str
    edge_type: str = "default"
    label: Optional[str] = None


class WorkflowEdgeOut(BaseModel):
    id: str
    project_id: str
    source_node_id: str
    target_node_id: str
    edge_type: str
    label: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Focus Schemas ──────────────────────────────────────────────────────────────

class FocusSessionOut(BaseModel):
    id: str
    project_id: str
    task_id: Optional[str]
    current_action: Optional[str]
    why_it_matters: Optional[str]
    expected_result: Optional[str]
    stuck_count: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── File Schemas ───────────────────────────────────────────────────────────────

class UploadedFileOut(BaseModel):
    id: str
    project_id: str
    original_filename: str
    mime_type: str
    size_bytes: int
    summary: Optional[str]
    is_image: bool
    row_count: Optional[int]
    col_count: Optional[int]
    parse_error: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Router Result Schema ───────────────────────────────────────────────────────

class RouterResultOut(BaseModel):
    mode: str
    confidence: float
    complexity: str
    required_tools: list[str]
    needs_web_search: bool
    needs_file_context: bool
    needs_feasibility_analysis: bool
    needs_critic_review: bool
    recommended_depth: str
    workflow_cost: str
    routing_reason: str


# ── Generic ───────────────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str
    data: Optional[Any] = None


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None
