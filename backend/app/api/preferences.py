"""ClarityLoop – Preferences API"""
from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.user import User, UserPreference, ResourceProfile
from app.schemas import UserPreferenceSchema, ResourceProfileSchema

router = APIRouter()
DEFAULT_USER = "default-user"

async def _ensure_user(db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.id == DEFAULT_USER))
    user = result.scalar_one_or_none()
    if not user:
        user = User(id=DEFAULT_USER, username="local_user", display_name="Local User")
        db.add(user)
        await db.flush()
    return user

@router.get("/")
async def get_preferences(db: AsyncSession = Depends(get_db)):
    await _ensure_user(db)
    result = await db.execute(select(UserPreference).where(UserPreference.user_id == DEFAULT_USER))
    pref = result.scalar_one_or_none()
    if not pref:
        return UserPreferenceSchema().model_dump()
    return {
        "answer_depth": pref.answer_depth,
        "preferred_language": pref.preferred_language,
        "skill_level": pref.skill_level,
        "explanation_style": pref.explanation_style,
        "focus_mode_preference": pref.focus_mode_preference,
        "theme": pref.theme,
        "animation_reduced": pref.animation_reduced,
        "memory_enabled": pref.memory_enabled,
        "budget_preference": pref.budget_preference,
    }

@router.put("/")
async def update_preferences(body: UserPreferenceSchema, db: AsyncSession = Depends(get_db)):
    await _ensure_user(db)
    result = await db.execute(select(UserPreference).where(UserPreference.user_id == DEFAULT_USER))
    pref = result.scalar_one_or_none()
    if not pref:
        pref = UserPreference(user_id=DEFAULT_USER, **body.model_dump())
        db.add(pref)
    else:
        for k, v in body.model_dump().items():
            setattr(pref, k, v)
    await db.flush()
    return {"message": "Preferences saved"}

@router.get("/resource-profile")
async def get_resource_profile(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ResourceProfile).where(ResourceProfile.user_id == DEFAULT_USER))
    profile = result.scalar_one_or_none()
    if not profile:
        return {}
    return {
        "cpu_cores": profile.cpu_cores,
        "ram_gb": profile.ram_gb,
        "gpu_model": profile.gpu_model,
        "gpu_vram_gb": profile.gpu_vram_gb,
        "storage_gb": profile.storage_gb,
        "operating_system": profile.operating_system,
        "monthly_budget_usd": profile.monthly_budget_usd,
    }

@router.put("/resource-profile")
async def update_resource_profile(body: ResourceProfileSchema, db: AsyncSession = Depends(get_db)):
    await _ensure_user(db)
    result = await db.execute(select(ResourceProfile).where(ResourceProfile.user_id == DEFAULT_USER))
    profile = result.scalar_one_or_none()
    if not profile:
        profile = ResourceProfile(user_id=DEFAULT_USER, **body.model_dump())
        db.add(profile)
    else:
        for k, v in body.model_dump(exclude_none=True).items():
            setattr(profile, k, v)
    await db.flush()
    return {"message": "Resource profile saved"}
