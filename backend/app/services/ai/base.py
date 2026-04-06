from dataclasses import dataclass
from typing import Protocol


@dataclass
class MatchSuggestionSet:
  provider_name: str
  suggestions: list[str]


class AIProvider(Protocol):
  name: str

  async def suggest(self, resume_text: str, job_description: str) -> MatchSuggestionSet:
    ...


def parse_suggestions(text: str) -> list[str]:
  lines = [line.strip(" -*0123456789.") for line in text.splitlines()]
  cleaned = [line.strip() for line in lines if line.strip()]
  unique: list[str] = []
  for line in cleaned:
    if line not in unique:
      unique.append(line)
  return unique[:8]


def fallback_suggestions(job_description: str) -> list[str]:
  lower = job_description.lower()
  suggestions = [
    "Tailor your summary to mirror the role's core outcomes.",
    "Quantify top achievements with clear metrics.",
    "Move the most relevant skills near the top of the resume."
  ]

  if "python" in lower:
    suggestions.append("Highlight production Python projects and measurable impact.")
  if "lead" in lower or "manager" in lower:
    suggestions.append("Show examples of leadership, mentoring, and ownership scope.")
  if "api" in lower or "backend" in lower:
    suggestions.append("Add API design, performance, and reliability accomplishments.")

  return suggestions[:8]
