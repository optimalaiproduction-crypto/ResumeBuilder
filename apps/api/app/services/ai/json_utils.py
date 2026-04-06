import json
from typing import TypeVar

from pydantic import BaseModel, ValidationError

T = TypeVar("T", bound=BaseModel)


def _extract_json_object(raw: str) -> str:
  raw = raw.strip()
  if raw.startswith("{") and raw.endswith("}"):
    return raw
  start = raw.find("{")
  end = raw.rfind("}")
  if start == -1 or end == -1 or start >= end:
    raise ValueError("No JSON object found in model response.")
  return raw[start : end + 1]


def parse_json_to_model(raw: str, model_cls: type[T]) -> T:
  payload = json.loads(_extract_json_object(raw))
  try:
    return model_cls.model_validate(payload)
  except ValidationError as exc:
    raise ValueError(str(exc)) from exc
