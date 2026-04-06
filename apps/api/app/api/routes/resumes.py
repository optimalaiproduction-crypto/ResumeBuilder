from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user_id
from app.db.session import get_db
from app.schemas.resume import (
  ResumeCreateRequest,
  ResumeListResponse,
  ResumeResponse,
  ResumeUpdateRequest
)
from app.services.resume_service import ResumeService

router = APIRouter(prefix="/resumes", tags=["resumes"])


def _to_response(model) -> ResumeResponse:
  return ResumeResponse(
    id=model.id,
    title=model.title,
    user_id=model.user_id,
    content=model.content,
    created_at=model.created_at,
    updated_at=model.updated_at
  )


@router.post("", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
def create_resume(
  payload: ResumeCreateRequest,
  user_id: str = Depends(get_current_user_id),
  db: Session = Depends(get_db)
):
  service = ResumeService(db)
  resume = service.create_resume(user_id=user_id, title=payload.title, content=payload.content.model_dump())
  return _to_response(resume)


@router.get("", response_model=ResumeListResponse)
def list_resumes(
  user_id: str = Depends(get_current_user_id),
  db: Session = Depends(get_db)
):
  service = ResumeService(db)
  items = [_to_response(resume) for resume in service.list_resumes(user_id=user_id)]
  return ResumeListResponse(items=items)


@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(
  resume_id: str,
  user_id: str = Depends(get_current_user_id),
  db: Session = Depends(get_db)
):
  service = ResumeService(db)
  resume = service.get_resume(resume_id=resume_id, user_id=user_id)
  return _to_response(resume)


@router.put("/{resume_id}", response_model=ResumeResponse)
def update_resume(
  resume_id: str,
  payload: ResumeUpdateRequest,
  user_id: str = Depends(get_current_user_id),
  db: Session = Depends(get_db)
):
  service = ResumeService(db)
  resume = service.update_resume(
    resume_id=resume_id,
    user_id=user_id,
    title=payload.title,
    content=payload.content.model_dump()
  )
  return _to_response(resume)


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
  resume_id: str,
  user_id: str = Depends(get_current_user_id),
  db: Session = Depends(get_db)
):
  service = ResumeService(db)
  service.delete_resume(resume_id=resume_id, user_id=user_id)
  return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{resume_id}/duplicate", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
def duplicate_resume(
  resume_id: str,
  user_id: str = Depends(get_current_user_id),
  db: Session = Depends(get_db)
):
  service = ResumeService(db)
  resume = service.duplicate_resume(resume_id=resume_id, user_id=user_id)
  return _to_response(resume)
