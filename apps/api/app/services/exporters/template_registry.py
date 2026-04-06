from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable

from app.services.exporters.templates.ats_classic.template import metadata as ats_classic_metadata
from app.services.exporters.templates.ats_classic.template import render as render_ats_classic
from app.services.exporters.templates.executive_clean.template import metadata as executive_clean_metadata
from app.services.exporters.templates.executive_clean.template import render as render_executive_clean
from app.services.exporters.templates.modern_sidebar.template import metadata as modern_sidebar_metadata
from app.services.exporters.templates.modern_sidebar.template import render as render_modern_sidebar
from app.services.exporters.templates.shared import normalize_resume_input

TemplateRenderer = Callable[[dict[str, Any]], str]


@dataclass(frozen=True)
class TemplateDefinition:
  id: str
  name: str
  category: str
  supports_photo: bool
  columns: int
  ats_friendly: bool
  renderer: TemplateRenderer
  ats_score: int
  aliases: tuple[str, ...] = ()

  def render_html(self, resume_json: dict[str, Any]) -> str:
    normalized_resume = normalize_resume_input(resume_json)
    return self.renderer(normalized_resume)


def _template_definition(payload: dict[str, Any], renderer: TemplateRenderer) -> TemplateDefinition:
  return TemplateDefinition(
    id=str(payload["id"]),
    name=str(payload["name"]),
    category=str(payload["category"]),
    supports_photo=bool(payload["supports_photo"]),
    columns=int(payload["columns"]),
    ats_friendly=bool(payload["ats_friendly"]),
    ats_score=int(payload["ats_score"]),
    aliases=tuple(payload.get("aliases", ())),
    renderer=renderer,
  )


_registered_templates = [
  _template_definition(ats_classic_metadata, render_ats_classic),
  _template_definition(modern_sidebar_metadata, render_modern_sidebar),
  _template_definition(executive_clean_metadata, render_executive_clean),
]


def _build_template_map() -> dict[str, TemplateDefinition]:
  registry: dict[str, TemplateDefinition] = {}
  for definition in _registered_templates:
    registry[definition.id] = definition
    for alias in definition.aliases:
      registry[alias] = definition
  return registry


templates = _build_template_map()


def template_summaries() -> list[dict[str, Any]]:
  return [
    {
      "id": definition.id,
      "name": definition.name,
      "category": definition.category,
      "supports_photo": definition.supports_photo,
      "columns": definition.columns,
      "ats_friendly": definition.ats_friendly,
      "ats_score": definition.ats_score,
    }
    for definition in _registered_templates
  ]
