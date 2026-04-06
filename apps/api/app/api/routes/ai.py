from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user_id
from app.db.session import get_db
from app.schemas.ai import (
  ExtractKeywordsRequest,
  ExtractKeywordsResponse,
  ProviderStatusResponseSchema,
  RewriteBulletRequest,
  RewriteBulletResponse,
  RewriteSummaryRequest,
  RewriteSummaryResponse,
  ScoreResumeRequest,
  ScoreResumeResponse
)
from app.services.ai.factory import AIService, get_ai_service
from app.services.resume_service import ResumeService

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/extract-keywords", response_model=ExtractKeywordsResponse)
async def extract_keywords(
  payload: ExtractKeywordsRequest,
  ai_service: AIService = Depends(get_ai_service),
  user_id: str = Depends(get_current_user_id),
  db: Session = Depends(get_db)
):
  result = await ai_service.extract_keywords(payload.jobDescription)
  ResumeService(db).log_job_description(
    user_id=user_id,
    resume_id=None,
    text=payload.jobDescription,
    extracted_keywords=result.keywords
  )
  return ExtractKeywordsResponse(
    keywords=result.keywords,
    provider=result.provider,
    providerMessage=result.providerMessage
  )


@router.post("/rewrite-summary", response_model=RewriteSummaryResponse)
async def rewrite_summary(
  payload: RewriteSummaryRequest,
  ai_service: AIService = Depends(get_ai_service)
):
  return await ai_service.rewrite_summary(
    resume_content=payload.resume.model_dump(),
    job_description=payload.jobDescription
  )


@router.post("/rewrite-bullet", response_model=RewriteBulletResponse)
async def rewrite_bullet(
  payload: RewriteBulletRequest,
  ai_service: AIService = Depends(get_ai_service)
):
  return await ai_service.rewrite_bullet(
    bullet=payload.bullet,
    job_description=payload.jobDescription,
    role_context=payload.roleContext
  )


@router.post("/score-resume", response_model=ScoreResumeResponse)
async def score_resume(
  payload: ScoreResumeRequest,
  ai_service: AIService = Depends(get_ai_service),
  user_id: str = Depends(get_current_user_id),
  db: Session = Depends(get_db)
):
  result = await ai_service.score_resume(
    resume_content=payload.resume.model_dump(),
    job_description=payload.jobDescription
  )
  suggestions = result.suggestions
  provider_message = result.providerMessage
  if not suggestions:
    improvements = await ai_service.suggest_improvements(
      resume_content=payload.resume.model_dump(),
      job_description=payload.jobDescription
    )
    suggestions = improvements.suggestions
    provider_message = provider_message or improvements.providerMessage

  merged = ScoreResumeResponse(
    score=result.score,
    matchedKeywords=result.matchedKeywords,
    missingKeywords=result.missingKeywords,
    suggestions=suggestions,
    provider=result.provider,
    providerMessage=provider_message
  )

  ResumeService(db).log_job_description(
    user_id=user_id,
    resume_id=payload.resumeId,
    text=payload.jobDescription,
    extracted_keywords=result.matchedKeywords + result.missingKeywords
  )
  return merged


@router.get("/providers/status", response_model=ProviderStatusResponseSchema)
async def provider_status(ai_service: AIService = Depends(get_ai_service)):
  return await ai_service.provider_status()
