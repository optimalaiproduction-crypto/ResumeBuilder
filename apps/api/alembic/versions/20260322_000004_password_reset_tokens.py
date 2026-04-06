"""add password reset tokens table

Revision ID: 20260322_000004
Revises: 20260319_000003
Create Date: 2026-03-22
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260322_000004"
down_revision = "20260319_000003"
branch_labels = None
depends_on = None


def upgrade() -> None:
  op.create_table(
    "password_reset_tokens",
    sa.Column("id", sa.String(length=36), nullable=False),
    sa.Column("user_id", sa.String(length=36), nullable=False),
    sa.Column("token_hash", sa.String(length=128), nullable=False),
    sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    sa.PrimaryKeyConstraint("id"),
    sa.UniqueConstraint("token_hash")
  )
  op.create_index("ix_password_reset_tokens_user_id", "password_reset_tokens", ["user_id"], unique=False)
  op.create_index("ix_password_reset_tokens_token_hash", "password_reset_tokens", ["token_hash"], unique=True)
  op.create_index("ix_password_reset_tokens_expires_at", "password_reset_tokens", ["expires_at"], unique=False)
  op.create_index("ix_password_reset_tokens_used_at", "password_reset_tokens", ["used_at"], unique=False)
  op.create_index("ix_password_reset_tokens_created_at", "password_reset_tokens", ["created_at"], unique=False)


def downgrade() -> None:
  op.drop_index("ix_password_reset_tokens_created_at", table_name="password_reset_tokens")
  op.drop_index("ix_password_reset_tokens_used_at", table_name="password_reset_tokens")
  op.drop_index("ix_password_reset_tokens_expires_at", table_name="password_reset_tokens")
  op.drop_index("ix_password_reset_tokens_token_hash", table_name="password_reset_tokens")
  op.drop_index("ix_password_reset_tokens_user_id", table_name="password_reset_tokens")
  op.drop_table("password_reset_tokens")
