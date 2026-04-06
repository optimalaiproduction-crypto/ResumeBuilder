"""add firebase uid to users

Revision ID: 20260406_000005
Revises: 20260322_000004
Create Date: 2026-04-06
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260406_000005"
down_revision = "20260322_000004"
branch_labels = None
depends_on = None


def upgrade() -> None:
  op.add_column("users", sa.Column("firebase_uid", sa.String(length=128), nullable=True))
  op.create_index("ix_users_firebase_uid", "users", ["firebase_uid"], unique=True)


def downgrade() -> None:
  op.drop_index("ix_users_firebase_uid", table_name="users")
  op.drop_column("users", "firebase_uid")
