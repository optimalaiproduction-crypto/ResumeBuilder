import io
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.security import get_current_user_id
from app.db.session import get_db
from app.schemas.export import ExportRequest
from app.services.exporters.docx_exporter import export_docx
from app.services.exporters.pdf_exporter import export_pdf, export_pdf_from_html
from app.services.exporters.template_registry import templates as export_templates
from app.services.resume_service import ResumeService

router = APIRouter(prefix="/export", tags=["export"])


@router.post("/docx")
def export_docx_route(
  payload: ExportRequest,
  user_id: str = Depends(get_current_user_id),
  db: Session = Depends(get_db)
):
  file_bytes = export_docx(
    title=payload.resolved_title(),
    content=payload.resolved_content(),
  )
  ResumeService(db).log_export(user_id=user_id, resume_id=payload.resumeId, export_format="docx")
  filename = f"{payload.resolved_title() or 'resume'}.docx"
  return StreamingResponse(
    BytesIO(file_bytes),
    media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    headers={"Content-Disposition": f'attachment; filename="{filename}"'}
  )


@router.post("/pdf")
def export_pdf_route(
  payload: ExportRequest,
  user_id: str = Depends(get_current_user_id),
  db: Session = Depends(get_db)
):
  method = (payload.method or "server").strip().lower()
  if method != "server":
    method = "server"

  engine = (payload.pdfEngine or "auto").strip().lower()
  requested_template_id = (payload.templateId or "").strip().lower()

  # Keep backward compatibility for legacy template ids and avoid hard failures
  # when callers send unknown template values.
  selected_template = None
  for candidate in [requested_template_id, "ats_classic", "ats"]:
    if not candidate:
      continue
    selected_template = export_templates.get(candidate)
    if selected_template is not None:
      break

  if selected_template is None:
    first_template = next(iter(export_templates.values()), None)
    if first_template is None:
      raise HTTPException(status_code=503, detail="No export templates are configured.")
    selected_template = first_template

  # Explicit compatibility mode: allow callers to force the legacy ReportLab pipeline.
  if engine == "reportlab":
    try:
      file_bytes = export_pdf(
        title=payload.resolved_title(),
        content=payload.resolved_content(),
        preferred_engine="reportlab"
      )
    except Exception as exc:
      raise HTTPException(status_code=503, detail=f"PDF export failed: {exc}") from exc

    ResumeService(db).log_export(user_id=user_id, resume_id=payload.resumeId, export_format="pdf")
    filename = f"{payload.resolved_title() or 'resume'}.pdf"
    return StreamingResponse(
      BytesIO(file_bytes),
      media_type="application/pdf",
      headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

  try:
    resume_json = {
      "title": payload.resolved_title(),
      "content": payload.resolved_content(),
    }
    html = selected_template.render_html(resume_json)
    file_bytes = export_pdf_from_html(html)
  except Exception:
    # WeasyPrint may be unavailable on some Windows setups (missing GTK libs).
    # Fall back to the existing ReportLab exporter so users can still download PDFs.
    try:
      file_bytes = export_pdf(
        title=payload.resolved_title(),
        content=payload.resolved_content(),
        preferred_engine="reportlab"
      )
    except Exception as fallback_exc:
      raise HTTPException(status_code=503, detail=f"PDF export failed: {fallback_exc}") from fallback_exc

  ResumeService(db).log_export(user_id=user_id, resume_id=payload.resumeId, export_format="pdf")
  filename = f"{payload.resolved_title() or 'resume'}.pdf"
  return StreamingResponse(
    io.BytesIO(file_bytes),
    media_type="application/pdf",
    headers={"Content-Disposition": f'attachment; filename="{filename}"'}
  )
