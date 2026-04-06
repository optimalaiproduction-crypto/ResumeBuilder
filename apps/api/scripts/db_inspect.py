import argparse

from sqlalchemy import MetaData, Table, func, select
from sqlalchemy import inspect as sqlalchemy_inspect

from app.db.session import engine


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(
    description="Inspect configured ResumeForge database tables and row counts."
  )
  parser.add_argument(
    "--tables",
    nargs="*",
    default=None,
    help="Optional list of table names to inspect. Default: all tables.",
  )
  return parser.parse_args()


def main() -> None:
  args = parse_args()
  inspector = sqlalchemy_inspect(engine)
  all_tables = sorted(inspector.get_table_names())

  selected_tables = all_tables
  if args.tables:
    requested = {name.strip() for name in args.tables if name.strip()}
    selected_tables = [name for name in all_tables if name in requested]

  print(f"Database URL: {engine.url.render_as_string(hide_password=True)}")
  print(f"Tables ({len(selected_tables)}):")
  for name in selected_tables:
    print(f"  - {name}")

  if not selected_tables:
    print("No matching tables found.")
    return

  metadata = MetaData()
  with engine.connect() as conn:
    print("\nRow Counts:")
    for name in selected_tables:
      table = Table(name, metadata, autoload_with=engine)
      count = conn.execute(select(func.count()).select_from(table)).scalar_one()
      print(f"  {name}: {count}")


if __name__ == "__main__":
  main()
