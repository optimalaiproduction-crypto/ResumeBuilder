import json
import os
from collections.abc import Iterable

from sqlalchemy import MetaData, create_engine, delete, insert, select, text


TABLE_COPY_ORDER = [
  "users",
  "resumes",
  "resume_versions",
  "job_descriptions",
  "exports",
  "login_events",
  "password_reset_tokens"
]
TABLE_DELETE_ORDER = list(reversed(TABLE_COPY_ORDER))


def as_rows(records: Iterable[dict]) -> list[dict]:
  normalized: list[dict] = []
  for record in records:
    row = dict(record)
    for key in ("content", "extracted_keywords"):
      value = row.get(key)
      if isinstance(value, str):
        try:
          row[key] = json.dumps(json.loads(value))
        except Exception:
          pass
      elif isinstance(value, (dict, list)):
        row[key] = json.dumps(value)
    normalized.append(row)
  return normalized


def main():
  source_url = os.getenv("SOURCE_DATABASE_URL", "sqlite+pysqlite:///./dev_resumeforge.db")
  target_url = os.getenv("TARGET_DATABASE_URL")
  if not target_url:
    raise SystemExit("TARGET_DATABASE_URL is required.")

  source_engine = create_engine(source_url, future=True)
  target_engine = create_engine(target_url, future=True)

  # Load model metadata so missing target tables are created automatically.
  from app.db.base import Base
  from app.models import ExportRecord, JobDescription, LoginEvent, PasswordResetToken, Resume, ResumeVersion, User  # noqa: F401

  Base.metadata.create_all(bind=target_engine)

  source_meta = MetaData()
  source_meta.reflect(bind=source_engine)
  source_tables = [table for table in TABLE_COPY_ORDER if table in source_meta.tables]

  target_meta = MetaData()
  target_meta.reflect(bind=target_engine, only=TABLE_COPY_ORDER)

  with source_engine.connect() as src_conn, target_engine.begin() as dst_conn:
    dst_conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
    for table_name in TABLE_DELETE_ORDER:
      if table_name not in target_meta.tables:
        continue
      table = target_meta.tables[table_name]
      dst_conn.execute(delete(table))
    dst_conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))

    total_inserted = 0
    for table_name in source_tables:
      src_table = source_meta.tables[table_name]
      dst_table = target_meta.tables[table_name]

      records = src_conn.execute(select(src_table)).mappings().all()
      rows = as_rows(records)
      if rows:
        dst_conn.execute(insert(dst_table), rows)
      print(f"{table_name}: inserted {len(rows)} rows")
      total_inserted += len(rows)

  print(f"Sync complete. Total rows inserted: {total_inserted}")


if __name__ == "__main__":
  main()
