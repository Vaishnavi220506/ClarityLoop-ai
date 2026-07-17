"""
ClarityLoop – Deterministic Confidence Calculator
Calculates a transparency confidence score from explicit positive/negative signals.
The LLM may explain the score but NEVER generates or modifies the numerical value.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ConfidenceSignal:
    name: str
    present: bool
    weight: float
    is_positive: bool
    description: str


POSITIVE_SIGNALS = {
    "critical_resource_verified": 0.20,
    "access_verified": 0.10,
    "required_labels_verified": 0.10,
    "licence_verified": 0.08,
    "hardware_suitability_verified": 0.10,
    "time_requirement_verified": 0.08,
    "multiple_reliable_sources_agree": 0.12,
    "sample_data_inspected": 0.08,
    "dataset_size_confirmed": 0.07,
    "api_tested": 0.07,
}

NEGATIVE_SIGNALS = {
    "unresolved_critical_assumption": -0.25,
    "contradictory_sources": -0.15,
    "hidden_manual_collection": -0.15,
    "missing_labels": -0.15,
    "unavailable_resource": -0.20,
    "unverified_download": -0.12,
    "unsuitable_hardware": -0.15,
    "unrealistic_deadline": -0.12,
    "major_scope_reduction_required": -0.18,
    "dataset_not_found": -0.20,
    "privacy_blocker": -0.15,
    "licence_blocker": -0.12,
}

BASE_SCORE = 0.50  # starting point before signals


@dataclass
class ConfidenceResult:
    raw_score: float
    clamped_score: float  # 0.0 – 1.0
    positive_signals: list[ConfidenceSignal] = field(default_factory=list)
    negative_signals: list[ConfidenceSignal] = field(default_factory=list)
    explanation: str = ""
    label: str = ""  # High | Medium | Low | Very Low

    @property
    def as_percent(self) -> int:
        return round(self.clamped_score * 100)


def calculate_confidence(
    positive: Optional[dict[str, bool]] = None,
    negative: Optional[dict[str, bool]] = None,
) -> ConfidenceResult:
    """
    Deterministically calculate a confidence score.

    Args:
        positive: dict mapping signal name -> bool (present or not)
        negative: dict mapping signal name -> bool (present or not)

    Returns:
        ConfidenceResult with raw_score, clamped_score, signals, and labels.
    """
    positive = positive or {}
    negative = negative or {}

    score = BASE_SCORE
    pos_signals: list[ConfidenceSignal] = []
    neg_signals: list[ConfidenceSignal] = []

    for name, weight in POSITIVE_SIGNALS.items():
        present = positive.get(name, False)
        pos_signals.append(ConfidenceSignal(
            name=name,
            present=present,
            weight=weight,
            is_positive=True,
            description=_describe_positive(name),
        ))
        if present:
            score += weight

    for name, weight in NEGATIVE_SIGNALS.items():
        present = negative.get(name, False)
        neg_signals.append(ConfidenceSignal(
            name=name,
            present=present,
            weight=abs(weight),
            is_positive=False,
            description=_describe_negative(name),
        ))
        if present:
            score += weight  # weight is already negative

    clamped = max(0.05, min(0.95, score))

    # Label
    if clamped >= 0.75:
        label = "High"
    elif clamped >= 0.55:
        label = "Medium"
    elif clamped >= 0.35:
        label = "Low"
    else:
        label = "Very Low"

    # Rule-based explanation
    active_pos = [s for s in pos_signals if s.present]
    active_neg = [s for s in neg_signals if s.present]

    explanation_parts = []
    if active_pos:
        explanation_parts.append(f"Positive signals: {', '.join(s.name.replace('_', ' ') for s in active_pos)}.")
    if active_neg:
        explanation_parts.append(f"Negative signals: {', '.join(s.name.replace('_', ' ') for s in active_neg)}.")
    if not active_pos and not active_neg:
        explanation_parts.append("No verification signals available; score is at baseline.")

    explanation = " ".join(explanation_parts)

    return ConfidenceResult(
        raw_score=score,
        clamped_score=round(clamped, 3),
        positive_signals=pos_signals,
        negative_signals=neg_signals,
        explanation=explanation,
        label=label,
    )


def _describe_positive(name: str) -> str:
    descriptions = {
        "critical_resource_verified": "Required resource has been confirmed to exist and be accessible.",
        "access_verified": "Access method (download, API, registration) has been confirmed.",
        "required_labels_verified": "Dataset labels required for the task have been confirmed.",
        "licence_verified": "Resource licence permits the intended use.",
        "hardware_suitability_verified": "User hardware has been confirmed sufficient for the workload.",
        "time_requirement_verified": "Timeline has been assessed against realistic estimates.",
        "multiple_reliable_sources_agree": "Two or more reliable sources provide consistent information.",
        "sample_data_inspected": "Sample data has been retrieved and matches expected format.",
        "dataset_size_confirmed": "Dataset row/sample count meets the minimum requirement.",
        "api_tested": "API endpoint responded correctly during verification.",
    }
    return descriptions.get(name, name.replace("_", " ").capitalize())


def _describe_negative(name: str) -> str:
    descriptions = {
        "unresolved_critical_assumption": "A critical assumption has not been verified and could invalidate the conclusion.",
        "contradictory_sources": "Different sources provide conflicting information about the same claim.",
        "hidden_manual_collection": "Manual data collection effort was not accounted for in the original plan.",
        "missing_labels": "Required dataset labels are absent or need to be created manually.",
        "unavailable_resource": "A required resource could not be found or accessed.",
        "unverified_download": "Download link or data source has not been confirmed to work.",
        "unsuitable_hardware": "User hardware is insufficient for the required computational workload.",
        "unrealistic_deadline": "The proposed timeline is too short given the known scope.",
        "major_scope_reduction_required": "The original plan must be significantly reduced to be achievable.",
        "dataset_not_found": "No dataset matching the required criteria was found.",
        "privacy_blocker": "Privacy regulations or data sensitivity prevents using the required data.",
        "licence_blocker": "Licence terms prohibit the intended commercial or research use.",
    }
    return descriptions.get(name, name.replace("_", " ").capitalize())
