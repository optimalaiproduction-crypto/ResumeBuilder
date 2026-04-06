from fastapi import APIRouter

from app.services.exporters.template_registry import template_summaries

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("")
def list_templates():
  return template_summaries()
