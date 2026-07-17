"""
ClarityLoop – Multi-Agent Feasibility Workflow Orchestrator
Implements the bounded review loop with MAX_AGENT_REVIEW_ROUNDS.
"""
from __future__ import annotations

import json
import time
from typing import Optional

from app.core.confidence import calculate_confidence, ConfidenceResult
from app.core.config import get_settings
from app.core.provider import provider

settings = get_settings()

# ── System prompts ─────────────────────────────────────────────────────────────

REQUIREMENT_ANALYST_PROMPT = """You are the Requirement Analyst for ClarityLoop.
Extract ALL requirements from the user's project/idea request.

Return JSON with this exact structure:
{
  "objective": "...",
  "user_intent": "...",
  "required_inputs": [...],
  "expected_outputs": [...],
  "datasets_or_resources": [...],
  "required_labels": [...],
  "hardware": {...},
  "software": [...],
  "storage": "...",
  "budget": "...",
  "time": "...",
  "skills": [...],
  "team_size": "...",
  "deadline": "...",
  "legal_concerns": [...],
  "licence_concerns": [...],
  "privacy_concerns": [...],
  "ethical_concerns": [...],
  "real_time_requirements": false,
  "production_requirements": false,
  "success_criteria": [...],
  "unresolved_questions": [...]
}

Be thorough. Mark truly unknown values as null."""

EVIDENCE_RESEARCHER_PROMPT = """You are the Evidence Researcher for ClarityLoop.
Based on the requirements, identify what evidence is needed and what you can reason about.

IMPORTANT: You cannot actually browse the web. Reason about what is likely based on your knowledge.
Clearly mark each claim as: verified_from_training, requires_current_check, or unknown.

Return JSON:
{
  "evidence_items": [
    {
      "title": "...",
      "url": null,
      "source_org": "...",
      "source_type": "documentation|repository|official|unknown",
      "supported_claim": "...",
      "summary": "...",
      "reliability": "high|medium|low|unknown",
      "verification_status": "verified|partial|unverified|requires_web_check",
      "source_quality": 1-7
    }
  ],
  "needs_web_search": false,
  "web_search_queries": [],
  "key_unknowns": []
}"""

RESOURCE_ASSESSOR_PROMPT = """You are the Resource Assessor for ClarityLoop.
Evaluate whether the project is achievable given the user's constraints.

Clearly distinguish between:
- theoretically_possible: exists in principle
- feasible_for_this_user: achievable with stated resources
- feasible_after_scope_reduction: possible with a smaller version
- feasible_as_prototype: works as a proof-of-concept
- feasible_for_production: reliable in real-world use
- currently_unrealistic: not achievable in the current situation

Return JSON:
{
  "cpu_adequate": true|false|null,
  "gpu_adequate": true|false|null,
  "ram_adequate": true|false|null,
  "storage_adequate": true|false|null,
  "budget_adequate": true|false|null,
  "time_adequate": true|false|null,
  "skills_adequate": true|false|null,
  "team_adequate": true|false|null,
  "feasibility_category": "theoretically_possible|feasible_for_this_user|feasible_after_scope_reduction|feasible_as_prototype|feasible_for_production|currently_unrealistic",
  "hardware_blockers": [...],
  "resource_blockers": [...],
  "assessment_notes": "..."
}"""

SKEPTIC_PROMPT = """You are the Skeptic Agent for ClarityLoop.
Try to disprove any overly positive assessment. Be rigorous but fair.

Check for:
- Hidden manual work not accounted for
- Unavailable or restricted data
- Missing required labels
- Insufficient sample counts
- Domain mismatch between available data and target use case
- Data leakage risks
- Privacy issues with the data
- Expensive APIs or services assumed to be free
- Unsupported accuracy expectations
- Unrealistic hardware requirements
- Unrealistic deadlines
- Excessive engineering scope hidden in the plan
- Unsupported assumptions presented as facts
- Silent scope changes from original request

Return JSON:
{
  "challenges": [
    {
      "type": "hidden_manual_work|unavailable_data|missing_labels|...",
      "description": "...",
      "severity": "critical|major|minor",
      "is_blocker": true|false
    }
  ],
  "new_blockers_found": [...],
  "assumptions_to_question": [...],
  "requires_additional_round": true|false,
  "reason_for_additional_round": "..."
}"""

SCOPE_AGENT_PROMPT = """You are the Scope and Alternative Agent for ClarityLoop.
When the original idea is not feasible, find the SMALLEST HONEST alternative.

CRITICAL RULES:
- Never claim the alternative is equivalent to the original
- Never silently reduce scope - always explicitly state what was removed
- Always explain what resources would make the original feasible
- Identify which requirements must be removed, relaxed, or postponed

Return JSON:
{
  "original_is_feasible": true|false,
  "smallest_alternative": "...",
  "differences_from_original": [...],
  "what_was_removed": [...],
  "what_was_relaxed": [...],
  "what_was_postponed": [...],
  "resources_needed_for_original": [...],
  "alternative_limitations": [...],
  "requires_user_approval": true|false
}"""

FINAL_JUDGE_PROMPT = """You are the Final Judge for ClarityLoop.
Synthesize all agent findings into a single structured verdict.

VERDICT OPTIONS (pick exactly one):
- feasible: The project is achievable as described
- feasible_with_conditions: Achievable but only under specific conditions
- not_feasible: Not achievable given current constraints
- insufficient_evidence: Cannot determine without more information

Never invent confidence scores - they are calculated deterministically.

Return JSON:
{
  "verdict": "feasible|feasible_with_conditions|not_feasible|insufficient_evidence",
  "confidence_explanation_for_user": "...",
  "verified_requirements": [...],
  "partially_verified_requirements": [...],
  "assumptions": [...],
  "estimates": [...],
  "unknowns": [...],
  "contradictions": [...],
  "blockers": [...],
  "risks": [...],
  "necessary_scope_changes": [...],
  "realistic_alternative": "...",
  "what_would_make_feasible": [...],
  "recommended_next_action": "..."
}"""


# ── Data Classes ───────────────────────────────────────────────────────────────

class AgentResult:
    def __init__(self, agent: str, output: dict, latency_ms: int):
        self.agent = agent
        self.output = output
        self.latency_ms = latency_ms


class FeasibilityWorkflowResult:
    def __init__(
        self,
        verdict: str,
        confidence: ConfidenceResult,
        judge_output: dict,
        requirements: dict,
        evidence: list,
        scope_changes: list,
        review_rounds: int,
        agents_used: list[str],
        total_latency_ms: int,
        tokens_used: int,
        errors: list[str],
    ):
        self.verdict = verdict
        self.confidence = confidence
        self.judge_output = judge_output
        self.requirements = requirements
        self.evidence = evidence
        self.scope_changes = scope_changes
        self.review_rounds = review_rounds
        self.agents_used = agents_used
        self.total_latency_ms = total_latency_ms
        self.tokens_used = tokens_used
        self.errors = errors


# ── Orchestrator ───────────────────────────────────────────────────────────────

async def _run_agent(system_prompt: str, user_content: str, agent_name: str) -> AgentResult:
    """Run a single agent and return its structured output."""
    start = time.monotonic()
    try:
        output = await provider.complete_json(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ]
        )
    except Exception as e:
        output = {"error": str(e), "agent": agent_name}
    latency = int((time.monotonic() - start) * 1000)
    return AgentResult(agent=agent_name, output=output, latency_ms=latency)


async def run_feasibility_workflow(
    user_request: str,
    resource_profile: Optional[dict] = None,
    web_search_results: Optional[list] = None,
) -> FeasibilityWorkflowResult:
    """
    Bounded multi-agent feasibility workflow.
    Runs up to MAX_AGENT_REVIEW_ROUNDS review cycles.
    """
    start_time = time.monotonic()
    agents_used: list[str] = []
    errors: list[str] = []
    total_latency = 0
    review_rounds = 0

    # ── Phase 1: Requirement Analysis ─────────────────────────────────────────
    req_context = f"User request: {user_request}"
    if resource_profile:
        req_context += f"\n\nUser resource profile: {json.dumps(resource_profile)}"

    req_result = await _run_agent(REQUIREMENT_ANALYST_PROMPT, req_context, "requirement_analyst")
    agents_used.append("requirement_analyst")
    total_latency += req_result.latency_ms
    requirements = req_result.output

    # ── Phase 2: Evidence Research ─────────────────────────────────────────────
    evidence_context = f"Requirements: {json.dumps(requirements)}\n\nOriginal request: {user_request}"
    if web_search_results:
        evidence_context += f"\n\nWeb search results: {json.dumps(web_search_results[:5])}"

    ev_result = await _run_agent(EVIDENCE_RESEARCHER_PROMPT, evidence_context, "evidence_researcher")
    agents_used.append("evidence_researcher")
    total_latency += ev_result.latency_ms
    evidence_items = ev_result.output.get("evidence_items", [])

    # ── Phase 3: Resource Assessment ──────────────────────────────────────────
    resource_context = (
        f"Requirements: {json.dumps(requirements)}\n"
        f"Evidence: {json.dumps(evidence_items[:10])}\n"
        f"Resource profile: {json.dumps(resource_profile or {})}"
    )
    res_result = await _run_agent(RESOURCE_ASSESSOR_PROMPT, resource_context, "resource_assessor")
    agents_used.append("resource_assessor")
    total_latency += res_result.latency_ms
    resource_assessment = res_result.output

    # ── Phase 4: Skeptic Review (bounded) ─────────────────────────────────────
    skeptic_context = (
        f"Requirements: {json.dumps(requirements)}\n"
        f"Evidence: {json.dumps(evidence_items[:10])}\n"
        f"Resource assessment: {json.dumps(resource_assessment)}\n"
        f"Original request: {user_request}"
    )
    skeptic_result = await _run_agent(SKEPTIC_PROMPT, skeptic_context, "skeptic")
    agents_used.append("skeptic")
    total_latency += skeptic_result.latency_ms
    skeptic_output = skeptic_result.output
    review_rounds = 1

    # ── Optional additional review round ──────────────────────────────────────
    max_rounds = settings.max_agent_review_rounds
    needs_more = skeptic_output.get("requires_additional_round", False)

    while needs_more and review_rounds < max_rounds:
        review_rounds += 1
        reason = skeptic_output.get("reason_for_additional_round", "Additional verification needed")
        # Re-run evidence research with skeptic challenges as context
        extra_context = (
            f"Original evidence: {json.dumps(evidence_items[:5])}\n"
            f"Skeptic challenges: {json.dumps(skeptic_output.get('challenges', []))}\n"
            f"Additional queries: {json.dumps(skeptic_output.get('assumptions_to_question', []))}"
        )
        extra_ev = await _run_agent(EVIDENCE_RESEARCHER_PROMPT, extra_context, f"evidence_researcher_round_{review_rounds}")
        agents_used.append(f"evidence_researcher_r{review_rounds}")
        total_latency += extra_ev.latency_ms
        new_evidence = extra_ev.output.get("evidence_items", [])
        evidence_items.extend(new_evidence)

        # Re-run skeptic with updated evidence
        skeptic_context2 = (
            f"All evidence: {json.dumps(evidence_items[:15])}\n"
            f"Resource assessment: {json.dumps(resource_assessment)}\n"
            f"Previous skeptic findings: {json.dumps(skeptic_output)}\n"
            f"Original request: {user_request}"
        )
        skeptic_result2 = await _run_agent(SKEPTIC_PROMPT, skeptic_context2, f"skeptic_r{review_rounds}")
        agents_used.append(f"skeptic_r{review_rounds}")
        total_latency += skeptic_result2.latency_ms
        prev_blocker_count = len(skeptic_output.get("new_blockers_found", []))
        skeptic_output = skeptic_result2.output
        new_blocker_count = len(skeptic_output.get("new_blockers_found", []))
        # Only continue if genuinely new blockers were found
        needs_more = (
            skeptic_output.get("requires_additional_round", False)
            and new_blocker_count > prev_blocker_count
        )

    # ── Phase 5: Scope & Alternatives ─────────────────────────────────────────
    scope_context = (
        f"Requirements: {json.dumps(requirements)}\n"
        f"Resource assessment: {json.dumps(resource_assessment)}\n"
        f"Skeptic findings: {json.dumps(skeptic_output)}\n"
        f"Original request: {user_request}"
    )
    scope_result = await _run_agent(SCOPE_AGENT_PROMPT, scope_context, "scope_agent")
    agents_used.append("scope_agent")
    total_latency += scope_result.latency_ms
    scope_output = scope_result.output

    # ── Phase 6: Final Judgment ────────────────────────────────────────────────
    judge_context = (
        f"Original request: {user_request}\n"
        f"Requirements: {json.dumps(requirements)}\n"
        f"Evidence ({len(evidence_items)} items): {json.dumps(evidence_items[:15])}\n"
        f"Resource assessment: {json.dumps(resource_assessment)}\n"
        f"Skeptic findings: {json.dumps(skeptic_output)}\n"
        f"Scope analysis: {json.dumps(scope_output)}\n"
        f"Review rounds completed: {review_rounds}"
    )
    judge_result = await _run_agent(FINAL_JUDGE_PROMPT, judge_context, "final_judge")
    agents_used.append("final_judge")
    total_latency += judge_result.latency_ms
    judge_output = judge_result.output

    # ── Deterministic Confidence Calculation ──────────────────────────────────
    positive_signals: dict[str, bool] = {}
    negative_signals: dict[str, bool] = {}

    # Build signals from agent outputs
    if evidence_items:
        verified_ev = [e for e in evidence_items if e.get("verification_status") in ("verified", "partial")]
        if verified_ev:
            positive_signals["critical_resource_verified"] = True
        if len([e for e in evidence_items if e.get("reliability") == "high"]) >= 2:
            positive_signals["multiple_reliable_sources_agree"] = True

    blockers = judge_output.get("blockers", [])
    if any("hardware" in str(b).lower() for b in blockers):
        negative_signals["unsuitable_hardware"] = True
    if any("dataset" in str(b).lower() or "data" in str(b).lower() for b in blockers):
        negative_signals["unavailable_resource"] = True
    if any("label" in str(b).lower() for b in blockers):
        negative_signals["missing_labels"] = True
    if any("deadline" in str(b).lower() or "time" in str(b).lower() for b in blockers):
        negative_signals["unrealistic_deadline"] = True
    if any("manual" in str(b).lower() for b in blockers):
        negative_signals["hidden_manual_collection"] = True
    if any("scope" in str(b).lower() for b in judge_output.get("necessary_scope_changes", [])):
        negative_signals["major_scope_reduction_required"] = True
    if judge_output.get("contradictions"):
        negative_signals["contradictory_sources"] = True
    if judge_output.get("unknowns"):
        negative_signals["unresolved_critical_assumption"] = bool(judge_output["unknowns"])

    if resource_assessment.get("hardware_suitability_verified"):
        positive_signals["hardware_suitability_verified"] = True
    if resource_assessment.get("time_adequate"):
        positive_signals["time_requirement_verified"] = True

    confidence = calculate_confidence(positive_signals, negative_signals)
    verdict = judge_output.get("verdict", "insufficient_evidence")

    return FeasibilityWorkflowResult(
        verdict=verdict,
        confidence=confidence,
        judge_output=judge_output,
        requirements=requirements,
        evidence=evidence_items,
        scope_changes=scope_output.get("differences_from_original", []),
        review_rounds=review_rounds,
        agents_used=agents_used,
        total_latency_ms=int((time.monotonic() - start_time) * 1000),
        tokens_used=0,  # Token counting from Responses API if available
        errors=errors,
    )
