import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.security import get_current_user
from app.db.session import get_db_session
from app.repositories.resume_repository import ResumeRepository
from app.schemas.match import MatchRequest, MatchResponse
from app.schemas.resume import ResumeCreate, ResumeListItem, ResumeRead, ResumeUpdate
from app.services.ai.factory import build_ai_orchestrator
from app.services.export_service import build_docx_bytes, build_pdf_bytes
from app.services.match_service import run_resume_match

router = APIRouter(prefix="/resumes", tags=["resumes"])


def to_resume_read(model) -> ResumeRead:
  return ResumeRead.model_validate(model)


@router.get("", response_model=list[ResumeListItem])
async def list_resumes(
  db: AsyncSession = Depends(get_db_session),
  user=Depends(get_current_user)
) -> list[ResumeListItem]:
  repo = ResumeRepository(db)
  rows = await repo.list_for_owner(user["sub"])
  return [ResumeListItem.model_validate(row) for row in rows]


@router.post("", response_model=ResumeRead, status_code=status.HTTP_201_CREATED)
async def create_resume(
  payload: ResumeCreate,
  db: AsyncSession = Depends(get_db_session),
  user=Depends(get_current_user)
) -> ResumeRead:
  repo = ResumeRepository(db)
  resume = await repo.create(user["sub"], payload)
  return to_resume_read(resume)


@router.get("/{resume_id}", response_model=ResumeRead)
async def get_resume(
  resume_id: uuid.UUID,
  db: AsyncSession = Depends(get_db_session),
  user=Depends(get_current_user)
) -> ResumeRead:
  repo = ResumeRepository(db)
  resume = await repo.get_for_owner(resume_id, user["sub"])
  if resume is None:
    raise HTTPException(status_code=404, detail="Resume not found.")
  return to_resume_read(resume)


@router.put("/{resume_id}", response_model=ResumeRead)
async def update_resume(
  resume_id: uuid.UUID,
  payload: ResumeUpdate,
  db: AsyncSession = Depends(get_db_session),
  user=Depends(get_current_user)
) -> ResumeRead:
  repo = ResumeRepository(db)
  resume = await repo.get_for_owner(resume_id, user["sub"])
  if resume is None:
    raise HTTPException(status_code=404, detail="Resume not found.")
  updated = await repo.update(resume, payload)
  return to_resume_read(updated)


@router.post("/{resume_id}/match", response_model=MatchResponse)
async def match_resume(
  resume_id: uuid.UUID,
  payload: MatchRequest,
  db: AsyncSession = Depends(get_db_session),
  user=Depends(get_current_user),
  settings: Settings = Depends(get_settings)
) -> MatchResponse:
  repo = ResumeRepository(db)
  resume = await repo.get_for_owner(resume_id, user["sub"])
  if resume is None:
    raise HTTPException(status_code=404, detail="Resume not found.")

  orchestrator = build_ai_orchestrator(settings)
  return await run_resume_match(
    content=ResumeRead.model_validate(resume).content,
    job_description=payload.job_description,
    orchestrator=orchestrator
  )


@router.get("/{resume_id}/export/docx")
async def export_docx(
  resume_id: uuid.UUID,
  db: AsyncSession = Depends(get_db_session),
  user=Depends(get_current_user)
) -> Response:
  repo = ResumeRepository(db)
  resume = await repo.get_for_owner(resume_id, user["sub"])
  if resume is None:
    raise HTTPException(status_code=404, detail="Resume not found.")

  payload = build_docx_bytes(ResumeRead.model_validate(resume))
  headers = {"Content-Disposition": f'attachment; filename="{resume.title or "resume"}.docx"'}
  return Response(
    content=payload,
    media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    headers=headers
  )


@router.get("/{resume_id}/export/pdf")
async def export_pdf(
  resume_id: uuid.UUID,
  db: AsyncSession = Depends(get_db_session),
  user=Depends(get_current_user)
) -> Response:
  repo = ResumeRepository(db)
  resume = await repo.get_for_owner(resume_id, user["sub"])
  if resume is None:
    raise HTTPException(status_code=404, detail="Resume not found.")

  try:
    payload = build_pdf_bytes(ResumeRead.model_validate(resume))
  except RuntimeError as exc:
    raise HTTPException(status_code=503, detail=str(exc)) from exc

  headers = {"Content-Disposition": f'attachment; filename="{resume.title or "resume"}.pdf"'}
  return Response(content=payload, media_type="application/pdf", headers=headers)
