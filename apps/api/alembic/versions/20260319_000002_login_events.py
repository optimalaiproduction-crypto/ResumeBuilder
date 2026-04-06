"""add login events table

Revision ID: 20260319_000002
Revises: 20260318_000001
Create Date: 2026-03-19
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260319_000002"
down_revision = "20260318_000001"
branch_labels = None
depends_on = None


def upgrade() -> None:
  op.create_table(
    "login_events",
    sa.Column("id", sa.String(length=36), nullable=False),
    sa.Column("user_id", sa.String(length=36), nullable=False),
    sa.Column("email", sa.String(length=255), nullable=False),
    sa.Column("ip_address", sa.String(length=64), nullable=False, server_default=""),
    sa.Column("user_agent", sa.String(length=512), nullable=False, server_default=""),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    sa.PrimaryKeyConstraint("id")
  )
  op.create_index("ix_login_events_user_id", "login_events", ["user_id"], unique=False)
  op.create_index("ix_login_events_email", "login_events", ["email"], unique=False)
  op.create_index("ix_login_events_created_at", "login_events", ["created_at"], unique=False)


def downgrade() -> None:
  op.drop_index("ix_login_events_created_at", table_name="login_events")
  op.drop_index("ix_login_events_email", table_name="login_events")
  op.drop_index("ix_login_events_user_id", table_name="login_events")
  op.drop_table("login_events")
