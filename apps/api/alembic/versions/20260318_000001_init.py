"""initial schema

Revision ID: 20260318_000001
Revises:
Create Date: 2026-03-18
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260318_000001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
  op.create_table(
    "users",
    sa.Column("id", sa.String(length=36), nullable=False),
    sa.Column("email", sa.String(length=255), nullable=False),
    sa.Column("password_hash", sa.String(length=255), nullable=False),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.PrimaryKeyConstraint("id")
  )
  op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

  op.create_table(
    "resumes",
    sa.Column("id", sa.String(length=36), nullable=False),
    sa.Column("user_id", sa.String(length=36), nullable=False),
    sa.Column("title", sa.String(length=180), nullable=False),
    sa.Column("content", sa.JSON(), nullable=False),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    sa.PrimaryKeyConstraint("id")
  )

  op.create_table(
    "job_descriptions",
    sa.Column("id", sa.String(length=36), nullable=False),
    sa.Column("user_id", sa.String(length=36), nullable=False),
    sa.Column("resume_id", sa.String(length=36), nullable=True),
    sa.Column("text", sa.Text(), nullable=False),
    sa.Column("extracted_keywords", sa.JSON(), nullable=False),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"], ondelete="SET NULL"),
    sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    sa.PrimaryKeyConstraint("id")
  )

  op.create_table(
    "resume_versions",
    sa.Column("id", sa.String(length=36), nullable=False),
    sa.Column("resume_id", sa.String(length=36), nullable=False),
    sa.Column("version_label", sa.String(length=80), nullable=False),
    sa.Column("content", sa.JSON(), nullable=False),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"], ondelete="CASCADE"),
    sa.PrimaryKeyConstraint("id")
  )

  op.create_table(
    "exports",
    sa.Column("id", sa.String(length=36), nullable=False),
    sa.Column("user_id", sa.String(length=36), nullable=False),
    sa.Column("resume_id", sa.String(length=36), nullable=False),
    sa.Column("format", sa.String(length=10), nullable=False),
    sa.Column("status", sa.String(length=30), nullable=False),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"], ondelete="CASCADE"),
    sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    sa.PrimaryKeyConstraint("id")
  )


def downgrade() -> None:
  op.drop_table("exports")
  op.drop_table("resume_versions")
  op.drop_table("job_descriptions")
  op.drop_table("resumes")
  op.drop_index(op.f("ix_users_email"), table_name="users")
  op.drop_table("users")
