"""add full_name to users

Revision ID: 20260319_000003
Revises: 20260319_000002
Create Date: 2026-03-19
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260319_000003"
down_revision = "20260319_000002"
branch_labels = None
depends_on = None


def upgrade() -> None:
  op.add_column("users", sa.Column("full_name", sa.String(length=120), nullable=True))


def downgrade() -> None:
  op.drop_column("users", "full_name")
