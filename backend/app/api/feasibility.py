"""ClarityLoop – Feasibility API"""
from __future__ import annotations
import json
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.feasibility import FeasibilityAssessment, AssessmentVersion
from app.models.project import Project
from app.models.agent_run import AgentRun
from app.schemas import FeasibilityRequest, FeasibilityOut, ConfidenceResultOut, ConfidenceSignalOut
from app.agents.orchestrator import run_feasibility_workflow
from app.core.confidence import calculate_confidence

router = APIRouter()

@router.post("/assess", response_model=FeasibilityOut, status_code=201)
async def assess_feasibility(body: FeasibilityRequest, db: AsyncSession = Depends(get_db)):
    """Run the full multi-agent feasibility workflow."""
    # Verify project exists
    result = await db.execute(select(Project).where(Project.id == body.project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(404, "Project not found")

    # Run the multi-agent workflow
    workflow_result = await run_feasibility_workflow(
        user_request=body.description,
        resource_profile=body.resource_profile,
    )

    # Store assessment
    assessment = FeasibilityAssessment(
        project_id=body.project_id,
        verdict=workflow_result.verdict,
        confidence_score=workflow_result.confidence.clamped_score,
        confidence_explanation=workflow_result.confidence.explanation,
        verified_requirements=json.dumps(workflow_result.requirements.get("required_inputs", [])),
        blockers_json=json.dumps(workflow_result.judge_output.get("blockers", [])),
        risks_json=json.dumps(workflow_result.judge_output.get("risks", [])),
        realistic_alternative=workflow_result.judge_output.get("realistic_alternative"),
        what_would_make_feasible=json.dumps(workflow_result.judge_output.get("what_would_make_feasible", [])),
        recommended_next_action=workflow_result.judge_output.get("recommended_next_action"),
        scope_changes_json=json.dumps(workflow_result.scope_changes),
        review_rounds=workflow_result.review_rounds,
        agents_used=json.dumps(workflow_result.agents_used),
        total_latency_ms=workflow_result.total_latency_ms,
    )
    db.add(assessment)
    await db.flush()

    # Update project verdict
    project.current_verdict = workflow_result.verdict
    await db.flush()

    # Save version
    version = AssessmentVersion(
        assessment_id=assessment.id,
        version_number=1,
        verdict=workflow_result.verdict,
        confidence_score=workflow_result.confidence.clamped_score,
        change_reason="Initial assessment",
    )
    db.add(version)

    # Log agent run
    run_log = AgentRun(
        project_id=body.project_id,
        workflow="feasibility",
        routing_mode="feasibility",
        agents_invoked=json.dumps(workflow_result.agents_used),
        review_rounds=workflow_result.review_rounds,
        verdict=workflow_result.verdict,
        latency_ms=workflow_result.total_latency_ms,
    )
    db.add(run_log)
    await db.flush()
    await db.refresh(assessment)
    return assessment

@router.get("/{assessment_id}", response_model=FeasibilityOut)
async def get_assessment(assessment_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FeasibilityAssessment).where(FeasibilityAssessment.id == assessment_id))
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(404, "Assessment not found")
    return assessment

@router.get("/project/{project_id}", response_model=list[FeasibilityOut])
async def list_project_assessments(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(FeasibilityAssessment).where(FeasibilityAssessment.project_id == project_id).order_by(FeasibilityAssessment.created_at.desc())
    )
    return result.scalars().all()

@router.post("/{assessment_id}/approve-scope")
async def approve_scope_change(assessment_id: str, body: dict, db: AsyncSession = Depends(get_db)):
    """User approves or rejects a scope change recommendation."""
    result = await db.execute(select(FeasibilityAssessment).where(FeasibilityAssessment.id == assessment_id))
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(404, "Assessment not found")
    assessment.scope_change_approved = body.get("approved", False)
    await db.flush()
    return {"message": "Scope change decision recorded", "approved": assessment.scope_change_approved}

@router.get("/{assessment_id}/confidence", response_model=ConfidenceResultOut)
async def get_confidence_details(assessment_id: str, db: AsyncSession = Depends(get_db)):
    """Return full confidence signal breakdown for an assessment."""
    result = await db.execute(select(FeasibilityAssessment).where(FeasibilityAssessment.id == assessment_id))
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(404, "Assessment not found")

    # Recalculate with stored data
    blockers = json.loads(assessment.blockers_json or "[]")
    positive = {}
    negative = {}
    if not blockers:
        positive["critical_resource_verified"] = True
    if blockers:
        negative["unresolved_critical_assumption"] = True
    conf = calculate_confidence(positive, negative)
    return ConfidenceResultOut(
        clamped_score=conf.clamped_score,
        as_percent=conf.as_percent,
        label=conf.label,
        explanation=conf.explanation,
        positive_signals=[ConfidenceSignalOut(**s.__dict__) for s in conf.positive_signals],
        negative_signals=[ConfidenceSignalOut(**s.__dict__) for s in conf.negative_signals],
    )
